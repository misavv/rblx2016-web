/* Avatar3D — a small, dependency-free WebGL viewer for a 2016 R6 avatar, like
 * the 2016 Avatar page's "3D" view. Everything comes from local files:
 * clothing templates from catalog/item/<id>, hat/hair meshes and textures from
 * the bundled pack via /asset/?id=N (the same URLs the engine uses).
 *
 *   const v = Avatar3D.create(canvas);
 *   v.setAvatar({ body:[6 hex], shirt, pants, tshirt, face, accessories:[itemUrl], brickHex });
 *
 * Coordinates are Bloxro's: +Y up, the character faces -Z, its right is +X.
 */
(function () {
  "use strict";

  // ------------------------------------------------------------ CFrame math
  // Bloxro convention: world = p + R*v, R stored row-major (R00 R01 R02 ...).
  const ID3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const CF = (x, y, z, r) => ({ p: [x || 0, y || 0, z || 0], r: r || ID3.slice() });
  function cfMul(a, b) {
    const A = a.r, B = b.r, r = new Array(9), p = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) r[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
      p[i] = A[i * 3] * b.p[0] + A[i * 3 + 1] * b.p[1] + A[i * 3 + 2] * b.p[2] + a.p[i];
    }
    return { p, r };
  }
  function cfInv(a) {
    const R = a.r;
    const r = [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]];
    const p = [0, 0, 0];
    for (let i = 0; i < 3; i++) p[i] = -(r[i * 3] * a.p[0] + r[i * 3 + 1] * a.p[1] + r[i * 3 + 2] * a.p[2]);
    return { p, r };
  }
  // model = p + R*(v*s + o), as a column-major mat4; plus R as a mat3 for normals.
  function modelMats(c, s, o) {
    s = s || [1, 1, 1]; o = o || [0, 0, 0];
    const R = c.r;
    const t = [
      R[0] * o[0] + R[1] * o[1] + R[2] * o[2] + c.p[0],
      R[3] * o[0] + R[4] * o[1] + R[5] * o[2] + c.p[1],
      R[6] * o[0] + R[7] * o[1] + R[8] * o[2] + c.p[2],
    ];
    return {
      model: new Float32Array([
        R[0] * s[0], R[3] * s[0], R[6] * s[0], 0,
        R[1] * s[1], R[4] * s[1], R[7] * s[1], 0,
        R[2] * s[2], R[5] * s[2], R[8] * s[2], 0,
        t[0], t[1], t[2], 1]),
      nrm: new Float32Array([R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]]),
    };
  }
  function perspective(fovy, aspect, n, f) {
    const t = 1 / Math.tan(fovy / 2), nf = 1 / (n - f);
    return new Float32Array([t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]);
  }
  function lookAt(e, c, u) {
    let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
    let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx;
    l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
  }

  // ------------------------------------------------------------- geometry
  function geo(n) { return { pos: new Float32Array(n * 3), nrm: new Float32Array(n * 3), uv: new Float32Array(n * 2), count: n }; }

  // A box whose faces sample rectangles of a W x H texture (pixel rects), laid
  // out like Bloxro's clothing template net. Front is -Z, the part's right +X.
  function box(sx, sy, sz, rects, W, H) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    // Each face: normal, then corners top-left, top-right, bottom-left, bottom-right.
    const faces = [
      ["F", [0, 0, -1], [hx, hy, -hz], [-hx, hy, -hz], [hx, -hy, -hz], [-hx, -hy, -hz]],
      ["B", [0, 0, 1], [-hx, hy, hz], [hx, hy, hz], [-hx, -hy, hz], [hx, -hy, hz]],
      ["R", [1, 0, 0], [hx, hy, hz], [hx, hy, -hz], [hx, -hy, hz], [hx, -hy, -hz]],
      ["L", [-1, 0, 0], [-hx, hy, -hz], [-hx, hy, hz], [-hx, -hy, -hz], [-hx, -hy, hz]],
      ["U", [0, 1, 0], [hx, hy, hz], [-hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]],
      ["D", [0, -1, 0], [hx, -hy, -hz], [-hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]],
    ];
    const g = geo(36);
    let v = 0;
    for (const [k, n, tl, tr, bl, br] of faces) {
      const r = rects[k];
      const u0 = r[0] / W, v0 = r[1] / H, u1 = (r[0] + r[2]) / W, v1 = (r[1] + r[3]) / H;
      const quad = [[tl, u0, v0], [bl, u0, v1], [tr, u1, v0], [tr, u1, v0], [bl, u0, v1], [br, u1, v1]];
      for (const [p, u, w] of quad) {
        g.pos.set(p, v * 3); g.nrm.set(n, v * 3); g.uv[v * 2] = u; g.uv[v * 2 + 1] = w; v++;
      }
    }
    return g;
  }

  // The 2016 head: a cylinder with rounded rims (Head mesh on a 2x1x1 part,
  // scaled 1.25). The side band carries the face; caps sample plain colour.
  function headGeo() {
    const seg = 40;
    const prof = [[0, -0.62], [0.47, -0.62], [0.6, -0.5], [0.62, -0.36], [0.62, 0.36], [0.6, 0.5], [0.47, 0.62], [0, 0.62]];
    const sideTop = 0.36, sideBot = -0.36;
    const tris = [];
    for (let s = 0; s < seg; s++) {
      const a0 = (s / seg) * Math.PI * 2, a1 = ((s + 1) / seg) * Math.PI * 2;
      for (let k = 0; k < prof.length - 1; k++) {
        const ring = (a, pr) => {
          // a = 0 at +X (character's right), PI/2 at the front (-Z).
          const x = pr[0] * Math.cos(a), z = -pr[0] * Math.sin(a), y = pr[1];
          const nl = Math.hypot(x, z) || 1;
          const nn = pr[0] === 0 ? [0, Math.sign(y), 0] : [x / nl, (Math.abs(y) > sideTop ? Math.sign(y) * 0.6 : 0), z / nl];
          const side = pr[1] <= sideTop + 1e-6 && pr[1] >= sideBot - 1e-6 && pr[0] > 0.6;
          const u = side ? a / (Math.PI * 2) : 0.97;
          const vv = side ? (sideTop - y) / (sideTop - sideBot) : 0.5;
          return [[x, y, z], nn, [u, vv]];
        };
        const p00 = ring(a0, prof[k]), p01 = ring(a1, prof[k]), p10 = ring(a0, prof[k + 1]), p11 = ring(a1, prof[k + 1]);
        tris.push(p00, p10, p01, p01, p10, p11);
      }
    }
    const g = geo(tris.length);
    tris.forEach((t, i) => { g.pos.set(t[0], i * 3); g.nrm.set(t[1], i * 3); g.uv.set(t[2], i * 2); });
    return g;
  }

  // ----------------------------------------------------------- mesh files
  function parseMesh(buf) {
    const bytes = new Uint8Array(buf);
    const head = new TextDecoder("latin1").decode(bytes.subarray(0, 12));
    if (head.startsWith("version 1.0")) return parseMeshV1(new TextDecoder("latin1").decode(bytes), head.startsWith("version 1.00"));
    if (head.startsWith("version 2.0")) return parseMeshBin(buf, false);
    if (head.startsWith("version 3.0")) return parseMeshBin(buf, true);
    return null;  // 4.x+ (skinned) is newer than 2016
  }
  function parseMeshV1(text, halve) {
    const nl = text.indexOf("\n"), nl2 = text.indexOf("\n", nl + 1);
    const nums = text.slice(nl2 + 1).match(/-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || [];
    const n = Math.floor(nums.length / 9);
    const g = geo(n), k = halve ? 0.5 : 1;   // 1.00 meshes are stored at double size
    for (let i = 0; i < n; i++) {
      const b = i * 9;
      g.pos[i * 3] = +nums[b] * k; g.pos[i * 3 + 1] = +nums[b + 1] * k; g.pos[i * 3 + 2] = +nums[b + 2] * k;
      g.nrm[i * 3] = +nums[b + 3]; g.nrm[i * 3 + 1] = +nums[b + 4]; g.nrm[i * 3 + 2] = +nums[b + 5];
      g.uv[i * 2] = +nums[b + 6]; g.uv[i * 2 + 1] = +nums[b + 7];
    }
    return g;
  }
  function parseMeshBin(buf, v3) {
    const dv = new DataView(buf), b = new Uint8Array(buf);
    const o = b.indexOf(10) + 1;
    const hsz = dv.getUint16(o, true), vsz = dv.getUint8(o + 2), fsz = dv.getUint8(o + 3);
    let nv, nf, lods = 0;
    if (v3) { lods = dv.getUint16(o + 6, true); nv = dv.getUint32(o + 8, true); nf = dv.getUint32(o + 12, true); }
    else { nv = dv.getUint32(o + 4, true); nf = dv.getUint32(o + 8, true); }
    const vAt = o + hsz, fAt = vAt + nv * vsz;
    let f0 = 0, f1 = nf;
    if (v3 && lods >= 2) { const lp = fAt + nf * fsz; f0 = dv.getUint32(lp, true); f1 = dv.getUint32(lp + 4, true); }
    const g = geo((f1 - f0) * 3);
    let w = 0;
    for (let f = f0; f < f1; f++) {
      for (let k = 0; k < 3; k++) {
        const vi = dv.getUint32(fAt + f * fsz + k * 4, true);
        const q = vAt + vi * vsz;
        for (let j = 0; j < 3; j++) {
          g.pos[w * 3 + j] = dv.getFloat32(q + j * 4, true);
          g.nrm[w * 3 + j] = dv.getFloat32(q + 12 + j * 4, true);
        }
        g.uv[w * 2] = dv.getFloat32(q + 24, true);
        g.uv[w * 2 + 1] = 1 - dv.getFloat32(q + 28, true);
        w++;
      }
    }
    return g;
  }

  // ------------------------------------------------------ accessory XML
  // Resolve against the site root (this script lives in <root>/js/), so the
  // viewer works from the menu and from the ported site pages alike.
  const ROOT = (() => {
    try { return new URL("../", document.currentScript.src).href; } catch (_) { return "/"; }
  })();
  const assetUrl = (u) => {
    if (!u) return null;
    const m = /(?:[?&]id=|rbxassetid:\/\/)(\d+)/i.exec(u);
    if (m) return ROOT + "asset/?id=" + m[1];
    const local = /^rbxasset:\/\/(.+)$/i.exec(u);
    return local ? ROOT + "content/" + local[1] : null;
  };
  const num = (el, tag) => { const e = el && el.getElementsByTagName(tag)[0]; return e ? parseFloat(e.textContent) : 0; };
  function readCF(el) {
    if (!el) return null;
    return CF(num(el, "X"), num(el, "Y"), num(el, "Z"),
      ["R00", "R01", "R02", "R10", "R11", "R12", "R20", "R21", "R22"].map((t) => num(el, t)));
  }
  const readV3 = (el) => (el ? [num(el, "X"), num(el, "Y"), num(el, "Z")] : null);
  const props = (item) => [...item.children].find((c) => c.tagName === "Properties");
  const prop = (item, type, name) => {
    const p = props(item);
    return p ? [...p.children].find((c) => c.tagName === type && c.getAttribute("name") === name) : null;
  };
  const kids = (item, cls) => [...item.children].filter((c) => c.tagName === "Item" && (!cls || c.getAttribute("class") === cls));

  // Character attachment points (the port's C++ adds the same ones to R6).
  const PARTS = {
    Torso: CF(0, 0, 0), Head: CF(0, 1.5, 0),
    "Left Arm": CF(-1.5, 0, 0), "Right Arm": CF(1.5, 0, 0),
  };
  const CHAR_ATT = {
    HatAttachment: ["Head", 0, 0.5, 0], HairAttachment: ["Head", 0, 0.6, 0], FaceFrontAttachment: ["Head", 0, 0, -0.5],
    NeckAttachment: ["Torso", 0, 1, 0], BodyFrontAttachment: ["Torso", 0, 0, -0.5], BodyBackAttachment: ["Torso", 0, 0, 0.5],
    LeftCollarAttachment: ["Torso", -1, 1, 0], RightCollarAttachment: ["Torso", 1, 1, 0],
    WaistCenterAttachment: ["Torso", 0, -1, 0], WaistFrontAttachment: ["Torso", 0, -1, -0.5], WaistBackAttachment: ["Torso", 0, -1, 0.5],
    LeftShoulderAttachment: ["Left Arm", 0, 1, 0], RightShoulderAttachment: ["Right Arm", 0, 1, 0],
  };

  // -> [{ mesh url, texture url, handle CFrame, scale, offset, tint, brick }]
  function readAccessory(xml) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const out = [];
    const roots = [...doc.getElementsByTagName("Item")].filter((i) => /^(Accessory|Hat)$/.test(i.getAttribute("class")));
    for (const acc of roots) {
      const handle = kids(acc, "Part").find((p) => {
        const n = prop(p, "string", "Name");
        return n && n.textContent === "Handle";
      }) || kids(acc, "Part")[0];
      if (!handle) continue;
      const mesh = kids(handle, "SpecialMesh")[0] || kids(handle, "FileMesh")[0];
      if (!mesh) continue;
      const type = prop(mesh, "token", "MeshType");
      if (type && type.textContent !== "5" && mesh.getAttribute("class") === "SpecialMesh") continue;
      const meshId = prop(mesh, "Content", "MeshId");
      const texId = prop(mesh, "Content", "TextureId");
      let place = null;
      for (const att of kids(handle, "Attachment")) {
        const n = prop(att, "string", "Name");
        const c = n && CHAR_ATT[n.textContent];
        if (c) {
          const charAtt = cfMul(PARTS[c[0]], CF(c[1], c[2], c[3]));
          place = cfMul(charAtt, cfInv(readCF(prop(att, "CoordinateFrame", "CFrame"))));
          break;
        }
      }
      if (!place) {  // legacy hat: Head * (0, 0.5, 0) * AttachmentPoint^-1
        const ap = readCF(prop(acc, "CoordinateFrame", "AttachmentPoint")) || CF();
        place = cfMul(cfMul(PARTS.Head, CF(0, 0.5, 0)), cfInv(ap));
      }
      const brick = prop(handle, "int", "BrickColor");
      out.push({
        mesh: assetUrl(meshId && meshId.textContent),
        tex: assetUrl(texId && texId.textContent),
        place,
        scale: readV3(prop(mesh, "Vector3", "Scale")) || [1, 1, 1],
        offset: readV3(prop(mesh, "Vector3", "Offset")) || [0, 0, 0],
        tint: readV3(prop(mesh, "Vector3", "VertexColor")) || [1, 1, 1],
        brick: brick ? parseInt(brick.textContent, 10) : 194,
      });
    }
    return out;
  }

  // ------------------------------------------------------------ loaders
  const cache = new Map();
  function cached(key, make) {
    if (!cache.has(key)) cache.set(key, make().catch((e) => { cache.delete(key); throw e; }));
    return cache.get(key);
  }
  const loadBuf = (url) => cached("b:" + url, async () => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.arrayBuffer();
  });
  const loadImg = (url) => cached("i:" + url, async () => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + " " + r.status);
    return createImageBitmap(await r.blob());
  });
  const loadText = (url) => cached("t:" + url, async () => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.text();
  });
  const tryImg = (url) => (url ? loadImg(url).catch(() => null) : Promise.resolve(null));

  // Clothing template net (585 x 559): torso, right arm/leg, left arm/leg.
  const T_W = 585, T_H = 559;
  const RECT_TORSO = { F: [231, 74, 128, 128], B: [427, 74, 128, 128], R: [165, 74, 64, 128], L: [361, 74, 64, 128], U: [231, 8, 128, 64], D: [231, 204, 128, 64] };
  const RECT_RIGHT = { F: [217, 355, 64, 128], B: [85, 355, 64, 128], R: [151, 355, 64, 128], L: [19, 355, 64, 128], U: [217, 289, 64, 64], D: [217, 485, 64, 64] };
  const RECT_LEFT = { F: [308, 355, 64, 128], B: [440, 355, 64, 128], L: [374, 355, 64, 128], R: [506, 355, 64, 128], U: [308, 289, 64, 64], D: [308, 485, 64, 64] };

  function composite(color, layers, extra) {
    const c = document.createElement("canvas");
    c.width = T_W; c.height = T_H;
    const g = c.getContext("2d");
    g.fillStyle = color;
    g.fillRect(0, 0, T_W, T_H);
    for (const img of layers) if (img) g.drawImage(img, 0, 0, T_W, T_H);
    if (extra) extra(g);
    return c;
  }
  function headTexture(color, face) {
    const c = document.createElement("canvas");
    c.width = 1024; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    // The front of the head (-Z) is at angle PI/2 -> u = 0.25.
    if (face) g.drawImage(face, 0.25 * c.width - 150, -22, 300, 300);
    return c;
  }

  // --------------------------------------------------------------- viewer
  const VS = "attribute vec3 aPos;attribute vec3 aNrm;attribute vec2 aUv;" +
    "uniform mat4 uProj,uView,uModel;uniform mat3 uNrmM;varying vec3 vN;varying vec2 vUv;" +
    "void main(){vN=uNrmM*aNrm;vUv=aUv;gl_Position=uProj*uView*uModel*vec4(aPos,1.0);}";
  const FS = "precision mediump float;uniform sampler2D uTex;uniform vec4 uTint;varying vec3 vN;varying vec2 vUv;" +
    "void main(){vec4 c=texture2D(uTex,vUv)*uTint;if(c.a<0.1)discard;vec3 n=normalize(vN);" +
    "float d=max(dot(n,normalize(vec3(-0.45,0.75,-0.6))),0.0);float b=max(dot(n,normalize(vec3(0.7,0.25,0.65))),0.0)*0.3;" +
    "gl_FragColor=vec4(c.rgb*(0.48+0.62*d+b),1.0);}";

  function create(canvas) {
    const gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    const A = { pos: gl.getAttribLocation(prog, "aPos"), nrm: gl.getAttribLocation(prog, "aNrm"), uv: gl.getAttribLocation(prog, "aUv") };
    const U = {};
    for (const n of ["uProj", "uView", "uModel", "uNrmM", "uTex", "uTint"]) U[n] = gl.getUniformLocation(prog, n);

    const texCache = new Map();
    function texture(src, key) {
      if (key && texCache.has(key)) return texCache.get(key);
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (key) texCache.set(key, t);
      return t;
    }
    const white = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 2, 2); return texture(c, "white"); })();
    const bufCache = new Map();
    function upload(g, key) {
      if (key && bufCache.has(key)) return bufCache.get(key);
      const mk = (arr) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); return b; };
      const out = { pos: mk(g.pos), nrm: mk(g.nrm), uv: mk(g.uv), count: g.count };
      if (key) bufCache.set(key, out);
      return out;
    }
    const meshes = {
      torso: upload(box(2, 2, 1, RECT_TORSO, T_W, T_H), "torso"),
      rArm: upload(box(1, 2, 1, RECT_RIGHT, T_W, T_H), "rArm"),
      lArm: upload(box(1, 2, 1, RECT_LEFT, T_W, T_H), "lArm"),
      head: upload(headGeo(), "head"),
    };

    const view = { yaw: Math.PI / 2 + 0.35, pitch: 0.18, dist: 10.5, items: [], tempTex: [] };
    let pending = 0;
    function frame() {
      pending = 0;
      const dpr = window.devicePixelRatio || 1;
      // A canvas that isn't on the page (picture rendering) keeps its own size.
      const onPage = canvas.clientWidth > 0 && canvas.clientHeight > 0;
      const w = onPage ? Math.max(1, Math.round(canvas.clientWidth * dpr)) : canvas.width;
      const h = onPage ? Math.max(1, Math.round(canvas.clientHeight * dpr)) : canvas.height;
      if (onPage && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(prog);
      const target = [0, -0.6, 0];
      // yaw: angle around Y measured like the head (PI/2 = in front, -Z).
      const cp = Math.cos(view.pitch);
      const eye = [target[0] + view.dist * cp * Math.cos(view.yaw), target[1] + view.dist * Math.sin(view.pitch),
        target[2] - view.dist * cp * Math.sin(view.yaw)];
      gl.uniformMatrix4fv(U.uProj, false, perspective(0.62, w / h, 0.1, 100));
      gl.uniformMatrix4fv(U.uView, false, lookAt(eye, target, [0, 1, 0]));
      gl.uniform1i(U.uTex, 0);
      for (const it of view.items) {
        gl.uniformMatrix4fv(U.uModel, false, it.m.model);
        gl.uniformMatrix3fv(U.uNrmM, false, it.m.nrm);
        gl.uniform4fv(U.uTint, it.tint);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, it.tex);
        for (const [loc, buf, n] of [[A.pos, it.buf.pos, 3], [A.nrm, it.buf.nrm, 3], [A.uv, it.buf.uv, 2]]) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0);
        }
        gl.drawArrays(gl.TRIANGLES, 0, it.buf.count);
      }
    }
    const redraw = () => { if (!pending) pending = requestAnimationFrame(frame); };

    // Drag to spin, wheel to zoom (like the 2016 3D thumbnail).
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      view.yaw += (e.clientX - drag.x) * 0.012;
      view.pitch = Math.max(-0.6, Math.min(1.1, view.pitch + (e.clientY - drag.y) * 0.008));
      drag = { x: e.clientX, y: e.clientY };
      redraw();
    });
    const endDrag = () => { drag = null; };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      view.dist = Math.max(5, Math.min(20, view.dist * (e.deltaY > 0 ? 1.08 : 0.93)));
      redraw();
    }, { passive: false });

    let token = 0;
    async function setAvatar(d) {
      const my = ++token;
      const hex = d.body || ["#f5cd30", "#f5cd30", "#f5cd30", "#0d69ac", "#4b974b", "#4b974b"];
      const [shirt, pants, tee, face] = await Promise.all([tryImg(d.shirt), tryImg(d.pants), tryImg(d.tshirt), tryImg(d.face)]);
      const accs = [];
      for (const url of d.accessories || []) {
        try {
          for (const a of readAccessory(await loadText(url))) {
            const [buf, tex] = await Promise.all([a.mesh ? loadBuf(a.mesh) : null, tryImg(a.tex)]);
            const g = buf && parseMesh(buf);
            if (g && g.count) accs.push({ a, g, tex, key: a.mesh });
          }
        } catch (_) { /* an item that fails to load is just not drawn */ }
      }
      if (my !== token) return;
      for (const t of view.tempTex) gl.deleteTexture(t);
      view.tempTex = [];
      const temp = (src) => { const t = texture(src); view.tempTex.push(t); return t; };
      const W = [1, 1, 1, 1];
      const tTorso = temp(composite(hex[3], [pants, shirt], (g) => { if (tee) g.drawImage(tee, 231 + 8, 74 + 8, 112, 112); }));
      const items = [
        { buf: meshes.torso, tex: tTorso, m: modelMats(CF(0, 0, 0)), tint: W },
        { buf: meshes.rArm, tex: temp(composite(hex[2], [shirt])), m: modelMats(CF(1.5, 0, 0)), tint: W },
        { buf: meshes.lArm, tex: temp(composite(hex[1], [shirt])), m: modelMats(CF(-1.5, 0, 0)), tint: W },
        { buf: meshes.rArm, tex: temp(composite(hex[5], [pants])), m: modelMats(CF(0.5, -2, 0)), tint: W },
        { buf: meshes.lArm, tex: temp(composite(hex[4], [pants])), m: modelMats(CF(-0.5, -2, 0)), tint: W },
        { buf: meshes.head, tex: temp(headTexture(hex[0], face)), m: modelMats(CF(0, 1.5, 0)), tint: W },
      ];
      for (const { a, g, tex, key } of accs) {
        const col = tex ? null : (d.brickHex ? d.brickHex(a.brick) : "#a3a2a5");
        const tint = col
          ? [parseInt(col.slice(1, 3), 16) / 255, parseInt(col.slice(3, 5), 16) / 255, parseInt(col.slice(5, 7), 16) / 255, 1]
          : [a.tint[0], a.tint[1], a.tint[2], 1];
        items.push({ buf: upload(g, "m:" + key), tex: tex ? texture(tex, "t:" + a.tex) : white,
          m: modelMats(a.place, a.scale, a.offset), tint });
      }
      view.items = items;
      redraw();
    }
    // Draw immediately (for reading the canvas right after, e.g. toBlob).
    const drawNow = () => { if (pending) { cancelAnimationFrame(pending); pending = 0; } frame(); };
    return { setAvatar, redraw, drawNow, view };
  }

  window.Avatar3D = { create, _parseMesh: parseMesh, _readAccessory: readAccessory };
})();
