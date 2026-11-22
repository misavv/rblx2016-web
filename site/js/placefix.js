// Makes place files saved by newer Roblox Studio readable by the 2016 loader.
//
// The 2016 binary reader (SerializerBinary.cpp) only knows LZ4 chunks and the
// property formats that existed in 2016. Newer files break it in three ways:
//   1. chunks compressed with zstd (Studio switched around 2021): the whole
//      load fails with "Malformed data";
//   2. properties written in formats added after 2016: a known property in a
//      new format aborts the whole load;
//   3. part colours saved only as "Color3uint8", which the 2016 Part does not
//      know, so every part comes out grey.
// This rewrites the file before it reaches the engine: zstd chunks are stored
// uncompressed, unsupported property chunks are dropped, ProtectedString
// (Script.Source) is relabelled as String (same bytes), and Color3uint8 is
// also written as the 2016 "Color" (Color3) property. 2016 files pass through
// unchanged.
(function () {
  "use strict";

  const MAGIC = "<roblox!";
  const ZSTD = [0x28, 0xb5, 0x2f, 0xfd];
  // Classes whose 2016 descriptor has Part.Color (PartInstance::prop_Color).
  const PART_CLASSES = new Set([
    "Part", "WedgePart", "CornerWedgePart", "TrussPart", "SpawnLocation", "Seat",
    "VehicleSeat", "SkateboardPlatform", "FlagStand", "Platform", "MeshPart",
    "UnionOperation", "NegateOperation", "PartOperation",
  ]);
  const BPF_STRING = 1, BPF_COLOR3 = 12, BPF_LAST_2016 = 25;
  const BPF_INT64 = 27, BPF_PROTECTED_STRING = 29, BPF_COLOR3UINT8 = 26;

  const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  const putU32 = (b, o, v) => { b[o] = v & 255; b[o + 1] = (v >>> 8) & 255; b[o + 2] = (v >>> 16) & 255; b[o + 3] = (v >>> 24) & 255; };
  const ascii = (b, o, n) => String.fromCharCode.apply(null, b.subarray(o, o + n));
  const readStr = (b, o) => { const n = u32(b, o); return [new TextDecoder().decode(b.subarray(o + 4, o + 4 + n)), o + 4 + n]; };

  function isZstd(b) { return b.length >= 4 && ZSTD.every((x, i) => b[i] === x); }

  // LZ4 block format (what LZ4_decompress_safe reads).
  function lz4(src, size) {
    const dst = new Uint8Array(size);
    let s = 0, d = 0;
    while (s < src.length) {
      const token = src[s++];
      let lit = token >>> 4;
      if (lit === 15) { let x; do { x = src[s++]; lit += x; } while (x === 255); }
      dst.set(src.subarray(s, s + lit), d); s += lit; d += lit;
      if (s >= src.length) break;
      const off = src[s] | (src[s + 1] << 8); s += 2;
      let len = token & 15;
      if (len === 15) { let x; do { x = src[s++]; len += x; } while (x === 255); }
      len += 4;
      if (!off || off > d) throw new Error("bad lz4 offset");
      for (let i = 0; i < len; i++, d++) dst[d] = dst[d - off];
    }
    if (d !== size) throw new Error("lz4 size mismatch");
    return dst;
  }

  // The binary format stores float arrays as big-endian, byte-interleaved
  // words with the sign bit rotated to the bottom (decodeFloat in the reader).
  function encodeFloats(values) {
    const n = values.length, out = new Uint8Array(n * 4);
    const f = new Float32Array(1), i32 = new Uint32Array(f.buffer);
    for (let i = 0; i < n; i++) {
      f[0] = values[i];
      const v = ((i32[0] << 1) | (i32[0] >>> 31)) >>> 0;
      out[i] = v >>> 24; out[n + i] = (v >>> 16) & 255; out[2 * n + i] = (v >>> 8) & 255; out[3 * n + i] = v & 255;
    }
    return out;
  }

  function chunk(name, payload) {
    const out = new Uint8Array(16 + payload.length);
    for (let i = 0; i < 4; i++) out[i] = name.charCodeAt(i) || 0;
    putU32(out, 4, 0);                 // stored uncompressed
    putU32(out, 8, payload.length);
    putU32(out, 12, 0);
    out.set(payload, 16);
    return out;
  }

  function propPayload(typeIndex, name, format, values) {
    const nameBytes = new TextEncoder().encode(name);
    const out = new Uint8Array(4 + 4 + nameBytes.length + 1 + values.length);
    putU32(out, 0, typeIndex);
    putU32(out, 4, nameBytes.length);
    out.set(nameBytes, 8);
    out[8 + nameBytes.length] = format;
    out.set(values, 9 + nameBytes.length);
    return out;
  }

  function upgradeBinary(bytes, report) {
    const parts = [bytes.subarray(0, 32)];
    const typeClass = new Map(), typeCount = new Map(), hasColor = new Set(), pendingColor = [];
    let o = 32, changed = false;
    while (o + 16 <= bytes.length) {
      const name = ascii(bytes, o, 4);
      const csize = u32(bytes, o + 4), size = u32(bytes, o + 8);
      const stored = csize || size;
      const raw = bytes.subarray(o + 16, o + 16 + stored);
      o += 16 + stored;
      let data = null; // decompressed payload, only when we need to look inside
      let rewrite = false; // emit `data` as an uncompressed chunk instead of the original bytes
      const zstd = csize > 0 && isZstd(raw);
      if (zstd) { data = window.fzstd.decompress(raw); report.zstd++; changed = rewrite = true; }
      else if (name === "INST" || name === "PROP") data = csize ? lz4(raw, size) : raw;
      if (name === "INST" && data) {
        const t = u32(data, 0);
        const [cls, p] = readStr(data, 4);
        typeClass.set(t, cls);
        typeCount.set(t, u32(data, p + 1));
      }
      if (name === "PROP" && data) {
        const t = u32(data, 0);
        const [prop, p] = readStr(data, 4);
        const fmt = data[p];
        if (prop === "Color" || prop === "BrickColor") hasColor.add(t);
        if (fmt === BPF_PROTECTED_STRING) {
          const copy = data.slice(); copy[p] = BPF_STRING; data = copy; changed = rewrite = true; report.relabelled++;
        } else if (fmt > BPF_LAST_2016 && fmt !== BPF_INT64) {
          if (prop === "Color3uint8" && fmt === BPF_COLOR3UINT8) pendingColor.push({ t, bytes: data.subarray(p + 1) });
          report.dropped++; changed = true;
          continue; // the 2016 reader cannot take this format
        }
      }
      if (name === "END\0") {
        // Synthesize Part.Color for part classes that only carry Color3uint8.
        for (const pc of pendingColor) {
          const cls = typeClass.get(pc.t), n = typeCount.get(pc.t) || 0;
          if (!PART_CLASSES.has(cls) || hasColor.has(pc.t) || pc.bytes.length < n * 3) continue;
          const r = [], g = [], b = [];
          for (let i = 0; i < n; i++) { r.push(pc.bytes[i] / 255); g.push(pc.bytes[n + i] / 255); b.push(pc.bytes[2 * n + i] / 255); }
          const vals = new Uint8Array(n * 12);
          vals.set(encodeFloats(r), 0); vals.set(encodeFloats(g), n * 4); vals.set(encodeFloats(b), n * 8);
          parts.push(chunk("PROP", propPayload(pc.t, "Color", BPF_COLOR3, vals)));
          report.colored++;
        }
      }
      parts.push(rewrite ? chunk(name, data) : bytes.subarray(o - 16 - stored, o));
      if (name === "END\0") break;
    }
    if (!changed && !pendingColor.length) return bytes;
    const total = parts.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total);
    let w = 0;
    for (const p of parts) { out.set(p, w); w += p.length; }
    return out;
  }

  function upgrade(bytes) {
    const report = { zstd: 0, dropped: 0, relabelled: 0, colored: 0 };
    if (!(bytes instanceof Uint8Array) || bytes.length < 32 || ascii(bytes, 0, 8) !== MAGIC) return { bytes, report };
    try {
      return { bytes: upgradeBinary(bytes, report), report };
    } catch (e) {
      console.warn("[placefix] could not upgrade place, loading as-is:", e);
      return { bytes, report };
    }
  }

  window.PlaceFix = { upgrade };
})();
