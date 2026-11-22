// This code implements the `-sMODULARIZE` settings by taking the generated
// JS program code (INNER_JS_CODE) and wrapping it in a factory function.

// Single threaded MINIMAL_RUNTIME programs do not need access to
// document.currentScript, so a simple export declaration is enough.
var createRBLX2016Module = (() => {
  // When MODULARIZE this JS may be executed later,
  // after document.currentScript is gone, so we save it.
  // In EXPORT_ES6 mode we can just use 'import.meta.url'.
  var _scriptName = globalThis.document?.currentScript?.src;
  return async function(moduleArg = {}) {
    var Module = moduleArg;
// include: shell.js
// include: minimum_runtime_check.js
(function() {
  // "30.0.0" -> 300000
  function humanReadableVersionToPacked(str) {
    str = str.split("-")[0];
    // Remove any trailing part from e.g. "12.53.3-alpha"
    let vers = str.split(".").slice(0, 3);
    while (vers.length < 3) vers.push("00");
    vers = vers.map((n, i, arr) => n.padStart(2, "0"));
    return vers.join("");
  }
  // 300000 -> "30.0.0"
  const packedVersionToHumanReadable = n => [ n / 1e4 | 0, (n / 100 | 0) % 100, n % 100 ].join(".");
  const TARGET_NOT_SUPPORTED = 2147483647;
  // Note: We use a typeof check here instead of optional chaining using
  // globalThis because older browsers might not have globalThis defined.
  // We skip the node version checking when running on Bun/Deno since the node
  // version they report doesn't seem to be useful.
  if (typeof process !== "undefined" && !process.versions?.bun && typeof Deno === "undefined") {
    const currentNodeVersion = process.versions?.node ? humanReadableVersionToPacked(process.versions.node) : TARGET_NOT_SUPPORTED;
    if (currentNodeVersion < TARGET_NOT_SUPPORTED) {
      throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
    }
    if (currentNodeVersion < 2147483647) {
      throw new Error(`This emscripten-generated code requires node v${packedVersionToHumanReadable(2147483647)} (detected v${packedVersionToHumanReadable(currentNodeVersion)})`);
    }
  }
  const userAgent = typeof navigator !== "undefined" && navigator.userAgent;
  if (!userAgent) {
    return;
  }
  const currentSafariVersion = userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/) ? humanReadableVersionToPacked(userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentSafariVersion < 150400) {
    throw new Error(`This emscripten-generated code requires Safari v${packedVersionToHumanReadable(150400)} (detected v${currentSafariVersion})`);
  }
  const currentFirefoxVersion = userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentFirefoxVersion < 100) {
    throw new Error(`This emscripten-generated code requires Firefox v100 (detected v${currentFirefoxVersion})`);
  }
  const currentChromeVersion = userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentChromeVersion < 95) {
    throw new Error(`This emscripten-generated code requires Chrome v95 (detected v${currentChromeVersion})`);
  }
})();

// end include: minimum_runtime_check.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).
// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = !!globalThis.window;

var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;

// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() running directly in a worker. (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)
// The way we signal to a worker that it is hosting a pthread is to construct
// it with a specific name.
var ENVIRONMENT_IS_PTHREAD = ENVIRONMENT_IS_WORKER && globalThis.name?.startsWith("em-pthread");

if (ENVIRONMENT_IS_PTHREAD) {
  assert(!globalThis.moduleLoaded, "module should only be loaded once on each pthread worker");
  globalThis.moduleLoaded = true;
}

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// include: C:\Users\misa\AppData\Local\Temp\tmp83vkwgri.js
if (!Module["expectedDataFileDownloads"]) Module["expectedDataFileDownloads"] = 0;

Module["expectedDataFileDownloads"]++;

((() => {
  // Do not attempt to redownload the virtual filesystem data when in a pthread or a Wasm Worker context.
  var isPthread = typeof ENVIRONMENT_IS_PTHREAD !== "undefined" && ENVIRONMENT_IS_PTHREAD;
  var isWasmWorker = typeof ENVIRONMENT_IS_WASM_WORKER !== "undefined" && ENVIRONMENT_IS_WASM_WORKER;
  if (isPthread || isWasmWorker) return;
  async function loadPackage(metadata) {
    var PACKAGE_PATH = "";
    if (typeof window === "object") {
      PACKAGE_PATH = window["encodeURIComponent"](window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")) + "/");
    } else if (typeof process === "undefined" && typeof location !== "undefined") {
      // web worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf("/")) + "/");
    }
    var PACKAGE_NAME = "C:/Trunk2016/_webport/rblx16-browser/web/js/rblx2016.data";
    var REMOTE_PACKAGE_BASE = "rblx2016.data";
    var REMOTE_PACKAGE_NAME = Module["locateFile"] ? Module["locateFile"](REMOTE_PACKAGE_BASE, "") : REMOTE_PACKAGE_BASE;
    var REMOTE_PACKAGE_SIZE = metadata["remote_package_size"];
    async function fetchRemotePackage(packageName, packageSize) {
      if (!Module["dataFileDownloads"]) Module["dataFileDownloads"] = {};
      try {
        var response = await fetch(packageName);
      } catch (e) {
        throw new Error(`Network Error: ${packageName}`, {
          e
        });
      }
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.url}`);
      }
      const chunks = [];
      const headers = response.headers;
      const total = Number(headers.get("Content-Length") || packageSize);
      let loaded = 0;
      Module["setStatus"] && Module["setStatus"]("Downloading data...");
      const reader = response.body.getReader();
      while (1) {
        var {done, value} = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        Module["dataFileDownloads"][packageName] = {
          loaded,
          total
        };
        let totalLoaded = 0;
        let totalSize = 0;
        for (const download of Object.values(Module["dataFileDownloads"])) {
          totalLoaded += download.loaded;
          totalSize += download.total;
        }
        Module["setStatus"] && Module["setStatus"](`Downloading data... (${totalLoaded}/${totalSize})`);
      }
      const packageData = new Uint8Array(chunks.map(c => c.length).reduce((a, b) => a + b, 0));
      let offset = 0;
      for (const chunk of chunks) {
        packageData.set(chunk, offset);
        offset += chunk.length;
      }
      return packageData.buffer;
    }
    var fetchPromise;
    var fetched = Module["getPreloadedPackage"] && Module["getPreloadedPackage"](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);
    if (!fetched) {
      // Note that we don't use await here because we want to execute the
      // the rest of this function immediately.
      fetchPromise = fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);
    }
    async function runWithFS(Module) {
      function assert(check, msg) {
        if (!check) throw new Error(msg);
      }
      Module["FS_createPath"]("/", "content", true, true);
      Module["FS_createPath"]("/content", "animations", true, true);
      Module["FS_createPath"]("/content", "fonts", true, true);
      Module["FS_createPath"]("/content", "music", true, true);
      Module["FS_createPath"]("/content", "particles", true, true);
      Module["FS_createPath"]("/content", "scripts", true, true);
      Module["FS_createPath"]("/content/scripts", "CoreScripts", true, true);
      Module["FS_createPath"]("/content/scripts/CoreScripts", "BuildToolsScripts", true, true);
      Module["FS_createPath"]("/content/scripts", "Libraries", true, true);
      Module["FS_createPath"]("/content/scripts", "Modules", true, true);
      Module["FS_createPath"]("/content/scripts/Modules", "Settings", true, true);
      Module["FS_createPath"]("/content/scripts/Modules/Settings", "Pages", true, true);
      Module["FS_createPath"]("/content/scripts", "ServerCoreScripts", true, true);
      Module["FS_createPath"]("/content", "sky", true, true);
      Module["FS_createPath"]("/content", "sounds", true, true);
      Module["FS_createPath"]("/content/sounds", "ui", true, true);
      Module["FS_createPath"]("/content/sounds/ui", "Shell", true, true);
      Module["FS_createPath"]("/content", "terrain", true, true);
      Module["FS_createPath"]("/content", "textures", true, true);
      Module["FS_createPath"]("/content/textures", "Cursors", true, true);
      Module["FS_createPath"]("/content/textures/Cursors", "Gamepad", true, true);
      Module["FS_createPath"]("/content/textures", "aluminum", true, true);
      Module["FS_createPath"]("/content/textures", "brick", true, true);
      Module["FS_createPath"]("/content/textures", "cobblestone", true, true);
      Module["FS_createPath"]("/content/textures", "concrete", true, true);
      Module["FS_createPath"]("/content/textures", "diamondplate", true, true);
      Module["FS_createPath"]("/content/textures", "fabric", true, true);
      Module["FS_createPath"]("/content/textures", "granite", true, true);
      Module["FS_createPath"]("/content/textures", "grass", true, true);
      Module["FS_createPath"]("/content/textures", "ice", true, true);
      Module["FS_createPath"]("/content/textures", "loading", true, true);
      Module["FS_createPath"]("/content/textures", "marble", true, true);
      Module["FS_createPath"]("/content/textures", "metal", true, true);
      Module["FS_createPath"]("/content/textures", "particles", true, true);
      Module["FS_createPath"]("/content/textures", "pebble", true, true);
      Module["FS_createPath"]("/content/textures", "plastic", true, true);
      Module["FS_createPath"]("/content/textures", "rust", true, true);
      Module["FS_createPath"]("/content/textures", "sand", true, true);
      Module["FS_createPath"]("/content/textures", "sky", true, true);
      Module["FS_createPath"]("/content/textures", "slate", true, true);
      Module["FS_createPath"]("/content/textures", "terrain", true, true);
      Module["FS_createPath"]("/content/textures", "ui", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Backpack", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Chat", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Menu", true, true);
      Module["FS_createPath"]("/content/textures/ui", "PlayerList", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Scroll", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Settings", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "DropDown", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "Help", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "MenuBarAssets", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "MenuBarIcons", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "Radial", true, true);
      Module["FS_createPath"]("/content/textures/ui/Settings", "Slider", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Shell", true, true);
      Module["FS_createPath"]("/content/textures/ui/Shell", "Background", true, true);
      Module["FS_createPath"]("/content/textures/ui/Shell", "ButtonIcons", true, true);
      Module["FS_createPath"]("/content/textures/ui/Shell", "Buttons", true, true);
      Module["FS_createPath"]("/content/textures/ui/Shell", "Icons", true, true);
      Module["FS_createPath"]("/content/textures/ui/Shell", "Images", true, true);
      Module["FS_createPath"]("/content/textures/ui/Shell/Images", "CharacterGlow", true, true);
      Module["FS_createPath"]("/content/textures/ui/Shell/Images", "Robux", true, true);
      Module["FS_createPath"]("/content/textures/ui/Shell", "ScreenAdjustment", true, true);
      Module["FS_createPath"]("/content/textures/ui", "TopBar", true, true);
      Module["FS_createPath"]("/content/textures/ui", "Vehicle", true, true);
      Module["FS_createPath"]("/content/textures", "water", true, true);
      Module["FS_createPath"]("/content/textures", "wood", true, true);
      Module["FS_createPath"]("/content/textures", "woodplanks", true, true);
      Module["FS_createPath"]("/", "shaders", true, true);
      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, "Loading data file failed.");
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, "bad input to processPackageData " + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        // Reuse the bytearray from the XHR as the source for file reads.
        for (var file of metadata["files"]) {
          var name = file["filename"];
          var data = byteArray.subarray(file["start"], file["end"]);
          // canOwn this data in the filesystem, it is a slice into the heap that will never change
          Module["FS_createDataFile"](name, null, data, true, true, true);
        }
        Module["removeRunDependency"]("datafile_C:/Trunk2016/_webport/rblx16-browser/web/js/rblx2016.data");
      }
      Module["addRunDependency"]("datafile_C:/Trunk2016/_webport/rblx16-browser/web/js/rblx2016.data");
      if (!Module["preloadResults"]) Module["preloadResults"] = {};
      Module["preloadResults"][PACKAGE_NAME] = {
        fromCache: false
      };
      if (!fetched) {
        fetched = await fetchPromise;
      }
      await processPackageData(fetched);
    }
    // Detect whether the module JS file has already been loaded.
    if (Module["FS_createPath"]) {
      runWithFS(Module);
    } else {
      if (!Module["preRun"]) Module["preRun"] = [];
      Module["preRun"].push(runWithFS);
    }
  }
  loadPackage({
    "files": [ {
      "filename": "/content/animations/125750702.rbxm",
      "start": 0,
      "end": 77680
    }, {
      "filename": "/content/animations/128777973.rbxm",
      "start": 77680,
      "end": 269456
    }, {
      "filename": "/content/animations/128853357.rbxm",
      "start": 269456,
      "end": 408350
    }, {
      "filename": "/content/animations/129423030.rbxm",
      "start": 408350,
      "end": 539114
    }, {
      "filename": "/content/animations/129423131.rbxm",
      "start": 539114,
      "end": 677866
    }, {
      "filename": "/content/animations/129967390.rbxm",
      "start": 677866,
      "end": 683388
    }, {
      "filename": "/content/animations/129967478.rbxm",
      "start": 683388,
      "end": 692364
    }, {
      "filename": "/content/animations/178130996.rbxm",
      "start": 692364,
      "end": 693165
    }, {
      "filename": "/content/animations/180426354.rbxm",
      "start": 693165,
      "end": 699251
    }, {
      "filename": "/content/animations/180435571.rbxm",
      "start": 699251,
      "end": 703620
    }, {
      "filename": "/content/animations/180435792.rbxm",
      "start": 703620,
      "end": 704873
    }, {
      "filename": "/content/animations/180436148.rbxm",
      "start": 704873,
      "end": 709553
    }, {
      "filename": "/content/animations/180436334.rbxm",
      "start": 709553,
      "end": 713261
    }, {
      "filename": "/content/animations/182393478.rbxm",
      "start": 713261,
      "end": 714057
    }, {
      "filename": "/content/animations/182435998.rbxm",
      "start": 714057,
      "end": 721087
    }, {
      "filename": "/content/animations/182436842.rbxm",
      "start": 721087,
      "end": 732153
    }, {
      "filename": "/content/animations/182436935.rbxm",
      "start": 732153,
      "end": 738785
    }, {
      "filename": "/content/animations/182491037.rbxm",
      "start": 738785,
      "end": 745848
    }, {
      "filename": "/content/animations/182491065.rbxm",
      "start": 745848,
      "end": 752911
    }, {
      "filename": "/content/animations/182491248.rbxm",
      "start": 752911,
      "end": 763966
    }, {
      "filename": "/content/animations/182491277.rbxm",
      "start": 763966,
      "end": 775021
    }, {
      "filename": "/content/animations/182491368.rbxm",
      "start": 775021,
      "end": 781640
    }, {
      "filename": "/content/animations/182491423.rbxm",
      "start": 781640,
      "end": 788259
    }, {
      "filename": "/content/fonts/Arial.font",
      "start": 788259,
      "end": 848599
    }, {
      "filename": "/content/fonts/ArialBold.font",
      "start": 848599,
      "end": 896443
    }, {
      "filename": "/content/fonts/CompositExtraSlot0.mesh",
      "start": 896443,
      "end": 897260
    }, {
      "filename": "/content/fonts/CompositExtraSlot1.mesh",
      "start": 897260,
      "end": 898077
    }, {
      "filename": "/content/fonts/CompositExtraSlot2.mesh",
      "start": 898077,
      "end": 898894
    }, {
      "filename": "/content/fonts/CompositExtraSlot3.mesh",
      "start": 898894,
      "end": 899711
    }, {
      "filename": "/content/fonts/CompositExtraSlot4.mesh",
      "start": 899711,
      "end": 900528
    }, {
      "filename": "/content/fonts/CompositFullAtlasBaseTexture.mesh",
      "start": 900528,
      "end": 900721
    }, {
      "filename": "/content/fonts/CompositFullAtlasOverlayTexture.mesh",
      "start": 900721,
      "end": 900914
    }, {
      "filename": "/content/fonts/CompositLeftArmBase.mesh",
      "start": 900914,
      "end": 929835
    }, {
      "filename": "/content/fonts/CompositLeftLegBase.mesh",
      "start": 929835,
      "end": 958756
    }, {
      "filename": "/content/fonts/CompositPantsTemplate.mesh",
      "start": 958756,
      "end": 1001957
    }, {
      "filename": "/content/fonts/CompositRightArmBase.mesh",
      "start": 1001957,
      "end": 1030542
    }, {
      "filename": "/content/fonts/CompositRightLegBase.mesh",
      "start": 1030542,
      "end": 1059127
    }, {
      "filename": "/content/fonts/CompositShirtTemplate.mesh",
      "start": 1059127,
      "end": 1102328
    }, {
      "filename": "/content/fonts/CompositTShirt.mesh",
      "start": 1102328,
      "end": 1102521
    }, {
      "filename": "/content/fonts/CompositTorsoBase.mesh",
      "start": 1102521,
      "end": 1131442
    }, {
      "filename": "/content/fonts/LoadingScript.lua",
      "start": 1131442,
      "end": 1156271
    }, {
      "filename": "/content/fonts/Rocket.rbxm",
      "start": 1156271,
      "end": 1160771
    }, {
      "filename": "/content/fonts/SlingshotPellet.rbxm",
      "start": 1160771,
      "end": 1164201
    }, {
      "filename": "/content/fonts/SourceSans.font",
      "start": 1164201,
      "end": 1238645
    }, {
      "filename": "/content/fonts/SourceSansBold.font",
      "start": 1238645,
      "end": 1316833
    }, {
      "filename": "/content/fonts/SourceSansItalic.font",
      "start": 1316833,
      "end": 1392141
    }, {
      "filename": "/content/fonts/SourceSansLight.font",
      "start": 1392141,
      "end": 1466777
    }, {
      "filename": "/content/fonts/SourceSansPro-Bold.ttf",
      "start": 1466777,
      "end": 1758361
    }, {
      "filename": "/content/fonts/SourceSansPro-It.ttf",
      "start": 1758361,
      "end": 1861981
    }, {
      "filename": "/content/fonts/SourceSansPro-Light.ttf",
      "start": 1861981,
      "end": 2155285
    }, {
      "filename": "/content/fonts/SourceSansPro-Regular.ttf",
      "start": 2155285,
      "end": 2449245
    }, {
      "filename": "/content/fonts/arial.ttf",
      "start": 2449245,
      "end": 3223097
    }, {
      "filename": "/content/fonts/arialbd.ttf",
      "start": 3223097,
      "end": 3973313
    }, {
      "filename": "/content/fonts/character.rbxm",
      "start": 3973313,
      "end": 3989971
    }, {
      "filename": "/content/fonts/character3.rbxm",
      "start": 3989971,
      "end": 4008938
    }, {
      "filename": "/content/fonts/characterCameraScript.rbxmx",
      "start": 4008938,
      "end": 4141039
    }, {
      "filename": "/content/fonts/characterControlScript.rbxmx",
      "start": 4141039,
      "end": 4211669
    }, {
      "filename": "/content/fonts/characterR15.rbxm",
      "start": 4211669,
      "end": 4217220
    }, {
      "filename": "/content/fonts/comics.fnt",
      "start": 4217220,
      "end": 4232468
    }, {
      "filename": "/content/fonts/diogenes.fnt",
      "start": 4232468,
      "end": 4235398
    }, {
      "filename": "/content/fonts/fonts.dds",
      "start": 4235398,
      "end": 8429830
    }, {
      "filename": "/content/fonts/gamecontrollerdb.txt",
      "start": 8429830,
      "end": 8453896
    }, {
      "filename": "/content/fonts/hammer.mesh",
      "start": 8453896,
      "end": 9136763
    }, {
      "filename": "/content/fonts/head.mesh",
      "start": 9136763,
      "end": 9165552
    }, {
      "filename": "/content/fonts/headA.mesh",
      "start": 9165552,
      "end": 9179113
    }, {
      "filename": "/content/fonts/headB.mesh",
      "start": 9179113,
      "end": 9180146
    }, {
      "filename": "/content/fonts/headC.mesh",
      "start": 9180146,
      "end": 9199107
    }, {
      "filename": "/content/fonts/headD.mesh",
      "start": 9199107,
      "end": 9228616
    }, {
      "filename": "/content/fonts/headE.mesh",
      "start": 9228616,
      "end": 9253121
    }, {
      "filename": "/content/fonts/headF.mesh",
      "start": 9253121,
      "end": 9262722
    }, {
      "filename": "/content/fonts/headG.mesh",
      "start": 9262722,
      "end": 9284311
    }, {
      "filename": "/content/fonts/headH.mesh",
      "start": 9284311,
      "end": 9313100
    }, {
      "filename": "/content/fonts/headI.mesh",
      "start": 9313100,
      "end": 9315981
    }, {
      "filename": "/content/fonts/headJ.mesh",
      "start": 9315981,
      "end": 9318646
    }, {
      "filename": "/content/fonts/headK.mesh",
      "start": 9318646,
      "end": 9347435
    }, {
      "filename": "/content/fonts/headL.mesh",
      "start": 9347435,
      "end": 9361464
    }, {
      "filename": "/content/fonts/headM.mesh",
      "start": 9361464,
      "end": 9364705
    }, {
      "filename": "/content/fonts/headN.mesh",
      "start": 9364705,
      "end": 9394214
    }, {
      "filename": "/content/fonts/headO.mesh",
      "start": 9394214,
      "end": 9413319
    }, {
      "filename": "/content/fonts/headP.mesh",
      "start": 9413319,
      "end": 9442828
    }, {
      "filename": "/content/fonts/humanoidAnimate.rbxm",
      "start": 9442828,
      "end": 9450081
    }, {
      "filename": "/content/fonts/humanoidAnimateLocal.rbxm",
      "start": 9450081,
      "end": 9458823
    }, {
      "filename": "/content/fonts/humanoidAnimateLocalKeyframe.rbxm",
      "start": 9458823,
      "end": 9481420
    }, {
      "filename": "/content/fonts/humanoidAnimateLocalKeyframe2.rbxm",
      "start": 9481420,
      "end": 9501182
    }, {
      "filename": "/content/fonts/humanoidAnimateR15.rbxm",
      "start": 9501182,
      "end": 9507031
    }, {
      "filename": "/content/fonts/humanoidExtra.rbxm",
      "start": 9507031,
      "end": 9509677
    }, {
      "filename": "/content/fonts/humanoidSound.rbxm",
      "start": 9509677,
      "end": 9511993
    }, {
      "filename": "/content/fonts/humanoidSound2.rbxm",
      "start": 9511993,
      "end": 9513793
    }, {
      "filename": "/content/fonts/humanoidSoundNew.rbxm",
      "start": 9513793,
      "end": 9518138
    }, {
      "filename": "/content/fonts/humanoidSoundNewLocal.rbxmx",
      "start": 9518138,
      "end": 9526973
    }, {
      "filename": "/content/fonts/humanoidStatic.rbxm",
      "start": 9526973,
      "end": 9527588
    }, {
      "filename": "/content/fonts/leftarm.mesh",
      "start": 9527588,
      "end": 9529653
    }, {
      "filename": "/content/fonts/leftleg.mesh",
      "start": 9529653,
      "end": 9531718
    }, {
      "filename": "/content/fonts/rightarm.mesh",
      "start": 9531718,
      "end": 9533783
    }, {
      "filename": "/content/fonts/rightleg.mesh",
      "start": 9533783,
      "end": 9535848
    }, {
      "filename": "/content/fonts/rocketlauncher.mesh",
      "start": 9535848,
      "end": 9759324
    }, {
      "filename": "/content/fonts/safechat.xml",
      "start": 9759324,
      "end": 9784816
    }, {
      "filename": "/content/fonts/slingshot.mesh",
      "start": 9784816,
      "end": 10168598
    }, {
      "filename": "/content/fonts/sword.mesh",
      "start": 10168598,
      "end": 10214747
    }, {
      "filename": "/content/fonts/timebomb.mesh",
      "start": 10214747,
      "end": 10857887
    }, {
      "filename": "/content/fonts/torso.mesh",
      "start": 10857887,
      "end": 10859952
    }, {
      "filename": "/content/fonts/trowel.mesh",
      "start": 10859952,
      "end": 10936689
    }, {
      "filename": "/content/music/bass.wav",
      "start": 10936689,
      "end": 10943069
    }, {
      "filename": "/content/music/ufofly.wav",
      "start": 10943069,
      "end": 10977511
    }, {
      "filename": "/content/particles/explosion.particle",
      "start": 10977511,
      "end": 10981289
    }, {
      "filename": "/content/particles/fire.particle",
      "start": 10981289,
      "end": 10982735
    }, {
      "filename": "/content/particles/forceFieldBeam.particle",
      "start": 10982735,
      "end": 10983654
    }, {
      "filename": "/content/particles/forceFieldRadial.particle",
      "start": 10983654,
      "end": 10984838
    }, {
      "filename": "/content/particles/smoke.particle",
      "start": 10984838,
      "end": 10985734
    }, {
      "filename": "/content/particles/sparkles.particle",
      "start": 10985734,
      "end": 10986722
    }, {
      "filename": "/content/scripts/CoreScripts/BubbleChat.lua",
      "start": 10986722,
      "end": 11008739
    }, {
      "filename": "/content/scripts/CoreScripts/BuildToolsScripts/BuildToolManager.lua",
      "start": 11008739,
      "end": 11013559
    }, {
      "filename": "/content/scripts/CoreScripts/BuildToolsScripts/BuildToolsScript.lua",
      "start": 11013559,
      "end": 11019114
    }, {
      "filename": "/content/scripts/CoreScripts/BuildToolsScripts/PersonalServerScript.lua",
      "start": 11019114,
      "end": 11024951
    }, {
      "filename": "/content/scripts/CoreScripts/ContextActionTouch.lua",
      "start": 11024951,
      "end": 11033630
    }, {
      "filename": "/content/scripts/CoreScripts/DeveloperConsole.lua",
      "start": 11033630,
      "end": 11075065
    }, {
      "filename": "/content/scripts/CoreScripts/GamepadMenu.lua",
      "start": 11075065,
      "end": 11097447
    }, {
      "filename": "/content/scripts/CoreScripts/HealthScript.lua",
      "start": 11097447,
      "end": 11107845
    }, {
      "filename": "/content/scripts/CoreScripts/MainBotChatScript2.lua",
      "start": 11107845,
      "end": 11131785
    }, {
      "filename": "/content/scripts/CoreScripts/NotificationScript2.lua",
      "start": 11131785,
      "end": 11155689
    }, {
      "filename": "/content/scripts/CoreScripts/PurchasePromptScript2.lua",
      "start": 11155689,
      "end": 11209288
    }, {
      "filename": "/content/scripts/CoreScripts/Topbar.lua",
      "start": 11209288,
      "end": 11244387
    }, {
      "filename": "/content/scripts/CoreScripts/VehicleHud.lua",
      "start": 11244387,
      "end": 11250396
    }, {
      "filename": "/content/scripts/Libraries/RbxGui.lua",
      "start": 11250396,
      "end": 11391817
    }, {
      "filename": "/content/scripts/Libraries/RbxStamper.lua",
      "start": 11391817,
      "end": 11476188
    }, {
      "filename": "/content/scripts/Libraries/RbxUtility.lua",
      "start": 11476188,
      "end": 11512800
    }, {
      "filename": "/content/scripts/LoadingScript.lua",
      "start": 11512800,
      "end": 11537109
    }, {
      "filename": "/content/scripts/Modules/BackpackScript.lua",
      "start": 11537109,
      "end": 11585910
    }, {
      "filename": "/content/scripts/Modules/Chat.lua",
      "start": 11585910,
      "end": 11678197
    }, {
      "filename": "/content/scripts/Modules/DeveloperConsoleModule.lua",
      "start": 11678197,
      "end": 11765821
    }, {
      "filename": "/content/scripts/Modules/PlayerDropDown.lua",
      "start": 11765821,
      "end": 11784988
    }, {
      "filename": "/content/scripts/Modules/PlayerlistModule.lua",
      "start": 11784988,
      "end": 11839756
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/GameSettings.lua",
      "start": 11839756,
      "end": 11860855
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/Help.lua",
      "start": 11860855,
      "end": 11880985
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/Home.lua",
      "start": 11880985,
      "end": 11883687
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/LeaveGame.lua",
      "start": 11883687,
      "end": 11887847
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/Players.lua",
      "start": 11887847,
      "end": 11899192
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/Record.lua",
      "start": 11899192,
      "end": 11904933
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/ReportAbuseMenu.lua",
      "start": 11904933,
      "end": 11914396
    }, {
      "filename": "/content/scripts/Modules/Settings/Pages/ResetCharacter.lua",
      "start": 11914396,
      "end": 11919114
    }, {
      "filename": "/content/scripts/Modules/Settings/SettingsHub.lua",
      "start": 11919114,
      "end": 11955704
    }, {
      "filename": "/content/scripts/Modules/Settings/SettingsPageFactory.lua",
      "start": 11955704,
      "end": 11963400
    }, {
      "filename": "/content/scripts/Modules/Settings/Utility.lua",
      "start": 11963400,
      "end": 12023704
    }, {
      "filename": "/content/scripts/Modules/TenFootInterface.lua",
      "start": 12023704,
      "end": 12033863
    }, {
      "filename": "/content/scripts/ServerCoreScripts/ServerSocialScript.lua",
      "start": 12033863,
      "end": 12040756
    }, {
      "filename": "/content/scripts/ServerStarterScript.lua",
      "start": 12040756,
      "end": 12042807
    }, {
      "filename": "/content/scripts/StarterScript.lua",
      "start": 12042807,
      "end": 12045307
    }, {
      "filename": "/content/sky/lensflare.jpg",
      "start": 12045307,
      "end": 12053744
    }, {
      "filename": "/content/sky/moon-alpha.jpg",
      "start": 12053744,
      "end": 12058664
    }, {
      "filename": "/content/sky/moon.jpg",
      "start": 12058664,
      "end": 12066058
    }, {
      "filename": "/content/sky/null_plainsky512_bk.jpg",
      "start": 12066058,
      "end": 12115335
    }, {
      "filename": "/content/sky/null_plainsky512_dn.jpg",
      "start": 12115335,
      "end": 12149003
    }, {
      "filename": "/content/sky/null_plainsky512_ft.jpg",
      "start": 12149003,
      "end": 12196694
    }, {
      "filename": "/content/sky/null_plainsky512_lf.jpg",
      "start": 12196694,
      "end": 12240351
    }, {
      "filename": "/content/sky/null_plainsky512_rt.jpg",
      "start": 12240351,
      "end": 12290552
    }, {
      "filename": "/content/sky/null_plainsky512_up.jpg",
      "start": 12290552,
      "end": 12326064
    }, {
      "filename": "/content/sky/skyspheremap.jpg",
      "start": 12326064,
      "end": 12336544
    }, {
      "filename": "/content/sky/sun-rays.jpg",
      "start": 12336544,
      "end": 12341123
    }, {
      "filename": "/content/sky/sun.jpg",
      "start": 12341123,
      "end": 12355896
    }, {
      "filename": "/content/sounds/Kerplunk.mp3",
      "start": 12355896,
      "end": 12360942
    }, {
      "filename": "/content/sounds/Kid saying Ouch.mp3",
      "start": 12360942,
      "end": 12368253
    }, {
      "filename": "/content/sounds/Rubber band sling shot.mp3",
      "start": 12368253,
      "end": 12377284
    }, {
      "filename": "/content/sounds/Rubber band.mp3",
      "start": 12377284,
      "end": 12388047
    }, {
      "filename": "/content/sounds/SWITCH3.mp3",
      "start": 12388047,
      "end": 12393092
    }, {
      "filename": "/content/sounds/action_falling.mp3",
      "start": 12393092,
      "end": 12527155
    }, {
      "filename": "/content/sounds/action_footsteps_plastic.mp3",
      "start": 12527155,
      "end": 12568013
    }, {
      "filename": "/content/sounds/action_get_up.mp3",
      "start": 12568013,
      "end": 12578360
    }, {
      "filename": "/content/sounds/action_jump.mp3",
      "start": 12578360,
      "end": 12584945
    }, {
      "filename": "/content/sounds/action_jump_land.mp3",
      "start": 12584945,
      "end": 12590276
    }, {
      "filename": "/content/sounds/action_swim.mp3",
      "start": 12590276,
      "end": 12669586
    }, {
      "filename": "/content/sounds/bass.mp3",
      "start": 12669586,
      "end": 12679766
    }, {
      "filename": "/content/sounds/bfsl-minifigfoots1.mp3",
      "start": 12679766,
      "end": 12696278
    }, {
      "filename": "/content/sounds/bfsl-minifigfoots2.mp3",
      "start": 12696278,
      "end": 12737366
    }, {
      "filename": "/content/sounds/button.mp3",
      "start": 12737366,
      "end": 12744092
    }, {
      "filename": "/content/sounds/clickfast.mp3",
      "start": 12744092,
      "end": 12748517
    }, {
      "filename": "/content/sounds/collide.mp3",
      "start": 12748517,
      "end": 12760250
    }, {
      "filename": "/content/sounds/electronicpingshort.mp3",
      "start": 12760250,
      "end": 12768141
    }, {
      "filename": "/content/sounds/flashbulb.mp3",
      "start": 12768141,
      "end": 12773142
    }, {
      "filename": "/content/sounds/grass.mp3",
      "start": 12773142,
      "end": 12780066
    }, {
      "filename": "/content/sounds/grass2.mp3",
      "start": 12780066,
      "end": 12786991
    }, {
      "filename": "/content/sounds/grass3.mp3",
      "start": 12786991,
      "end": 12793916
    }, {
      "filename": "/content/sounds/grassstone.mp3",
      "start": 12793916,
      "end": 12800845
    }, {
      "filename": "/content/sounds/grassstone2.mp3",
      "start": 12800845,
      "end": 12807775
    }, {
      "filename": "/content/sounds/grassstone3.mp3",
      "start": 12807775,
      "end": 12814705
    }, {
      "filename": "/content/sounds/hit.mp3",
      "start": 12814705,
      "end": 12823508
    }, {
      "filename": "/content/sounds/ice.mp3",
      "start": 12823508,
      "end": 12830430
    }, {
      "filename": "/content/sounds/ice2.mp3",
      "start": 12830430,
      "end": 12837353
    }, {
      "filename": "/content/sounds/ice3.mp3",
      "start": 12837353,
      "end": 12844276
    }, {
      "filename": "/content/sounds/icegrass.mp3",
      "start": 12844276,
      "end": 12851203
    }, {
      "filename": "/content/sounds/icegrass2.mp3",
      "start": 12851203,
      "end": 12858131
    }, {
      "filename": "/content/sounds/icegrass3.mp3",
      "start": 12858131,
      "end": 12865059
    }, {
      "filename": "/content/sounds/icemetal.mp3",
      "start": 12865059,
      "end": 12871986
    }, {
      "filename": "/content/sounds/icemetal2.mp3",
      "start": 12871986,
      "end": 12878914
    }, {
      "filename": "/content/sounds/icemetal3.mp3",
      "start": 12878914,
      "end": 12885842
    }, {
      "filename": "/content/sounds/icestone.mp3",
      "start": 12885842,
      "end": 12892769
    }, {
      "filename": "/content/sounds/icestone2.mp3",
      "start": 12892769,
      "end": 12899697
    }, {
      "filename": "/content/sounds/icestone3.mp3",
      "start": 12899697,
      "end": 12906625
    }, {
      "filename": "/content/sounds/impact_bodyfall.mp3",
      "start": 12906625,
      "end": 12916972
    }, {
      "filename": "/content/sounds/impact_explosion_01.mp3",
      "start": 12916972,
      "end": 12949888
    }, {
      "filename": "/content/sounds/impact_explosion_02.mp3",
      "start": 12949888,
      "end": 12984894
    }, {
      "filename": "/content/sounds/impact_explosion_03.mp3",
      "start": 12984894,
      "end": 13027423
    }, {
      "filename": "/content/sounds/impact_water.mp3",
      "start": 13027423,
      "end": 13066609
    }, {
      "filename": "/content/sounds/metal.mp3",
      "start": 13066609,
      "end": 13073533
    }, {
      "filename": "/content/sounds/metal2.mp3",
      "start": 13073533,
      "end": 13080458
    }, {
      "filename": "/content/sounds/metal3.mp3",
      "start": 13080458,
      "end": 13087383
    }, {
      "filename": "/content/sounds/metalgrass.mp3",
      "start": 13087383,
      "end": 13094312
    }, {
      "filename": "/content/sounds/metalgrass2.mp3",
      "start": 13094312,
      "end": 13101242
    }, {
      "filename": "/content/sounds/metalgrass3.mp3",
      "start": 13101242,
      "end": 13108172
    }, {
      "filename": "/content/sounds/metalstone.mp3",
      "start": 13108172,
      "end": 13115101
    }, {
      "filename": "/content/sounds/metalstone2.mp3",
      "start": 13115101,
      "end": 13122031
    }, {
      "filename": "/content/sounds/metalstone3.mp3",
      "start": 13122031,
      "end": 13128961
    }, {
      "filename": "/content/sounds/plasticgrass.mp3",
      "start": 13128961,
      "end": 13135892
    }, {
      "filename": "/content/sounds/plasticgrass2.mp3",
      "start": 13135892,
      "end": 13142824
    }, {
      "filename": "/content/sounds/plasticgrass3.mp3",
      "start": 13142824,
      "end": 13149756
    }, {
      "filename": "/content/sounds/plasticice.mp3",
      "start": 13149756,
      "end": 13156685
    }, {
      "filename": "/content/sounds/plasticice2.mp3",
      "start": 13156685,
      "end": 13163615
    }, {
      "filename": "/content/sounds/plasticice3.mp3",
      "start": 13163615,
      "end": 13170545
    }, {
      "filename": "/content/sounds/plasticmetal.mp3",
      "start": 13170545,
      "end": 13177476
    }, {
      "filename": "/content/sounds/plasticmetal2.mp3",
      "start": 13177476,
      "end": 13184408
    }, {
      "filename": "/content/sounds/plasticmetal3.mp3",
      "start": 13184408,
      "end": 13191340
    }, {
      "filename": "/content/sounds/plasticplastic.mp3",
      "start": 13191340,
      "end": 13198273
    }, {
      "filename": "/content/sounds/plasticplastic2.mp3",
      "start": 13198273,
      "end": 13205207
    }, {
      "filename": "/content/sounds/plasticplastic3.mp3",
      "start": 13205207,
      "end": 13214022
    }, {
      "filename": "/content/sounds/plasticstone.mp3",
      "start": 13214022,
      "end": 13220953
    }, {
      "filename": "/content/sounds/plasticstone2.mp3",
      "start": 13220953,
      "end": 13227885
    }, {
      "filename": "/content/sounds/plasticstone3.mp3",
      "start": 13227885,
      "end": 13234817
    }, {
      "filename": "/content/sounds/snap.mp3",
      "start": 13234817,
      "end": 13240277
    }, {
      "filename": "/content/sounds/splat.mp3",
      "start": 13240277,
      "end": 13246426
    }, {
      "filename": "/content/sounds/stone.mp3",
      "start": 13246426,
      "end": 13253350
    }, {
      "filename": "/content/sounds/stone2.mp3",
      "start": 13253350,
      "end": 13260275
    }, {
      "filename": "/content/sounds/stone3.mp3",
      "start": 13260275,
      "end": 13267200
    }, {
      "filename": "/content/sounds/switch.mp3",
      "start": 13267200,
      "end": 13273080
    }, {
      "filename": "/content/sounds/swoosh.mp3",
      "start": 13273080,
      "end": 13278654
    }, {
      "filename": "/content/sounds/swordlunge.mp3",
      "start": 13278654,
      "end": 13287046
    }, {
      "filename": "/content/sounds/swordslash.mp3",
      "start": 13287046,
      "end": 13294393
    }, {
      "filename": "/content/sounds/ui/Shell/ButtonPress.mp3",
      "start": 13294393,
      "end": 13332612
    }, {
      "filename": "/content/sounds/ui/Shell/Error.mp3",
      "start": 13332612,
      "end": 13376585
    }, {
      "filename": "/content/sounds/ui/Shell/MoveSelection.mp3",
      "start": 13376585,
      "end": 13413270
    }, {
      "filename": "/content/sounds/ui/Shell/OverlayOpen.mp3",
      "start": 13413270,
      "end": 13444193
    }, {
      "filename": "/content/sounds/ui/Shell/PopUp.mp3",
      "start": 13444193,
      "end": 13473190
    }, {
      "filename": "/content/sounds/ui/Shell/PurchaseSuccess.mp3",
      "start": 13473190,
      "end": 13527925
    }, {
      "filename": "/content/sounds/ui/Shell/RobloxMusic.ogg",
      "start": 13527925,
      "end": 14394873
    }, {
      "filename": "/content/sounds/ui/Shell/ScreenChange.mp3",
      "start": 14394873,
      "end": 14428869
    }, {
      "filename": "/content/sounds/ui/Shell/SideMenuSlideIn.mp3",
      "start": 14428869,
      "end": 14454036
    }, {
      "filename": "/content/sounds/unsheath.mp3",
      "start": 14454036,
      "end": 14467859
    }, {
      "filename": "/content/sounds/uuhhh.mp3",
      "start": 14467859,
      "end": 14473320
    }, {
      "filename": "/content/sounds/victory.mp3",
      "start": 14473320,
      "end": 14485888
    }, {
      "filename": "/content/sounds/woodgrass.mp3",
      "start": 14485888,
      "end": 14492816
    }, {
      "filename": "/content/sounds/woodgrass2.mp3",
      "start": 14492816,
      "end": 14499745
    }, {
      "filename": "/content/sounds/woodgrass3.mp3",
      "start": 14499745,
      "end": 14506674
    }, {
      "filename": "/content/sounds/woodice.mp3",
      "start": 14506674,
      "end": 14513600
    }, {
      "filename": "/content/sounds/woodice2.mp3",
      "start": 14513600,
      "end": 14520527
    }, {
      "filename": "/content/sounds/woodice3.mp3",
      "start": 14520527,
      "end": 14527454
    }, {
      "filename": "/content/sounds/woodmetal.mp3",
      "start": 14527454,
      "end": 14534382
    }, {
      "filename": "/content/sounds/woodmetal2.mp3",
      "start": 14534382,
      "end": 14541311
    }, {
      "filename": "/content/sounds/woodmetal3.mp3",
      "start": 14541311,
      "end": 14548240
    }, {
      "filename": "/content/sounds/woodplastic.mp3",
      "start": 14548240,
      "end": 14555170
    }, {
      "filename": "/content/sounds/woodplastic2.mp3",
      "start": 14555170,
      "end": 14562101
    }, {
      "filename": "/content/sounds/woodplastic3.mp3",
      "start": 14562101,
      "end": 14569032
    }, {
      "filename": "/content/sounds/woodstone.mp3",
      "start": 14569032,
      "end": 14575960
    }, {
      "filename": "/content/sounds/woodstone2.mp3",
      "start": 14575960,
      "end": 14582889
    }, {
      "filename": "/content/sounds/woodstone3.mp3",
      "start": 14582889,
      "end": 14589818
    }, {
      "filename": "/content/sounds/woodwood.mp3",
      "start": 14589818,
      "end": 14596745
    }, {
      "filename": "/content/sounds/woodwood2.mp3",
      "start": 14596745,
      "end": 14603673
    }, {
      "filename": "/content/sounds/woodwood3.mp3",
      "start": 14603673,
      "end": 14610601
    }, {
      "filename": "/content/terrain/diffuse.dds",
      "start": 14610601,
      "end": 25795553
    }, {
      "filename": "/content/terrain/materials.json",
      "start": 25795553,
      "end": 25798598
    }, {
      "filename": "/content/terrain/normal.dds",
      "start": 25798598,
      "end": 48168374
    }, {
      "filename": "/content/terrain/specular.dds",
      "start": 48168374,
      "end": 59353326
    }, {
      "filename": "/content/textures-index.json",
      "start": 59353326,
      "end": 59355834
    }, {
      "filename": "/content/textures/AnchorCursor.png",
      "start": 59355834,
      "end": 59357093
    }, {
      "filename": "/content/textures/ArrowCursor.png",
      "start": 59357093,
      "end": 59357376
    }, {
      "filename": "/content/textures/ArrowCursorDecalDrag.png",
      "start": 59357376,
      "end": 59357659
    }, {
      "filename": "/content/textures/ArrowFarCursor.png",
      "start": 59357659,
      "end": 59357946
    }, {
      "filename": "/content/textures/BWGradient.png",
      "start": 59357946,
      "end": 59407793
    }, {
      "filename": "/content/textures/BackgroundImage.png",
      "start": 59407793,
      "end": 59410789
    }, {
      "filename": "/content/textures/Blank.png",
      "start": 59410789,
      "end": 59410976
    }, {
      "filename": "/content/textures/Clone.png",
      "start": 59410976,
      "end": 59417245
    }, {
      "filename": "/content/textures/CloneCursor.png",
      "start": 59417245,
      "end": 59420429
    }, {
      "filename": "/content/textures/CloneDownCursor.png",
      "start": 59420429,
      "end": 59425184
    }, {
      "filename": "/content/textures/CloneOverCursor.png",
      "start": 59425184,
      "end": 59428400
    }, {
      "filename": "/content/textures/Cursors/Gamepad/Pointer.png",
      "start": 59428400,
      "end": 59429737
    }, {
      "filename": "/content/textures/Cursors/Gamepad/Pointer@2x.png",
      "start": 59429737,
      "end": 59431224
    }, {
      "filename": "/content/textures/Cursors/Gamepad/PointerOver.png",
      "start": 59431224,
      "end": 59432377
    }, {
      "filename": "/content/textures/Cursors/Gamepad/PointerOver@2x.png",
      "start": 59432377,
      "end": 59434338
    }, {
      "filename": "/content/textures/DialogHelp.png",
      "start": 59434338,
      "end": 59435228
    }, {
      "filename": "/content/textures/DialogQuest.png",
      "start": 59435228,
      "end": 59435787
    }, {
      "filename": "/content/textures/DialogShop.png",
      "start": 59435787,
      "end": 59436986
    }, {
      "filename": "/content/textures/DragCursor.png",
      "start": 59436986,
      "end": 59439049
    }, {
      "filename": "/content/textures/DropperCursor.png",
      "start": 59439049,
      "end": 59439402
    }, {
      "filename": "/content/textures/Exit.png",
      "start": 59439402,
      "end": 59442521
    }, {
      "filename": "/content/textures/Exit_dn.png",
      "start": 59442521,
      "end": 59445602
    }, {
      "filename": "/content/textures/Exit_ovr.png",
      "start": 59445602,
      "end": 59448683
    }, {
      "filename": "/content/textures/FillCursor.png",
      "start": 59448683,
      "end": 59449116
    }, {
      "filename": "/content/textures/FlagCursor.png",
      "start": 59449116,
      "end": 59449744
    }, {
      "filename": "/content/textures/FlatCursor.png",
      "start": 59449744,
      "end": 59450339
    }, {
      "filename": "/content/textures/GrabCursor.png",
      "start": 59450339,
      "end": 59452616
    }, {
      "filename": "/content/textures/GrabRotateCursor.png",
      "start": 59452616,
      "end": 59455509
    }, {
      "filename": "/content/textures/Grass_Texture.jpg",
      "start": 59455509,
      "end": 59696328
    }, {
      "filename": "/content/textures/GunCursor.png",
      "start": 59696328,
      "end": 59697275
    }, {
      "filename": "/content/textures/GunWaitCursor.png",
      "start": 59697275,
      "end": 59699210
    }, {
      "filename": "/content/textures/HammerCursor.png",
      "start": 59699210,
      "end": 59701653
    }, {
      "filename": "/content/textures/HammerDownCursor.png",
      "start": 59701653,
      "end": 59705654
    }, {
      "filename": "/content/textures/HammerOverCursor.png",
      "start": 59705654,
      "end": 59708522
    }, {
      "filename": "/content/textures/HingeCursor.png",
      "start": 59708522,
      "end": 59709149
    }, {
      "filename": "/content/textures/HurtOverlay.png",
      "start": 59709149,
      "end": 59815385
    }, {
      "filename": "/content/textures/LockCursor.png",
      "start": 59815385,
      "end": 59816173
    }, {
      "filename": "/content/textures/MotorCursor.png",
      "start": 59816173,
      "end": 59816833
    }, {
      "filename": "/content/textures/MouseLockedCursor.png",
      "start": 59816833,
      "end": 59819163
    }, {
      "filename": "/content/textures/ResizeCursor.png",
      "start": 59819163,
      "end": 59819715
    }, {
      "filename": "/content/textures/Roblox-loading-glow.png",
      "start": 59819715,
      "end": 59825627
    }, {
      "filename": "/content/textures/Roblox-loading-glow@2x.png",
      "start": 59825627,
      "end": 59838828
    }, {
      "filename": "/content/textures/Roblox-loading.png",
      "start": 59838828,
      "end": 59865956
    }, {
      "filename": "/content/textures/Roblox-loading@2x.png",
      "start": 59865956,
      "end": 59929057
    }, {
      "filename": "/content/textures/Roblox.bmp",
      "start": 59929057,
      "end": 59941401
    }, {
      "filename": "/content/textures/RustGradient.png",
      "start": 59941401,
      "end": 59972191
    }, {
      "filename": "/content/textures/SlingshotTexture.png",
      "start": 59972191,
      "end": 59973622
    }, {
      "filename": "/content/textures/Smoke.png",
      "start": 59973622,
      "end": 60029373
    }, {
      "filename": "/content/textures/SpawnCursor.png",
      "start": 60029373,
      "end": 60030028
    }, {
      "filename": "/content/textures/SpawnLocation.png",
      "start": 60030028,
      "end": 60032700
    }, {
      "filename": "/content/textures/SurfacesDefault.png",
      "start": 60032700,
      "end": 60032866
    }, {
      "filename": "/content/textures/SwordTexture.png",
      "start": 60032866,
      "end": 60052319
    }, {
      "filename": "/content/textures/TrowelTexture.png",
      "start": 60052319,
      "end": 60055899
    }, {
      "filename": "/content/textures/UnAnchorCursor.png",
      "start": 60055899,
      "end": 60057735
    }, {
      "filename": "/content/textures/UnlockCursor.png",
      "start": 60057735,
      "end": 60058533
    }, {
      "filename": "/content/textures/WeldCursor.png",
      "start": 60058533,
      "end": 60059055
    }, {
      "filename": "/content/textures/WhiteCircle.png",
      "start": 60059055,
      "end": 60065568
    }, {
      "filename": "/content/textures/advClosed-hand-no-weld.png",
      "start": 60065568,
      "end": 60066803
    }, {
      "filename": "/content/textures/advClosed-hand-weld.png",
      "start": 60066803,
      "end": 60068104
    }, {
      "filename": "/content/textures/advClosed-hand.png",
      "start": 60068104,
      "end": 60069285
    }, {
      "filename": "/content/textures/advCursor-default.png",
      "start": 60069285,
      "end": 60070461
    }, {
      "filename": "/content/textures/advCursor-openedHand.png",
      "start": 60070461,
      "end": 60071698
    }, {
      "filename": "/content/textures/advCursor-white.png",
      "start": 60071698,
      "end": 60072860
    }, {
      "filename": "/content/textures/advancedMove.png",
      "start": 60072860,
      "end": 60075644
    }, {
      "filename": "/content/textures/advancedMoveResize.png",
      "start": 60075644,
      "end": 60078686
    }, {
      "filename": "/content/textures/advancedMove_joint.png",
      "start": 60078686,
      "end": 60083220
    }, {
      "filename": "/content/textures/advancedMove_keysOnly.png",
      "start": 60083220,
      "end": 60087044
    }, {
      "filename": "/content/textures/advancedMove_noJoint.png",
      "start": 60087044,
      "end": 60091955
    }, {
      "filename": "/content/textures/aluminum/diffuse.dds",
      "start": 60091955,
      "end": 60092107
    }, {
      "filename": "/content/textures/aluminum/normal.dds",
      "start": 60092107,
      "end": 60441787
    }, {
      "filename": "/content/textures/aluminum/normaldetail.dds",
      "start": 60441787,
      "end": 60441963
    }, {
      "filename": "/content/textures/aluminum/specular.dds",
      "start": 60441963,
      "end": 60442115
    }, {
      "filename": "/content/textures/blackBkg_round.png",
      "start": 60442115,
      "end": 60442558
    }, {
      "filename": "/content/textures/blackBkg_square.png",
      "start": 60442558,
      "end": 60442712
    }, {
      "filename": "/content/textures/bombtex.png",
      "start": 60442712,
      "end": 60447271
    }, {
      "filename": "/content/textures/brick/diffuse.dds",
      "start": 60447271,
      "end": 60796951
    }, {
      "filename": "/content/textures/brick/normal.dds",
      "start": 60796951,
      "end": 62195207
    }, {
      "filename": "/content/textures/brick/normaldetail.dds",
      "start": 62195207,
      "end": 62195383
    }, {
      "filename": "/content/textures/brick/specular.dds",
      "start": 62195383,
      "end": 62894575
    }, {
      "filename": "/content/textures/chatBubble_botBlue_bkg.png",
      "start": 62894575,
      "end": 62897351
    }, {
      "filename": "/content/textures/chatBubble_botBlue_notify_bkg.png",
      "start": 62897351,
      "end": 62901455
    }, {
      "filename": "/content/textures/chatBubble_botBlue_tail.png",
      "start": 62901455,
      "end": 62907852
    }, {
      "filename": "/content/textures/chatBubble_botBlue_tailRight.png",
      "start": 62907852,
      "end": 62912133
    }, {
      "filename": "/content/textures/chatBubble_botGreen_bkg.png",
      "start": 62912133,
      "end": 62914324
    }, {
      "filename": "/content/textures/chatBubble_botGreen_notify_bkg.png",
      "start": 62914324,
      "end": 62917745
    }, {
      "filename": "/content/textures/chatBubble_botGreen_tail.png",
      "start": 62917745,
      "end": 62922568
    }, {
      "filename": "/content/textures/chatBubble_botGreen_tailRight.png",
      "start": 62922568,
      "end": 62926149
    }, {
      "filename": "/content/textures/chatBubble_botRed_bkg.png",
      "start": 62926149,
      "end": 62928792
    }, {
      "filename": "/content/textures/chatBubble_botRed_notify_bkg.png",
      "start": 62928792,
      "end": 62932012
    }, {
      "filename": "/content/textures/chatBubble_botRed_tail.png",
      "start": 62932012,
      "end": 62935878
    }, {
      "filename": "/content/textures/chatBubble_botRed_tailRight.png",
      "start": 62935878,
      "end": 62939506
    }, {
      "filename": "/content/textures/chatBubble_bot_notifyGray_dotDotDot.png",
      "start": 62939506,
      "end": 62942424
    }, {
      "filename": "/content/textures/chatBubble_bot_notify_bang.png",
      "start": 62942424,
      "end": 62943529
    }, {
      "filename": "/content/textures/chatBubble_bot_notify_dotDotDot.png",
      "start": 62943529,
      "end": 62944562
    }, {
      "filename": "/content/textures/chatBubble_bot_notify_money.png",
      "start": 62944562,
      "end": 62946062
    }, {
      "filename": "/content/textures/chatBubble_bot_notify_question.png",
      "start": 62946062,
      "end": 62947332
    }, {
      "filename": "/content/textures/chatBubble_white_bkg.png",
      "start": 62947332,
      "end": 62951636
    }, {
      "filename": "/content/textures/chatBubble_white_notify_bkg.png",
      "start": 62951636,
      "end": 62955697
    }, {
      "filename": "/content/textures/chatBubble_white_tail.png",
      "start": 62955697,
      "end": 62957276
    }, {
      "filename": "/content/textures/cobblestone/diffuse.dds",
      "start": 62957276,
      "end": 64355532
    }, {
      "filename": "/content/textures/cobblestone/normal.dds",
      "start": 64355532,
      "end": 65753788
    }, {
      "filename": "/content/textures/cobblestone/normaldetail.dds",
      "start": 65753788,
      "end": 65753964
    }, {
      "filename": "/content/textures/cobblestone/specular.dds",
      "start": 65753964,
      "end": 66453156
    }, {
      "filename": "/content/textures/concrete/diffuse.dds",
      "start": 66453156,
      "end": 67152348
    }, {
      "filename": "/content/textures/concrete/normal.dds",
      "start": 67152348,
      "end": 68550604
    }, {
      "filename": "/content/textures/concrete/normaldetail.dds",
      "start": 68550604,
      "end": 68900284
    }, {
      "filename": "/content/textures/concrete/specular.dds",
      "start": 68900284,
      "end": 69075188
    }, {
      "filename": "/content/textures/diamondplate/diffuse.dds",
      "start": 69075188,
      "end": 69250092
    }, {
      "filename": "/content/textures/diamondplate/normal.dds",
      "start": 69250092,
      "end": 69599772
    }, {
      "filename": "/content/textures/diamondplate/normaldetail.dds",
      "start": 69599772,
      "end": 69599948
    }, {
      "filename": "/content/textures/diamondplate/specular.dds",
      "start": 69599948,
      "end": 69774852
    }, {
      "filename": "/content/textures/dirt.jpg",
      "start": 69774852,
      "end": 69948338
    }, {
      "filename": "/content/textures/explosion.png",
      "start": 69948338,
      "end": 69961107
    }, {
      "filename": "/content/textures/fabric/diffuse.dds",
      "start": 69961107,
      "end": 70310787
    }, {
      "filename": "/content/textures/fabric/normal.dds",
      "start": 70310787,
      "end": 70660467
    }, {
      "filename": "/content/textures/fabric/normaldetail.dds",
      "start": 70660467,
      "end": 70660643
    }, {
      "filename": "/content/textures/fabric/specular.dds",
      "start": 70660643,
      "end": 70835547
    }, {
      "filename": "/content/textures/face.png",
      "start": 70835547,
      "end": 70836596
    }, {
      "filename": "/content/textures/fire_0.png",
      "start": 70836596,
      "end": 70862132
    }, {
      "filename": "/content/textures/glow.png",
      "start": 70862132,
      "end": 70918737
    }, {
      "filename": "/content/textures/gradient.png",
      "start": 70918737,
      "end": 71122690
    }, {
      "filename": "/content/textures/granite/diffuse.dds",
      "start": 71122690,
      "end": 71821882
    }, {
      "filename": "/content/textures/granite/normal.dds",
      "start": 71821882,
      "end": 71822058
    }, {
      "filename": "/content/textures/granite/normaldetail.dds",
      "start": 71822058,
      "end": 71822234
    }, {
      "filename": "/content/textures/granite/specular.dds",
      "start": 71822234,
      "end": 72521426
    }, {
      "filename": "/content/textures/grass/diffuse.dds",
      "start": 72521426,
      "end": 72871106
    }, {
      "filename": "/content/textures/grass/normal.dds",
      "start": 72871106,
      "end": 73220786
    }, {
      "filename": "/content/textures/grass/normaldetail.dds",
      "start": 73220786,
      "end": 73220962
    }, {
      "filename": "/content/textures/grass/specular.dds",
      "start": 73220962,
      "end": 73395866
    }, {
      "filename": "/content/textures/ice/diffuse.dds",
      "start": 73395866,
      "end": 73396018
    }, {
      "filename": "/content/textures/ice/normal.dds",
      "start": 73396018,
      "end": 73745698
    }, {
      "filename": "/content/textures/ice/normaldetail.dds",
      "start": 73745698,
      "end": 73745874
    }, {
      "filename": "/content/textures/ice/specular.dds",
      "start": 73745874,
      "end": 74445066
    }, {
      "filename": "/content/textures/loading/cancelButton.png",
      "start": 74445066,
      "end": 74448394
    }, {
      "filename": "/content/textures/loading/darkLoadingTexture.png",
      "start": 74448394,
      "end": 74511499
    }, {
      "filename": "/content/textures/loading/loadingCircle.png",
      "start": 74511499,
      "end": 74524794
    }, {
      "filename": "/content/textures/loading/loadingTexture.png",
      "start": 74524794,
      "end": 74608668
    }, {
      "filename": "/content/textures/loading/loadingvignette.png",
      "start": 74608668,
      "end": 74629376
    }, {
      "filename": "/content/textures/loading/robloxlogo.png",
      "start": 74629376,
      "end": 74652751
    }, {
      "filename": "/content/textures/lua.png",
      "start": 74652751,
      "end": 74717329
    }, {
      "filename": "/content/textures/marble/diffuse.dds",
      "start": 74717329,
      "end": 75416521
    }, {
      "filename": "/content/textures/marble/normal.dds",
      "start": 75416521,
      "end": 75416697
    }, {
      "filename": "/content/textures/marble/normaldetail.dds",
      "start": 75416697,
      "end": 75416873
    }, {
      "filename": "/content/textures/marble/specular.dds",
      "start": 75416873,
      "end": 76116065
    }, {
      "filename": "/content/textures/metal/diffuse.dds",
      "start": 76116065,
      "end": 76290969
    }, {
      "filename": "/content/textures/metal/normal.dds",
      "start": 76290969,
      "end": 76640649
    }, {
      "filename": "/content/textures/metal/normaldetail.dds",
      "start": 76640649,
      "end": 76640825
    }, {
      "filename": "/content/textures/metal/specular.dds",
      "start": 76640825,
      "end": 76815729
    }, {
      "filename": "/content/textures/particles/common_alpha.dds",
      "start": 76815729,
      "end": 76819953
    }, {
      "filename": "/content/textures/particles/explosion01_core_alpha.png",
      "start": 76819953,
      "end": 76848901
    }, {
      "filename": "/content/textures/particles/explosion01_core_main.dds",
      "start": 76848901,
      "end": 76936437
    }, {
      "filename": "/content/textures/particles/explosion01_implosion_color.png",
      "start": 76936437,
      "end": 76945215
    }, {
      "filename": "/content/textures/particles/explosion01_implosion_main.dds",
      "start": 76945215,
      "end": 77032751
    }, {
      "filename": "/content/textures/particles/explosion01_shockwave_main.dds",
      "start": 77032751,
      "end": 77120287
    }, {
      "filename": "/content/textures/particles/explosion01_smoke_alpha.dds",
      "start": 77120287,
      "end": 77123175
    }, {
      "filename": "/content/textures/particles/explosion01_smoke_color_new.dds",
      "start": 77123175,
      "end": 77126063
    }, {
      "filename": "/content/textures/particles/explosion01_smoke_main.dds",
      "start": 77126063,
      "end": 77213599
    }, {
      "filename": "/content/textures/particles/explosion_alpha.dds",
      "start": 77213599,
      "end": 77216487
    }, {
      "filename": "/content/textures/particles/explosion_color.dds",
      "start": 77216487,
      "end": 77222135
    }, {
      "filename": "/content/textures/particles/fire_alpha.dds",
      "start": 77222135,
      "end": 77227783
    }, {
      "filename": "/content/textures/particles/fire_color.dds",
      "start": 77227783,
      "end": 77233431
    }, {
      "filename": "/content/textures/particles/fire_main.dds",
      "start": 77233431,
      "end": 77320967
    }, {
      "filename": "/content/textures/particles/fire_sparks_color.dds",
      "start": 77320967,
      "end": 77326615
    }, {
      "filename": "/content/textures/particles/fire_sparks_main.dds",
      "start": 77326615,
      "end": 77332231
    }, {
      "filename": "/content/textures/particles/forcefield_alpha.dds",
      "start": 77332231,
      "end": 77337879
    }, {
      "filename": "/content/textures/particles/forcefield_glow_alpha.dds",
      "start": 77337879,
      "end": 77343527
    }, {
      "filename": "/content/textures/particles/forcefield_glow_color.dds",
      "start": 77343527,
      "end": 77349175
    }, {
      "filename": "/content/textures/particles/forcefield_glow_main.dds",
      "start": 77349175,
      "end": 77436711
    }, {
      "filename": "/content/textures/particles/forcefield_vortex_color.dds",
      "start": 77436711,
      "end": 77442359
    }, {
      "filename": "/content/textures/particles/forcefield_vortex_main.dds",
      "start": 77442359,
      "end": 77464359
    }, {
      "filename": "/content/textures/particles/legacy_fire_alpha_color.dds",
      "start": 77464359,
      "end": 77467247
    }, {
      "filename": "/content/textures/particles/smoke_color.dds",
      "start": 77467247,
      "end": 77472895
    }, {
      "filename": "/content/textures/particles/smoke_main.dds",
      "start": 77472895,
      "end": 77494895
    }, {
      "filename": "/content/textures/particles/sparkles_color.dds",
      "start": 77494895,
      "end": 77500543
    }, {
      "filename": "/content/textures/particles/sparkles_main.dds",
      "start": 77500543,
      "end": 77522543
    }, {
      "filename": "/content/textures/pebble/diffuse.dds",
      "start": 77522543,
      "end": 77697447
    }, {
      "filename": "/content/textures/pebble/normal.dds",
      "start": 77697447,
      "end": 77697623
    }, {
      "filename": "/content/textures/pebble/normaldetail.dds",
      "start": 77697623,
      "end": 77697799
    }, {
      "filename": "/content/textures/pebble/specular.dds",
      "start": 77697799,
      "end": 77872703
    }, {
      "filename": "/content/textures/plastic/diffuse.dds",
      "start": 77872703,
      "end": 78047687
    }, {
      "filename": "/content/textures/plastic/normal.dds",
      "start": 78047687,
      "end": 78397527
    }, {
      "filename": "/content/textures/plastic/normaldetail.dds",
      "start": 78397527,
      "end": 78747207
    }, {
      "filename": "/content/textures/roblox-logo.png",
      "start": 78747207,
      "end": 78914689
    }, {
      "filename": "/content/textures/rocketlaunchertex.png",
      "start": 78914689,
      "end": 78924728
    }, {
      "filename": "/content/textures/rotationArrow.png",
      "start": 78924728,
      "end": 78928797
    }, {
      "filename": "/content/textures/rust/diffuse.dds",
      "start": 78928797,
      "end": 80327053
    }, {
      "filename": "/content/textures/rust/normal.dds",
      "start": 80327053,
      "end": 81725309
    }, {
      "filename": "/content/textures/rust/normaldetail.dds",
      "start": 81725309,
      "end": 81725485
    }, {
      "filename": "/content/textures/rust/specular.dds",
      "start": 81725485,
      "end": 82424677
    }, {
      "filename": "/content/textures/sand/diffuse.dds",
      "start": 82424677,
      "end": 83123869
    }, {
      "filename": "/content/textures/sand/normal.dds",
      "start": 83123869,
      "end": 83473549
    }, {
      "filename": "/content/textures/sand/normaldetail.dds",
      "start": 83473549,
      "end": 83473725
    }, {
      "filename": "/content/textures/sand/specular.dds",
      "start": 83473725,
      "end": 84172917
    }, {
      "filename": "/content/textures/script.png",
      "start": 84172917,
      "end": 84173665
    }, {
      "filename": "/content/textures/shadowmask.png",
      "start": 84173665,
      "end": 84177250
    }, {
      "filename": "/content/textures/sky/sky512_bk.tex",
      "start": 84177250,
      "end": 84876442
    }, {
      "filename": "/content/textures/sky/sky512_dn.tex",
      "start": 84876442,
      "end": 85575634
    }, {
      "filename": "/content/textures/sky/sky512_ft.tex",
      "start": 85575634,
      "end": 86274826
    }, {
      "filename": "/content/textures/sky/sky512_lf.tex",
      "start": 86274826,
      "end": 86974018
    }, {
      "filename": "/content/textures/sky/sky512_rt.tex",
      "start": 86974018,
      "end": 87673210
    }, {
      "filename": "/content/textures/sky/sky512_up.tex",
      "start": 87673210,
      "end": 88372402
    }, {
      "filename": "/content/textures/slate/diffuse.dds",
      "start": 88372402,
      "end": 89071594
    }, {
      "filename": "/content/textures/slate/normal.dds",
      "start": 89071594,
      "end": 90469850
    }, {
      "filename": "/content/textures/slate/normaldetail.dds",
      "start": 90469850,
      "end": 90819530
    }, {
      "filename": "/content/textures/slate/specular.dds",
      "start": 90819530,
      "end": 90994434
    }, {
      "filename": "/content/textures/spark.png",
      "start": 90994434,
      "end": 90998011
    }, {
      "filename": "/content/textures/sparkle.png",
      "start": 90998011,
      "end": 91002278
    }, {
      "filename": "/content/textures/studs.dds",
      "start": 91002278,
      "end": 91177262
    }, {
      "filename": "/content/textures/terrain/diffuse.dds",
      "start": 91177262,
      "end": 93973606
    }, {
      "filename": "/content/textures/terrain/diffusefar.dds",
      "start": 93973606,
      "end": 96769950
    }, {
      "filename": "/content/textures/terrain/normal.dds",
      "start": 96769950,
      "end": 102362510
    }, {
      "filename": "/content/textures/terrain/specular.dds",
      "start": 102362510,
      "end": 105158854
    }, {
      "filename": "/content/textures/transformFiveDegrees.png",
      "start": 105158854,
      "end": 105163917
    }, {
      "filename": "/content/textures/transformNinetyDegrees.png",
      "start": 105163917,
      "end": 105169433
    }, {
      "filename": "/content/textures/transformOneDegree.png",
      "start": 105169433,
      "end": 105174186
    }, {
      "filename": "/content/textures/transformTwentyTwoDegrees.png",
      "start": 105174186,
      "end": 105178254
    }, {
      "filename": "/content/textures/ui/Backpack/Backpack.png",
      "start": 105178254,
      "end": 105179077
    }, {
      "filename": "/content/textures/ui/Backpack/Backpack@2x.png",
      "start": 105179077,
      "end": 105181253
    }, {
      "filename": "/content/textures/ui/Backpack/Backpack_Down.png",
      "start": 105181253,
      "end": 105182233
    }, {
      "filename": "/content/textures/ui/Backpack/Backpack_Down@2x.png",
      "start": 105182233,
      "end": 105184485
    }, {
      "filename": "/content/textures/ui/Backpack_Close.png",
      "start": 105184485,
      "end": 105184719
    }, {
      "filename": "/content/textures/ui/Backpack_Close@2x.png",
      "start": 105184719,
      "end": 105185172
    }, {
      "filename": "/content/textures/ui/Backpack_Open.png",
      "start": 105185172,
      "end": 105185416
    }, {
      "filename": "/content/textures/ui/Backpack_Open@2x.png",
      "start": 105185416,
      "end": 105185861
    }, {
      "filename": "/content/textures/ui/ButtonLeft.png",
      "start": 105185861,
      "end": 105200973
    }, {
      "filename": "/content/textures/ui/ButtonLeftDown.png",
      "start": 105200973,
      "end": 105216084
    }, {
      "filename": "/content/textures/ui/ButtonRight.png",
      "start": 105216084,
      "end": 105231179
    }, {
      "filename": "/content/textures/ui/ButtonRightDown.png",
      "start": 105231179,
      "end": 105246287
    }, {
      "filename": "/content/textures/ui/Chat/Chat.png",
      "start": 105246287,
      "end": 105247142
    }, {
      "filename": "/content/textures/ui/Chat/Chat@2x.png",
      "start": 105247142,
      "end": 105249263
    }, {
      "filename": "/content/textures/ui/Chat/ChatDown.png",
      "start": 105249263,
      "end": 105250067
    }, {
      "filename": "/content/textures/ui/Chat/ChatDown@2x.png",
      "start": 105250067,
      "end": 105251903
    }, {
      "filename": "/content/textures/ui/Chat/MessageCounter.png",
      "start": 105251903,
      "end": 105252500
    }, {
      "filename": "/content/textures/ui/Chat/MessageCounter@2x.png",
      "start": 105252500,
      "end": 105253810
    }, {
      "filename": "/content/textures/ui/Chat/ToggleChat.png",
      "start": 105253810,
      "end": 105254880
    }, {
      "filename": "/content/textures/ui/Chat/ToggleChat@2x.png",
      "start": 105254880,
      "end": 105257565
    }, {
      "filename": "/content/textures/ui/Chat/ToggleChatDown.png",
      "start": 105257565,
      "end": 105258723
    }, {
      "filename": "/content/textures/ui/Chat/ToggleChatDown@2x.png",
      "start": 105258723,
      "end": 105261464
    }, {
      "filename": "/content/textures/ui/CloneButton.png",
      "start": 105261464,
      "end": 105263129
    }, {
      "filename": "/content/textures/ui/CloneButton_dn.png",
      "start": 105263129,
      "end": 105264866
    }, {
      "filename": "/content/textures/ui/CloseButton.png",
      "start": 105264866,
      "end": 105266433
    }, {
      "filename": "/content/textures/ui/CloseButton_dn.png",
      "start": 105266433,
      "end": 105267939
    }, {
      "filename": "/content/textures/ui/Concrete.png",
      "start": 105267939,
      "end": 105270059
    }, {
      "filename": "/content/textures/ui/CorrodedMetal.png",
      "start": 105270059,
      "end": 105272014
    }, {
      "filename": "/content/textures/ui/DPadSheet.png",
      "start": 105272014,
      "end": 105289881
    }, {
      "filename": "/content/textures/ui/DeleteButton.png",
      "start": 105289881,
      "end": 105291437
    }, {
      "filename": "/content/textures/ui/DeleteButton_dn.png",
      "start": 105291437,
      "end": 105293012
    }, {
      "filename": "/content/textures/ui/DiamondPlate.png",
      "start": 105293012,
      "end": 105294955
    }, {
      "filename": "/content/textures/ui/ErrorIcon.png",
      "start": 105294955,
      "end": 105298018
    }, {
      "filename": "/content/textures/ui/ErrorIconSmall.png",
      "start": 105298018,
      "end": 105301138
    }, {
      "filename": "/content/textures/ui/Foil.png",
      "start": 105301138,
      "end": 105303221
    }, {
      "filename": "/content/textures/ui/Gear.png",
      "start": 105303221,
      "end": 105304459
    }, {
      "filename": "/content/textures/ui/Gear_dn.png",
      "start": 105304459,
      "end": 105305662
    }, {
      "filename": "/content/textures/ui/Glue.png",
      "start": 105305662,
      "end": 105308403
    }, {
      "filename": "/content/textures/ui/Grass.png",
      "start": 105308403,
      "end": 105309789
    }, {
      "filename": "/content/textures/ui/GroupMoveButton.png",
      "start": 105309789,
      "end": 105311602
    }, {
      "filename": "/content/textures/ui/GroupMoveButton_dn.png",
      "start": 105311602,
      "end": 105313451
    }, {
      "filename": "/content/textures/ui/Health-BKG-Center.png",
      "start": 105313451,
      "end": 105314410
    }, {
      "filename": "/content/textures/ui/Health-BKG-Center@2x.png",
      "start": 105314410,
      "end": 105315396
    }, {
      "filename": "/content/textures/ui/Health-BKG-Left-Cap.png",
      "start": 105315396,
      "end": 105316481
    }, {
      "filename": "/content/textures/ui/Health-BKG-Left-Cap@2x.png",
      "start": 105316481,
      "end": 105317791
    }, {
      "filename": "/content/textures/ui/Health-BKG-Right-Cap.png",
      "start": 105317791,
      "end": 105318896
    }, {
      "filename": "/content/textures/ui/Health-BKG-Right-Cap@2x.png",
      "start": 105318896,
      "end": 105320250
    }, {
      "filename": "/content/textures/ui/Hinge.png",
      "start": 105320250,
      "end": 105321117
    }, {
      "filename": "/content/textures/ui/Ice.png",
      "start": 105321117,
      "end": 105323036
    }, {
      "filename": "/content/textures/ui/Inlets.png",
      "start": 105323036,
      "end": 105325295
    }, {
      "filename": "/content/textures/ui/InsertButton.png",
      "start": 105325295,
      "end": 105326933
    }, {
      "filename": "/content/textures/ui/InsertButton_dn.png",
      "start": 105326933,
      "end": 105328603
    }, {
      "filename": "/content/textures/ui/LoadingBKG.png",
      "start": 105328603,
      "end": 105334513
    }, {
      "filename": "/content/textures/ui/MaterialButton.png",
      "start": 105334513,
      "end": 105336555
    }, {
      "filename": "/content/textures/ui/MaterialButton_dn.png",
      "start": 105336555,
      "end": 105338650
    }, {
      "filename": "/content/textures/ui/MaterialMenu.png",
      "start": 105338650,
      "end": 105340137
    }, {
      "filename": "/content/textures/ui/Menu/Hamburger.png",
      "start": 105340137,
      "end": 105340384
    }, {
      "filename": "/content/textures/ui/Menu/Hamburger@2x.png",
      "start": 105340384,
      "end": 105341018
    }, {
      "filename": "/content/textures/ui/Menu/HamburgerDown.png",
      "start": 105341018,
      "end": 105341280
    }, {
      "filename": "/content/textures/ui/Menu/HamburgerDown@2x.png",
      "start": 105341280,
      "end": 105341925
    }, {
      "filename": "/content/textures/ui/Modal.png",
      "start": 105341925,
      "end": 105357942
    }, {
      "filename": "/content/textures/ui/Motor.png",
      "start": 105357942,
      "end": 105358822
    }, {
      "filename": "/content/textures/ui/PaintButton.png",
      "start": 105358822,
      "end": 105360396
    }, {
      "filename": "/content/textures/ui/PaintButton_dn.png",
      "start": 105360396,
      "end": 105362009
    }, {
      "filename": "/content/textures/ui/PartMoveButton.png",
      "start": 105362009,
      "end": 105363715
    }, {
      "filename": "/content/textures/ui/PartMoveButton_dn.png",
      "start": 105363715,
      "end": 105365408
    }, {
      "filename": "/content/textures/ui/Plastic.png",
      "start": 105365408,
      "end": 105366581
    }, {
      "filename": "/content/textures/ui/PlayerList/BlockedIcon.png",
      "start": 105366581,
      "end": 105366926
    }, {
      "filename": "/content/textures/ui/PlayerList/CharacterImageBackground.png",
      "start": 105366926,
      "end": 105367506
    }, {
      "filename": "/content/textures/ui/PlayerList/TileShadowMissingTop.png",
      "start": 105367506,
      "end": 105368002
    }, {
      "filename": "/content/textures/ui/PlayerListFriendRequestReceivedIcon.png",
      "start": 105368002,
      "end": 105370452
    }, {
      "filename": "/content/textures/ui/PlayerListFriendRequestSentIcon.png",
      "start": 105370452,
      "end": 105372800
    }, {
      "filename": "/content/textures/ui/PlayerlistFriendIcon.png",
      "start": 105372800,
      "end": 105374894
    }, {
      "filename": "/content/textures/ui/PropertyButton.png",
      "start": 105374894,
      "end": 105376543
    }, {
      "filename": "/content/textures/ui/PropertyButton_dn.png",
      "start": 105376543,
      "end": 105378230
    }, {
      "filename": "/content/textures/ui/RecordDown.png",
      "start": 105378230,
      "end": 105380590
    }, {
      "filename": "/content/textures/ui/RecordStop.png",
      "start": 105380590,
      "end": 105382577
    }, {
      "filename": "/content/textures/ui/ResetIcon.png",
      "start": 105382577,
      "end": 105384983
    }, {
      "filename": "/content/textures/ui/RobuxIcon.png",
      "start": 105384983,
      "end": 105387147
    }, {
      "filename": "/content/textures/ui/ScaleButton.png",
      "start": 105387147,
      "end": 105388894
    }, {
      "filename": "/content/textures/ui/ScaleButton_dn.png",
      "start": 105388894,
      "end": 105390686
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-bottom.png",
      "start": 105390686,
      "end": 105391687
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-bottom@2x.png",
      "start": 105391687,
      "end": 105392776
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-middle.png",
      "start": 105392776,
      "end": 105393706
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-middle@2x.png",
      "start": 105393706,
      "end": 105394639
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-top.png",
      "start": 105394639,
      "end": 105395645
    }, {
      "filename": "/content/textures/ui/Scroll/scroll-top@2x.png",
      "start": 105395645,
      "end": 105396753
    }, {
      "filename": "/content/textures/ui/SearchIcon.png",
      "start": 105396753,
      "end": 105398052
    }, {
      "filename": "/content/textures/ui/SelectionBox.png",
      "start": 105398052,
      "end": 105402438
    }, {
      "filename": "/content/textures/ui/SelectionBox@2x.png",
      "start": 105402438,
      "end": 105408310
    }, {
      "filename": "/content/textures/ui/Settings/DropDown/DropDown.png",
      "start": 105408310,
      "end": 105411214
    }, {
      "filename": "/content/textures/ui/Settings/DropDown/DropDown@2x.png",
      "start": 105411214,
      "end": 105414290
    }, {
      "filename": "/content/textures/ui/Settings/Help/AButtonDark.png",
      "start": 105414290,
      "end": 105419618
    }, {
      "filename": "/content/textures/ui/Settings/Help/AButtonDark@2x.png",
      "start": 105419618,
      "end": 105433516
    }, {
      "filename": "/content/textures/ui/Settings/Help/AButtonLight.png",
      "start": 105433516,
      "end": 105437556
    }, {
      "filename": "/content/textures/ui/Settings/Help/AButtonLight@2x.png",
      "start": 105437556,
      "end": 105447621
    }, {
      "filename": "/content/textures/ui/Settings/Help/AButtonLightSmall.png",
      "start": 105447621,
      "end": 105448866
    }, {
      "filename": "/content/textures/ui/Settings/Help/BButtonDark.png",
      "start": 105448866,
      "end": 105454135
    }, {
      "filename": "/content/textures/ui/Settings/Help/BButtonDark@2x.png",
      "start": 105454135,
      "end": 105467895
    }, {
      "filename": "/content/textures/ui/Settings/Help/BButtonLight.png",
      "start": 105467895,
      "end": 105472092
    }, {
      "filename": "/content/textures/ui/Settings/Help/BButtonLight@2x.png",
      "start": 105472092,
      "end": 105482419
    }, {
      "filename": "/content/textures/ui/Settings/Help/EscapeIcon.png",
      "start": 105482419,
      "end": 105483427
    }, {
      "filename": "/content/textures/ui/Settings/Help/GenericController.png",
      "start": 105483427,
      "end": 105515029
    }, {
      "filename": "/content/textures/ui/Settings/Help/GenericController@2x.png",
      "start": 105515029,
      "end": 105594445
    }, {
      "filename": "/content/textures/ui/Settings/Help/LeaveIcon.png",
      "start": 105594445,
      "end": 105594861
    }, {
      "filename": "/content/textures/ui/Settings/Help/ResetIcon.png",
      "start": 105594861,
      "end": 105595501
    }, {
      "filename": "/content/textures/ui/Settings/Help/RotateCameraGesture.png",
      "start": 105595501,
      "end": 105603861
    }, {
      "filename": "/content/textures/ui/Settings/Help/UseToolGesture.png",
      "start": 105603861,
      "end": 105607659
    }, {
      "filename": "/content/textures/ui/Settings/Help/XButtonDark.png",
      "start": 105607659,
      "end": 105613211
    }, {
      "filename": "/content/textures/ui/Settings/Help/XButtonDark@2x.png",
      "start": 105613211,
      "end": 105627656
    }, {
      "filename": "/content/textures/ui/Settings/Help/XButtonLight.png",
      "start": 105627656,
      "end": 105631702
    }, {
      "filename": "/content/textures/ui/Settings/Help/XButtonLight@2x.png",
      "start": 105631702,
      "end": 105641750
    }, {
      "filename": "/content/textures/ui/Settings/Help/XboxController.png",
      "start": 105641750,
      "end": 105735476
    }, {
      "filename": "/content/textures/ui/Settings/Help/YButtonDark.png",
      "start": 105735476,
      "end": 105740811
    }, {
      "filename": "/content/textures/ui/Settings/Help/YButtonDark@2x.png",
      "start": 105740811,
      "end": 105754550
    }, {
      "filename": "/content/textures/ui/Settings/Help/YButtonLight.png",
      "start": 105754550,
      "end": 105758354
    }, {
      "filename": "/content/textures/ui/Settings/Help/YButtonLight@2x.png",
      "start": 105758354,
      "end": 105768077
    }, {
      "filename": "/content/textures/ui/Settings/Help/ZoomGesture.png",
      "start": 105768077,
      "end": 105774886
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuBackground.png",
      "start": 105774886,
      "end": 105777818
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuButton.png",
      "start": 105777818,
      "end": 105778566
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuButton@2x.png",
      "start": 105778566,
      "end": 105780519
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuButtonSelected.png",
      "start": 105780519,
      "end": 105781282
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuButtonSelected@2x.png",
      "start": 105781282,
      "end": 105783237
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuSelection.png",
      "start": 105783237,
      "end": 105786097
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarAssets/MenuSelection@2x.png",
      "start": 105786097,
      "end": 105789037
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/GameSettingsTab.png",
      "start": 105789037,
      "end": 105791853
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/GameSettingsTab@2x.png",
      "start": 105791853,
      "end": 105799253
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/HelpTab.png",
      "start": 105799253,
      "end": 105801919
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/HelpTab@2x.png",
      "start": 105801919,
      "end": 105809218
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/HomeTab.png",
      "start": 105809218,
      "end": 105810329
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/HomeTab@2x.png",
      "start": 105810329,
      "end": 105813193
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/PlayersTabIcon.png",
      "start": 105813193,
      "end": 105813687
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/PlayersTabIcon@2x.png",
      "start": 105813687,
      "end": 105815364
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/RecordTab.png",
      "start": 105815364,
      "end": 105817268
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/RecordTab@2x.png",
      "start": 105817268,
      "end": 105821842
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/ReportAbuseTab.png",
      "start": 105821842,
      "end": 105823205
    }, {
      "filename": "/content/textures/ui/Settings/MenuBarIcons/ReportAbuseTab@2x.png",
      "start": 105823205,
      "end": 105825848
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Alert.png",
      "start": 105825848,
      "end": 105828458
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Alert@2x.png",
      "start": 105828458,
      "end": 105835149
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Backpack.png",
      "start": 105835149,
      "end": 105837343
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Backpack@2x.png",
      "start": 105837343,
      "end": 105842668
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Bottom.png",
      "start": 105842668,
      "end": 105853549
    }, {
      "filename": "/content/textures/ui/Settings/Radial/BottomLeft.png",
      "start": 105853549,
      "end": 105864741
    }, {
      "filename": "/content/textures/ui/Settings/Radial/BottomLeftSelected.png",
      "start": 105864741,
      "end": 105875755
    }, {
      "filename": "/content/textures/ui/Settings/Radial/BottomRight.png",
      "start": 105875755,
      "end": 105886980
    }, {
      "filename": "/content/textures/ui/Settings/Radial/BottomRightSelected.png",
      "start": 105886980,
      "end": 105897753
    }, {
      "filename": "/content/textures/ui/Settings/Radial/BottomSelected.png",
      "start": 105897753,
      "end": 105907568
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Chat.png",
      "start": 105907568,
      "end": 105909710
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Chat@2x.png",
      "start": 105909710,
      "end": 105914853
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyBottom.png",
      "start": 105914853,
      "end": 105928906
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyBottomLeft.png",
      "start": 105928906,
      "end": 105943481
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyBottomRight.png",
      "start": 105943481,
      "end": 105958162
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyTop.png",
      "start": 105958162,
      "end": 105972195
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyTopLeft.png",
      "start": 105972195,
      "end": 105986821
    }, {
      "filename": "/content/textures/ui/Settings/Radial/EmptyTopRight.png",
      "start": 105986821,
      "end": 106001773
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Leave.png",
      "start": 106001773,
      "end": 106003896
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Leave@2x.png",
      "start": 106003896,
      "end": 106009370
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Menu.png",
      "start": 106009370,
      "end": 106010484
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Menu@2x.png",
      "start": 106010484,
      "end": 106013321
    }, {
      "filename": "/content/textures/ui/Settings/Radial/PlayerList.png",
      "start": 106013321,
      "end": 106014711
    }, {
      "filename": "/content/textures/ui/Settings/Radial/PlayerList@2x.png",
      "start": 106014711,
      "end": 106018525
    }, {
      "filename": "/content/textures/ui/Settings/Radial/RadialLabel.png",
      "start": 106018525,
      "end": 106021938
    }, {
      "filename": "/content/textures/ui/Settings/Radial/RadialLabel@2x.png",
      "start": 106021938,
      "end": 106026219
    }, {
      "filename": "/content/textures/ui/Settings/Radial/Top.png",
      "start": 106026219,
      "end": 106037132
    }, {
      "filename": "/content/textures/ui/Settings/Radial/TopLeft.png",
      "start": 106037132,
      "end": 106048356
    }, {
      "filename": "/content/textures/ui/Settings/Radial/TopLeftSelected.png",
      "start": 106048356,
      "end": 106058686
    }, {
      "filename": "/content/textures/ui/Settings/Radial/TopRight.png",
      "start": 106058686,
      "end": 106070127
    }, {
      "filename": "/content/textures/ui/Settings/Radial/TopRightSelected.png",
      "start": 106070127,
      "end": 106080787
    }, {
      "filename": "/content/textures/ui/Settings/Radial/TopSelected.png",
      "start": 106080787,
      "end": 106090953
    }, {
      "filename": "/content/textures/ui/Settings/Slider/BarLeft.png",
      "start": 106090953,
      "end": 106091164
    }, {
      "filename": "/content/textures/ui/Settings/Slider/BarLeft@2x.png",
      "start": 106091164,
      "end": 106091526
    }, {
      "filename": "/content/textures/ui/Settings/Slider/BarRight.png",
      "start": 106091526,
      "end": 106091718
    }, {
      "filename": "/content/textures/ui/Settings/Slider/BarRight@2x.png",
      "start": 106091718,
      "end": 106092061
    }, {
      "filename": "/content/textures/ui/Settings/Slider/Left.png",
      "start": 106092061,
      "end": 106092426
    }, {
      "filename": "/content/textures/ui/Settings/Slider/Left@2x.png",
      "start": 106092426,
      "end": 106093107
    }, {
      "filename": "/content/textures/ui/Settings/Slider/Right.png",
      "start": 106093107,
      "end": 106093445
    }, {
      "filename": "/content/textures/ui/Settings/Slider/Right@2x.png",
      "start": 106093445,
      "end": 106094179
    }, {
      "filename": "/content/textures/ui/Settings/Slider/SelectedBarLeft.png",
      "start": 106094179,
      "end": 106094376
    }, {
      "filename": "/content/textures/ui/Settings/Slider/SelectedBarLeft@2x.png",
      "start": 106094376,
      "end": 106094738
    }, {
      "filename": "/content/textures/ui/Settings/Slider/SelectedBarRight.png",
      "start": 106094738,
      "end": 106094926
    }, {
      "filename": "/content/textures/ui/Settings/Slider/SelectedBarRight@2x.png",
      "start": 106094926,
      "end": 106095238
    }, {
      "filename": "/content/textures/ui/SettingsButton.png",
      "start": 106095238,
      "end": 106098724
    }, {
      "filename": "/content/textures/ui/SettingsButton_dn.png",
      "start": 106098724,
      "end": 106102126
    }, {
      "filename": "/content/textures/ui/SettingsButton_ds.png",
      "start": 106102126,
      "end": 106104717
    }, {
      "filename": "/content/textures/ui/SettingsButton_ovr.png",
      "start": 106104717,
      "end": 106108119
    }, {
      "filename": "/content/textures/ui/Shell/Background/Home_screen_01.png",
      "start": 106108119,
      "end": 106977128
    }, {
      "filename": "/content/textures/ui/Shell/ButtonIcons/AButton.png",
      "start": 106977128,
      "end": 106984242
    }, {
      "filename": "/content/textures/ui/Shell/ButtonIcons/AButtonDark.png",
      "start": 106984242,
      "end": 106994005
    }, {
      "filename": "/content/textures/ui/Shell/ButtonIcons/BButton.png",
      "start": 106994005,
      "end": 107001329
    }, {
      "filename": "/content/textures/ui/Shell/ButtonIcons/BButtonDark.png",
      "start": 107001329,
      "end": 107010535
    }, {
      "filename": "/content/textures/ui/Shell/ButtonIcons/XButton.png",
      "start": 107010535,
      "end": 107017657
    }, {
      "filename": "/content/textures/ui/Shell/ButtonIcons/XButtonDark.png",
      "start": 107017657,
      "end": 107027749
    }, {
      "filename": "/content/textures/ui/Shell/ButtonIcons/YButton.png",
      "start": 107027749,
      "end": 107034643
    }, {
      "filename": "/content/textures/ui/Shell/ButtonIcons/YButtonDark.png",
      "start": 107034643,
      "end": 107044330
    }, {
      "filename": "/content/textures/ui/Shell/Buttons/Generic9ScaleButton@720.png",
      "start": 107044330,
      "end": 107044490
    }, {
      "filename": "/content/textures/ui/Shell/Buttons/Generic9ScaleShadow.png",
      "start": 107044490,
      "end": 107045047
    }, {
      "filename": "/content/textures/ui/Shell/Buttons/MoreButton@1080.png",
      "start": 107045047,
      "end": 107045797
    }, {
      "filename": "/content/textures/ui/Shell/Buttons/MoreButton@720.png",
      "start": 107045797,
      "end": 107046566
    }, {
      "filename": "/content/textures/ui/Shell/Buttons/MoreButtonSelected@1080.png",
      "start": 107046566,
      "end": 107047750
    }, {
      "filename": "/content/textures/ui/Shell/Buttons/MoreButtonSelected@720.png",
      "start": 107047750,
      "end": 107049150
    }, {
      "filename": "/content/textures/ui/Shell/Icons/AccountIcon.png",
      "start": 107049150,
      "end": 107061005
    }, {
      "filename": "/content/textures/ui/Shell/Icons/AlertIcon.png",
      "start": 107061005,
      "end": 107076818
    }, {
      "filename": "/content/textures/ui/Shell/Icons/BackIcon@1080.png",
      "start": 107076818,
      "end": 107078084
    }, {
      "filename": "/content/textures/ui/Shell/Icons/BackIcon@720.png",
      "start": 107078084,
      "end": 107079045
    }, {
      "filename": "/content/textures/ui/Shell/Icons/Checkmark@1080.png",
      "start": 107079045,
      "end": 107080371
    }, {
      "filename": "/content/textures/ui/Shell/Icons/Checkmark@720.png",
      "start": 107080371,
      "end": 107081324
    }, {
      "filename": "/content/textures/ui/Shell/Icons/CustomizeIcon@1080.png",
      "start": 107081324,
      "end": 107082583
    }, {
      "filename": "/content/textures/ui/Shell/Icons/CustomizeIcon@720.png",
      "start": 107082583,
      "end": 107083420
    }, {
      "filename": "/content/textures/ui/Shell/Icons/DefaultProfileIcon.png",
      "start": 107083420,
      "end": 107085723
    }, {
      "filename": "/content/textures/ui/Shell/Icons/DownIndicatorIcon@1080.png",
      "start": 107085723,
      "end": 107086058
    }, {
      "filename": "/content/textures/ui/Shell/Icons/DownIndicatorIcon@720.png",
      "start": 107086058,
      "end": 107086301
    }, {
      "filename": "/content/textures/ui/Shell/Icons/Dropdown02@1080.png",
      "start": 107086301,
      "end": 107088795
    }, {
      "filename": "/content/textures/ui/Shell/Icons/Dropdown02@720.png",
      "start": 107088795,
      "end": 107090457
    }, {
      "filename": "/content/textures/ui/Shell/Icons/EquippedOverlay.png",
      "start": 107090457,
      "end": 107092297
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ErrorIconLargeCopy@1080.png",
      "start": 107092297,
      "end": 107104535
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ErrorIconLargeCopy@720.png",
      "start": 107104535,
      "end": 107112665
    }, {
      "filename": "/content/textures/ui/Shell/Icons/FavoriteStar@1080.png",
      "start": 107112665,
      "end": 107113427
    }, {
      "filename": "/content/textures/ui/Shell/Icons/FavoriteStar@720.png",
      "start": 107113427,
      "end": 107114016
    }, {
      "filename": "/content/textures/ui/Shell/Icons/FriendsIcon@1080.png",
      "start": 107114016,
      "end": 107130973
    }, {
      "filename": "/content/textures/ui/Shell/Icons/GamePlusIcon.png",
      "start": 107130973,
      "end": 107134091
    }, {
      "filename": "/content/textures/ui/Shell/Icons/HelpIcon.png",
      "start": 107134091,
      "end": 107144971
    }, {
      "filename": "/content/textures/ui/Shell/Icons/HelpIconSmall.png",
      "start": 107144971,
      "end": 107147510
    }, {
      "filename": "/content/textures/ui/Shell/Icons/LoadingSpinner@1080.png",
      "start": 107147510,
      "end": 107151648
    }, {
      "filename": "/content/textures/ui/Shell/Icons/LoadingSpinner@720.png",
      "start": 107151648,
      "end": 107154354
    }, {
      "filename": "/content/textures/ui/Shell/Icons/NoGameImageIcon.png",
      "start": 107154354,
      "end": 107158662
    }, {
      "filename": "/content/textures/ui/Shell/Icons/OfflineDot@1080.png",
      "start": 107158662,
      "end": 107159161
    }, {
      "filename": "/content/textures/ui/Shell/Icons/OfflineDot@720.png",
      "start": 107159161,
      "end": 107159660
    }, {
      "filename": "/content/textures/ui/Shell/Icons/OnlineDot@1080.png",
      "start": 107159660,
      "end": 107160125
    }, {
      "filename": "/content/textures/ui/Shell/Icons/OnlineDot@720.png",
      "start": 107160125,
      "end": 107160491
    }, {
      "filename": "/content/textures/ui/Shell/Icons/OnlineKindaDot@1080.png",
      "start": 107160491,
      "end": 107160947
    }, {
      "filename": "/content/textures/ui/Shell/Icons/OnlineKindaDot@720.png",
      "start": 107160947,
      "end": 107161289
    }, {
      "filename": "/content/textures/ui/Shell/Icons/OnlineStatus@1080.png",
      "start": 107161289,
      "end": 107161754
    }, {
      "filename": "/content/textures/ui/Shell/Icons/OnlineStatus@720.png",
      "start": 107161754,
      "end": 107162120
    }, {
      "filename": "/content/textures/ui/Shell/Icons/OnlineStatusIcon@1080.png",
      "start": 107162120,
      "end": 107162431
    }, {
      "filename": "/content/textures/ui/Shell/Icons/OnlineStatusIcon@720.png",
      "start": 107162431,
      "end": 107162695
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ProfileIcon.png",
      "start": 107162695,
      "end": 107171528
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ROBLOXLogoSmall@1080.png",
      "start": 107171528,
      "end": 107189556
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ROBLOXLogoSmall@720.png",
      "start": 107189556,
      "end": 107200041
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ROBLOXLogoStart@1080.png",
      "start": 107200041,
      "end": 107252636
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ROBLOXLogoStart@720.png",
      "start": 107252636,
      "end": 107288380
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ROBLOXSplashLogo.png",
      "start": 107288380,
      "end": 107346071
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ROBUXIcon@1080.png",
      "start": 107346071,
      "end": 107347738
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ROBUXIcon@720.png",
      "start": 107347738,
      "end": 107348954
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ROBUXIconOutlined@1080.png",
      "start": 107348954,
      "end": 107351084
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ROBUXIconOutlined@720.png",
      "start": 107351084,
      "end": 107352729
    }, {
      "filename": "/content/textures/ui/Shell/Icons/RatingBar@1080.png",
      "start": 107352729,
      "end": 107353017
    }, {
      "filename": "/content/textures/ui/Shell/Icons/RatingBar@720.png",
      "start": 107353017,
      "end": 107353231
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ReportIcon@1080.png",
      "start": 107353231,
      "end": 107355035
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ReportIcon@720.png",
      "start": 107355035,
      "end": 107356197
    }, {
      "filename": "/content/textures/ui/Shell/Icons/RobloxIcon24.png",
      "start": 107356197,
      "end": 107357755
    }, {
      "filename": "/content/textures/ui/Shell/Icons/RobloxIcon32.png",
      "start": 107357755,
      "end": 107360043
    }, {
      "filename": "/content/textures/ui/Shell/Icons/SeparatorDot@1080.png",
      "start": 107360043,
      "end": 107360251
    }, {
      "filename": "/content/textures/ui/Shell/Icons/SeparatorDot@720.png",
      "start": 107360251,
      "end": 107360438
    }, {
      "filename": "/content/textures/ui/Shell/Icons/TVIcon.png",
      "start": 107360438,
      "end": 107362341
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsDown@1080.png",
      "start": 107362341,
      "end": 107364915
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsDown@720.png",
      "start": 107364915,
      "end": 107366534
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsDownFilled@1080.png",
      "start": 107366534,
      "end": 107368815
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsDownFilled@720.png",
      "start": 107368815,
      "end": 107370289
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsDownIcon@1080.png",
      "start": 107370289,
      "end": 107370948
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsDownIcon@720.png",
      "start": 107370948,
      "end": 107371430
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsUp@1080.png",
      "start": 107371430,
      "end": 107374061
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsUp@720.png",
      "start": 107374061,
      "end": 107375661
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsUpFilled@1080.png",
      "start": 107375661,
      "end": 107377885
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsUpFilled@720.png",
      "start": 107377885,
      "end": 107379357
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsUpIcon@1080.png",
      "start": 107379357,
      "end": 107379949
    }, {
      "filename": "/content/textures/ui/Shell/Icons/ThumbsUpIcon@720.png",
      "start": 107379949,
      "end": 107380364
    }, {
      "filename": "/content/textures/ui/Shell/Icons/UpIndicatorIcon@1080.png",
      "start": 107380364,
      "end": 107380708
    }, {
      "filename": "/content/textures/ui/Shell/Icons/UpIndicatorIcon@720.png",
      "start": 107380708,
      "end": 107380953
    }, {
      "filename": "/content/textures/ui/Shell/Images/CharacterGlow/CharacterGlowBase.png",
      "start": 107380953,
      "end": 108255077
    }, {
      "filename": "/content/textures/ui/Shell/Images/CharacterGlow/CharacterGlowTop.png",
      "start": 108255077,
      "end": 109768331
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/Robux01.png",
      "start": 109768331,
      "end": 110009502
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/Robux02.png",
      "start": 110009502,
      "end": 110254550
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/Robux03.png",
      "start": 110254550,
      "end": 110505385
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/Robux04.png",
      "start": 110505385,
      "end": 110768932
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/Robux05.png",
      "start": 110768932,
      "end": 111065911
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/Robux06.png",
      "start": 111065911,
      "end": 111368211
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/RobuxSquare01.png",
      "start": 111368211,
      "end": 111745270
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/RobuxSquare02.png",
      "start": 111745270,
      "end": 112147500
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/RobuxSquare03.png",
      "start": 112147500,
      "end": 112566792
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/RobuxSquare04.png",
      "start": 112566792,
      "end": 112970860
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/RobuxSquare05.png",
      "start": 112970860,
      "end": 113423445
    }, {
      "filename": "/content/textures/ui/Shell/Images/Robux/RobuxSquare06.png",
      "start": 113423445,
      "end": 113911795
    }, {
      "filename": "/content/textures/ui/Shell/ScreenAdjustment/Background.png",
      "start": 113911795,
      "end": 114054906
    }, {
      "filename": "/content/textures/ui/Shell/ScreenAdjustment/Controller@1080.png",
      "start": 114054906,
      "end": 114102207
    }, {
      "filename": "/content/textures/ui/Shell/ScreenAdjustment/Controller@720.png",
      "start": 114102207,
      "end": 114130132
    }, {
      "filename": "/content/textures/ui/Shell/ScreenAdjustment/ScreenAdjustmentArrow.png",
      "start": 114130132,
      "end": 114131122
    }, {
      "filename": "/content/textures/ui/Shell/ScreenAdjustment/ScreenRangeOverlay.png",
      "start": 114131122,
      "end": 114131508
    }, {
      "filename": "/content/textures/ui/SingleButton.png",
      "start": 114131508,
      "end": 114132859
    }, {
      "filename": "/content/textures/ui/SingleButtonDown.png",
      "start": 114132859,
      "end": 114134191
    }, {
      "filename": "/content/textures/ui/Slate.png",
      "start": 114134191,
      "end": 114135935
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Center.png",
      "start": 114135935,
      "end": 114136867
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Center@2x.png",
      "start": 114136867,
      "end": 114137799
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Left-Cap.png",
      "start": 114137799,
      "end": 114138781
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Left-Cap@2x.png",
      "start": 114138781,
      "end": 114139862
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Right-Cap.png",
      "start": 114139862,
      "end": 114140853
    }, {
      "filename": "/content/textures/ui/Slider-BKG-Right-Cap@2x.png",
      "start": 114140853,
      "end": 114141932
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Center.png",
      "start": 114141932,
      "end": 114142864
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Center@2x.png",
      "start": 114142864,
      "end": 114143796
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Left-Cap.png",
      "start": 114143796,
      "end": 114144779
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Left-Cap@2x.png",
      "start": 114144779,
      "end": 114145839
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Right-Cap.png",
      "start": 114145839,
      "end": 114146829
    }, {
      "filename": "/content/textures/ui/Slider-Fill-Right-Cap@2x.png",
      "start": 114146829,
      "end": 114147907
    }, {
      "filename": "/content/textures/ui/Slider.png",
      "start": 114147907,
      "end": 114149253
    }, {
      "filename": "/content/textures/ui/Slider_dn.png",
      "start": 114149253,
      "end": 114150517
    }, {
      "filename": "/content/textures/ui/Slider_sel.png",
      "start": 114150517,
      "end": 114151781
    }, {
      "filename": "/content/textures/ui/Smooth.png",
      "start": 114151781,
      "end": 114151968
    }, {
      "filename": "/content/textures/ui/StampToolButton.png",
      "start": 114151968,
      "end": 114153462
    }, {
      "filename": "/content/textures/ui/StampToolButton_dn.png",
      "start": 114153462,
      "end": 114155261
    }, {
      "filename": "/content/textures/ui/Studs.png",
      "start": 114155261,
      "end": 114158582
    }, {
      "filename": "/content/textures/ui/SurfaceButton.png",
      "start": 114158582,
      "end": 114160489
    }, {
      "filename": "/content/textures/ui/SurfaceButton_dn.png",
      "start": 114160489,
      "end": 114162478
    }, {
      "filename": "/content/textures/ui/SurfaceMenu.png",
      "start": 114162478,
      "end": 114163921
    }, {
      "filename": "/content/textures/ui/TinyBcIcon.png",
      "start": 114163921,
      "end": 114167273
    }, {
      "filename": "/content/textures/ui/TinyObcIcon.png",
      "start": 114167273,
      "end": 114170516
    }, {
      "filename": "/content/textures/ui/TinyTbcIcon.png",
      "start": 114170516,
      "end": 114173862
    }, {
      "filename": "/content/textures/ui/TixIcon.png",
      "start": 114173862,
      "end": 114174955
    }, {
      "filename": "/content/textures/ui/ToggleFullScreen_ds.png",
      "start": 114174955,
      "end": 114175421
    }, {
      "filename": "/content/textures/ui/ToolButton.png",
      "start": 114175421,
      "end": 114177122
    }, {
      "filename": "/content/textures/ui/ToolButton_dn.png",
      "start": 114177122,
      "end": 114178823
    }, {
      "filename": "/content/textures/ui/ToolButton_ds.png",
      "start": 114178823,
      "end": 114182023
    }, {
      "filename": "/content/textures/ui/TopBar/dropshadow.png",
      "start": 114182023,
      "end": 114182186
    }, {
      "filename": "/content/textures/ui/TopBar/dropshadow@2x.png",
      "start": 114182186,
      "end": 114182388
    }, {
      "filename": "/content/textures/ui/TouchControlsSheet.png",
      "start": 114182388,
      "end": 114299308
    }, {
      "filename": "/content/textures/ui/Universal.png",
      "start": 114299308,
      "end": 114302567
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBar.png",
      "start": 114302567,
      "end": 114302978
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBar@2x.png",
      "start": 114302978,
      "end": 114303443
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBarBKG.png",
      "start": 114303443,
      "end": 114303722
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBarBKG@2x.png",
      "start": 114303722,
      "end": 114304323
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBarEmpty.png",
      "start": 114304323,
      "end": 114304441
    }, {
      "filename": "/content/textures/ui/Vehicle/SpeedBarEmpty@2x.png",
      "start": 114304441,
      "end": 114304608
    }, {
      "filename": "/content/textures/ui/Weld.png",
      "start": 114304608,
      "end": 114307934
    }, {
      "filename": "/content/textures/ui/Wood.png",
      "start": 114307934,
      "end": 114308909
    }, {
      "filename": "/content/textures/ui/btn_grey.png",
      "start": 114308909,
      "end": 114309329
    }, {
      "filename": "/content/textures/ui/btn_greyTransp.png",
      "start": 114309329,
      "end": 114309757
    }, {
      "filename": "/content/textures/ui/btn_newBlue.png",
      "start": 114309757,
      "end": 114324652
    }, {
      "filename": "/content/textures/ui/btn_newBlue@2x.png",
      "start": 114324652,
      "end": 114339964
    }, {
      "filename": "/content/textures/ui/btn_newBlueGlow.png",
      "start": 114339964,
      "end": 114354858
    }, {
      "filename": "/content/textures/ui/btn_newBlueGlow@2x.png",
      "start": 114354858,
      "end": 114370174
    }, {
      "filename": "/content/textures/ui/btn_newGrey.png",
      "start": 114370174,
      "end": 114385051
    }, {
      "filename": "/content/textures/ui/btn_newGrey@2x.png",
      "start": 114385051,
      "end": 114400347
    }, {
      "filename": "/content/textures/ui/btn_newGreyGlow.png",
      "start": 114400347,
      "end": 114415225
    }, {
      "filename": "/content/textures/ui/btn_newGreyGlow@2x.png",
      "start": 114415225,
      "end": 114430527
    }, {
      "filename": "/content/textures/ui/btn_newWhite.png",
      "start": 114430527,
      "end": 114445357
    }, {
      "filename": "/content/textures/ui/btn_newWhite@2x.png",
      "start": 114445357,
      "end": 114460608
    }, {
      "filename": "/content/textures/ui/btn_newWhiteGlow.png",
      "start": 114460608,
      "end": 114475472
    }, {
      "filename": "/content/textures/ui/btn_newWhiteGlow@2x.png",
      "start": 114475472,
      "end": 114490750
    }, {
      "filename": "/content/textures/ui/btn_red.png",
      "start": 114490750,
      "end": 114491131
    }, {
      "filename": "/content/textures/ui/btn_redGlow.png",
      "start": 114491131,
      "end": 114491654
    }, {
      "filename": "/content/textures/ui/btn_white.png",
      "start": 114491654,
      "end": 114492020
    }, {
      "filename": "/content/textures/ui/chatBubble_blue_notify_bkg.png",
      "start": 114492020,
      "end": 114492943
    }, {
      "filename": "/content/textures/ui/chatBubble_green_notify_bkg.png",
      "start": 114492943,
      "end": 114493842
    }, {
      "filename": "/content/textures/ui/chatBubble_red_notify_bkg.png",
      "start": 114493842,
      "end": 114494661
    }, {
      "filename": "/content/textures/ui/chatBubble_white_notify_bkg.png",
      "start": 114494661,
      "end": 114495502
    }, {
      "filename": "/content/textures/ui/chat_teamButton.png",
      "start": 114495502,
      "end": 114495870
    }, {
      "filename": "/content/textures/ui/chat_teamButton@2x.png",
      "start": 114495870,
      "end": 114496712
    }, {
      "filename": "/content/textures/ui/dialog_blue.png",
      "start": 114496712,
      "end": 114497013
    }, {
      "filename": "/content/textures/ui/dialog_blue@2x.png",
      "start": 114497013,
      "end": 114497751
    }, {
      "filename": "/content/textures/ui/dialog_ellipses.png",
      "start": 114497751,
      "end": 114498165
    }, {
      "filename": "/content/textures/ui/dialog_green.png",
      "start": 114498165,
      "end": 114498473
    }, {
      "filename": "/content/textures/ui/dialog_green@2x.png",
      "start": 114498473,
      "end": 114499183
    }, {
      "filename": "/content/textures/ui/dialog_purpose_help.png",
      "start": 114499183,
      "end": 114499753
    }, {
      "filename": "/content/textures/ui/dialog_purpose_quest.png",
      "start": 114499753,
      "end": 114500082
    }, {
      "filename": "/content/textures/ui/dialog_purpose_shop.png",
      "start": 114500082,
      "end": 114500804
    }, {
      "filename": "/content/textures/ui/dialog_red.png",
      "start": 114500804,
      "end": 114501126
    }, {
      "filename": "/content/textures/ui/dialog_red@2x.png",
      "start": 114501126,
      "end": 114501759
    }, {
      "filename": "/content/textures/ui/dialog_tail.png",
      "start": 114501759,
      "end": 114501950
    }, {
      "filename": "/content/textures/ui/dialog_tail@2x.png",
      "start": 114501950,
      "end": 114502236
    }, {
      "filename": "/content/textures/ui/dialog_white.png",
      "start": 114502236,
      "end": 114502429
    }, {
      "filename": "/content/textures/ui/dialog_white@2x.png",
      "start": 114502429,
      "end": 114502779
    }, {
      "filename": "/content/textures/ui/dropdown_arrow.png",
      "start": 114502779,
      "end": 114503097
    }, {
      "filename": "/content/textures/ui/dropdown_arrow@2x.png",
      "start": 114503097,
      "end": 114503728
    }, {
      "filename": "/content/textures/ui/expandPlayerList.png",
      "start": 114503728,
      "end": 114503937
    }, {
      "filename": "/content/textures/ui/expandPlayerList@2x.png",
      "start": 114503937,
      "end": 114504363
    }, {
      "filename": "/content/textures/ui/homeButton.png",
      "start": 114504363,
      "end": 114519046
    }, {
      "filename": "/content/textures/ui/homeButton@2x.png",
      "start": 114519046,
      "end": 114519852
    }, {
      "filename": "/content/textures/ui/icon_BC-16.png",
      "start": 114519852,
      "end": 114520967
    }, {
      "filename": "/content/textures/ui/icon_OBC-16.png",
      "start": 114520967,
      "end": 114522127
    }, {
      "filename": "/content/textures/ui/icon_TBC-16.png",
      "start": 114522127,
      "end": 114523294
    }, {
      "filename": "/content/textures/ui/icon_admin-16.png",
      "start": 114523294,
      "end": 114524883
    }, {
      "filename": "/content/textures/ui/icon_follower-16.png",
      "start": 114524883,
      "end": 114526044
    }, {
      "filename": "/content/textures/ui/icon_following-16.png",
      "start": 114526044,
      "end": 114527271
    }, {
      "filename": "/content/textures/ui/icon_friendrequestrecieved-16.png",
      "start": 114527271,
      "end": 114528421
    }, {
      "filename": "/content/textures/ui/icon_friendrequestsent_16.png",
      "start": 114528421,
      "end": 114529480
    }, {
      "filename": "/content/textures/ui/icon_friends_16.png",
      "start": 114529480,
      "end": 114530691
    }, {
      "filename": "/content/textures/ui/icon_mutualfollowing-16.png",
      "start": 114530691,
      "end": 114531793
    }, {
      "filename": "/content/textures/ui/icon_placeowner.png",
      "start": 114531793,
      "end": 114533014
    }, {
      "filename": "/content/textures/ui/mouseLock_off.png",
      "start": 114533014,
      "end": 114534582
    }, {
      "filename": "/content/textures/ui/mouseLock_off@2x.png",
      "start": 114534582,
      "end": 114538801
    }, {
      "filename": "/content/textures/ui/mouseLock_on.png",
      "start": 114538801,
      "end": 114540725
    }, {
      "filename": "/content/textures/ui/mouseLock_on@2x.png",
      "start": 114540725,
      "end": 114545619
    }, {
      "filename": "/content/textures/ui/newBkg_square.png",
      "start": 114545619,
      "end": 114560431
    }, {
      "filename": "/content/textures/ui/newBkg_square@2x.png",
      "start": 114560431,
      "end": 114575572
    }, {
      "filename": "/content/textures/ui/scroll-bottom.png",
      "start": 114575572,
      "end": 114575754
    }, {
      "filename": "/content/textures/ui/scroll-bottom@2x.png",
      "start": 114575754,
      "end": 114590422
    }, {
      "filename": "/content/textures/ui/scroll-middle.png",
      "start": 114590422,
      "end": 114590537
    }, {
      "filename": "/content/textures/ui/scroll-middle@2x.png",
      "start": 114590537,
      "end": 114590655
    }, {
      "filename": "/content/textures/ui/scroll-top.png",
      "start": 114590655,
      "end": 114590853
    }, {
      "filename": "/content/textures/ui/scroll-top@2x.png",
      "start": 114590853,
      "end": 114605532
    }, {
      "filename": "/content/textures/ui/scrollbar.png",
      "start": 114605532,
      "end": 114606473
    }, {
      "filename": "/content/textures/ui/scrollbuttonDown.png",
      "start": 114606473,
      "end": 114607591
    }, {
      "filename": "/content/textures/ui/scrollbuttonDown_dn.png",
      "start": 114607591,
      "end": 114608682
    }, {
      "filename": "/content/textures/ui/scrollbuttonDown_ds.png",
      "start": 114608682,
      "end": 114609800
    }, {
      "filename": "/content/textures/ui/scrollbuttonDown_ovr.png",
      "start": 114609800,
      "end": 114610891
    }, {
      "filename": "/content/textures/ui/scrollbuttonUp.png",
      "start": 114610891,
      "end": 114612003
    }, {
      "filename": "/content/textures/ui/scrollbuttonUp_dn.png",
      "start": 114612003,
      "end": 114613093
    }, {
      "filename": "/content/textures/ui/scrollbuttonUp_ds.png",
      "start": 114613093,
      "end": 114614203
    }, {
      "filename": "/content/textures/ui/scrollbuttonUp_ovr.png",
      "start": 114614203,
      "end": 114615293
    }, {
      "filename": "/content/textures/ui/slider_new_tab.png",
      "start": 114615293,
      "end": 114616261
    }, {
      "filename": "/content/textures/ui/slider_new_tab@2x.png",
      "start": 114616261,
      "end": 114618446
    }, {
      "filename": "/content/textures/wangIndex.dds",
      "start": 114618446,
      "end": 114651342
    }, {
      "filename": "/content/textures/water/normal_01.dds",
      "start": 114651342,
      "end": 114738878
    }, {
      "filename": "/content/textures/water/normal_02.dds",
      "start": 114738878,
      "end": 114826414
    }, {
      "filename": "/content/textures/water/normal_03.dds",
      "start": 114826414,
      "end": 114913950
    }, {
      "filename": "/content/textures/water/normal_04.dds",
      "start": 114913950,
      "end": 115001486
    }, {
      "filename": "/content/textures/water/normal_05.dds",
      "start": 115001486,
      "end": 115089022
    }, {
      "filename": "/content/textures/water/normal_06.dds",
      "start": 115089022,
      "end": 115176558
    }, {
      "filename": "/content/textures/water/normal_07.dds",
      "start": 115176558,
      "end": 115264094
    }, {
      "filename": "/content/textures/water/normal_08.dds",
      "start": 115264094,
      "end": 115351630
    }, {
      "filename": "/content/textures/water/normal_09.dds",
      "start": 115351630,
      "end": 115439166
    }, {
      "filename": "/content/textures/water/normal_10.dds",
      "start": 115439166,
      "end": 115526702
    }, {
      "filename": "/content/textures/water/normal_11.dds",
      "start": 115526702,
      "end": 115614238
    }, {
      "filename": "/content/textures/water/normal_12.dds",
      "start": 115614238,
      "end": 115701774
    }, {
      "filename": "/content/textures/water/normal_13.dds",
      "start": 115701774,
      "end": 115789310
    }, {
      "filename": "/content/textures/water/normal_14.dds",
      "start": 115789310,
      "end": 115876846
    }, {
      "filename": "/content/textures/water/normal_15.dds",
      "start": 115876846,
      "end": 115964382
    }, {
      "filename": "/content/textures/water/normal_16.dds",
      "start": 115964382,
      "end": 116051918
    }, {
      "filename": "/content/textures/water/normal_17.dds",
      "start": 116051918,
      "end": 116139454
    }, {
      "filename": "/content/textures/water/normal_18.dds",
      "start": 116139454,
      "end": 116226990
    }, {
      "filename": "/content/textures/water/normal_19.dds",
      "start": 116226990,
      "end": 116314526
    }, {
      "filename": "/content/textures/water/normal_20.dds",
      "start": 116314526,
      "end": 116402062
    }, {
      "filename": "/content/textures/water/normal_21.dds",
      "start": 116402062,
      "end": 116489598
    }, {
      "filename": "/content/textures/water/normal_22.dds",
      "start": 116489598,
      "end": 116577134
    }, {
      "filename": "/content/textures/water/normal_23.dds",
      "start": 116577134,
      "end": 116664670
    }, {
      "filename": "/content/textures/water/normal_24.dds",
      "start": 116664670,
      "end": 116752206
    }, {
      "filename": "/content/textures/water/normal_25.dds",
      "start": 116752206,
      "end": 116839742
    }, {
      "filename": "/content/textures/water_Subsurface.dds",
      "start": 116839742,
      "end": 116861714
    }, {
      "filename": "/content/textures/water_Wave.dds",
      "start": 116861714,
      "end": 116883686
    }, {
      "filename": "/content/textures/wood/diffuse.dds",
      "start": 116883686,
      "end": 117582878
    }, {
      "filename": "/content/textures/wood/normal.dds",
      "start": 117582878,
      "end": 117932558
    }, {
      "filename": "/content/textures/wood/normaldetail.dds",
      "start": 117932558,
      "end": 118282238
    }, {
      "filename": "/content/textures/wood/specular.dds",
      "start": 118282238,
      "end": 118981430
    }, {
      "filename": "/content/textures/woodplanks/diffuse.dds",
      "start": 118981430,
      "end": 119331110
    }, {
      "filename": "/content/textures/woodplanks/normal.dds",
      "start": 119331110,
      "end": 119680790
    }, {
      "filename": "/content/textures/woodplanks/normaldetail.dds",
      "start": 119680790,
      "end": 119680966
    }, {
      "filename": "/content/textures/woodplanks/specular.dds",
      "start": 119680966,
      "end": 119855870
    }, {
      "filename": "/content/textures/wrench.png",
      "start": 119855870,
      "end": 119856480
    }, {
      "filename": "/shaders/shaders.json",
      "start": 119856480,
      "end": 119874617
    }, {
      "filename": "/shaders/shaders_glsles.pack",
      "start": 119874617,
      "end": 120348304
    }, {
      "filename": "/shaders/shaders_glsles3.pack",
      "start": 120348304,
      "end": 121105126
    } ],
    "remote_package_size": 121105126
  });
}))();

// end include: C:\Users\misa\AppData\Local\Temp\tmp83vkwgri.js
// include: C:\Users\misa\AppData\Local\Temp\tmpcycn1pcu.js
// All the pre-js content up to here must remain later on, we need to run
// it.
if ((typeof ENVIRONMENT_IS_WASM_WORKER !== "undefined" && ENVIRONMENT_IS_WASM_WORKER) || (typeof ENVIRONMENT_IS_PTHREAD !== "undefined" && ENVIRONMENT_IS_PTHREAD) || (typeof ENVIRONMENT_IS_AUDIO_WORKLET !== "undefined" && ENVIRONMENT_IS_AUDIO_WORKLET)) Module["preRun"] = [];

var necessaryPreJSTasks = Module["preRun"].slice();

// end include: C:\Users\misa\AppData\Local\Temp\tmpcycn1pcu.js
// include: C:\Users\misa\AppData\Local\Temp\tmp1s4cav2e.js
if (!Module["preRun"]) throw "Module.preRun should exist because file support used it; did a pre-js delete it?";

necessaryPreJSTasks.forEach(task => {
  if (!Module["preRun"].includes(task)) throw "All preRun tasks that exist before user pre-js code should remain after; did you replace Module or modify Module.preRun?";
});

// end include: C:\Users\misa\AppData\Local\Temp\tmp1s4cav2e.js
var programArgs = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
  throw toThrow;
};

if (ENVIRONMENT_IS_WORKER) {
  _scriptName = self.location.href;
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = "";

function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_SHELL) {} else // Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL(".", _scriptName).href;
  } catch {}
  if (!(globalThis.window || globalThis.WorkerGlobalScope)) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  {
    // include: web_or_worker_shell_read.js
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = url => {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
      };
    }
    readAsync = async url => {
      assert(!isFileURI(url), "readAsync does not work with file:// URLs");
      var response = await fetch(url, {
        credentials: "same-origin"
      });
      if (response.ok) {
        return response.arrayBuffer();
      }
      throw new Error(response.status + " : " + response.url);
    };
  }
} else {
  throw new Error("environment detection error");
}

var out = console.log.bind(console);

var err = console.error.bind(console);

var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";

var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";

var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";

var FETCHFS = "FETCHFS is no longer included by default; build with -lfetchfs.js";

var ICASEFS = "ICASEFS is no longer included by default; build with -licasefs.js";

var JSFILEFS = "JSFILEFS is no longer included by default; build with -ljsfilefs.js";

var OPFS = "OPFS is no longer included by default; build with -lopfs.js";

var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";

// perform assertions in shell.js after we set up out() and err(), as otherwise
// if an assertion fails it cannot print the message
assert(ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER || ENVIRONMENT_IS_NODE, "pthreads do not work in this environment yet (need Web Workers, or an alternative to them)");

assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time (add `node` to `-sENVIRONMENT` to enable)");

assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time (add `shell` to `-sENVIRONMENT` to enable)");

// end include: shell.js
// include: preamble.js
// === Preamble library stuff ===
// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html
var wasmBinary;

if (!globalThis.WebAssembly) {
  err("no native wasm support detected");
}

// Wasm globals
// For sending to workers.
var wasmModule;

//========================================
// Runtime essentials
//========================================
// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */ function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed" + (text ? ": " + text : ""));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.
/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */ var isFileURI = filename => filename.startsWith("file://");

// include: runtime_common.js
// include: runtime_exceptions.js
// end include: runtime_exceptions.js
// include: runtime_debug.js
var runtimeDebug = true;

// Switch to false at runtime to disable logging at the right times
// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  if (!runtimeDebug && typeof runtimeDebug !== "undefined") return;
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}

// Endianness check
((() => {
  const h16 = new Int16Array(1);
  const h8 = new Int8Array(h16.buffer);
  h16[0] = 25459;
  if (h8[0] !== 115 || h8[1] !== 99) abort("Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)");
}))();

function consumedModuleProp(prop) {
  let value = Module[prop];
  const msg = `Attempt to modify \`Module.${prop}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`;
  if (Array.isArray(value)) {
    value = new Proxy(value, {
      set(target, key, val) {
        abort(msg);
        return false;
      },
      defineProperty(target, key, descriptor) {
        abort(msg);
        return false;
      },
      deleteProperty(target, key) {
        abort(msg);
        return false;
      }
    });
  }
  Object.defineProperty(Module, prop, {
    configurable: true,
    get() {
      return value;
    },
    set() {
      abort(msg);
    }
  });
}

function makeInvalidEarlyAccess(name) {
  return () => assert(false, `call to '${name}' via reference taken before Wasm module initialization`);
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_preloadFile" || name === "FS_unlink" || name === "addRunDependency" || // The old FS has some functionality that WasmFS lacks.
  name === "FS_createLazyFile" || name === "FS_createDevice" || name === "removeRunDependency";
}

function missingLibrarySymbol(sym) {
  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (ENVIRONMENT_IS_PTHREAD) {
    return;
  }
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        let msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
        }
        abort(msg);
      }
    });
  }
}

// Unique ID of the current pthread worker (zero on non-pthread-workers
// including the main thread).
var workerID = 0;

/**
 * Override `err`/`out`/`dbg` to report thread / worker information
 */ function initWorkerLogging() {
  function getLogPrefix() {
    let t = 0;
    if (runtimeInitialized && typeof _pthread_self !== "undefined") {
      t = _pthread_self();
    }
    return `w:${workerID},t:${ptrToString(t)}:`;
  }
  // Prefix all dbg() messages with the calling thread info.
  const origDbg = dbg;
  dbg = (...args) => origDbg(getLogPrefix(), ...args);
}

initWorkerLogging();

const MAX_UINT8 = (2 ** 8) - 1;

const MAX_UINT16 = (2 ** 16) - 1;

const MAX_UINT32 = (2 ** 32) - 1;

const MAX_UINT53 = (2 ** 53) - 1;

const MAX_UINT64 = (2 ** 64) - 1;

const MIN_INT8 = -(2 ** (8 - 1));

const MIN_INT16 = -(2 ** (16 - 1));

const MIN_INT32 = -(2 ** (32 - 1));

const MIN_INT53 = -(2 ** (53 - 1));

const MIN_INT64 = -(2 ** (64 - 1));

function checkInt(value, bits, min, max) {
  assert(Number.isInteger(Number(value)), `attempt to write non-integer (${value}) into integer heap`);
  assert(value <= max, `value (${value}) too large to write as ${bits}-bit value`);
  assert(value >= min, `value (${value}) too small to write as ${bits}-bit value`);
}

const checkInt1 = value => checkInt(value, 1, 1);

const checkInt8 = value => checkInt(value, 8, MIN_INT8, MAX_UINT8);

const checkInt16 = value => checkInt(value, 16, MIN_INT16, MAX_UINT16);

const checkInt32 = value => checkInt(value, 32, MIN_INT32, MAX_UINT32);

const checkInt53 = value => checkInt(value, 53, MIN_INT53, MAX_UINT53);

const checkInt64 = value => checkInt(value, 64, MIN_INT64, MAX_UINT64);

// end include: runtime_debug.js
// include: runtime_stack_check.js
const stackCookie1 = 34821223;

const stackCookie2 = 2310721022;

// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  let max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  (growMemViews(), HEAPU32)[((max) >> 2)] = stackCookie1;
  checkInt32(stackCookie1);
  (growMemViews(), HEAPU32)[(((max) + (4)) >> 2)] = stackCookie2;
  checkInt32(stackCookie2);
  // Also test the global address 0 for integrity.
  (growMemViews(), HEAPU32)[((0) >> 2)] = 1668509029;
  checkInt32(1668509029);
}

function u32ToHexString(num) {
  return "0x" + (num >>> 0).toString(16).padStart(8, "0");
}

function checkStackCookie() {
  if (ABORT) return;
  let max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  const val1 = (growMemViews(), HEAPU32)[((max) >> 2)];
  const val2 = (growMemViews(), HEAPU32)[(((max) + (4)) >> 2)];
  if (val1 != stackCookie1 || val2 != stackCookie2) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords ${u32ToHexString(stackCookie2)} and ${u32ToHexString(stackCookie1)}, but received ${u32ToHexString(val2)} ${u32ToHexString(val1)}`);
  }
  // Also test the global address 0 for integrity.
  if ((growMemViews(), HEAPU32)[((0) >> 2)] != 1668509029) {
    abort("Runtime error: The application has corrupted its heap memory area (address zero)!");
  }
}

// end include: runtime_stack_check.js
// Support for growable heap + pthreads, where the buffer may change, so JS views
// must be updated.
function growMemViews() {
  // `updateMemoryViews` updates all the views simultaneously, so it's enough to check any of them.
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
}

// Memory management
var runtimeInitialized = false;

// When ALLOW_MEMORY_GROWTH is enabled, the conversion from Wasm
// memory to ArrayBuffer requires some additional logic.
function getMemoryBuffer() {
  return wasmMemory.buffer;
}

function updateMemoryViews() {
  // If we already have a heap that is resizeable/growable buffer we don't
  // need to do anything in updateMemoryViews.
  if (HEAP8?.buffer?.growable) return;
  var b = getMemoryBuffer();
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  Module["HEAP32"] = HEAP32 = new Int32Array(b);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
  HEAP64 = new BigInt64Array(b);
  HEAPU64 = new BigUint64Array(b);
}

// In non-standalone/normal mode, we create the memory here.
// include: runtime_init_memory.js
// Create the wasm memory. (Note: this only applies if IMPORTED_MEMORY is defined)
function initMemory() {
  if ((ENVIRONMENT_IS_PTHREAD)) {
    return;
  }
  {
    var INITIAL_MEMORY = 268435456;
    assert(INITIAL_MEMORY >= 8388608, `INITIAL_MEMORY should be larger than STACK_SIZE, was ${INITIAL_MEMORY}! (STACK_SIZE=8388608)`);
    /** @suppress {checkTypes} */ wasmMemory = new WebAssembly.Memory({
      "initial": INITIAL_MEMORY / 65536,
      // In theory we should not need to emit the maximum if we want "unlimited"
      // or 4GB of memory, but VMs error on that atm, see
      // https://github.com/emscripten-core/emscripten/issues/14130
      // And in the pthreads case we definitely need to emit a maximum. So
      // always emit one.
      "maximum": 32768,
      "shared": true
    });
  }
  updateMemoryViews();
}

// end include: runtime_init_memory.js
// include: memoryprofiler.js
// end include: memoryprofiler.js
// end include: runtime_common.js
assert(globalThis.Int32Array && globalThis.Float64Array && Int32Array.prototype.subarray && Int32Array.prototype.set, "JS engine does not provide full typed array support");

function preRun() {
  assert(!ENVIRONMENT_IS_PTHREAD);
  // PThreads reuse the runtime from the main thread.
  var preRun = Module["preRun"];
  if (preRun) {
    if (typeof preRun === "function") preRun = [ preRun ];
    onPreRuns.push(...preRun);
  }
  consumedModuleProp("preRun");
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;
  if (ENVIRONMENT_IS_PTHREAD) return;
  setStackLimits();
  checkStackCookie();
  // Begin ATINITS hooks
  if (!Module["noFSInit"] && !FS.initialized) FS.init();
  TTY.init();
  // End ATINITS hooks
  wasmExports["__wasm_call_ctors"]();
  // Begin ATPOSTCTORS hooks
  FS.ignorePermissions = false;
  // End ATPOSTCTORS hooks
  checkStackCookie();
}

function postRun() {
  checkStackCookie();
  var postRun = Module["postRun"];
  if (postRun) {
    if (typeof postRun === "function") postRun = [ postRun ];
    onPostRuns.push(...postRun);
  }
  consumedModuleProp("postRun");
  // Begin ATPOSTRUNS hooks
  callRuntimeCallbacks(onPostRuns);
}

/**
 * @param {string|number=} what
 */ function abort(what) {
  Module["onAbort"]?.(what);
  what = `Aborted(${what})`;
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);
  ABORT = true;
  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.
  // See above, in the meantime, we resort to wasm code for trapping.
  // In case abort() is called before the module is initialized, wasmExports
  // and its exported '__trap' function is not available, in which case we throw
  // a RuntimeError.
  // We trap instead of throwing RuntimeError to prevent infinite-looping in
  // Wasm EH code (because RuntimeError is considered as a foreign exception and
  // caught by 'catch_all'), but in case throwing RuntimeError is fine because
  // the module has not even been instantiated, even less running.
  if (runtimeInitialized) {
    ___trap();
  }
  throw new WebAssembly.RuntimeError(what);
}

function createExportWrapper(name, func, nargs) {
  assert(func);
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return func(...args);
  };
}

var wasmBinaryFile;

function findWasmBinary() {
  return locateFile("rblx2016.wasm");
}

function getBinarySync(file) {
  if (readBinary) {
    return readBinary(file);
  }
  // Throwing a plain string here, even though it not normally advisable since
  // this gets turning into an `abort` in instantiateArrayBuffer.
  throw "both async and sync fetching of the wasm failed";
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      // Await so a rejection is caught and falls back to getBinarySync.
      return await readAsync(binaryFile);
    } catch {}
  }
  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);
    // Warn on some common problems.
    if (isFileURI(binaryFile)) {
      err(`warning: Loading from a file URI (${binaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary) {
    try {
      var response = fetch(binaryFile, {
        credentials: "same-origin"
      });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err("falling back to ArrayBuffer instantiation");
    }
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  assignWasmImports();
  // prepare imports
  var imports = {
    "env": wasmImports,
    "wasi_snapshot_preview1": wasmImports
  };
  return imports;
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;
    registerTLSInit(wasmExports["_emscripten_tls_init"]);
    assignWasmExports(wasmExports);
    // We now have the Wasm module loaded up, keep a reference to the compiled module so we can post it to the workers.
    wasmModule = module;
    return wasmExports;
  }
  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
    trueModule = null;
    return receiveInstance(result["instance"], result["module"]);
  }
  var info = getWasmImports();
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  var instantiateWasm = Module["instantiateWasm"];
  if (instantiateWasm) {
    return new Promise(resolve => {
      try {
        instantiateWasm(info, (inst, mod) => resolve(receiveInstance(inst, mod)));
      } catch (e) {
        err(`Module.instantiateWasm callback failed with error: ${e}`);
        throw e;
      }
    });
  }
  if ((ENVIRONMENT_IS_PTHREAD)) {
    // Instantiate from the module that was received via postMessage from
    // the main thread. We can just use sync instantiation in the worker.
    assert(wasmModule, "wasmModule should have been received via postMessage");
    var instance = new WebAssembly.Instance(wasmModule, getWasmImports());
    return receiveInstance(instance, wasmModule);
  }
  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}

// end include: preamble.js
// Begin JS library code
const CMD_CALL_HANDLER = 9;

const CMD_CHECK_MAILBOX = 4;

const CMD_LOAD = 1;

const CMD_LOADED = 3;

const CMD_RUN = 2;

class ExitStatus {
  name="ExitStatus";
  constructor(status) {
    this.message = `Program terminated with exit(${status})`;
    this.status = status;
  }
}

/** @type {!Int32Array} */ var HEAP32;

/** @type {!Int8Array} */ var HEAP8;

/** @type {!Uint32Array} */ var HEAPU32;

const CMD_CLEANUP_THREAD = 6;

const CMD_SPAWN_THREAD = 5;

var callRuntimeCallbacks = callbacks => {
  while (callbacks.length > 0) {
    // Pass the module as the first argument.
    callbacks.shift()(Module);
  }
};

var onPreRuns = [];

var addOnPreRun = cb => onPreRuns.push(cb);

var dependenciesPromise = null;

var dependenciesPromiseResolve = null;

var resolveRunDependencies = async () => dependenciesPromise;

var runDependencies = 0;

var runDependencyTracking = {};

var runDependencyWatcher = null;

var removeRunDependency = id => {
  runDependencies--;
  Module["monitorRunDependencies"]?.(runDependencies);
  assert(id, "removeRunDependency requires an ID");
  assert(runDependencyTracking[id]);
  delete runDependencyTracking[id];
  if (!runDependencies) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    dependenciesPromiseResolve();
  }
};

var addRunDependency = id => {
  if (!runDependencies) {
    dependenciesPromise = new Promise(resolve => dependenciesPromiseResolve = resolve);
  }
  runDependencies++;
  Module["monitorRunDependencies"]?.(runDependencies);
  assert(id, "addRunDependency requires an ID");
  assert(!runDependencyTracking[id]);
  runDependencyTracking[id] = 1;
  if (!runDependencyWatcher && globalThis.setInterval) {
    // Check for missing dependencies every few seconds
    runDependencyWatcher = setInterval(() => {
      if (ABORT) {
        clearInterval(runDependencyWatcher);
        runDependencyWatcher = null;
        return;
      }
      var shown = false;
      for (var dep in runDependencyTracking) {
        if (!shown) {
          shown = true;
          err("still waiting on run dependencies:");
        }
        err(`dependency: ${dep}`);
      }
      if (shown) {
        err("(end of list)");
      }
    }, 1e4);
  }
};

var handleException = e => {
  // Certain exception types we do not treat as errors since they are used for
  // internal control flow.
  // 1. ExitStatus, which is thrown by exit()
  // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
  //    that wish to return to JS event loop.
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  }
  checkStackCookie();
  if (e instanceof WebAssembly.RuntimeError) {
    if (_emscripten_stack_get_current() <= 0) {
      err("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 8388608)");
    }
  }
  quit_(1, e);
};

var runtimeKeepaliveCounter = 0;

var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;

/** not-@type {!BigInt64Array} */ var HEAP64;

/** @type {!Float64Array} */ var HEAPF64;

var stackAlloc = sz => __emscripten_stack_alloc(sz);

var stackRestore = val => __emscripten_stack_restore(val);

var stackSave = () => _emscripten_stack_get_current();

/** @type{function(number, (number|boolean), ...number)} */ var proxyToMainThread = (funcIndex, emAsmAddr, proxyMode, ...callArgs) => {
  // EM_ASM proxying is done by passing a pointer to the address of the EM_ASM
  // content as `emAsmAddr`.  JS library proxying is done by passing an index
  // into `proxiedJSCallArgs` as `funcIndex`. If `emAsmAddr` is non-zero then
  // `funcIndex` will be ignored.
  // Additional arguments are passed after the first three are the actual
  // function arguments.
  // The serialization buffer contains the number of call params, and then
  // all the args here.
  // We also pass 'proxyMode' to C separately, since C needs to look at it.
  // Allocate a buffer (on the stack), which will be copied if necessary by
  // the C code.
  // First passed parameter specifies the number of arguments to the function.
  // When BigInt support is enabled, we must handle types in a more complex
  // way, detecting at runtime if a value is a BigInt or not (as we have no
  // type info here). To do that, add a "prefix" before each value that
  // indicates if it is a BigInt, which effectively doubles the number of
  // values we serialize for proxying. TODO: pack this?
  var bufSize = 8 * callArgs.length * 2;
  var sp = stackSave();
  var args = stackAlloc(bufSize);
  var b = ((args) >> 3);
  for (var arg of callArgs) {
    if (typeof arg === "bigint") {
      // The prefix is non-zero to indicate a bigint.
      (growMemViews(), HEAP64)[b++] = 1n;
      (growMemViews(), HEAP64)[b++] = arg;
    } else {
      // The prefix is zero to indicate a JS Number.
      (growMemViews(), HEAP64)[b++] = 0n;
      (growMemViews(), HEAPF64)[b++] = arg;
    }
  }
  var rtn = __emscripten_run_js_on_main_thread(funcIndex, emAsmAddr, bufSize, args, proxyMode);
  stackRestore(sp);
  return rtn;
};

function exitOnMainThread(returnCode) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(0, 0, 0, returnCode);
  _exit(returnCode);
}

function _proc_exit(code) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(1, 0, 1, code);
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    PThread.terminateAllThreads();
    Module["onExit"]?.(code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
}

/** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
  EXITSTATUS = status;
  checkUnflushedContent();
  if (ENVIRONMENT_IS_PTHREAD) {
    // implicit exit can never happen on a pthread
    assert(!implicit);
    // When running in a pthread we propagate the exit back to the main thread
    // where it can decide if the whole process should be shut down or not.
    // The pthread may have decided not to exit its own runtime, for example
    // because it runs a main loop, but that doesn't affect the main thread.
    exitOnMainThread(status);
    throw "unwind";
  }
  // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
  if (keepRuntimeAlive() && !implicit) {
    var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
    err(msg);
  }
  _proc_exit(status);
};

var maybeExit = () => {
  if (!keepRuntimeAlive()) {
    try {
      if (ENVIRONMENT_IS_PTHREAD) {
        // exit the current thread, but only if there is one active.
        // TODO(https://github.com/emscripten-core/emscripten/issues/25076):
        // Unify this check with the runtimeExited check above
        if (_pthread_self()) __emscripten_thread_exit(EXITSTATUS);
        return;
      }
      _exit(EXITSTATUS);
    } catch (e) {
      handleException(e);
    }
  }
};

var callUserCallback = (func, ...args) => {
  if (ABORT) {
    err("user callback triggered after runtime exited or application aborted.  Ignoring.");
    return;
  }
  try {
    return func(...args);
  } catch (e) {
    handleException(e);
  } finally {
    maybeExit();
  }
};

var waitAsyncPolyfilled = !Atomics.waitAsync;

var __emscripten_thread_mailbox_await = pthread_ptr => {
  if (!waitAsyncPolyfilled) {
    // Wait on the pthread's initial self-pointer field because it is easy and
    // safe to access from sending threads that need to notify the waiting
    // thread.
    // Note: Under wasm64 only the low 32-bit of the pthread_ptr are
    // read/compared here, but we don't actually care about the exact values
    // here as long as they match.
    var wait = Atomics.waitAsync((growMemViews(), HEAP32), ((pthread_ptr) >> 2), pthread_ptr);
    assert(wait.async);
    wait.value.then(checkMailbox);
    var waitingAsync = pthread_ptr + 112;
    Atomics.store((growMemViews(), HEAP32), ((waitingAsync) >> 2), 1);
  }
};

var checkMailbox = () => {
  // checkMailbox can be called after the pthread has shut down. See
  // Pthread.terminateRuntime().
  // In this case we return silently without re-registering using waitAsync.
  // Perhaps there is a more universal way we can detect runtime has exited.
  // TODO(https://github.com/emscripten-core/emscripten/issues/25076)
  var pthread_ptr = _pthread_self();
  if (!pthread_ptr) return;
  callUserCallback(() => {
    // If we are using Atomics.waitAsync as our notification mechanism, wait
    // for a notification before processing the mailbox to avoid missing any
    // work that could otherwise arrive after we've finished processing the
    // mailbox and before we're ready for the next notification.
    __emscripten_thread_mailbox_await(pthread_ptr);
    __emscripten_check_mailbox();
  });
};

var cleanupThread = pthread_ptr => {
  assert(!ENVIRONMENT_IS_PTHREAD, "cleanupThread() should only be called from the main thread");
  assert(pthread_ptr, "null pthread_ptr passed to cleanupThread");
  var worker = PThread.pthreads[pthread_ptr];
  assert(worker);
  PThread.returnWorkerToPool(worker);
};

function ptrToString(ptr) {
  assert(typeof ptr === "number", `ptrToString expects a number, got ${typeof ptr}`);
  // Convert to 32-bit unsigned value
  ptr >>>= 0;
  return "0x" + ptr.toString(16).padStart(8, "0");
}

var spawnThread = threadParams => {
  assert(!ENVIRONMENT_IS_PTHREAD, "spawnThread() should only be called from the main thread");
  assert(threadParams.pthread_ptr, "spawnThread called with null pthread ptr");
  var worker = PThread.getNewWorker();
  if (!worker) {
    // No available workers in the PThread pool.
    return 6;
  }
  assert(!worker.pthread_ptr);
  // Add to pthreads map
  PThread.pthreads[threadParams.pthread_ptr] = worker;
  worker.pthread_ptr = threadParams.pthread_ptr;
  var msg = {
    cmd: CMD_RUN,
    start_routine: threadParams.startRoutine,
    arg: threadParams.arg,
    pthread_ptr: threadParams.pthread_ptr
  };
  // Ask the worker to start executing its pthread entry point function.
  worker.postMessage(msg, threadParams.transferList);
  return 0;
};

var terminateWorker = worker => {
  worker.terminate();
  // terminate() can be asynchronous, so in theory the worker can continue
  // to run for some amount of time after termination.  However from our POV
  // the worker is now dead and we don't want to hear from it again, so we stub
  // out its message handler here.  This avoids having to check in each of
  // the onmessage handlers if the message was coming from a valid worker.
  worker.onmessage = e => {
    var cmd = e.data.cmd;
    err(`received "${cmd}" command from terminated worker: ${worker.workerID}`);
  };
};

var wasmMemory;

var PThread = {
  unusedWorkers: [],
  tlsInitFunctions: [],
  pthreads: {},
  nextWorkerID: 1,
  init() {
    if ((!(ENVIRONMENT_IS_PTHREAD))) {
      PThread.initMainThread();
    }
  },
  initMainThread() {
    var pthreadPoolSize = 8;
    // Start loading up the Worker pool, if requested.
    while (pthreadPoolSize--) {
      PThread.allocateUnusedWorker();
    }
    // MINIMAL_RUNTIME takes care of calling loadWasmModuleToAllWorkers
    // in postamble_minimal.js
    addOnPreRun(async () => {
      var pthreadPoolReady = PThread.loadWasmModuleToAllWorkers();
      addRunDependency("loading-workers");
      await pthreadPoolReady;
      removeRunDependency("loading-workers");
    });
  },
  terminateAllThreads: () => {
    assert(!ENVIRONMENT_IS_PTHREAD, "terminateAllThreads() should only be called from the main thread");
    // Attempt to kill all workers.  Sadly (at least on the web) there is no
    // way to terminate a worker synchronously, or to be notified when a
    // worker is actually terminated.  This means there is some risk that
    // pthreads will continue to be executing after `worker.terminate` has
    // returned.  For this reason, we don't call `returnWorkerToPool` here or
    // free the underlying pthread data structures.
    for (var worker of Object.values(PThread.pthreads)) {
      terminateWorker(worker);
    }
    for (var worker of PThread.unusedWorkers) {
      terminateWorker(worker);
    }
    PThread.unusedWorkers = [];
    PThread.pthreads = {};
  },
  clearMailboxAwait: pthread_ptr => {
    if (!waitAsyncPolyfilled) {
      Atomics.notify((growMemViews(), HEAP32), ((pthread_ptr) >> 2));
    }
  },
  terminateRuntime: () => {
    assert(!ENVIRONMENT_IS_PTHREAD, "terminateRuntime() should only be called from the main thread");
    PThread.terminateAllThreads();
    var pthread_ptr = _pthread_self();
    ___set_thread_state(0, 0, 0, 1);
    PThread.clearMailboxAwait(pthread_ptr);
  },
  returnWorkerToPool: worker => {
    // We don't want to run main thread queued calls here, since we are doing
    // some operations that leave the worker queue in an invalid state until
    // we are completely done (it would be bad if free() ends up calling a
    // queued pthread_create which looks at the global data structures we are
    // modifying). To achieve that, defer the free() until the very end, when
    // we are all done.
    var pthread_ptr = worker.pthread_ptr;
    delete PThread.pthreads[pthread_ptr];
    // Note: worker is intentionally not terminated so the pool can
    // dynamically grow.
    PThread.unusedWorkers.push(worker);
    // Not a running Worker anymore
    // Detach the worker from the pthread object, and return it to the
    // worker pool as an unused worker.
    worker.pthread_ptr = 0;
    // Clear any pending waitAsync waiter armed on this thread's struct
    // BEFORE freeing the memory so that memory recycled by malloc in another
    // thread will not have a window where a stale async waiter is still active.
    PThread.clearMailboxAwait(pthread_ptr);
    // Finally, free the underlying (and now-unused) pthread structure in
    // linear memory.
    __emscripten_thread_free_data(pthread_ptr);
  },
  threadInitTLS() {
    // Call thread init functions (these are the _emscripten_tls_init for each
    // module loaded.
    PThread.tlsInitFunctions.forEach(f => f());
  },
  loadWasmModuleToWorker: worker => new Promise(onFinishedLoading => {
    worker.onmessage = e => {
      var d = e.data;
      var cmd = d.cmd;
      // If this message is intended to a recipient that is not the main
      // thread, forward it to the target thread. This is currently only
      // used by `CMD_CHECK_MAILBOX`.
      if (d.targetThread && d.targetThread != _pthread_self()) {
        var targetWorker = PThread.pthreads[d.targetThread];
        if (!targetWorker) err(`worker sent message (${cmd}) to pthread (${d.targetThread}) that no longer exists`);
        targetWorker?.postMessage(d);
        return;
      }
      if (d === "setimmediate" || d === "_si") {
        // Worker wants to postMessage() to itself to implement setImmediate()
        // emulation.
        worker.postMessage(d);
        return;
      }
      switch (cmd) {
       case CMD_CHECK_MAILBOX:
        checkMailbox();
        break;

       case CMD_SPAWN_THREAD:
        spawnThread(d);
        break;

       case CMD_CLEANUP_THREAD:
        // cleanupThread needs to be run via callUserCallback since it calls
        // back into user code to free thread data. Without this it's possible
        // the unwind or ExitStatus exception could escape here.
        callUserCallback(() => cleanupThread(d.thread));
        break;

       case CMD_LOADED:
        onFinishedLoading(worker);
        break;

       case CMD_CALL_HANDLER:
        Module[d.handler](...d.args);
        break;

       default:
        // The received message looks like something that should be handled by this message
        // handler, (since there is a e.data.cmd field present), but is not one of the
        // recognized commands:
        if (cmd) err(`worker sent an unknown command ${cmd}`);
      }
    };
    worker.onerror = e => {
      var message = "worker sent an error!";
      if (worker.pthread_ptr) {
        message = `Pthread ${ptrToString(worker.pthread_ptr)} sent an error!`;
      }
      err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);
      throw e;
    };
    assert(wasmMemory instanceof WebAssembly.Memory, "wasmMemory should have been loaded by now");
    assert(wasmModule instanceof WebAssembly.Module, "wasmModule should have been loaded by now");
    // When running on a pthread, none of the incoming parameters on the module
    // object are present. Proxy known handlers back to the main thread if specified.
    var handlers = [];
    var knownHandlers = [ "onExit", "onAbort", "print", "printErr" ];
    for (var handler of knownHandlers) {
      if (Module.propertyIsEnumerable(handler)) {
        handlers.push(handler);
      }
    }
    // Ask the new worker to load up the Emscripten-compiled page. This is a heavy operation.
    worker.postMessage({
      cmd: CMD_LOAD,
      handlers,
      wasmMemory,
      wasmModule,
      workerID: worker.workerID
    });
  }),
  async loadWasmModuleToAllWorkers() {
    // Instantiation is synchronous in pthreads.
    if (ENVIRONMENT_IS_PTHREAD) {
      return;
    }
    let pthreadPoolReady = Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));
    return pthreadPoolReady;
  },
  allocateUnusedWorker() {
    var worker;
    var pthreadMainJs = _scriptName;
    worker = new Worker(pthreadMainJs, {
      // This is the way that we signal to the Web Worker that it is hosting
      // a pthread.
      "name": "em-pthread-" + PThread.nextWorkerID
    });
    worker.workerID = PThread.nextWorkerID++;
    PThread.unusedWorkers.push(worker);
    return worker;
  },
  getNewWorker() {
    if (PThread.unusedWorkers.length == 0) {
      // PTHREAD_POOL_SIZE_STRICT should show a warning and, if set to level `2`, return from the function.
      var newWorker = PThread.allocateUnusedWorker();
      PThread.loadWasmModuleToWorker(newWorker);
    }
    return PThread.unusedWorkers.pop();
  }
};

var onPostRuns = [];

var addOnPostRun = cb => onPostRuns.push(cb);

var setStackLimits = () => {
  var stackLow = _emscripten_stack_get_base();
  var stackHigh = _emscripten_stack_get_end();
  ___set_stack_limits(stackLow, stackHigh);
};

function establishStackSpace(pthread_ptr) {
  var stackHigh = (growMemViews(), HEAPU32)[(((pthread_ptr) + (48)) >> 2)];
  var stackSize = (growMemViews(), HEAPU32)[(((pthread_ptr) + (52)) >> 2)];
  var stackLow = stackHigh - stackSize;
  assert(stackHigh != 0);
  assert(stackLow != 0);
  assert(stackHigh > stackLow, "stackHigh must be higher then stackLow");
  // Set stack limits used by `emscripten/stack.h` function.  These limits are
  // cached in wasm-side globals to make checks as fast as possible.
  _emscripten_stack_set_limits(stackHigh, stackLow);
  setStackLimits();
  // Call inside wasm module to set up the stack frame for this pthread in wasm module scope
  stackRestore(stackHigh);
  // Write the stack cookie last, after we have set up the proper bounds and
  // current position of the stack.
  writeStackCookie();
}

var wasmTableMirror = [];

var getWasmTableEntry = funcPtr => {
  var func = wasmTableMirror[funcPtr];
  if (!func) {
    /** @suppress {checkTypes} */ wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
  }
  /** @suppress {checkTypes} */ assert(wasmTable.get(funcPtr) == func, "table mirror is out of date");
  return func;
};

var invokeEntryPoint = (ptr, arg) => {
  // An old thread on this worker may have been canceled without returning the
  // `runtimeKeepaliveCounter` to zero. Reset it now so the new thread won't
  // be affected.
  runtimeKeepaliveCounter = 0;
  // Same for noExitRuntime.  The default for pthreads should always be false
  // otherwise pthreads would never complete and attempts to pthread_join to
  // them would block forever.
  // pthreads can still choose to set `noExitRuntime` explicitly, or
  // call emscripten_unwind_to_js_event_loop to extend their lifetime beyond
  // their main function.  See comment in src/runtime_pthread.js for more.
  noExitRuntime = 0;
  // pthread entry points are always of signature 'void *ThreadMain(void *arg)'
  // Native codebases sometimes spawn threads with other thread entry point
  // signatures, such as void ThreadMain(void *arg), void *ThreadMain(), or
  // void ThreadMain().  That is not acceptable per C/C++ specification, but
  // x86 compiler ABI extensions enable that to work. If you find the
  // following line to crash, either change the signature to "proper" void
  // *ThreadMain(void *arg) form, or try linking with the Emscripten linker
  // flag -sEMULATE_FUNCTION_POINTER_CASTS to add in emulation for this x86
  // ABI extension.
  var result = getWasmTableEntry(ptr)(arg);
  checkStackCookie();
  function finish(result) {
    // In MINIMAL_RUNTIME the noExitRuntime concept does not apply to
    // pthreads. To exit a pthread with live runtime, use the function
    // emscripten_unwind_to_js_event_loop() in the pthread body.
    if (keepRuntimeAlive()) {
      EXITSTATUS = result;
      return;
    }
    __emscripten_thread_exit(result);
  }
  finish(result);
};

var noExitRuntime = true;

var registerTLSInit = tlsInitFunc => PThread.tlsInitFunctions.push(tlsInitFunc);

var warnOnce = text => {
  warnOnce.shown ||= {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
};

/** @type {!Uint8Array} */ var HEAPU8;

var UTF8Decoder = globalThis.TextDecoder && new TextDecoder;

/**
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul
   * @return {number}
   */ var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
  var maxIdx = idx + maxBytesToRead;
  if (ignoreNul) return maxIdx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on
  // null terminator by itself.
  // As a tiny code save trick, compare idx against maxIdx using a negation,
  // so that maxBytesToRead=undefined/NaN means Infinity.
  while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
  return idx;
};

/**
   * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
   * array that contains uint8 values, returns a copy of that string as a
   * Javascript String object.
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number=} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */ var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.buffer instanceof ArrayBuffer ? heapOrArray.subarray(idx, endPtr) : heapOrArray.slice(idx, endPtr));
  }
  var str = "";
  while (idx < endPtr) {
    // For UTF8 byte structure, see:
    // http://en.wikipedia.org/wiki/UTF-8#Description
    // https://www.ietf.org/rfc/rfc2279.txt
    // https://tools.ietf.org/html/rfc3629
    var u0 = heapOrArray[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode(((u0 & 31) << 6) | u1);
      continue;
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      if ((u0 & 248) != 240) warnOnce(`Invalid UTF-8 leading byte ${ptrToString(u0)} encountered when deserializing a UTF-8 string in wasm memory to a JS string!`);
      u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
    }
  }
  return str;
};

/**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first 0 byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index.
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */ var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
  assert(typeof ptr === "number", `UTF8ToString expects a number (got ${typeof ptr})`);
  return ptr ? UTF8ArrayToString((growMemViews(), HEAPU8), ptr, maxBytesToRead, ignoreNul) : "";
};

var ___assert_fail = (condition, filename, line, func) => abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);

var ___handle_stack_overflow = requested => {
  var base = _emscripten_stack_get_base();
  var end = _emscripten_stack_get_end();
  abort(`stack overflow (Attempt to set SP to ${ptrToString(requested)}` + `, with stack limits [${ptrToString(end)} - ${ptrToString(base)}` + "]). If you require more stack space build with -sSTACK_SIZE=<bytes>");
};

function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(2, 0, 1, pthread_ptr, attr, startRoutine, arg);
  return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg);
}

var _emscripten_has_threading_support = () => !!globalThis.SharedArrayBuffer;

var ___pthread_create_js = (pthread_ptr, attr, startRoutine, arg) => {
  if (!_emscripten_has_threading_support()) {
    dbg("pthread_create: environment does not support SharedArrayBuffer, pthreads are not available");
    return 6;
  }
  // List of JS objects that will transfer ownership to the Worker hosting the thread
  var transferList = [];
  var error = 0;
  // Synchronously proxy the thread creation to main thread if possible. If we
  // need to transfer ownership of objects, then proxy asynchronously via
  // postMessage.
  if (ENVIRONMENT_IS_PTHREAD && (!transferList.length || error)) {
    return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
  }
  // If on the main thread, and accessing Canvas/OffscreenCanvas failed, abort
  // with the detected error.
  if (error) return error;
  var threadParams = {
    startRoutine,
    pthread_ptr,
    arg,
    transferList
  };
  if (ENVIRONMENT_IS_PTHREAD) {
    // The prepopulated pool of web workers that can host pthreads is stored
    // in the main JS thread. Therefore if a pthread is attempting to spawn a
    // new thread, the thread creation must be deferred to the main JS thread.
    threadParams.cmd = CMD_SPAWN_THREAD;
    postMessage(threadParams, transferList);
    // When we defer thread creation this way, we have no way to detect thread
    // creation synchronously today, so we have to assume success and return 0.
    return 0;
  }
  // We are the main thread, so we have the pthread warmup pool in this
  // thread and can fire off JS thread creation directly ourselves.
  return spawnThread(threadParams);
};

var ERRNO_CODES = {
  "EPERM": 63,
  "ENOENT": 44,
  "ESRCH": 71,
  "EINTR": 27,
  "EIO": 29,
  "ENXIO": 60,
  "E2BIG": 1,
  "ENOEXEC": 45,
  "EBADF": 8,
  "ECHILD": 12,
  "EAGAIN": 6,
  "EWOULDBLOCK": 6,
  "ENOMEM": 48,
  "EACCES": 2,
  "EFAULT": 21,
  "ENOTBLK": 105,
  "EBUSY": 10,
  "EEXIST": 20,
  "EXDEV": 75,
  "ENODEV": 43,
  "ENOTDIR": 54,
  "EISDIR": 31,
  "EINVAL": 28,
  "ENFILE": 41,
  "EMFILE": 33,
  "ENOTTY": 59,
  "ETXTBSY": 74,
  "EFBIG": 22,
  "ENOSPC": 51,
  "ESPIPE": 70,
  "EROFS": 69,
  "EMLINK": 34,
  "EPIPE": 64,
  "EDOM": 18,
  "ERANGE": 68,
  "ENOMSG": 49,
  "EIDRM": 24,
  "ECHRNG": 106,
  "EL2NSYNC": 156,
  "EL3HLT": 107,
  "EL3RST": 108,
  "ELNRNG": 109,
  "EUNATCH": 110,
  "ENOCSI": 111,
  "EL2HLT": 112,
  "EDEADLK": 16,
  "ENOLCK": 46,
  "EBADE": 113,
  "EBADR": 114,
  "EXFULL": 115,
  "ENOANO": 104,
  "EBADRQC": 103,
  "EBADSLT": 102,
  "EDEADLOCK": 16,
  "EBFONT": 101,
  "ENOSTR": 100,
  "ENODATA": 116,
  "ETIME": 117,
  "ENOSR": 118,
  "ENONET": 119,
  "ENOPKG": 120,
  "EREMOTE": 121,
  "ENOLINK": 47,
  "EADV": 122,
  "ESRMNT": 123,
  "ECOMM": 124,
  "EPROTO": 65,
  "EMULTIHOP": 36,
  "EDOTDOT": 125,
  "EBADMSG": 9,
  "ENOTUNIQ": 126,
  "EBADFD": 127,
  "EREMCHG": 128,
  "ELIBACC": 129,
  "ELIBBAD": 130,
  "ELIBSCN": 131,
  "ELIBMAX": 132,
  "ELIBEXEC": 133,
  "ENOSYS": 52,
  "ENOTEMPTY": 55,
  "ENAMETOOLONG": 37,
  "ELOOP": 32,
  "EOPNOTSUPP": 138,
  "EPFNOSUPPORT": 139,
  "ECONNRESET": 15,
  "ENOBUFS": 42,
  "EAFNOSUPPORT": 5,
  "EPROTOTYPE": 67,
  "ENOTSOCK": 57,
  "ENOPROTOOPT": 50,
  "ESHUTDOWN": 140,
  "ECONNREFUSED": 14,
  "EADDRINUSE": 3,
  "ECONNABORTED": 13,
  "ENETUNREACH": 40,
  "ENETDOWN": 38,
  "ETIMEDOUT": 73,
  "EHOSTDOWN": 142,
  "EHOSTUNREACH": 23,
  "EINPROGRESS": 26,
  "EALREADY": 7,
  "EDESTADDRREQ": 17,
  "EMSGSIZE": 35,
  "EPROTONOSUPPORT": 66,
  "ESOCKTNOSUPPORT": 137,
  "EADDRNOTAVAIL": 4,
  "ENETRESET": 39,
  "EISCONN": 30,
  "ENOTCONN": 53,
  "ETOOMANYREFS": 141,
  "EUSERS": 136,
  "EDQUOT": 19,
  "ESTALE": 72,
  "ENOTSUP": 138,
  "ENOMEDIUM": 148,
  "EILSEQ": 25,
  "EOVERFLOW": 61,
  "ECANCELED": 11,
  "ENOTRECOVERABLE": 56,
  "EOWNERDEAD": 62,
  "ESTRPIPE": 135
};

const FS_MAX_OPEN_FDS = 4096;

var FS_createDataFile = (...args) => FS.createDataFile(...args);

var preloadPlugins = [];

var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
  // Ensure plugins are ready.
  if (typeof Browser !== "undefined") Browser.init();
  for (var plugin of preloadPlugins) {
    if (plugin["canHandle"](fullname)) {
      assert(plugin["handle"].constructor.name === "AsyncFunction", "Filesystem plugin handlers must be async functions (See #24914)");
      return plugin["handle"](byteArray, fullname);
    }
  }
  // If no plugin handled this file then return the original/unmodified
  // byteArray.
  return byteArray;
};

var PATH = {
  isAbs: path => path.charAt(0) === "/",
  splitPath: filename => {
    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    return splitPathRe.exec(filename).slice(1);
  },
  normalizeArray: (parts, allowAboveRoot) => {
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
        parts.splice(i, 1);
      } else if (last === "..") {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }
    // if the path is allowed to go above the root, restore leading ..s
    if (allowAboveRoot) {
      for (;up; up--) {
        parts.unshift("..");
      }
    }
    return parts;
  },
  normalize: path => {
    var isAbsolute = PATH.isAbs(path), trailingSlash = path.slice(-1) === "/";
    // Normalize the path
    path = PATH.normalizeArray(path.split("/").filter(p => !!p), !isAbsolute).join("/");
    if (!path && !isAbsolute) {
      path = ".";
    }
    if (path && trailingSlash) {
      path += "/";
    }
    return (isAbsolute ? "/" : "") + path;
  },
  dirname: path => {
    var result = PATH.splitPath(path), root = result[0], dir = result[1];
    if (!root && !dir) {
      // No dirname whatsoever
      return ".";
    }
    if (dir) {
      // It has a dirname, strip trailing slash
      dir = dir.slice(0, -1);
    }
    return root + dir;
  },
  basename: path => path && path.match(/([^\/]+|\/)\/*$/)[1],
  join: (...paths) => PATH.normalize(paths.join("/")),
  join2: (l, r) => PATH.normalize(l + "/" + r)
};

var PATH_FS = {
  resolve: (...args) => {
    var resolvedPath = "", resolvedAbsolute = false;
    for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = (i >= 0) ? args[i] : FS.cwd();
      // Skip empty and invalid entries
      if (typeof path !== "string") {
        throw new TypeError("Arguments to path.resolve must be strings");
      } else if (!path) {
        return "";
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = PATH.isAbs(path);
    }
    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)
    resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(p => !!p), !resolvedAbsolute).join("/");
    return ((resolvedAbsolute ? "/" : "") + resolvedPath) || ".";
  },
  relative: (from, to) => {
    from = PATH_FS.resolve(from).slice(1);
    to = PATH_FS.resolve(to).slice(1);
    function trim(arr) {
      var start = 0;
      for (;start < arr.length; start++) {
        if (arr[start] !== "") break;
      }
      var end = arr.length - 1;
      for (;end >= 0; end--) {
        if (arr[end] !== "") break;
      }
      if (start > end) return [];
      return arr.slice(start, end - start + 1);
    }
    var fromParts = trim(from.split("/"));
    var toParts = trim(to.split("/"));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..");
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/");
  }
};

var asyncLoad = async url => {
  var arrayBuffer = await readAsync(url);
  assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
  return new Uint8Array(arrayBuffer);
};

var getUniqueRunDependency = id => {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
};

var FS_preloadFile = async (parent, name, url, canRead = undefined, canWrite = undefined, dontCreateFile = undefined, canOwn = undefined, preFinish = undefined) => {
  // TODO we should allow people to just pass in a complete filename instead
  // of parent and name being that we just join them anyways
  var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency(`cp ${fullname}`);
  // might have several active requests for the same fullname
  addRunDependency(dep);
  try {
    var byteArray = url;
    if (typeof url === "string") {
      byteArray = await asyncLoad(url);
    }
    byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
    preFinish?.();
    if (!dontCreateFile) {
      FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
  } finally {
    removeRunDependency(dep);
  }
};

var FS_createPreloadedFile = (parent, name, url, canRead = undefined, canWrite = undefined, onload = undefined, onerror = undefined, dontCreateFile = undefined, canOwn = undefined, preFinish = undefined) => {
  FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
};

var lengthBytesUTF8 = str => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var u = str.codePointAt(i);
    if (u <= 127) {
      len++;
    } else if (u <= 2047) {
      len += 2;
    } else if (u <= 65535) {
      len += 3;
    } else {
      len += 4;
      // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
      // We need to manually skip over the second code unit for correct iteration.
      i++;
    }
  }
  return len;
};

var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
  assert(typeof str === "string", `stringToUTF8Array expects a string (got ${typeof str})`);
  // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
  // undefined and false each don't write out any bytes.
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
    // and https://www.ietf.org/rfc/rfc2279.txt
    // and https://tools.ietf.org/html/rfc3629
    var u = str.codePointAt(i);
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 192 | (u >> 6);
      heap[outIdx++] = 128 | (u & 63);
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 224 | (u >> 12);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 1114111) warnOnce(`Invalid Unicode code point ${ptrToString(u)} encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).`);
      heap[outIdx++] = 240 | (u >> 18);
      heap[outIdx++] = 128 | ((u >> 12) & 63);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
      // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
      // We need to manually skip over the second code unit for correct iteration.
      i++;
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
};

/** @type {function(string, boolean=, number=)} */ var intArrayFromString = (stringy, dontAddNull, length) => {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
};

var FS_fileDataToTypedArray = data => {
  if (typeof data === "string") {
    data = intArrayFromString(data, true);
  }
  if (!data.subarray) {
    data = new Uint8Array(data);
  }
  return data;
};

var FS_getMode = (canRead, canWrite) => {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
};

var FS_modeStringToFlags = str => {
  if (typeof str !== "string") return str;
  var flagModes = {
    "r": 0,
    "r+": 2,
    "w": 512 | 64 | 1,
    "w+": 512 | 64 | 2,
    "a": 1024 | 64 | 1,
    "a+": 1024 | 64 | 2
  };
  var flags = flagModes[str];
  if (typeof flags === "undefined") {
    throw new Error(`Unknown file open mode: ${str}`);
  }
  return flags;
};

var mmapAlloc = size => {
  abort("internal error: mmapAlloc called but `emscripten_builtin_memalign` native symbol not exported");
};

var MEMFS = {
  ops_table: null,
  mount(mount) {
    return MEMFS.createNode(null, "/", 16895, 0);
  },
  createNode(parent, name, mode, dev = undefined) {
    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
      // not supported
      throw new FS.ErrnoError(63);
    }
    MEMFS.ops_table ||= {
      dir: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr,
          lookup: MEMFS.node_ops.lookup,
          mknod: MEMFS.node_ops.mknod,
          rename: MEMFS.node_ops.rename,
          unlink: MEMFS.node_ops.unlink,
          rmdir: MEMFS.node_ops.rmdir,
          readdir: MEMFS.node_ops.readdir,
          symlink: MEMFS.node_ops.symlink
        },
        stream: {
          llseek: MEMFS.stream_ops.llseek
        }
      },
      file: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr
        },
        stream: {
          llseek: MEMFS.stream_ops.llseek,
          read: MEMFS.stream_ops.read,
          write: MEMFS.stream_ops.write,
          mmap: MEMFS.stream_ops.mmap,
          msync: MEMFS.stream_ops.msync
        }
      },
      link: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr,
          readlink: MEMFS.node_ops.readlink
        },
        stream: {}
      },
      chrdev: {
        node: {
          getattr: MEMFS.node_ops.getattr,
          setattr: MEMFS.node_ops.setattr
        },
        stream: FS.chrdev_stream_ops
      }
    };
    var node = FS.createNode(parent, name, mode, dev);
    if (FS.isDir(node.mode)) {
      node.node_ops = MEMFS.ops_table.dir.node;
      node.stream_ops = MEMFS.ops_table.dir.stream;
      node.contents = {};
    } else if (FS.isFile(node.mode)) {
      node.node_ops = MEMFS.ops_table.file.node;
      node.stream_ops = MEMFS.ops_table.file.stream;
      // The actual number of bytes used in the typed array, as opposed to
      // contents.length which gives the whole capacity.
      node.usedBytes = 0;
      // The byte data of the file is stored in a typed array.
      // Note: typed arrays are not resizable like normal JS arrays are, so
      // there is a small penalty involved for appending file writes that
      // continuously grow a file similar to std::vector capacity vs used.
      node.contents = MEMFS.emptyFileContents ??= new Uint8Array(0);
    } else if (FS.isLink(node.mode)) {
      node.node_ops = MEMFS.ops_table.link.node;
      node.stream_ops = MEMFS.ops_table.link.stream;
    } else if (FS.isChrdev(node.mode)) {
      node.node_ops = MEMFS.ops_table.chrdev.node;
      node.stream_ops = MEMFS.ops_table.chrdev.stream;
    }
    node.atime = node.mtime = node.ctime = Date.now();
    // add the new node to the parent
    if (parent) {
      parent.contents[name] = node;
      parent.atime = parent.mtime = parent.ctime = node.atime;
    }
    return node;
  },
  getFileDataAsTypedArray(node) {
    assert(FS.isFile(node.mode), "getFileDataAsTypedArray called on non-file");
    return node.contents.subarray(0, node.usedBytes);
  },
  expandFileStorage(node, newCapacity) {
    var prevCapacity = node.contents.length;
    if (prevCapacity >= newCapacity) return;
    // No need to expand, the storage was already large enough.
    // Don't expand strictly to the given requested limit if it's only a very
    // small increase, but instead geometrically grow capacity.
    // For small filesizes (<1MB), perform size*2 geometric increase, but for
    // large sizes, do a much more conservative size*1.125 increase to avoid
    // overshooting the allocation cap by a very large margin.
    const CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0);
    if (prevCapacity) newCapacity = Math.max(newCapacity, 256);
    // At minimum allocate 256b for each file when expanding.
    var oldContents = MEMFS.getFileDataAsTypedArray(node);
    node.contents = new Uint8Array(newCapacity);
    // Allocate new storage.
    node.contents.set(oldContents);
  },
  resizeFileStorage(node, newSize) {
    if (node.usedBytes == newSize) return;
    var oldContents = node.contents;
    node.contents = new Uint8Array(newSize);
    // Allocate new storage.
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
    // Copy old data over to the new storage.
    node.usedBytes = newSize;
  },
  node_ops: {
    getattr(node) {
      var attr = {};
      // device numbers reuse inode numbers.
      attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
      attr.ino = node.id;
      attr.mode = node.mode;
      attr.nlink = 1;
      attr.uid = 0;
      attr.gid = 0;
      attr.rdev = node.rdev;
      if (FS.isDir(node.mode)) {
        attr.size = 4096;
      } else if (FS.isFile(node.mode)) {
        attr.size = node.usedBytes;
      } else if (FS.isLink(node.mode)) {
        attr.size = node.link.length;
      } else {
        attr.size = 0;
      }
      attr.atime = new Date(node.atime);
      attr.mtime = new Date(node.mtime);
      attr.ctime = new Date(node.ctime);
      // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
      //       but this is not required by the standard.
      attr.blksize = 4096;
      attr.blocks = Math.ceil(attr.size / attr.blksize);
      return attr;
    },
    setattr(node, attr) {
      for (const key of [ "mode", "atime", "mtime", "ctime" ]) {
        if (attr[key] != null) {
          node[key] = attr[key];
        }
      }
      if (attr.size !== undefined) {
        MEMFS.resizeFileStorage(node, attr.size);
      }
    },
    lookup(parent, name) {
      throw new FS.ErrnoError(44);
    },
    mknod(parent, name, mode, dev = undefined) {
      return MEMFS.createNode(parent, name, mode, dev);
    },
    rename(old_node, new_dir, new_name) {
      var new_node;
      try {
        new_node = FS.lookupNode(new_dir, new_name);
      } catch (e) {}
      if (new_node && FS.isDir(old_node.mode)) {
        // if we're overwriting a directory at new_name, make sure it's empty.
        for (var i in new_node.contents) {
          throw new FS.ErrnoError(55);
        }
      }
      // do the internal rewiring
      delete old_node.parent.contents[old_node.name];
      new_dir.contents[new_name] = old_node;
      old_node.name = new_name;
      new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
    },
    unlink(parent, name) {
      delete parent.contents[name];
      parent.ctime = parent.mtime = Date.now();
    },
    rmdir(parent, name) {
      var node = FS.lookupNode(parent, name);
      for (var i in node.contents) {
        throw new FS.ErrnoError(55);
      }
      delete parent.contents[name];
      parent.ctime = parent.mtime = Date.now();
    },
    readdir(node) {
      return [ ".", "..", ...Object.keys(node.contents) ];
    },
    symlink(parent, newname, oldpath) {
      var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
      node.link = oldpath;
      return node;
    },
    readlink(node) {
      if (!FS.isLink(node.mode)) {
        throw new FS.ErrnoError(28);
      }
      return node.link;
    }
  },
  stream_ops: {
    read(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= stream.node.usedBytes) return 0;
      var size = Math.min(stream.node.usedBytes - position, length);
      assert(size >= 0);
      buffer.set(contents.subarray(position, position + size), offset);
      return size;
    },
    write(stream, buffer, offset, length, position, canOwn) {
      assert(buffer.subarray, "FS.write expects a TypedArray");
      // If the buffer is located in main memory (HEAP), and if
      // memory can grow, we can't hold on to references of the
      // memory buffer, as they may get invalidated. That means we
      // need to copy its contents.
      if (buffer.buffer === (growMemViews(), HEAP8).buffer) {
        canOwn = false;
      }
      if (!length) return 0;
      var node = stream.node;
      node.mtime = node.ctime = Date.now();
      if (canOwn) {
        assert(!position, "canOwn must imply no weird position inside the file");
        node.contents = buffer.subarray(offset, offset + length);
        node.usedBytes = length;
      } else if (!node.usedBytes && !position) {
        // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
        node.contents = buffer.slice(offset, offset + length);
        node.usedBytes = length;
      } else {
        MEMFS.expandFileStorage(node, position + length);
        // Use typed array write which is available.
        node.contents.set(buffer.subarray(offset, offset + length), position);
        node.usedBytes = Math.max(node.usedBytes, position + length);
      }
      return length;
    },
    llseek(stream, offset, whence) {
      var position = offset;
      if (whence === 1) {
        position += stream.position;
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          position += stream.node.usedBytes;
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(28);
      }
      return position;
    },
    mmap(stream, length, position, prot, flags) {
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      var ptr;
      var allocated;
      var contents = stream.node.contents;
      // Only make a new copy when MAP_PRIVATE is specified.
      if (!(flags & 2) && contents.buffer === (growMemViews(), HEAP8).buffer) {
        // We can't emulate MAP_SHARED when the file is not backed by the
        // buffer we're mapping to (e.g. the HEAP buffer).
        allocated = false;
        ptr = contents.byteOffset;
      } else {
        allocated = true;
        ptr = mmapAlloc(length);
        if (!ptr) {
          throw new FS.ErrnoError(48);
        }
        if (contents) {
          // Try to avoid unnecessary slices.
          if (position > 0 || position + length < contents.length) {
            if (contents.subarray) {
              contents = contents.subarray(position, position + length);
            } else {
              contents = contents.slice(position, position + length);
            }
          }
          (growMemViews(), HEAP8).set(contents, ptr);
        }
      }
      return {
        ptr,
        allocated
      };
    },
    msync(stream, buffer, offset, length, mmapFlags) {
      MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
      // should we check if bytesWritten and length are the same?
      return 0;
    }
  }
};

var FS_stdin_getChar_buffer = [];

var FS_stdin_getChar = () => {
  if (!FS_stdin_getChar_buffer.length) {
    var result = null;
    if (globalThis.window?.prompt) {
      // Browser.
      result = window.prompt("Input: ");
      // returns null on cancel
      if (result !== null) {
        result += "\n";
      }
    } else {}
    if (!result) {
      return null;
    }
    FS_stdin_getChar_buffer = intArrayFromString(result, true);
  }
  return FS_stdin_getChar_buffer.shift();
};

var TTY = {
  ttys: [],
  init() {},
  shutdown() {},
  register(dev, ops) {
    TTY.ttys[dev] = {
      input: [],
      output: [],
      ops
    };
    FS.registerDevice(dev, TTY.stream_ops);
  },
  stream_ops: {
    open(stream) {
      var tty = TTY.ttys[stream.node.rdev];
      if (!tty) {
        throw new FS.ErrnoError(43);
      }
      stream.tty = tty;
      stream.seekable = false;
    },
    close(stream) {
      // flush any pending line data
      stream.tty.ops.fsync(stream.tty);
    },
    fsync(stream) {
      stream.tty.ops.fsync(stream.tty);
    },
    read(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.get_char) {
        throw new FS.ErrnoError(60);
      }
      var bytesRead = 0;
      for (var i = 0; i < length; i++) {
        var result;
        try {
          result = stream.tty.ops.get_char(stream.tty);
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
        if (result === undefined && !bytesRead) {
          throw new FS.ErrnoError(6);
        }
        if (result === null || result === undefined) break;
        bytesRead++;
        buffer[offset + i] = result;
        // We currently only support canonical mode (ICANON), where
        // read(2) returns as soon as a line delimiter is read.
        if (result === 10) break;
      }
      if (bytesRead) {
        stream.node.atime = Date.now();
      }
      return bytesRead;
    },
    write(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.put_char) {
        throw new FS.ErrnoError(60);
      }
      try {
        for (var i = 0; i < length; i++) {
          stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
        }
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (length) {
        stream.node.mtime = stream.node.ctime = Date.now();
      }
      return i;
    }
  },
  default_tty_ops: {
    get_char(tty) {
      return FS_stdin_getChar();
    },
    put_char(tty, val) {
      if (val === null || val === 10) {
        out(UTF8ArrayToString(tty.output));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    fsync(tty) {
      if (tty.output?.length > 0) {
        out(UTF8ArrayToString(tty.output));
        tty.output = [];
      }
    },
    ioctl_tcgets(tty) {
      // typical setting
      return {
        c_iflag: 25856,
        c_oflag: 5,
        c_cflag: 191,
        c_lflag: 35387,
        c_cc: [ 3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
      };
    },
    ioctl_tcsets(tty, optional_actions, data) {
      // currently just ignore
      return 0;
    },
    ioctl_tiocgwinsz(tty) {
      return [ 24, 80 ];
    }
  },
  default_tty1_ops: {
    put_char(tty, val) {
      if (val === null || val === 10) {
        err(UTF8ArrayToString(tty.output));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    fsync(tty) {
      if (tty.output?.length > 0) {
        err(UTF8ArrayToString(tty.output));
        tty.output = [];
      }
    }
  }
};

var initRandomFill = () => view => (view.set(crypto.getRandomValues(new Uint8Array(view.byteLength))), 
0);

var randomFill = view => (randomFill = initRandomFill())(view);

var strError = errno => UTF8ToString(_strerror(errno));

var FS = {
  root: null,
  mounts: [],
  devices: {},
  streams: [],
  nextInode: 1,
  nameTable: [],
  currentPath: "/",
  initialized: false,
  ignorePermissions: true,
  syncFSRequests: 0,
  ErrnoError: class extends Error {
    name="ErrnoError";
    // We set the `name` property to be able to identify `FS.ErrnoError`
    // - the `name` is a standard ECMA-262 property of error objects. Kind of good to have it anyway.
    // - when using PROXYFS, an error can come from an underlying FS
    // as different FS objects have their own FS.ErrnoError each,
    // the test `err instanceof FS.ErrnoError` won't detect an error coming from another filesystem, causing bugs.
    // we'll use the reliable test `err.name == "ErrnoError"` instead
    constructor(errno) {
      super(runtimeInitialized ? strError(errno) : "");
      this.errno = errno;
      for (var key in ERRNO_CODES) {
        if (ERRNO_CODES[key] === errno) {
          this.code = key;
          break;
        }
      }
    }
  },
  FSStream: class {
    shared={};
    get object() {
      return this.node;
    }
    set object(val) {
      this.node = val;
    }
    get isRead() {
      return (this.flags & 2097155) !== 1;
    }
    get isWrite() {
      return (this.flags & 2097155) !== 0;
    }
    get isAppend() {
      return (this.flags & 1024);
    }
    get flags() {
      return this.shared.flags;
    }
    set flags(val) {
      this.shared.flags = val;
    }
    get position() {
      return this.shared.position;
    }
    set position(val) {
      this.shared.position = val;
    }
  },
  FSNode: class {
    node_ops={};
    stream_ops={};
    readMode=292 | 73;
    writeMode=146;
    mounted=null;
    constructor(parent, name, mode, rdev) {
      if (!parent) {
        parent = this;
      }
      this.parent = parent;
      this.mount = parent.mount;
      this.id = FS.nextInode++;
      this.name = name;
      this.mode = mode;
      this.rdev = rdev;
      this.atime = this.mtime = this.ctime = Date.now();
    }
    get read() {
      return (this.mode & this.readMode) === this.readMode;
    }
    set read(val) {
      val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
    }
    get write() {
      return (this.mode & this.writeMode) === this.writeMode;
    }
    set write(val) {
      val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
    }
    get isFolder() {
      return FS.isDir(this.mode);
    }
    get isDevice() {
      return FS.isChrdev(this.mode);
    }
    // The per-inode readiness wait-queue. The node carries a Set of listener
    // entries {cb}; producers (SOCKFS, PIPEFS) call notifyListeners on a
    // readiness transition, and poll()/epoll consume it. It lives on the node
    // (not the fd) so dup'd fds share one queue. Only nodes that derive real
    // readiness (sockets, pipes, and an epoll's own node) ever use this -
    // always-ready types (regular files, ttys) never register or notify.
    addListener(cb, exclusive = false) {
      var entry = {
        cb,
        exclusive
      };
      var listeners = (this.listeners ??= new Set);
      listeners.add(entry);
      return {
        listeners,
        entry
      };
    }
    notifyListeners(flags) {
      // Iterates the set without copying, which is safe ONLY under a
      // load-bearing contract that every internal listener must honour:
      //   1. A listener must not run user code synchronously (a poll waiter only
      //      resolves a Promise; an epoll registration only re-lists +
      //      re-notifies; the epoll callback only schedules a tick). User code
      //      runs on a later tick, never inside this loop.
      //   2. A listener may delete entries only from ITS OWN waiter, never from
      //      a sibling node's set that may be mid-iteration. (Deleting an entry
      //      of the set being iterated here is fine - a Set tolerates removal of
      //      a not-yet-visited entry mid-iteration; mutating a *different* node's
      //      set is fine because that set is not being iterated.)
      // Violating either gives silently skipped wakeups that are near-impossible
      // to reproduce. Any new producer/listener must preserve it.
      if (!this.listeners) return;
      // Fire every non-exclusive listener. Among EPOLLEXCLUSIVE registrations
      // (one fd watched by several epolls) wake only one, rotating round-robin
      // per node, to avoid a thundering herd. (Only epoll registrations are ever
      // exclusive; poll waiters and a node's own consumers are not.)
      var excl;
      for (var entry of this.listeners) {
        if (entry.exclusive) (excl ||= []).push(entry); else entry.cb(flags);
      }
      if (excl) {
        var i = (this.exclTurn || 0) % excl.length;
        this.exclTurn = i + 1;
        excl[i].cb(flags);
      }
    }
  },
  lookupPath(path, opts = {}) {
    if (!path) {
      throw new FS.ErrnoError(44);
    }
    opts.follow_mount ??= true;
    if (!PATH.isAbs(path)) {
      path = FS.cwd() + "/" + path;
    }
    // limit max consecutive symlinks to SYMLOOP_MAX.
    linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
      // split the absolute path
      var parts = path.split("/").filter(p => !!p);
      // start at the root
      var current = FS.root;
      var current_path = "/";
      for (var i = 0; i < parts.length; i++) {
        var islast = (i === parts.length - 1);
        if (islast && opts.parent) {
          // stop resolving
          break;
        }
        if (parts[i] === ".") {
          continue;
        }
        if (parts[i] === "..") {
          current_path = PATH.dirname(current_path);
          if (FS.isRoot(current)) {
            path = current_path + "/" + parts.slice(i + 1).join("/");
            // We're making progress here, don't let many consecutive ..'s
            // lead to ELOOP
            nlinks--;
            continue linkloop;
          } else {
            current = current.parent;
          }
          continue;
        }
        current_path = PATH.join2(current_path, parts[i]);
        try {
          current = FS.lookupNode(current, parts[i]);
        } catch (e) {
          // if noent_okay is true, suppress a ENOENT in the last component
          // and return an object with an undefined node. This is needed for
          // resolving symlinks in the path when creating a file.
          if ((e?.errno === 44) && islast && opts.noent_okay) {
            return {
              path: current_path
            };
          }
          throw e;
        }
        // jump to the mount's root node if this is a mountpoint
        if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
          current = current.mounted.root;
        }
        // by default, lookupPath will not follow a symlink if it is the final path component.
        // setting opts.follow = true will override this behavior.
        if (FS.isLink(current.mode) && (!islast || opts.follow)) {
          if (!current.node_ops.readlink) {
            throw new FS.ErrnoError(52);
          }
          var link = current.node_ops.readlink(current);
          if (!PATH.isAbs(link)) {
            link = PATH.dirname(current_path) + "/" + link;
          }
          path = link + "/" + parts.slice(i + 1).join("/");
          continue linkloop;
        }
      }
      return {
        path: current_path,
        node: current
      };
    }
    throw new FS.ErrnoError(32);
  },
  getPath(node) {
    var path;
    while (true) {
      if (FS.isRoot(node)) {
        var mount = node.mount.mountpoint;
        if (!path) return mount;
        return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
      }
      path = path ? `${node.name}/${path}` : node.name;
      node = node.parent;
    }
  },
  hashName(parentid, name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    }
    return ((parentid + hash) >>> 0) % FS.nameTable.length;
  },
  hashAddNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    node.name_next = FS.nameTable[hash];
    FS.nameTable[hash] = node;
  },
  hashRemoveNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    if (FS.nameTable[hash] === node) {
      FS.nameTable[hash] = node.name_next;
    } else {
      var current = FS.nameTable[hash];
      while (current) {
        if (current.name_next === node) {
          current.name_next = node.name_next;
          break;
        }
        current = current.name_next;
      }
    }
  },
  lookupNode(parent, name) {
    var errCode = FS.mayLookup(parent);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    var hash = FS.hashName(parent.id, name);
    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
      var nodeName = node.name;
      if (node.parent.id === parent.id && nodeName === name) {
        return node;
      }
    }
    // if we failed to find it in the cache, call into the VFS
    return FS.lookup(parent, name);
  },
  createNode(parent, name, mode, rdev = undefined) {
    assert(typeof parent === "object");
    var node = new FS.FSNode(parent, name, mode, rdev);
    FS.hashAddNode(node);
    return node;
  },
  destroyNode(node) {
    FS.hashRemoveNode(node);
  },
  isRoot(node) {
    return node === node.parent;
  },
  isMountpoint(node) {
    return !!node.mounted;
  },
  isFile(mode) {
    return (mode & 61440) === 32768;
  },
  isDir(mode) {
    return (mode & 61440) === 16384;
  },
  isLink(mode) {
    return (mode & 61440) === 40960;
  },
  isChrdev(mode) {
    return (mode & 61440) === 8192;
  },
  isBlkdev(mode) {
    return (mode & 61440) === 24576;
  },
  isFIFO(mode) {
    return (mode & 61440) === 4096;
  },
  isSocket(mode) {
    return (mode & 49152) === 49152;
  },
  flagsToPermissionString(flag) {
    var perms = [ "r", "w", "rw" ][flag & 3];
    if ((flag & 512)) {
      perms += "w";
    }
    return perms;
  },
  nodePermissions(node, perms) {
    if (FS.ignorePermissions) {
      return 0;
    }
    // return 0 if any user, group or owner bits are set.
    if (perms.includes("r") && !(node.mode & 292)) {
      return 2;
    }
    if (perms.includes("w") && !(node.mode & 146)) {
      return 2;
    }
    if (perms.includes("x") && !(node.mode & 73)) {
      return 2;
    }
    return 0;
  },
  mayLookup(dir) {
    if (!FS.isDir(dir.mode)) return 54;
    var errCode = FS.nodePermissions(dir, "x");
    if (errCode) return errCode;
    if (!dir.node_ops.lookup) return 2;
    return 0;
  },
  mayCreate(dir, name) {
    if (!FS.isDir(dir.mode)) {
      return 54;
    }
    try {
      var node = FS.lookupNode(dir, name);
      return 20;
    } catch (e) {}
    return FS.nodePermissions(dir, "wx");
  },
  mayDelete(dir, name, isdir) {
    var node;
    try {
      node = FS.lookupNode(dir, name);
    } catch (e) {
      return e.errno;
    }
    var errCode = FS.nodePermissions(dir, "wx");
    if (errCode) {
      return errCode;
    }
    if (isdir) {
      if (!FS.isDir(node.mode)) {
        return 54;
      }
      if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
        return 10;
      }
    } else if (FS.isDir(node.mode)) {
      return 31;
    }
    return 0;
  },
  mayOpen(node, flags) {
    if (!node) {
      return 44;
    }
    if (FS.isLink(node.mode)) {
      return 32;
    }
    var mode = FS.flagsToPermissionString(flags);
    if (FS.isDir(node.mode)) {
      // opening for write
      // TODO: check for O_SEARCH? (== search for dir only)
      if (mode !== "r" || (flags & (512 | 64))) {
        return 31;
      }
    }
    return FS.nodePermissions(node, mode);
  },
  checkOpExists(op, err) {
    if (!op) {
      throw new FS.ErrnoError(err);
    }
    return op;
  },
  nextfd() {
    for (var fd = 0; fd <= FS_MAX_OPEN_FDS; fd++) {
      if (!FS.streams[fd]) {
        return fd;
      }
    }
    throw new FS.ErrnoError(33);
  },
  getStreamChecked(fd) {
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8);
    }
    return stream;
  },
  getStream: fd => FS.streams[fd],
  createStream(stream, fd = -1) {
    assert(fd >= -1);
    // clone it, so we can return an instance of FSStream
    stream = Object.assign(new FS.FSStream, stream);
    if (fd == -1) {
      fd = FS.nextfd();
    }
    stream.fd = fd;
    FS.streams[fd] = stream;
    return stream;
  },
  closeStream(fd) {
    FS.streams[fd] = null;
  },
  dupStream(origStream, fd = -1) {
    var stream = FS.createStream(origStream, fd);
    stream.stream_ops?.dup?.(stream);
    return stream;
  },
  doSetAttr(stream, node, attr) {
    var setattr = stream?.stream_ops.setattr;
    var arg = setattr ? stream : node;
    setattr ??= node.node_ops.setattr;
    FS.checkOpExists(setattr, 63);
    try {
      setattr(arg, attr);
    } catch (e) {
      if (e instanceof RangeError) {
        throw new FS.ErrnoError(22);
      }
      throw e;
    }
  },
  chrdev_stream_ops: {
    open(stream) {
      var device = FS.getDevice(stream.node.rdev);
      // override node's stream ops with the device's
      stream.stream_ops = device.stream_ops;
      // forward the open call
      stream.stream_ops.open?.(stream);
    },
    llseek() {
      throw new FS.ErrnoError(70);
    }
  },
  major: dev => ((dev) >> 8),
  minor: dev => ((dev) & 255),
  makedev: (ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
    FS.devices[dev] = {
      stream_ops: ops
    };
  },
  getDevice: dev => FS.devices[dev],
  getMounts(mount) {
    var mounts = [];
    var check = [ mount ];
    while (check.length) {
      var m = check.pop();
      mounts.push(m);
      check.push(...m.mounts);
    }
    return mounts;
  },
  syncfs(populate, callback) {
    if (typeof populate === "function") {
      callback = populate;
      populate = false;
    }
    FS.syncFSRequests++;
    if (FS.syncFSRequests > 1) {
      err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
    }
    var mounts = FS.getMounts(FS.root.mount);
    var completed = 0;
    function doCallback(errCode) {
      assert(FS.syncFSRequests > 0);
      FS.syncFSRequests--;
      return callback(errCode);
    }
    function done(errCode) {
      if (errCode) {
        if (!done.errored) {
          done.errored = true;
          return doCallback(errCode);
        }
        return;
      }
      if (++completed >= mounts.length) {
        doCallback(null);
      }
    }
    // sync all mounts
    for (var mount of mounts) {
      if (mount.type.syncfs) {
        mount.type.syncfs(mount, populate, done);
      } else {
        done(null);
      }
    }
  },
  mount(type, opts, mountpoint) {
    if (typeof type === "string") {
      // The filesystem was not included, and instead we have an error
      // message stored in the variable.
      throw type;
    }
    var root = mountpoint === "/";
    var pseudo = !mountpoint;
    var node;
    if (root && FS.root) {
      throw new FS.ErrnoError(10);
    } else if (!root && !pseudo) {
      var lookup = FS.lookupPath(mountpoint, {
        follow_mount: false
      });
      mountpoint = lookup.path;
      // use the absolute path
      node = lookup.node;
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10);
      }
      if (!FS.isDir(node.mode)) {
        throw new FS.ErrnoError(54);
      }
    }
    var mount = {
      type,
      opts,
      mountpoint,
      mounts: []
    };
    // create a root node for the fs
    var mountRoot = type.mount(mount);
    mountRoot.mount = mount;
    mount.root = mountRoot;
    if (root) {
      FS.root = mountRoot;
    } else if (node) {
      // set as a mountpoint
      node.mounted = mount;
      // add the new mount to the current mount's children
      if (node.mount) {
        node.mount.mounts.push(mount);
      }
    }
    return mountRoot;
  },
  unmount(mountpoint) {
    var lookup = FS.lookupPath(mountpoint, {
      follow_mount: false
    });
    if (!FS.isMountpoint(lookup.node)) {
      throw new FS.ErrnoError(28);
    }
    // destroy the nodes for this mount, and all its child mounts
    var node = lookup.node;
    var mount = node.mounted;
    var mounts = FS.getMounts(mount);
    for (var [hash, current] of Object.entries(FS.nameTable)) {
      while (current) {
        var next = current.name_next;
        if (mounts.includes(current.mount)) {
          FS.destroyNode(current);
        }
        current = next;
      }
    }
    // no longer a mountpoint
    node.mounted = null;
    // remove this mount from the child mounts
    var idx = node.mount.mounts.indexOf(mount);
    assert(idx !== -1);
    node.mount.mounts.splice(idx, 1);
  },
  lookup(parent, name) {
    return parent.node_ops.lookup(parent, name);
  },
  mknod(path, mode, dev) {
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    var name = PATH.basename(path);
    if (!name) {
      throw new FS.ErrnoError(28);
    }
    if (name === "." || name === "..") {
      throw new FS.ErrnoError(20);
    }
    var errCode = FS.mayCreate(parent, name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.mknod) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.mknod(parent, name, mode, dev);
  },
  statfs(path) {
    return FS.statfsNode(FS.lookupPath(path, {
      follow: true
    }).node);
  },
  statfsStream(stream) {
    // We keep a separate statfsStream function because noderawfs overrides
    // it. In noderawfs, stream.node is sometimes null. Instead, we need to
    // look at stream.path.
    return FS.statfsNode(stream.node);
  },
  statfsNode(node) {
    // NOTE: None of the defaults here are true. We're just returning safe and
    //       sane values. Currently nodefs and rawfs replace these defaults,
    //       other file systems leave them alone.
    var rtn = {
      bsize: 4096,
      frsize: 4096,
      blocks: 1e6,
      bfree: 5e5,
      bavail: 5e5,
      files: FS.nextInode,
      ffree: FS.nextInode - 1,
      fsid: 42,
      flags: 2,
      namelen: 255
    };
    if (node.node_ops.statfs) {
      Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
    }
    return rtn;
  },
  create(path, mode = 438) {
    mode &= 4095;
    mode |= 32768;
    return FS.mknod(path, mode, 0);
  },
  mkdir(path, mode = 511) {
    mode &= 511 | 512;
    mode |= 16384;
    return FS.mknod(path, mode, 0);
  },
  mkdirTree(path, mode = 511) {
    var dirs = path.split("/");
    var d = "";
    for (var dir of dirs) {
      if (!dir) continue;
      if (d || PATH.isAbs(path)) d += "/";
      d += dir;
      try {
        FS.mkdir(d, mode);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
    }
  },
  mkdev(path, mode, dev = undefined) {
    if (typeof dev === "undefined") {
      dev = mode;
      mode = 438;
    }
    mode |= 8192;
    return FS.mknod(path, mode, dev);
  },
  symlink(oldpath, newpath) {
    if (!PATH_FS.resolve(oldpath)) {
      throw new FS.ErrnoError(44);
    }
    var lookup = FS.lookupPath(newpath, {
      parent: true
    });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.symlink) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.symlink(parent, newname, oldpath);
  },
  link(oldpath, newpath, flags) {
    var lookup = FS.lookupPath(newpath, {
      parent: true
    });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    // Hardlinks are only supported by filesystem backends that provide a
    // `link` node op (e.g. NODERAWFS backed by the host). NODEFS omits it:
    // a host hardlink cannot be confined to the mount root.
    if (!parent.node_ops.link) {
      throw new FS.ErrnoError(34);
    }
    return parent.node_ops.link(parent, newname, oldpath, flags);
  },
  rename(old_path, new_path) {
    var old_dirname = PATH.dirname(old_path);
    var new_dirname = PATH.dirname(new_path);
    var old_name = PATH.basename(old_path);
    var new_name = PATH.basename(new_path);
    // parents must exist
    var lookup, old_dir, new_dir;
    // let the errors from non existent directories percolate up
    lookup = FS.lookupPath(old_path, {
      parent: true
    });
    old_dir = lookup.node;
    lookup = FS.lookupPath(new_path, {
      parent: true
    });
    new_dir = lookup.node;
    if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
    // need to be part of the same mount
    if (old_dir.mount !== new_dir.mount) {
      throw new FS.ErrnoError(75);
    }
    // source must exist
    var old_node = FS.lookupNode(old_dir, old_name);
    // old path should not be an ancestor of the new path
    var relative = PATH_FS.relative(old_path, new_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(28);
    }
    // new path should not be an ancestor of the old path
    relative = PATH_FS.relative(new_path, old_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(55);
    }
    // see if the new path already exists
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    // early out if nothing needs to change
    if (old_node === new_node) {
      return;
    }
    // we'll need to delete the old entry
    var isdir = FS.isDir(old_node.mode);
    var errCode = FS.mayDelete(old_dir, old_name, isdir);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    // need delete permissions if we'll be overwriting.
    // need create permissions if new doesn't already exist.
    errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!old_dir.node_ops.rename) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
      throw new FS.ErrnoError(10);
    }
    // if we are going to change the parent, check write permissions
    if (new_dir !== old_dir) {
      errCode = FS.nodePermissions(old_dir, "w");
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    // remove the node from the lookup hash
    FS.hashRemoveNode(old_node);
    // do the underlying fs rename
    try {
      old_dir.node_ops.rename(old_node, new_dir, new_name);
      // The replaced node is stale now. Evict it only after the rename
      // succeeded: backends like NODEFS report node.id as st_ino.
      if (new_node) {
        FS.hashRemoveNode(new_node);
      }
      // update old node (we do this here to avoid each backend
      // needing to)
      old_node.parent = new_dir;
    } catch (e) {
      throw e;
    } finally {
      // add the node back to the hash (in case node_ops.rename
      // changed its name)
      FS.hashAddNode(old_node);
    }
  },
  rmdir(path) {
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, true);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.rmdir) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.rmdir(parent, name);
    FS.destroyNode(node);
  },
  readdir(path) {
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    var node = lookup.node;
    var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
    return readdir(node);
  },
  unlink(path) {
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, false);
    if (errCode) {
      // According to POSIX, we should map EISDIR to EPERM, but
      // we instead do what Linux does (and we must, as we use
      // the musl linux libc).
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.unlink) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.unlink(parent, name);
    FS.destroyNode(node);
  },
  readlink(path) {
    var lookup = FS.lookupPath(path);
    var link = lookup.node;
    if (!link) {
      throw new FS.ErrnoError(44);
    }
    if (!link.node_ops.readlink) {
      throw new FS.ErrnoError(28);
    }
    return link.node_ops.readlink(link);
  },
  stat(path, dontFollow = false) {
    var lookup = FS.lookupPath(path, {
      follow: !dontFollow
    });
    var node = lookup.node;
    var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
    return getattr(node);
  },
  fstat(fd) {
    var stream = FS.getStreamChecked(fd);
    var node = stream.node;
    var getattr = stream.stream_ops.getattr;
    var arg = getattr ? stream : node;
    getattr ??= node.node_ops.getattr;
    FS.checkOpExists(getattr, 63);
    return getattr(arg);
  },
  lstat(path) {
    return FS.stat(path, true);
  },
  doChmod(stream, node, mode, dontFollow = false) {
    FS.doSetAttr(stream, node, {
      mode: (mode & 4095) | (node.mode & ~4095),
      ctime: Date.now(),
      dontFollow
    });
  },
  chmod(path, mode, dontFollow = false) {
    var node;
    if (typeof path === "string") {
      var lookup = FS.lookupPath(path, {
        follow: !dontFollow
      });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChmod(null, node, mode, dontFollow);
  },
  lchmod(path, mode) {
    FS.chmod(path, mode, true);
  },
  fchmod(fd, mode) {
    var stream = FS.getStreamChecked(fd);
    FS.doChmod(stream, stream.node, mode, false);
  },
  doChown(stream, node, dontFollow = false) {
    FS.doSetAttr(stream, node, {
      timestamp: Date.now(),
      dontFollow
    });
  },
  chown(path, uid, gid, dontFollow = false) {
    var node;
    if (typeof path === "string") {
      var lookup = FS.lookupPath(path, {
        follow: !dontFollow
      });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChown(null, node, dontFollow);
  },
  lchown(path, uid, gid) {
    FS.chown(path, uid, gid, true);
  },
  fchown(fd, uid, gid) {
    var stream = FS.getStreamChecked(fd);
    FS.doChown(stream, stream.node, false);
  },
  doTruncate(stream, node, len) {
    if (FS.isDir(node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!FS.isFile(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    var errCode = FS.nodePermissions(node, "w");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.doSetAttr(stream, node, {
      size: len,
      timestamp: Date.now()
    });
  },
  truncate(path, len) {
    if (len < 0) {
      throw new FS.ErrnoError(28);
    }
    var node;
    if (typeof path === "string") {
      var lookup = FS.lookupPath(path, {
        follow: true
      });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doTruncate(null, node, len);
  },
  ftruncate(fd, len) {
    var stream = FS.getStreamChecked(fd);
    if (len < 0 || (stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(28);
    }
    FS.doTruncate(stream, stream.node, len);
  },
  utime(path, atime, mtime, dontFollow = false) {
    var lookup = FS.lookupPath(path, {
      follow: !dontFollow
    });
    FS.doSetAttr(null, lookup.node, {
      atime,
      mtime,
      dontFollow
    });
  },
  open(path, flags, mode = 438) {
    if (path === "") {
      throw new FS.ErrnoError(44);
    }
    flags = FS_modeStringToFlags(flags);
    if ((flags & 64)) {
      mode = (mode & 4095) | 32768;
    } else {
      mode = 0;
    }
    var node;
    var isDirPath;
    if (typeof path === "object") {
      node = path;
    } else {
      isDirPath = path.endsWith("/");
      // noent_okay makes it so that if the final component of the path
      // doesn't exist, lookupPath returns `node: undefined`. `path` will be
      // updated to point to the target of all symlinks.
      var lookup = FS.lookupPath(path, {
        follow: !(flags & 131072),
        noent_okay: true
      });
      node = lookup.node;
      path = lookup.path;
    }
    // perhaps we need to create the node
    var created = false;
    if ((flags & 64)) {
      if (node) {
        // if O_CREAT and O_EXCL are set, error out if the node already exists
        if ((flags & 128)) {
          throw new FS.ErrnoError(20);
        }
      } else if (isDirPath) {
        throw new FS.ErrnoError(31);
      } else {
        // node doesn't exist, try to create it
        // Ignore the permission bits here to ensure we can `open` this new
        // file below. We use chmod below to apply the permissions once the
        // file is open.
        node = FS.mknod(path, mode | 511, 0);
        created = true;
      }
    }
    if (!node) {
      throw new FS.ErrnoError(44);
    }
    // can't truncate a device
    if (FS.isChrdev(node.mode)) {
      flags &= ~512;
    }
    // if asked only for a directory, then this must be one
    if ((flags & 65536) && !FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54);
    }
    // check permissions, if this is not a file we just created now (it is ok to
    // create and write to a file with read-only permissions; it is read-only
    // for later use)
    if (!created) {
      var errCode = FS.mayOpen(node, flags);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    // do truncation if necessary
    if ((flags & 512) && !created) {
      FS.truncate(node, 0);
    }
    // we've already handled these, don't pass down to the underlying vfs
    flags &= ~(128 | 512 | 131072);
    // register the stream with the filesystem
    var stream = FS.createStream({
      node,
      path: FS.getPath(node),
      // we want the absolute path to the node
      flags,
      seekable: true,
      position: 0,
      stream_ops: node.stream_ops,
      // used by the file family libc calls (fopen, fwrite, ferror, etc.)
      ungotten: [],
      error: false
    });
    // call the new stream's open function
    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream);
    }
    if (created) {
      FS.chmod(node, mode & 511);
    }
    return stream;
  },
  close(stream) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (stream.getdents) stream.getdents = null;
    // free readdir state
    // The fd is going away: wake anything waiting on it (poll/epoll) with
    // POLLNVAL so a blocking wait unblocks and an epoll registration is evicted
    // on its next derive. Only sockets/pipes/epoll ever carry a wait-queue, so
    // for every other stream (incl. nodeless noderawfs stdio) this is a no-op.
    stream.node?.notifyListeners(32);
    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream);
      }
    } catch (e) {
      throw e;
    } finally {
      FS.closeStream(stream.fd);
    }
    stream.fd = null;
  },
  isClosed(stream) {
    return stream.fd === null;
  },
  llseek(stream, offset, whence) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (!stream.seekable || !stream.stream_ops.llseek) {
      throw new FS.ErrnoError(70);
    }
    if (whence != 0 && whence != 1 && whence != 2) {
      throw new FS.ErrnoError(28);
    }
    stream.position = stream.stream_ops.llseek(stream, offset, whence);
    stream.ungotten = [];
    return stream.position;
  },
  read(stream, buffer, offset, length, position = undefined) {
    assert(offset >= 0);
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.read) {
      throw new FS.ErrnoError(28);
    }
    var seeking = typeof position !== "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
    if (!seeking) stream.position += bytesRead;
    return bytesRead;
  },
  write(stream, buffer, offset, length, position = undefined, canOwn = undefined) {
    assert(offset >= 0);
    assert(buffer.subarray, "FS.write expects a TypedArray");
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.write) {
      throw new FS.ErrnoError(28);
    }
    if (stream.seekable && stream.flags & 1024) {
      // seek to the end before writing in append mode
      FS.llseek(stream, 0, 2);
    }
    var seeking = typeof position !== "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
    if (!seeking) stream.position += bytesWritten;
    return bytesWritten;
  },
  mmap(stream, length, position, prot, flags) {
    // User requests writing to file (prot & PROT_WRITE != 0).
    // Checking if we have permissions to write to the file unless
    // MAP_PRIVATE flag is set. According to POSIX spec it is possible
    // to write to file opened in read-only mode with MAP_PRIVATE flag,
    // as all modifications will be visible only in the memory of
    // the current process.
    if ((prot & 2) && !(flags & 2) && (stream.flags & 2097155) !== 2) {
      throw new FS.ErrnoError(2);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(2);
    }
    if (!stream.stream_ops.mmap) {
      throw new FS.ErrnoError(43);
    }
    if (!length) {
      throw new FS.ErrnoError(28);
    }
    return stream.stream_ops.mmap(stream, length, position, prot, flags);
  },
  msync(stream, buffer, offset, length, mmapFlags) {
    assert(offset >= 0);
    if (!stream.stream_ops.msync) {
      return 0;
    }
    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
  },
  ioctl(stream, cmd, arg) {
    if (!stream.stream_ops.ioctl) {
      throw new FS.ErrnoError(59);
    }
    return stream.stream_ops.ioctl(stream, cmd, arg);
  },
  readFile(path, opts = {}) {
    opts.flags ??= 0;
    opts.encoding ??= "binary";
    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
      abort(`Invalid encoding type "${opts.encoding}"`);
    }
    var stream = FS.open(path, opts.flags);
    var stat = FS.stat(path);
    var length = stat.size;
    var buf = new Uint8Array(length);
    FS.read(stream, buf, 0, length, 0);
    if (opts.encoding === "utf8") {
      buf = UTF8ArrayToString(buf);
    }
    FS.close(stream);
    return buf;
  },
  writeFile(path, data, opts = {}) {
    opts.flags ??= 577;
    var stream = FS.open(path, opts.flags, opts.mode);
    data = FS_fileDataToTypedArray(data);
    FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
    FS.close(stream);
  },
  cwd: () => FS.currentPath,
  chdir(path) {
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    if (lookup.node === null) {
      throw new FS.ErrnoError(44);
    }
    if (!FS.isDir(lookup.node.mode)) {
      throw new FS.ErrnoError(54);
    }
    var errCode = FS.nodePermissions(lookup.node, "x");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.currentPath = lookup.path;
  },
  createDefaultDirectories() {
    FS.mkdir("/tmp");
    FS.mkdir("/home");
    FS.mkdir("/home/web_user");
  },
  createDefaultDevices() {
    // create /dev
    FS.mkdir("/dev");
    // setup /dev/null
    FS.registerDevice(FS.makedev(1, 3), {
      read: () => 0,
      write: (stream, buffer, offset, length, pos) => length,
      llseek: () => 0
    });
    FS.mkdev("/dev/null", FS.makedev(1, 3));
    // setup /dev/tty and /dev/tty1
    // stderr needs to print output using err() rather than out()
    // so we register a second tty just for it.
    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
    FS.mkdev("/dev/tty", FS.makedev(5, 0));
    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
    // setup /dev/[u]random
    // use a buffer to avoid overhead of individual crypto calls per byte
    var randomBuffer = new Uint8Array(1024), randomLeft = 0;
    var randomByte = () => {
      if (!randomLeft) {
        randomFill(randomBuffer);
        randomLeft = randomBuffer.byteLength;
      }
      return randomBuffer[--randomLeft];
    };
    FS.createDevice("/dev", "random", randomByte);
    FS.createDevice("/dev", "urandom", randomByte);
    // we're not going to emulate the actual shm device,
    // just create the tmp dirs that reside in it commonly
    FS.mkdir("/dev/shm");
    FS.mkdir("/dev/shm/tmp");
  },
  createSpecialDirectories() {
    // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
    // name of the stream for fd 6 (see test_unistd_ttyname)
    FS.mkdir("/proc");
    var proc_self = FS.mkdir("/proc/self");
    FS.mkdir("/proc/self/fd");
    FS.mount({
      mount() {
        var node = FS.createNode(proc_self, "fd", 16895, 73);
        node.stream_ops = {
          llseek: MEMFS.stream_ops.llseek
        };
        node.node_ops = {
          lookup(parent, name) {
            var fd = +name;
            var stream = FS.getStreamChecked(fd);
            var ret = {
              parent: null,
              mount: {
                mountpoint: "fake"
              },
              node_ops: {
                readlink: () => stream.path
              },
              id: fd + 1
            };
            ret.parent = ret;
            // make it look like a simple root node
            return ret;
          },
          readdir() {
            return Array.from(FS.streams.entries()).filter(([k, v]) => v).map(([k, v]) => k.toString());
          }
        };
        return node;
      }
    }, {}, "/proc/self/fd");
  },
  createStandardStreams(input, output, error) {
    // TODO deprecate the old functionality of a single
    // input / output callback and that utilizes FS.createDevice
    // and instead require a unique set of stream ops
    // by default, we symlink the standard streams to the
    // default tty devices. however, if the standard streams
    // have been overwritten we create a unique device for
    // them instead.
    if (input) {
      FS.createDevice("/dev", "stdin", input);
    } else {
      FS.symlink("/dev/tty", "/dev/stdin");
    }
    if (output) {
      FS.createDevice("/dev", "stdout", null, output);
    } else {
      FS.symlink("/dev/tty", "/dev/stdout");
    }
    if (error) {
      FS.createDevice("/dev", "stderr", null, error);
    } else {
      FS.symlink("/dev/tty1", "/dev/stderr");
    }
    // open default streams for the stdin, stdout and stderr devices
    var stdin = FS.open("/dev/stdin", 0);
    var stdout = FS.open("/dev/stdout", 1);
    var stderr = FS.open("/dev/stderr", 1);
    assert(stdin.fd === 0, `invalid handle for stdin (${stdin.fd})`);
    assert(stdout.fd === 1, `invalid handle for stdout (${stdout.fd})`);
    assert(stderr.fd === 2, `invalid handle for stderr (${stderr.fd})`);
  },
  staticInit() {
    FS.nameTable.length = 4096;
    FS.mount(MEMFS, {}, "/");
    FS.createDefaultDirectories();
    FS.createDefaultDevices();
    FS.createSpecialDirectories();
  },
  init(input = undefined, output = undefined, error = undefined) {
    assert(!FS.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
    FS.initialized = true;
    // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
    input ??= Module["stdin"];
    output ??= Module["stdout"];
    error ??= Module["stderr"];
    FS.createStandardStreams(input, output, error);
  },
  quit() {
    FS.initialized = false;
    // force-flush all streams, so we get musl std streams printed out
    _fflush(0);
    // close all of our streams
    for (var stream of FS.streams) {
      if (stream) {
        FS.close(stream);
      }
    }
  },
  analyzePath(path, dontResolveLastLink = false) {
    warnOnce("FS.analyzePath is deprecated; use FS.lookupPath or FS.stat instead");
    // operate from within the context of the symlink's target
    try {
      var lookup = FS.lookupPath(path, {
        follow: !dontResolveLastLink
      });
      path = lookup.path;
    } catch (e) {}
    var ret = {
      isRoot: false,
      exists: false,
      error: 0,
      name: null,
      path: null,
      object: null,
      parentExists: false,
      parentPath: null,
      parentObject: null
    };
    try {
      var lookup = FS.lookupPath(path, {
        parent: true
      });
      ret.parentExists = true;
      ret.parentPath = lookup.path;
      ret.parentObject = lookup.node;
      ret.name = PATH.basename(path);
      lookup = FS.lookupPath(path, {
        follow: !dontResolveLastLink
      });
      ret.exists = true;
      ret.path = lookup.path;
      ret.object = lookup.node;
      ret.name = lookup.node.name;
      ret.isRoot = lookup.path === "/";
    } catch (e) {
      ret.error = e.errno;
    }
    return ret;
  },
  createPath(parent, path, canRead = undefined, canWrite = undefined) {
    parent = typeof parent === "string" ? parent : FS.getPath(parent);
    var parts = path.split("/").reverse();
    while (parts.length) {
      var part = parts.pop();
      if (!part) continue;
      var current = PATH.join2(parent, part);
      try {
        FS.mkdir(current);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
      parent = current;
    }
    return current;
  },
  createFile(parent, name, properties, canRead = undefined, canWrite = undefined) {
    var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(canRead, canWrite);
    return FS.create(path, mode);
  },
  createDataFile(parent, name, data = undefined, canRead = undefined, canWrite = undefined, canOwn = undefined) {
    var path = name;
    if (parent) {
      parent = typeof parent === "string" ? parent : FS.getPath(parent);
      path = name ? PATH.join2(parent, name) : parent;
    }
    var mode = FS_getMode(canRead, canWrite);
    var node = FS.create(path, mode);
    if (data) {
      data = FS_fileDataToTypedArray(data);
      // make sure we can write to the file
      FS.chmod(node, mode | 146);
      var stream = FS.open(node, 577);
      FS.write(stream, data, 0, data.length, 0, canOwn);
      FS.close(stream);
      FS.chmod(node, mode);
    }
  },
  createDevice(parent, name, input = undefined, output = undefined) {
    var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(!!input, !!output);
    FS.createDevice.major ??= 64;
    var dev = FS.makedev(FS.createDevice.major++, 0);
    // Create a fake device that a set of stream ops to emulate
    // the old behavior.
    FS.registerDevice(dev, {
      open(stream) {
        stream.seekable = false;
      },
      close(stream) {
        // flush any pending line data
        if (output?.buffer?.length) {
          output(10);
        }
      },
      read(stream, buffer, offset, length, pos) {
        var bytesRead = 0;
        for (var i = 0; i < length; i++) {
          var result;
          try {
            result = input();
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (result === undefined && !bytesRead) {
            throw new FS.ErrnoError(6);
          }
          if (result === null || result === undefined) break;
          bytesRead++;
          buffer[offset + i] = result;
        }
        if (bytesRead) {
          stream.node.atime = Date.now();
        }
        return bytesRead;
      },
      write(stream, buffer, offset, length, pos) {
        for (var i = 0; i < length; i++) {
          try {
            output(buffer[offset + i]);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
        if (length) {
          stream.node.mtime = stream.node.ctime = Date.now();
        }
        return i;
      }
    });
    return FS.mkdev(path, mode, dev);
  },
  forceLoadFile(obj) {
    if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
    if (globalThis.XMLHttpRequest) {
      abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
    } else {
      // Command-line.
      try {
        obj.contents = readBinary(obj.url);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
    }
  },
  createLazyFile(parent, name, url, canRead = undefined, canWrite = undefined) {
    // Lazy chunked Uint8Array (implements get and length from Uint8Array).
    // Actual getting is abstracted away for eventual reuse.
    class LazyUint8Array {
      lengthKnown=false;
      chunks=[];
      // Loaded chunks. Index is the chunk number
      get(idx) {
        if (idx > this.length - 1 || idx < 0) {
          return undefined;
        }
        var chunkOffset = idx % this.chunkSize;
        var chunkNum = (idx / this.chunkSize) | 0;
        return this.getter(chunkNum)[chunkOffset];
      }
      setDataGetter(getter) {
        this.getter = getter;
      }
      cacheLength() {
        // Find length
        var xhr = new XMLHttpRequest;
        xhr.open("HEAD", url, false);
        xhr.send(null);
        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
        var datalength = Number(xhr.getResponseHeader("Content-length"));
        var header;
        var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
        var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
        var chunkSize = 1024 * 1024;
        // Chunk size in bytes
        if (!hasByteServing) chunkSize = datalength;
        // Function to get a range from the remote URL.
        var doXHR = (from, to) => {
          if (from > to) abort(`invalid range (${from}, ${to}) or no bytes requested!`);
          if (to > datalength - 1) abort(`only ${datalength} bytes available! programmer error!`);
          // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
          var xhr = new XMLHttpRequest;
          xhr.open("GET", url, false);
          if (datalength !== chunkSize) xhr.setRequestHeader("Range", `bytes=${from}-${to}`);
          // Some hints to the browser that we want binary data.
          xhr.responseType = "arraybuffer";
          if (xhr.overrideMimeType) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
          }
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
          if (xhr.response !== undefined) {
            return new Uint8Array(/** @type{Array<number>} */ (xhr.response || []));
          }
          return intArrayFromString(xhr.responseText ?? "", true);
        };
        var lazyArray = this;
        lazyArray.setDataGetter(chunkNum => {
          var start = chunkNum * chunkSize;
          var end = (chunkNum + 1) * chunkSize - 1;
          // including this byte
          end = Math.min(end, datalength - 1);
          // if datalength-1 is selected, this is the last block
          if (typeof lazyArray.chunks[chunkNum] === "undefined") {
            lazyArray.chunks[chunkNum] = doXHR(start, end);
          }
          if (typeof lazyArray.chunks[chunkNum] === "undefined") abort("doXHR failed!");
          return lazyArray.chunks[chunkNum];
        });
        if (usesGzip || !datalength) {
          // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
          chunkSize = datalength = 1;
          // this will force getter(0)/doXHR do download the whole file
          datalength = this.getter(0).length;
          chunkSize = datalength;
          out("LazyFiles on gzip forces download of the whole file when length is accessed");
        }
        this._length = datalength;
        this._chunkSize = chunkSize;
        this.lengthKnown = true;
      }
      get length() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._length;
      }
      get chunkSize() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._chunkSize;
      }
    }
    if (globalThis.XMLHttpRequest) {
      if (!ENVIRONMENT_IS_WORKER) abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");
      var lazyArray = new LazyUint8Array;
      var properties = {
        isDevice: false,
        contents: lazyArray
      };
    } else {
      var properties = {
        isDevice: false,
        url
      };
    }
    var node = FS.createFile(parent, name, properties, canRead, canWrite);
    // This is a total hack, but I want to get this lazy file code out of the
    // core of MEMFS. If we want to keep this lazy file concept I feel it should
    // be its own thin LAZYFS proxying calls to MEMFS.
    if (properties.contents) {
      node.contents = properties.contents;
    } else if (properties.url) {
      node.contents = null;
      node.url = properties.url;
    }
    // Add a function that defers querying the file size until it is asked the first time.
    Object.defineProperties(node, {
      usedBytes: {
        get: function() {
          return this.contents.length;
        }
      }
    });
    // override each stream op with one that tries to force load the lazy file first
    var stream_ops = {};
    for (const [key, fn] of Object.entries(node.stream_ops)) {
      stream_ops[key] = (...args) => {
        FS.forceLoadFile(node);
        return fn(...args);
      };
    }
    function writeChunks(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= contents.length) return 0;
      var size = Math.min(contents.length - position, length);
      assert(size >= 0);
      if (contents.slice) {
        // normal array
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents[position + i];
        }
      } else {
        for (var i = 0; i < size; i++) {
          // LazyUint8Array from sync binary XHR
          buffer[offset + i] = contents.get(position + i);
        }
      }
      return size;
    }
    // use a custom read function
    stream_ops.read = (stream, buffer, offset, length, position) => {
      FS.forceLoadFile(node);
      return writeChunks(stream, buffer, offset, length, position);
    };
    // use a custom mmap function
    stream_ops.mmap = (stream, length, position, prot, flags) => {
      FS.forceLoadFile(node);
      var ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48);
      }
      writeChunks(stream, (growMemViews(), HEAP8), ptr, length, position);
      return {
        ptr,
        allocated: true
      };
    };
    node.stream_ops = stream_ops;
    return node;
  }
};

var SYSCALLS = {
  currentUmask: 18,
  calculateAt(dirfd, path, allowEmpty = false) {
    if (PATH.isAbs(path)) {
      return path;
    }
    // relative path
    var dir;
    if (dirfd === -100) {
      dir = FS.cwd();
    } else {
      var dirstream = SYSCALLS.getStreamFromFD(dirfd);
      dir = dirstream.path;
    }
    if (path.length == 0) {
      if (!allowEmpty) {
        throw new FS.ErrnoError(44);
      }
      return dir;
    }
    return dir + "/" + path;
  },
  writeStat(buf, stat) {
    (growMemViews(), HEAPU32)[((buf) >> 2)] = stat.dev;
    checkInt32(stat.dev);
    (growMemViews(), HEAPU32)[(((buf) + (4)) >> 2)] = stat.mode;
    checkInt32(stat.mode);
    (growMemViews(), HEAPU32)[(((buf) + (8)) >> 2)] = stat.nlink;
    checkInt32(stat.nlink);
    (growMemViews(), HEAPU32)[(((buf) + (12)) >> 2)] = stat.uid;
    checkInt32(stat.uid);
    (growMemViews(), HEAPU32)[(((buf) + (16)) >> 2)] = stat.gid;
    checkInt32(stat.gid);
    (growMemViews(), HEAPU32)[(((buf) + (20)) >> 2)] = stat.rdev;
    checkInt32(stat.rdev);
    (growMemViews(), HEAP64)[(((buf) + (24)) >> 3)] = BigInt(stat.size);
    checkInt64(stat.size);
    (growMemViews(), HEAP32)[(((buf) + (32)) >> 2)] = 4096;
    checkInt32(4096);
    (growMemViews(), HEAP32)[(((buf) + (36)) >> 2)] = stat.blocks;
    checkInt32(stat.blocks);
    var atime = stat.atime.getTime();
    var mtime = stat.mtime.getTime();
    var ctime = stat.ctime.getTime();
    (growMemViews(), HEAP64)[(((buf) + (40)) >> 3)] = BigInt(Math.floor(atime / 1e3));
    checkInt64(Math.floor(atime / 1e3));
    (growMemViews(), HEAPU32)[(((buf) + (48)) >> 2)] = (atime % 1e3) * 1e3 * 1e3;
    checkInt32((atime % 1e3) * 1e3 * 1e3);
    (growMemViews(), HEAP64)[(((buf) + (56)) >> 3)] = BigInt(Math.floor(mtime / 1e3));
    checkInt64(Math.floor(mtime / 1e3));
    (growMemViews(), HEAPU32)[(((buf) + (64)) >> 2)] = (mtime % 1e3) * 1e3 * 1e3;
    checkInt32((mtime % 1e3) * 1e3 * 1e3);
    (growMemViews(), HEAP64)[(((buf) + (72)) >> 3)] = BigInt(Math.floor(ctime / 1e3));
    checkInt64(Math.floor(ctime / 1e3));
    (growMemViews(), HEAPU32)[(((buf) + (80)) >> 2)] = (ctime % 1e3) * 1e3 * 1e3;
    checkInt32((ctime % 1e3) * 1e3 * 1e3);
    (growMemViews(), HEAP64)[(((buf) + (88)) >> 3)] = BigInt(stat.ino);
    checkInt64(stat.ino);
    return 0;
  },
  writeStatFs(buf, stats) {
    (growMemViews(), HEAPU32)[(((buf) + (4)) >> 2)] = stats.bsize;
    checkInt32(stats.bsize);
    (growMemViews(), HEAPU32)[(((buf) + (60)) >> 2)] = stats.bsize;
    checkInt32(stats.bsize);
    (growMemViews(), HEAP64)[(((buf) + (8)) >> 3)] = BigInt(stats.blocks);
    checkInt64(stats.blocks);
    (growMemViews(), HEAP64)[(((buf) + (16)) >> 3)] = BigInt(stats.bfree);
    checkInt64(stats.bfree);
    (growMemViews(), HEAP64)[(((buf) + (24)) >> 3)] = BigInt(stats.bavail);
    checkInt64(stats.bavail);
    (growMemViews(), HEAP64)[(((buf) + (32)) >> 3)] = BigInt(stats.files);
    checkInt64(stats.files);
    (growMemViews(), HEAP64)[(((buf) + (40)) >> 3)] = BigInt(stats.ffree);
    checkInt64(stats.ffree);
    (growMemViews(), HEAPU32)[(((buf) + (48)) >> 2)] = stats.fsid;
    checkInt32(stats.fsid);
    (growMemViews(), HEAPU32)[(((buf) + (64)) >> 2)] = stats.flags;
    checkInt32(stats.flags);
    // ST_NOSUID
    (growMemViews(), HEAPU32)[(((buf) + (56)) >> 2)] = stats.namelen;
    checkInt32(stats.namelen);
  },
  doMsync(addr, stream, len, flags, offset) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    if (flags & 2) {
      // MAP_PRIVATE calls need not to be synced back to underlying fs
      return 0;
    }
    var buffer = (growMemViews(), HEAPU8).subarray(addr, addr + len);
    FS.msync(stream, buffer, offset, len, flags);
  },
  getStreamFromFD(fd) {
    var stream = FS.getStreamChecked(fd);
    return stream;
  },
  varargs: undefined,
  getStr(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  }
};

function ___syscall_dup3(fd, newfd, flags) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(3, 0, 1, fd, newfd, flags);
  try {
    if (fd === newfd) return -28;
    if (flags & ~524288) return -28;
    var old = SYSCALLS.getStreamFromFD(fd);
    // Check newfd is within range of valid open file descriptors.
    if (newfd < 0 || newfd >= FS_MAX_OPEN_FDS) return -8;
    var existing = FS.getStream(newfd);
    if (existing) FS.close(existing);
    var stream = FS.dupStream(old, newfd);
    if (flags & 524288) {
      stream.flags |= 524288;
    }
    return stream.fd;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

/** @type {!Int16Array} */ var HEAP16;

var syscallGetVarargI = () => {
  assert(SYSCALLS.varargs != undefined);
  // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
  var ret = (growMemViews(), HEAP32)[((+SYSCALLS.varargs) >> 2)];
  SYSCALLS.varargs += 4;
  return ret;
};

function ___syscall_fcntl64(fd, cmd, varargs) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(4, 0, 1, fd, cmd, varargs);
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (cmd) {
     case 0:
      {
        var arg = syscallGetVarargI();
        if (arg < 0) {
          return -28;
        }
        while (FS.streams[arg]) {
          arg++;
        }
        var newStream;
        newStream = FS.dupStream(stream, arg);
        return newStream.fd;
      }

     case 1:
     case 2:
      return 0;

     // FD_CLOEXEC makes no sense for a single process.
      case 3:
      return stream.flags;

     case 4:
      {
        var arg = syscallGetVarargI();
        var mask = 289792;
        stream.flags = (stream.flags & ~mask) | (arg & mask);
        return 0;
      }

     case 12:
      {
        var arg = syscallGetVarargP();
        var offset = 0;
        // We're always unlocked.
        (growMemViews(), HEAP16)[(((arg) + (offset)) >> 1)] = 2;
        checkInt16(2);
        return 0;
      }

     case 13:
     case 14:
      // Pretend that the locking is successful. These are process-level locks,
      // and Emscripten programs are a single process. If we supported linking a
      // filesystem between programs, we'd need to do more here.
      // See https://github.com/emscripten-core/emscripten/issues/23697
      return 0;
    }
    return -28;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_fstat64(fd, buf) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(5, 0, 1, fd, buf);
  try {
    return SYSCALLS.writeStat(buf, FS.fstat(fd));
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
  assert(typeof maxBytesToWrite === "number", "stringToUTF8 requires a third parameter that specifies the length of the output buffer");
  return stringToUTF8Array(str, (growMemViews(), HEAPU8), outPtr, maxBytesToWrite);
};

function ___syscall_getcwd(buf, size) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(6, 0, 1, buf, size);
  try {
    if (!size) return -28;
    var cwd = FS.cwd();
    var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
    if (size < cwdLengthInBytes) return -68;
    stringToUTF8(cwd, buf, size);
    return cwdLengthInBytes;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_getdents64(fd, dirp, count) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(7, 0, 1, fd, dirp, count);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    stream.getdents ||= FS.readdir(stream.path);
    var struct_size = 280;
    var pos = 0;
    var off = FS.llseek(stream, 0, 1);
    var startIdx = Math.floor(off / struct_size);
    var endIdx = Math.min(stream.getdents.length, startIdx + Math.floor(count / struct_size));
    for (var idx = startIdx; idx < endIdx; idx++) {
      var id;
      var type;
      var name = stream.getdents[idx];
      if (name === ".") {
        id = stream.node.id;
        type = 4;
      } else if (name === "..") {
        var lookup = FS.lookupPath(stream.path, {
          parent: true
        });
        id = lookup.node.id;
        type = 4;
      } else {
        var child;
        try {
          child = FS.lookupNode(stream.node, name);
        } catch (e) {
          // If the entry is not a directory, file, or symlink, nodefs
          // lookupNode will raise EINVAL. Skip these and continue.
          if (e?.errno === 28) {
            continue;
          }
          throw e;
        }
        id = child.id;
        type = FS.isChrdev(child.mode) ? 2 : // character device.
        FS.isDir(child.mode) ? 4 : // directory
        FS.isLink(child.mode) ? 10 : // symbolic link.
        8;
      }
      assert(id);
      (growMemViews(), HEAP64)[((dirp + pos) >> 3)] = BigInt(id);
      checkInt64(id);
      (growMemViews(), HEAP64)[(((dirp + pos) + (8)) >> 3)] = BigInt((idx + 1) * struct_size);
      checkInt64((idx + 1) * struct_size);
      (growMemViews(), HEAP16)[(((dirp + pos) + (16)) >> 1)] = 280;
      checkInt16(280);
      (growMemViews(), HEAP8)[(dirp + pos) + (18)] = type;
      checkInt8(type);
      stringToUTF8(name, dirp + pos + 19, 256);
      pos += struct_size;
    }
    FS.llseek(stream, idx * struct_size, 0);
    return pos;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_ioctl(fd, op, varargs) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(8, 0, 1, fd, op, varargs);
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (op) {
     case 21509:
      {
        if (!stream.tty) return -59;
        return 0;
      }

     case 21505:
      {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tcgets) {
          var termios = stream.tty.ops.ioctl_tcgets(stream);
          var argp = syscallGetVarargP();
          (growMemViews(), HEAP32)[((argp) >> 2)] = termios.c_iflag || 0;
          checkInt32(termios.c_iflag || 0);
          (growMemViews(), HEAP32)[(((argp) + (4)) >> 2)] = termios.c_oflag || 0;
          checkInt32(termios.c_oflag || 0);
          (growMemViews(), HEAP32)[(((argp) + (8)) >> 2)] = termios.c_cflag || 0;
          checkInt32(termios.c_cflag || 0);
          (growMemViews(), HEAP32)[(((argp) + (12)) >> 2)] = termios.c_lflag || 0;
          checkInt32(termios.c_lflag || 0);
          for (var i = 0; i < 32; i++) {
            (growMemViews(), HEAP8)[(argp + i) + (17)] = termios.c_cc[i] || 0;
            checkInt8(termios.c_cc[i] || 0);
          }
          return 0;
        }
        return 0;
      }

     case 21510:
     case 21511:
     case 21512:
      {
        if (!stream.tty) return -59;
        return 0;
      }

     case 21506:
     case 21507:
     case 21508:
      {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tcsets) {
          var argp = syscallGetVarargP();
          var c_iflag = (growMemViews(), HEAP32)[((argp) >> 2)];
          var c_oflag = (growMemViews(), HEAP32)[(((argp) + (4)) >> 2)];
          var c_cflag = (growMemViews(), HEAP32)[(((argp) + (8)) >> 2)];
          var c_lflag = (growMemViews(), HEAP32)[(((argp) + (12)) >> 2)];
          var c_cc = [];
          for (var i = 0; i < 32; i++) {
            c_cc.push((growMemViews(), HEAP8)[(argp + i) + (17)]);
          }
          return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
            c_iflag,
            c_oflag,
            c_cflag,
            c_lflag,
            c_cc
          });
        }
        return 0;
      }

     case 21519:
      {
        if (!stream.tty) return -59;
        var argp = syscallGetVarargP();
        (growMemViews(), HEAP32)[((argp) >> 2)] = 0;
        checkInt32(0);
        return 0;
      }

     case 21520:
      {
        if (!stream.tty) return -59;
        return -28;
      }

     case 21537:
     case 21531:
      {
        var argp = syscallGetVarargP();
        return FS.ioctl(stream, op, argp);
      }

     case 21523:
      {
        // TODO: in theory we should write to the winsize struct that gets
        // passed in, but for now musl doesn't read anything on it
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tiocgwinsz) {
          var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
          var argp = syscallGetVarargP();
          (growMemViews(), HEAP16)[((argp) >> 1)] = winsize[0];
          checkInt16(winsize[0]);
          (growMemViews(), HEAP16)[(((argp) + (2)) >> 1)] = winsize[1];
          checkInt16(winsize[1]);
        }
        return 0;
      }

     case 21524:
      {
        // TODO: technically, this ioctl call should change the window size.
        // but, since emscripten doesn't have any concept of a terminal window
        // yet, we'll just silently throw it away as we do TIOCGWINSZ
        if (!stream.tty) return -59;
        return 0;
      }

     case 21515:
      {
        if (!stream.tty) return -59;
        return 0;
      }

     default:
      return -28;
    }
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_lstat64(path, buf) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(9, 0, 1, path, buf);
  try {
    path = SYSCALLS.getStr(path);
    return SYSCALLS.writeStat(buf, FS.lstat(path));
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_mkdirat(dirfd, path, mode) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(10, 0, 1, dirfd, path, mode);
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    mode &= ~SYSCALLS.currentUmask;
    FS.mkdir(path, mode);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_newfstatat(dirfd, path, buf, flags) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(11, 0, 1, dirfd, path, buf, flags);
  try {
    path = SYSCALLS.getStr(path);
    var nofollow = flags & 256;
    var allowEmpty = flags & 4096;
    flags = flags & (~6400);
    assert(!flags, `unknown flags in __syscall_newfstatat: ${flags}`);
    path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
    return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_openat(dirfd, path, flags, varargs) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(12, 0, 1, dirfd, path, flags, varargs);
  SYSCALLS.varargs = varargs;
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    var mode = varargs ? syscallGetVarargI() : 0;
    if (flags & 64) {
      mode &= ~SYSCALLS.currentUmask;
    }
    return FS.open(path, flags, mode).fd;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(13, 0, 1, dirfd, path, buf, bufsize);
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    if (bufsize <= 0) return -28;
    var ret = FS.readlink(path);
    var len = Math.min(bufsize, lengthBytesUTF8(ret));
    var endChar = (growMemViews(), HEAP8)[buf + len];
    stringToUTF8(ret, buf, bufsize + 1);
    // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
    // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
    (growMemViews(), HEAP8)[buf + len] = endChar;
    return len;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_rmdir(path) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(14, 0, 1, path);
  try {
    path = SYSCALLS.getStr(path);
    FS.rmdir(path);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

function ___syscall_stat64(path, buf) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(15, 0, 1, path, buf);
  try {
    path = SYSCALLS.getStr(path);
    return SYSCALLS.writeStat(buf, FS.stat(path));
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var ___syscall_uname = buf => {
  if (!buf) {
    return -21;
  }
  var copyString = (offset, value) => stringToUTF8(value, buf + offset, 65);
  copyString(0, "Emscripten");
  copyString(65, "emscripten");
  copyString(130, "7.0.0");
  copyString(195, "#1");
  copyString(260, "wasm32");
  return 0;
};

function ___syscall_unlinkat(dirfd, path, flags) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(16, 0, 1, dirfd, path, flags);
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    if (!flags) {
      FS.unlink(path);
    } else if (flags === 512) {
      FS.rmdir(path);
    } else {
      return -28;
    }
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}

var getCppExceptionTag = () => ___cpp_exception;

var getCppExceptionThrownObjectFromWebAssemblyException = ex => {
  // In Wasm EH, the value extracted from WebAssembly.Exception is a pointer
  // to the unwind header. Convert it to the actual thrown value.
  var unwind_header = ex.getArg(getCppExceptionTag(), 0);
  return ___thrown_object_from_unwind_exception(unwind_header);
};

var decrementExceptionRefcount = ex => {
  var ptr = getCppExceptionThrownObjectFromWebAssemblyException(ex);
  ___cxa_decrement_exception_refcount(ptr);
};

var getExceptionMessageCommon = ptr => {
  var sp = stackSave();
  var type_addr_addr = stackAlloc(4);
  var message_addr_addr = stackAlloc(4);
  ___get_exception_message(ptr, type_addr_addr, message_addr_addr);
  var type_addr = (growMemViews(), HEAPU32)[((type_addr_addr) >> 2)];
  var message_addr = (growMemViews(), HEAPU32)[((message_addr_addr) >> 2)];
  var type = UTF8ToString(type_addr);
  _free(type_addr);
  var message;
  if (message_addr) {
    message = UTF8ToString(message_addr);
    _free(message_addr);
  }
  stackRestore(sp);
  return [ type, message ];
};

var getExceptionMessage = ex => {
  var ptr = getCppExceptionThrownObjectFromWebAssemblyException(ex);
  return getExceptionMessageCommon(ptr);
};

var incrementExceptionRefcount = ex => {
  var ptr = getCppExceptionThrownObjectFromWebAssemblyException(ex);
  ___cxa_increment_exception_refcount(ptr);
};

var ___throw_exception_with_stack_trace = ex => {
  var e = new WebAssembly.Exception(getCppExceptionTag(), [ ex ], {
    traceStack: true
  });
  e.message = getExceptionMessage(e);
  throw e;
};

var __abort_js = () => abort("native code called abort()");

var __emscripten_init_main_thread_js = tb => {
  var can_block = !ENVIRONMENT_IS_WEB;
  // Feature detect whether the main thread can block.
  try {
    Atomics.wait((growMemViews(), HEAP32), 0, 0, 0);
    can_block = true;
  } catch (e) {}
  // Pass the thread address to the native code where they are stored in wasm
  // globals which act as a form of TLS. Global constructors trying
  // to access this value will read the wrong value, but that is UB anyway.
  __emscripten_thread_init(tb, /*is_main=*/ !ENVIRONMENT_IS_WORKER, /*is_runtime=*/ 1, can_block, /*default_stacksize=*/ 8388608, /*start_profiling=*/ false);
  PThread.threadInitTLS();
};

var __emscripten_notify_mailbox_postmessage = (targetThread, currThreadId) => {
  if (targetThread == currThreadId) {
    setTimeout(checkMailbox);
  } else if (ENVIRONMENT_IS_PTHREAD) {
    postMessage({
      targetThread,
      cmd: CMD_CHECK_MAILBOX
    });
  } else {
    var worker = PThread.pthreads[targetThread];
    if (!worker) {
      err(`Cannot send message to thread with ID ${targetThread}, unknown thread ID!`);
      return;
    }
    worker.postMessage({
      cmd: CMD_CHECK_MAILBOX
    });
  }
};

var proxiedJSCallArgs = [];

var __emscripten_receive_on_main_thread_js = (funcIndex, emAsmAddr, callingThread, bufSize, args, ctx, ctxArgs) => {
  // Sometimes we need to backproxy events to the calling thread (e.g.
  // HTML5 DOM events handlers such as
  // emscripten_set_mousemove_callback()), so keep track in a globally
  // accessible variable about the thread that initiated the proxying.
  proxiedJSCallArgs.length = 0;
  var b = ((args) >> 3);
  var end = ((args + bufSize) >> 3);
  while (b < end) {
    var arg;
    if ((growMemViews(), HEAP64)[b++]) {
      // It's a BigInt.
      arg = (growMemViews(), HEAP64)[b++];
    } else {
      // It's a Number.
      arg = (growMemViews(), HEAPF64)[b++];
    }
    proxiedJSCallArgs.push(arg);
  }
  // Proxied JS library funcs use funcIndex and EM_ASM functions use emAsmAddr
  var func = emAsmAddr ? ASM_CONSTS[emAsmAddr] : proxiedFunctionTable[funcIndex];
  assert(!(funcIndex && emAsmAddr));
  assert(func.length == proxiedJSCallArgs.length, "Call args mismatch in _emscripten_receive_on_main_thread_js");
  PThread.currentProxiedOperationCallerThread = callingThread;
  var rtn = func(...proxiedJSCallArgs);
  PThread.currentProxiedOperationCallerThread = 0;
  var coerceRtn = rtn => rtn;
  if (ctx) {
    // A PROXY_SYNC_ASYNC function may complete synchronously with a plain value.
    Promise.resolve(rtn).then(rtn => __emscripten_run_js_on_main_thread_done(ctx, ctxArgs, coerceRtn(rtn)));
    return;
  }
  rtn = coerceRtn(rtn);
  // Proxied functions can return any type except bigint.  All other types
  // coerce to f64/double (the return type of this function in C) but not
  // bigint.
  assert(typeof rtn !== "bigint");
  return rtn;
};

var __emscripten_thread_cleanup = thread => {
  // Called when a thread needs to be cleaned up so it can be reused.
  // A thread is considered reusable when it either returns from its
  // entry point, calls pthread_exit, or acts upon a cancellation.
  // Detached threads are responsible for calling this themselves,
  // otherwise pthread_join is responsible for calling this.
  if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread); else postMessage({
    cmd: CMD_CLEANUP_THREAD,
    thread
  });
};

var __emscripten_thread_set_strongref = thread => {};

const INT53_MAX = 9007199254740992;

const INT53_MIN = -9007199254740992;

var bigintToI53Checked = num => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);

function __gmtime_js(time, tmPtr) {
  time = bigintToI53Checked(time);
  var date = new Date(time * 1e3);
  if (isNaN(date.getTime())) {
    return 1;
  }
  (growMemViews(), HEAP32)[((tmPtr) >> 2)] = date.getUTCSeconds();
  checkInt32(date.getUTCSeconds());
  (growMemViews(), HEAP32)[(((tmPtr) + (4)) >> 2)] = date.getUTCMinutes();
  checkInt32(date.getUTCMinutes());
  (growMemViews(), HEAP32)[(((tmPtr) + (8)) >> 2)] = date.getUTCHours();
  checkInt32(date.getUTCHours());
  (growMemViews(), HEAP32)[(((tmPtr) + (12)) >> 2)] = date.getUTCDate();
  checkInt32(date.getUTCDate());
  (growMemViews(), HEAP32)[(((tmPtr) + (16)) >> 2)] = date.getUTCMonth();
  checkInt32(date.getUTCMonth());
  (growMemViews(), HEAP32)[(((tmPtr) + (20)) >> 2)] = date.getUTCFullYear() - 1900;
  checkInt32(date.getUTCFullYear() - 1900);
  (growMemViews(), HEAP32)[(((tmPtr) + (24)) >> 2)] = date.getUTCDay();
  checkInt32(date.getUTCDay());
  var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
  var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
  (growMemViews(), HEAP32)[(((tmPtr) + (28)) >> 2)] = yday;
  checkInt32(yday);
  return 0;
}

var MONTH_DAYS_LEAP_CUMULATIVE = [ 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335 ];

var MONTH_DAYS_REGULAR_CUMULATIVE = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334 ];

var isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

var ydayFromDate = date => {
  var leap = isLeapYear(date.getFullYear());
  var monthDaysCumulative = (leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE);
  var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
  // -1 since it's days since Jan 1
  return yday;
};

function __localtime_js(time, tmPtr) {
  time = bigintToI53Checked(time);
  var date = new Date(time * 1e3);
  if (isNaN(date.getTime())) {
    return 1;
  }
  (growMemViews(), HEAP32)[((tmPtr) >> 2)] = date.getSeconds();
  checkInt32(date.getSeconds());
  (growMemViews(), HEAP32)[(((tmPtr) + (4)) >> 2)] = date.getMinutes();
  checkInt32(date.getMinutes());
  (growMemViews(), HEAP32)[(((tmPtr) + (8)) >> 2)] = date.getHours();
  checkInt32(date.getHours());
  (growMemViews(), HEAP32)[(((tmPtr) + (12)) >> 2)] = date.getDate();
  checkInt32(date.getDate());
  (growMemViews(), HEAP32)[(((tmPtr) + (16)) >> 2)] = date.getMonth();
  checkInt32(date.getMonth());
  (growMemViews(), HEAP32)[(((tmPtr) + (20)) >> 2)] = date.getFullYear() - 1900;
  checkInt32(date.getFullYear() - 1900);
  (growMemViews(), HEAP32)[(((tmPtr) + (24)) >> 2)] = date.getDay();
  checkInt32(date.getDay());
  var yday = ydayFromDate(date) | 0;
  (growMemViews(), HEAP32)[(((tmPtr) + (28)) >> 2)] = yday;
  checkInt32(yday);
  (growMemViews(), HEAP32)[(((tmPtr) + (36)) >> 2)] = -(date.getTimezoneOffset() * 60);
  checkInt32(-(date.getTimezoneOffset() * 60));
  // Attention: DST is in December in South, and some regions don't have DST at all.
  var start = new Date(date.getFullYear(), 0, 1);
  var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  var winterOffset = start.getTimezoneOffset();
  var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
  (growMemViews(), HEAP32)[(((tmPtr) + (32)) >> 2)] = dst;
  checkInt32(dst);
  return 0;
}

var __mktime_js = function(tmPtr) {
  var ret = ((() => {
    var date = new Date((growMemViews(), HEAP32)[(((tmPtr) + (20)) >> 2)] + 1900, (growMemViews(), 
    HEAP32)[(((tmPtr) + (16)) >> 2)], (growMemViews(), HEAP32)[(((tmPtr) + (12)) >> 2)], (growMemViews(), 
    HEAP32)[(((tmPtr) + (8)) >> 2)], (growMemViews(), HEAP32)[(((tmPtr) + (4)) >> 2)], (growMemViews(), 
    HEAP32)[((tmPtr) >> 2)], 0);
    if (isNaN(date.getTime())) {
      return -1;
    }
    // There's an ambiguous hour when the time goes back; the tm_isdst field is
    // used to disambiguate it.  Date() basically guesses, so we fix it up if it
    // guessed wrong, or fill in tm_isdst with the guess if it's -1.
    var dst = (growMemViews(), HEAP32)[(((tmPtr) + (32)) >> 2)];
    var guessedOffset = date.getTimezoneOffset();
    var start = new Date(date.getFullYear(), 0, 1);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dstOffset = Math.min(winterOffset, summerOffset);
    // DST is in December in South
    if (dst < 0) {
      // Attention: some regions don't have DST at all.
      dst = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
    } else if ((dst > 0) != (dstOffset == guessedOffset)) {
      var nonDstOffset = Math.max(winterOffset, summerOffset);
      var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
      // Don't try setMinutes(date.getMinutes() + ...) -- it's messed up.
      date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4);
      if (isNaN(date.getTime())) {
        return -1;
      }
    }
    (growMemViews(), HEAP32)[(((tmPtr) + (32)) >> 2)] = dst;
    checkInt32(dst);
    (growMemViews(), HEAP32)[(((tmPtr) + (24)) >> 2)] = date.getDay();
    checkInt32(date.getDay());
    var yday = ydayFromDate(date) | 0;
    (growMemViews(), HEAP32)[(((tmPtr) + (28)) >> 2)] = yday;
    checkInt32(yday);
    // To match expected behavior, update fields from date
    (growMemViews(), HEAP32)[((tmPtr) >> 2)] = date.getSeconds();
    checkInt32(date.getSeconds());
    (growMemViews(), HEAP32)[(((tmPtr) + (4)) >> 2)] = date.getMinutes();
    checkInt32(date.getMinutes());
    (growMemViews(), HEAP32)[(((tmPtr) + (8)) >> 2)] = date.getHours();
    checkInt32(date.getHours());
    (growMemViews(), HEAP32)[(((tmPtr) + (12)) >> 2)] = date.getDate();
    checkInt32(date.getDate());
    (growMemViews(), HEAP32)[(((tmPtr) + (16)) >> 2)] = date.getMonth();
    checkInt32(date.getMonth());
    (growMemViews(), HEAP32)[(((tmPtr) + (20)) >> 2)] = date.getYear();
    checkInt32(date.getYear());
    // Return time in seconds
    return date.getTime() / 1e3;
  }))();
  return BigInt(ret);
};

var __tzset_js = (timezone, daylight, std_name, dst_name) => {
  // TODO: Use (malleable) environment variables instead of system settings.
  var currentYear = (new Date).getFullYear();
  var winter = new Date(currentYear, 0, 1);
  var summer = new Date(currentYear, 6, 1);
  var winterOffset = winter.getTimezoneOffset();
  var summerOffset = summer.getTimezoneOffset();
  // Local standard timezone offset. Local standard time is not adjusted for
  // daylight savings.  This code uses the fact that getTimezoneOffset returns
  // a greater value during Standard Time versus Daylight Saving Time (DST).
  // Thus it determines the expected output during Standard Time, and it
  // compares whether the output of the given date the same (Standard) or less
  // (DST).
  var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  // timezone is specified as seconds west of UTC ("The external variable
  // `timezone` shall be set to the difference, in seconds, between
  // Coordinated Universal Time (UTC) and local standard time."), the same
  // as returned by stdTimezoneOffset.
  // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
  (growMemViews(), HEAPU32)[((timezone) >> 2)] = stdTimezoneOffset * 60;
  (growMemViews(), HEAP32)[((daylight) >> 2)] = Number(winterOffset != summerOffset);
  checkInt32(Number(winterOffset != summerOffset));
  var extractZone = timezoneOffset => {
    // Why inverse sign?
    // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
    var sign = timezoneOffset >= 0 ? "-" : "+";
    var absOffset = Math.abs(timezoneOffset);
    var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    var minutes = String(absOffset % 60).padStart(2, "0");
    return `UTC${sign}${hours}${minutes}`;
  };
  var winterName = extractZone(winterOffset);
  var summerName = extractZone(summerOffset);
  assert(winterName);
  assert(summerName);
  assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
  assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
  if (summerOffset < winterOffset) {
    // Northern hemisphere
    stringToUTF8(winterName, std_name, 17);
    stringToUTF8(summerName, dst_name, 17);
  } else {
    stringToUTF8(winterName, dst_name, 17);
    stringToUTF8(summerName, std_name, 17);
  }
};

var checkWasiClock = clock_id => clock_id >= 0 && clock_id <= 3;

const nowIsMonotonic = 1;

var _emscripten_date_now = () => Date.now();

var _emscripten_get_now = () => performance.timeOrigin + performance.now();

function _clock_time_get(clk_id, ignored_precision, ptime) {
  ignored_precision = bigintToI53Checked(ignored_precision);
  if (!checkWasiClock(clk_id)) {
    return 28;
  }
  var now;
  // all wasi clocks but realtime are monotonic
  if (clk_id === 0) {
    now = _emscripten_date_now();
  } else if (nowIsMonotonic) {
    now = _emscripten_get_now();
  } else {
    return 52;
  }
  // "now" is in ms, and wasi times are in ns.
  var nsec = Math.round(now * 1e6);
  (growMemViews(), HEAP64)[((ptime) >> 3)] = BigInt(nsec);
  checkInt64(nsec);
  return 0;
}

/** @type {function(?, ?): boolean} */ var hasOwn = Object.hasOwn;

const STACK_ALIGN = 16;

var readEmAsmArgsArray = [];

var readEmAsmArgs = (sigPtr, buf) => {
  // Nobody should have mutated _readEmAsmArgsArray underneath us to be something else than an array.
  assert(Array.isArray(readEmAsmArgsArray));
  // The input buffer is allocated on the stack, so it must be stack-aligned.
  assert(buf % STACK_ALIGN == 0);
  readEmAsmArgsArray.length = 0;
  var ch;
  // Most arguments are i32s, so shift the buffer pointer so it is a plain
  // index into HEAP32.
  while (ch = (growMemViews(), HEAPU8)[sigPtr++]) {
    var chr = String.fromCharCode(ch);
    var validChars = [ "d", "f", "i", "p" ];
    // In WASM_BIGINT mode we support passing i64 values as bigint.
    validChars.push("j");
    assert(validChars.includes(chr), `Invalid character ${ch}("${chr}") in readEmAsmArgs! Use only [${validChars}], and do not specify "v" for void return argument.`);
    // Floats are always passed as doubles, so all types except for 'i'
    // are 8 bytes and require alignment.
    var wide = (ch != 105);
    wide &= (ch != 112);
    buf += wide && (buf % 8) ? 4 : 0;
    readEmAsmArgsArray.push(// Special case for pointers under wasm64 or CAN_ADDRESS_2GB mode.
    ch == 112 ? (growMemViews(), HEAPU32)[((buf) >> 2)] : ch == 106 ? (growMemViews(), 
    HEAP64)[((buf) >> 3)] : ch == 105 ? (growMemViews(), HEAP32)[((buf) >> 2)] : (growMemViews(), 
    HEAPF64)[((buf) >> 3)]);
    buf += wide ? 8 : 4;
  }
  return readEmAsmArgsArray;
};

var runMainThreadEmAsm = (emAsmAddr, sigPtr, argbuf, sync) => {
  var args = readEmAsmArgs(sigPtr, argbuf);
  if (ENVIRONMENT_IS_PTHREAD) {
    // EM_ASM functions are variadic, receiving the actual arguments as a buffer
    // in memory. the last parameter (argBuf) points to that data. We need to
    // always un-variadify that, *before proxying*, as in the async case this
    // is a stack allocation that LLVM made, which may go away before the main
    // thread gets the message. For that reason we handle proxying *after* the
    // call to readEmAsmArgs, and therefore we do that manually here instead
    // of using __proxy. (And for simplicity, do the same in the sync
    // case as well, even though it's not strictly necessary, to keep the two
    // code paths as similar as possible on both sides.)
    return proxyToMainThread(0, emAsmAddr, sync, ...args);
  }
  assert(hasOwn(ASM_CONSTS, emAsmAddr), `No EM_ASM constant found at address ${emAsmAddr}.  The loaded WebAssembly file is likely out of sync with the generated JavaScript.`);
  return ASM_CONSTS[emAsmAddr](...args);
};

var _emscripten_asm_const_async_on_main_thread = (emAsmAddr, sigPtr, argbuf) => runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 0);

var _emscripten_check_blocking_allowed = () => {
  if (ENVIRONMENT_IS_WORKER) return;
  // Blocking in a worker/pthread is fine.
  warnOnce("Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread");
};

var _emscripten_err = str => err(UTF8ToString(str));

var runtimeKeepalivePush = () => {
  runtimeKeepaliveCounter += 1;
};

var _emscripten_exit_with_live_runtime = () => {
  runtimeKeepalivePush();
  throw "unwind";
};

class HandleAllocator {
  allocated=[ undefined ];
  freelist=[];
  get(id) {
    assert(this.allocated[id] !== undefined, `invalid handle: ${id}`);
    return this.allocated[id];
  }
  has(id) {
    return this.allocated[id] !== undefined;
  }
  allocate(handle) {
    var id = this.freelist.pop() ?? this.allocated.length;
    this.allocated[id] = handle;
    return id;
  }
  free(id) {
    assert(this.allocated[id] !== undefined);
    // Set the slot to `undefined` rather than using `delete` here since
    // apparently arrays with holes in them can be less efficient.
    this.allocated[id] = undefined;
    this.freelist.push(id);
  }
}

var Fetch = {
  async openDatabase(dbname, dbversion) {
    return new Promise((resolve, reject) => {
      try {
        var openRequest = indexedDB.open(dbname, dbversion);
      } catch (e) {
        return reject(e);
      }
      openRequest.onupgradeneeded = event => {
        var db = /** @type {IDBDatabase} */ (event.target.result);
        if (db.objectStoreNames.contains("FILES")) {
          db.deleteObjectStore("FILES");
        }
        db.createObjectStore("FILES");
      };
      openRequest.onsuccess = event => resolve(event.target.result);
      openRequest.onerror = reject;
    });
  },
  async init() {
    Fetch.xhrs = new HandleAllocator;
    if (ENVIRONMENT_IS_PTHREAD) return;
    addRunDependency("library_fetch_init");
    try {
      var db = await Fetch.openDatabase("emscripten_filesystem", 1);
      Fetch.dbInstance = db;
    } catch (e) {
      Fetch.dbInstance = false;
    } finally {
      removeRunDependency("library_fetch_init");
    }
  }
};

function _emscripten_fetch_free(id) {
  if (Fetch.xhrs.has(id)) {
    var xhr = Fetch.xhrs.get(id);
    Fetch.xhrs.free(id);
    // check if fetch is still in progress and should be aborted
    if (xhr.readyState > 0 && xhr.readyState < 4) {
      xhr.abort();
    }
  }
}

var getHeapMax = () => // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
// full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
// for any code that deals with heap sizes, which would require special
// casing all heap size related code to treat 0 specially.
2147483648;

var _emscripten_get_heap_max = () => getHeapMax();

var _emscripten_num_logical_cores = () => navigator["hardwareConcurrency"];

var alignMemory = (size, alignment) => {
  assert(alignment, "alignment argument is required");
  return Math.ceil(size / alignment) * alignment;
};

var growMemory = size => {
  var oldHeapSize = wasmMemory.buffer.byteLength;
  var pages = ((size - oldHeapSize + 65535) / 65536) | 0;
  try {
    // round size grow request up to wasm page size (fixed 64KB per spec)
    wasmMemory.grow(pages);
    // .grow() takes a delta compared to the previous size
    updateMemoryViews();
    return 1;
  } catch (e) {
    err(`growMemory: Attempted to grow heap from ${oldHeapSize} bytes to ${size} bytes, but got error: ${e}`);
  }
};

var _emscripten_resize_heap = requestedSize => {
  var oldSize = (growMemViews(), HEAPU8).length;
  // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
  requestedSize >>>= 0;
  // With multithreaded builds, races can happen (another thread might increase the size
  // in between), so return a failure, and let the caller retry.
  if (requestedSize <= oldSize) {
    return false;
  }
  // Memory resize rules:
  // 1.  Always increase heap size to at least the requested size, rounded up
  //     to next page multiple.
  // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
  //     geometrically: increase the heap size according to
  //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
  //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
  // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
  //     linearly: increase the heap size by at least
  //     MEMORY_GROWTH_LINEAR_STEP bytes.
  // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
  //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
  // 4.  If we were unable to allocate as much memory, it may be due to
  //     over-eager decision to excessively reserve due to (3) above.
  //     Hence if an allocation fails, cut down on the amount of excess
  //     growth, in an attempt to succeed to perform a smaller allocation.
  // A limit is set for how much we can grow. We should not exceed that
  // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
    return false;
  }
  // Loop through potential heap size increases. If we attempt a too eager
  // reservation that fails, cut down on the attempted size and reserve a
  // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
    // ensure geometric growth
    // but limit overreserving (default to capping at +96MB overgrowth at most)
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
    var t0 = _emscripten_get_now();
    var replacement = growMemory(newSize);
    var t1 = _emscripten_get_now();
    dbg(`Heap resize call from ${oldSize} to ${newSize} took ${(t1 - t0)} msecs. Success: ${!!replacement}`);
    if (replacement) {
      return true;
    }
  }
  err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
  return false;
};

/** @type {!Float32Array} */ var HEAPF32;

/** @type {!Uint16Array} */ var HEAPU16;

/** not-@type {!BigUint64Array} */ var HEAPU64;

var _emscripten_run_script = ptr => {
  eval(UTF8ToString(ptr));
};

/** @suppress{checkTypes} */ var _emscripten_run_script_int = ptr => eval(UTF8ToString(ptr)) | 0;

function fetchCacheData(/** @type {IDBDatabase} */ db, fetch, data, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return;
  }
  var fetch_attr = fetch + 108;
  var destinationPath = (growMemViews(), HEAPU32)[(((fetch_attr) + (64)) >> 2)];
  destinationPath ||= (growMemViews(), HEAPU32)[(((fetch) + (8)) >> 2)];
  var destinationPathStr = UTF8ToString(destinationPath);
  try {
    var transaction = db.transaction([ "FILES" ], "readwrite");
    var packages = transaction.objectStore("FILES");
    var putRequest = packages.put(data, destinationPathStr);
    putRequest.onsuccess = event => {
      (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
      checkInt16(4);
      // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 200;
      checkInt16(200);
      // Mimic XHR HTTP status code 200 "OK"
      stringToUTF8("OK", fetch + 44, 64);
      onsuccess(fetch, 0, destinationPathStr);
    };
    putRequest.onerror = error => {
      // Most likely we got an error if IndexedDB is unwilling to store any more data for this page.
      // TODO: Can we identify and break down different IndexedDB-provided errors and convert those
      // to more HTTP status codes for more information?
      (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
      checkInt16(4);
      // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 413;
      checkInt16(413);
      // Mimic XHR HTTP status code 413 "Payload Too Large"
      stringToUTF8("Payload Too Large", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch (e) {
    onerror(fetch, 0, e);
  }
}

var readI53FromI64 = ptr => (growMemViews(), HEAPU32)[((ptr) >> 2)] + (growMemViews(), 
HEAP32)[(((ptr) + (4)) >> 2)] * 4294967296;

var readI53FromU64 = ptr => (growMemViews(), HEAPU32)[((ptr) >> 2)] + (growMemViews(), 
HEAPU32)[(((ptr) + (4)) >> 2)] * 4294967296;

var writeI53ToI64 = (ptr, num) => {
  (growMemViews(), HEAPU32)[((ptr) >> 2)] = num;
  checkInt32(num);
  var lower = (growMemViews(), HEAPU32)[((ptr) >> 2)];
  (growMemViews(), HEAPU32)[(((ptr) + (4)) >> 2)] = (num - lower) / 4294967296;
  checkInt32((num - lower) / 4294967296);
  var deserialized = (num >= 0) ? readI53FromU64(ptr) : readI53FromI64(ptr);
  var offset = ((ptr) >> 2);
  if (deserialized != num) warnOnce(`writeI53ToI64() out of range: serialized JS Number ${num} to Wasm heap as bytes lo=${ptrToString((growMemViews(), 
  HEAPU32)[offset])}, hi=${ptrToString((growMemViews(), HEAPU32)[offset + 1])}, which deserializes back to ${deserialized} instead!`);
};

function fetchDeleteCachedData(db, fetch, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return;
  }
  var fetch_attr = fetch + 108;
  var path = (growMemViews(), HEAPU32)[(((fetch_attr) + (64)) >> 2)];
  path ||= (growMemViews(), HEAPU32)[(((fetch) + (8)) >> 2)];
  var pathStr = UTF8ToString(path);
  try {
    var transaction = db.transaction([ "FILES" ], "readwrite");
    var packages = transaction.objectStore("FILES");
    var request = packages.delete(pathStr);
    request.onsuccess = event => {
      var value = event.target.result;
      (growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)] = 0;
      writeI53ToI64(fetch + 16, 0);
      writeI53ToI64(fetch + 24, 0);
      writeI53ToI64(fetch + 32, 0);
      // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
      checkInt16(4);
      // Mimic XHR HTTP status code 200 "OK"
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 200;
      checkInt16(200);
      stringToUTF8("OK", fetch + 44, 64);
      onsuccess(fetch, 0, value);
    };
    request.onerror = error => {
      (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
      checkInt16(4);
      // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 404;
      checkInt16(404);
      // Mimic XHR HTTP status code 404 "Not Found"
      stringToUTF8("Not Found", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch (e) {
    onerror(fetch, 0, e);
  }
}

function fetchLoadCachedData(db, fetch, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return;
  }
  var fetch_attr = fetch + 108;
  var path = (growMemViews(), HEAPU32)[(((fetch_attr) + (64)) >> 2)];
  path ||= (growMemViews(), HEAPU32)[(((fetch) + (8)) >> 2)];
  var pathStr = UTF8ToString(path);
  try {
    var transaction = db.transaction([ "FILES" ], "readonly");
    var packages = transaction.objectStore("FILES");
    var getRequest = packages.get(pathStr);
    getRequest.onsuccess = event => {
      if (event.target.result) {
        var value = event.target.result;
        var len = value.byteLength || value.length;
        // The data pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
        // freed when emscripten_fetch_close() is called.
        var ptr = _malloc(len);
        (growMemViews(), HEAPU8).set(new Uint8Array(value), ptr);
        (growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)] = ptr;
        writeI53ToI64(fetch + 16, len);
        writeI53ToI64(fetch + 24, 0);
        writeI53ToI64(fetch + 32, len);
        (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
        checkInt16(4);
        // Mimic XHR readyState 4 === 'DONE: The operation is complete'
        (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 200;
        checkInt16(200);
        // Mimic XHR HTTP status code 200 "OK"
        stringToUTF8("OK", fetch + 44, 64);
        onsuccess(fetch, 0, value);
      } else {
        // Succeeded to load, but the load came back with the value of undefined, treat that as an error since we never store undefined in db.
        (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
        checkInt16(4);
        // Mimic XHR readyState 4 === 'DONE: The operation is complete'
        (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 404;
        checkInt16(404);
        // Mimic XHR HTTP status code 404 "Not Found"
        stringToUTF8("Not Found", fetch + 44, 64);
        onerror(fetch, 0, "no data");
      }
    };
    getRequest.onerror = error => {
      (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = 4;
      checkInt16(4);
      // Mimic XHR readyState 4 === 'DONE: The operation is complete'
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = 404;
      checkInt16(404);
      // Mimic XHR HTTP status code 404 "Not Found"
      stringToUTF8("Not Found", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch (e) {
    onerror(fetch, 0, e);
  }
}

var runtimeKeepalivePop = () => {
  assert(runtimeKeepaliveCounter > 0);
  runtimeKeepaliveCounter -= 1;
};

var stringToNewUTF8 = str => {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8(str, ret, size);
  return ret;
};

function fetchXHR(fetch, onsuccess, onerror, onprogress, onreadystatechange) {
  var url = (growMemViews(), HEAPU32)[(((fetch) + (8)) >> 2)];
  if (!url) {
    onerror(fetch, "no url specified!");
    return;
  }
  var url_ = UTF8ToString(url);
  var fetch_attr = fetch + 108;
  var requestMethod = UTF8ToString(fetch_attr + 0);
  requestMethod ||= "GET";
  var timeoutMsecs = (growMemViews(), HEAPU32)[(((fetch_attr) + (56)) >> 2)];
  var userName = (growMemViews(), HEAPU32)[(((fetch_attr) + (68)) >> 2)];
  var password = (growMemViews(), HEAPU32)[(((fetch_attr) + (72)) >> 2)];
  var requestHeaders = (growMemViews(), HEAPU32)[(((fetch_attr) + (76)) >> 2)];
  var overriddenMimeType = (growMemViews(), HEAPU32)[(((fetch_attr) + (80)) >> 2)];
  var dataPtr = (growMemViews(), HEAPU32)[(((fetch_attr) + (84)) >> 2)];
  var dataLength = (growMemViews(), HEAPU32)[(((fetch_attr) + (88)) >> 2)];
  var fetchAttributes = (growMemViews(), HEAPU32)[(((fetch_attr) + (52)) >> 2)];
  var fetchAttrLoadToMemory = !!(fetchAttributes & 1);
  var fetchAttrStreamData = !!(fetchAttributes & 2);
  var fetchAttrSynchronous = !!(fetchAttributes & 64);
  var userNameStr = userName ? UTF8ToString(userName) : undefined;
  var passwordStr = password ? UTF8ToString(password) : undefined;
  var xhr = new XMLHttpRequest;
  xhr.withCredentials = !!(growMemViews(), HEAPU8)[(fetch_attr) + (60)];
  xhr._streamData = fetchAttrStreamData;
  xhr.open(requestMethod, url_, !fetchAttrSynchronous, userNameStr, passwordStr);
  if (!fetchAttrSynchronous) xhr.timeout = timeoutMsecs;
  // XHR timeout field is only accessible in async XHRs, and must be set after .open() but before .send().
  xhr.url_ = url_;
  // Save the url for debugging purposes (and for comparing to the responseURL that server side advertised)
  assert(!fetchAttrStreamData, "streaming is only supported when FETCH_STREAMING is enabled");
  xhr.responseType = "arraybuffer";
  if (overriddenMimeType) {
    var overriddenMimeTypeStr = UTF8ToString(overriddenMimeType);
    xhr.overrideMimeType(overriddenMimeTypeStr);
  }
  if (requestHeaders) {
    for (;;) {
      var key = (growMemViews(), HEAPU32)[((requestHeaders) >> 2)];
      if (!key) break;
      var value = (growMemViews(), HEAPU32)[(((requestHeaders) + (4)) >> 2)];
      if (!value) break;
      requestHeaders += 8;
      var keyStr = UTF8ToString(key);
      var valueStr = UTF8ToString(value);
      xhr.setRequestHeader(keyStr, valueStr);
    }
  }
  var id = Fetch.xhrs.allocate(xhr);
  (growMemViews(), HEAPU32)[((fetch) >> 2)] = id;
  checkInt32(id);
  var data = (dataPtr && dataLength) ? (growMemViews(), HEAPU8).slice(dataPtr, dataPtr + dataLength) : null;
  // TODO: Support specifying custom headers to the request.
  // Share the code to save the response, as we need to do so both on success
  // and on error (despite an error, there may be a response, like a 404 page).
  // This receives a condition, which determines whether to save the xhr's
  // response, or just 0.
  function saveResponseAndStatus() {
    var ptr = 0;
    var ptrLen = 0;
    if (xhr.response && fetchAttrLoadToMemory && (growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)] === 0) {
      ptrLen = xhr.response.byteLength;
    }
    if (ptrLen > 0) {
      // The data pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
      // freed when emscripten_fetch_close() is called.
      ptr = _realloc((growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)], ptrLen);
      (growMemViews(), HEAPU8).set(new Uint8Array(/** @type{Array<number>} */ (xhr.response)), ptr);
    }
    (growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)] = ptr;
    writeI53ToI64(fetch + 16, ptrLen);
    writeI53ToI64(fetch + 24, 0);
    var len = xhr.response?.byteLength ?? 0;
    if (len) {
      // If the final XHR.onload handler receives the bytedata to compute total length, report that,
      // otherwise don't write anything out here, which will retain the latest byte size reported in
      // the most recent XHR.onprogress handler.
      writeI53ToI64(fetch + 32, len);
    }
    (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = xhr.readyState;
    checkInt16(xhr.readyState);
    (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = xhr.status;
    checkInt16(xhr.status);
    if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
    if (fetchAttrSynchronous) {
      // The response url pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
      // freed when emscripten_fetch_close() is called.
      var ruPtr = stringToNewUTF8(xhr.responseURL);
      (growMemViews(), HEAPU32)[(((fetch) + (200)) >> 2)] = ruPtr;
    }
  }
  xhr.onload = e => {
    // check if xhr was aborted by user and don't try to call back
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    saveResponseAndStatus();
    if (xhr.status >= 200 && xhr.status < 300) {
      if (fetchAttrStreamData) {
        assert(xhr.response === null);
      }
      onsuccess(fetch, xhr, e);
    } else {
      onerror(fetch, e);
    }
  };
  xhr.onerror = e => {
    // check if xhr was aborted by user and don't try to call back
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    saveResponseAndStatus();
    onerror(fetch, e);
  };
  xhr.ontimeout = e => {
    // check if xhr was aborted by user and don't try to call back
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    onerror(fetch, e);
  };
  xhr.onprogress = e => {
    // check if xhr was aborted by user and don't try to call back
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    var ptrLen = (fetchAttrLoadToMemory && fetchAttrStreamData) ? xhr.response?.byteLength ?? 0 : 0;
    // Specifies the maximum chunk size that a streaming fetch will transfer from
    // JS over to WebAssembly side. Used to cap a streaming fetch to avoid
    // overallocating WebAssembly memory needlessly.
    const FETCH_STREAMING_MAX_CHUNK_SIZE = 8 * 1024 * 1024;
    for (var bytePos = 0; bytePos < ptrLen || !ptrLen; ) {
      var sz = Math.min(ptrLen - bytePos, FETCH_STREAMING_MAX_CHUNK_SIZE);
      var ptr = 0;
      if (sz > 0 && fetchAttrLoadToMemory && fetchAttrStreamData) {
        // Even though we are doing a streaming fetch (i.e. in small chunks), Safari may call onprogress with a huge
        // chunk size. This will be a problem for Wasm applications that intend to use streaming fetch to process
        // an input file in small chunks (to avoid blowing up the WebAssembly heap size). Therefore apply a max
        // chunk size ceiling to the received chunks, and transfer the data over to WebAssembly using max sized chunks.
        assert(onprogress, "streaming fetch requires an onprogress handler");
        // The data pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
        // freed when emscripten_fetch_close() is called.
        ptr = _realloc((growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)], sz);
        (growMemViews(), HEAPU8).set(new Uint8Array(/** @type{Array<number>} */ (xhr.response), bytePos, sz), ptr);
      }
      (growMemViews(), HEAPU32)[(((fetch) + (12)) >> 2)] = ptr;
      writeI53ToI64(fetch + 16, sz);
      writeI53ToI64(fetch + 24, e.loaded - ptrLen + bytePos);
      writeI53ToI64(fetch + 32, e.total);
      (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = xhr.readyState;
      checkInt16(xhr.readyState);
      var status = xhr.status;
      // If loading files from a source that does not give HTTP status code, assume success if we get data bytes
      if (xhr.readyState >= 3 && xhr.status === 0 && e.loaded > 0) status = 200;
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = status;
      checkInt16(status);
      if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
      onprogress(fetch, e);
      bytePos += sz;
      if (!ptrLen) break;
    }
  };
  xhr.onreadystatechange = e => {
    // check if xhr was aborted by user and don't try to call back
    if (!Fetch.xhrs.has(id)) {
      runtimeKeepalivePop();
      return;
    }
    (growMemViews(), HEAP16)[(((fetch) + (40)) >> 1)] = xhr.readyState;
    checkInt16(xhr.readyState);
    if (xhr.readyState >= 2) {
      (growMemViews(), HEAP16)[(((fetch) + (42)) >> 1)] = xhr.status;
      checkInt16(xhr.status);
    }
    if (!fetchAttrSynchronous && (xhr.readyState === 2 && xhr.responseURL.length > 0)) {
      // The response url pointer malloc()ed here has the same lifetime as the emscripten_fetch_t structure itself has, and is
      // freed when emscripten_fetch_close() is called.
      var ruPtr = stringToNewUTF8(xhr.responseURL);
      (growMemViews(), HEAPU32)[(((fetch) + (200)) >> 2)] = ruPtr;
    }
    onreadystatechange(fetch, e);
  };
  try {
    xhr.send(data);
  } catch (e) {
    onerror(fetch, e);
  }
}

function _emscripten_start_fetch(fetch, successcb, errorcb, progresscb, readystatechangecb) {
  // Avoid shutting down the runtime since we want to wait for the async
  // response.
  runtimeKeepalivePush();
  var fetch_attr = fetch + 108;
  var onsuccess = (growMemViews(), HEAPU32)[(((fetch_attr) + (36)) >> 2)];
  var onerror = (growMemViews(), HEAPU32)[(((fetch_attr) + (40)) >> 2)];
  var onprogress = (growMemViews(), HEAPU32)[(((fetch_attr) + (44)) >> 2)];
  var onreadystatechange = (growMemViews(), HEAPU32)[(((fetch_attr) + (48)) >> 2)];
  var fetchAttributes = (growMemViews(), HEAPU32)[(((fetch_attr) + (52)) >> 2)];
  var fetchAttrSynchronous = !!(fetchAttributes & 64);
  function doCallback(f) {
    if (fetchAttrSynchronous) {
      f();
    } else {
      callUserCallback(f);
    }
  }
  var reportSuccess = (fetch, xhr, e) => {
    runtimeKeepalivePop();
    doCallback(() => {
      if (onsuccess) getWasmTableEntry(onsuccess)(fetch); else successcb?.(fetch);
    });
  };
  var reportProgress = (fetch, e) => {
    doCallback(() => {
      if (onprogress) getWasmTableEntry(onprogress)(fetch); else progresscb?.(fetch);
    });
  };
  var reportError = (fetch, e) => {
    runtimeKeepalivePop();
    doCallback(() => {
      if (onerror) getWasmTableEntry(onerror)(fetch); else errorcb?.(fetch);
    });
  };
  var reportReadyStateChange = (fetch, e) => {
    doCallback(() => {
      if (onreadystatechange) getWasmTableEntry(onreadystatechange)(fetch); else readystatechangecb?.(fetch);
    });
  };
  var performUncachedXhr = (fetch, xhr, e) => {
    fetchXHR(fetch, reportSuccess, reportError, reportProgress, reportReadyStateChange);
  };
  var cacheResultAndReportSuccess = (fetch, xhr, e) => {
    var storeSuccess = (fetch, xhr, e) => {
      runtimeKeepalivePop();
      doCallback(() => {
        if (onsuccess) getWasmTableEntry(onsuccess)(fetch); else successcb?.(fetch);
      });
    };
    var storeError = (fetch, xhr, e) => {
      runtimeKeepalivePop();
      doCallback(() => {
        if (onsuccess) getWasmTableEntry(onsuccess)(fetch); else successcb?.(fetch);
      });
    };
    fetchCacheData(Fetch.dbInstance, fetch, xhr.response, storeSuccess, storeError);
  };
  var performCachedXhr = (fetch, xhr, e) => {
    fetchXHR(fetch, cacheResultAndReportSuccess, reportError, reportProgress, reportReadyStateChange);
  };
  var requestMethod = UTF8ToString(fetch_attr + 0);
  var fetchAttrReplace = !!(fetchAttributes & 16);
  var fetchAttrPersistFile = !!(fetchAttributes & 4);
  var fetchAttrNoDownload = !!(fetchAttributes & 32);
  if (requestMethod === "EM_IDB_STORE") {
    var ptr = (growMemViews(), HEAPU32)[(((fetch_attr) + (84)) >> 2)];
    var size = (growMemViews(), HEAPU32)[(((fetch_attr) + (88)) >> 2)];
    // Storing shared or resizable typed arrays to IndexedDB is not allowed, so use getHeapViewOrCopy.
    fetchCacheData(Fetch.dbInstance, fetch, (growMemViews(), HEAPU8).slice(ptr, ptr + size), reportSuccess, reportError);
  } else if (requestMethod === "EM_IDB_DELETE") {
    fetchDeleteCachedData(Fetch.dbInstance, fetch, reportSuccess, reportError);
  } else if (!fetchAttrReplace) {
    fetchLoadCachedData(Fetch.dbInstance, fetch, reportSuccess, fetchAttrNoDownload ? reportError : (fetchAttrPersistFile ? performCachedXhr : performUncachedXhr));
  } else if (!fetchAttrNoDownload) {
    fetchXHR(fetch, fetchAttrPersistFile ? cacheResultAndReportSuccess : reportSuccess, reportError, reportProgress, reportReadyStateChange);
  } else {
    return 0;
  }
  return fetch;
}

var ENV = {};

var getExecutableName = () => thisProgram;

var getEnvStrings = () => {
  if (!getEnvStrings.strings) {
    // Default values.
    var lang = (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8";
    var env = {
      "USER": "web_user",
      "LOGNAME": "web_user",
      "PATH": "/",
      "PWD": "/",
      "HOME": "/home/web_user",
      "LANG": lang,
      "_": getExecutableName()
    };
    // Apply the user-provided values, if any.
    for (var x in ENV) {
      // x is a key in ENV; if ENV[x] is undefined, that means it was
      // explicitly set to be so. We allow user code to do that to
      // force variables with default values to remain unset.
      if (ENV[x] === undefined) delete env[x]; else env[x] = ENV[x];
    }
    var strings = [];
    for (var x in env) {
      strings.push(`${x}=${env[x]}`);
    }
    getEnvStrings.strings = strings;
  }
  return getEnvStrings.strings;
};

function _environ_get(__environ, environ_buf) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(17, 0, 1, __environ, environ_buf);
  var bufSize = 0;
  var envp = 0;
  for (var string of getEnvStrings()) {
    var ptr = environ_buf + bufSize;
    (growMemViews(), HEAPU32)[(((__environ) + (envp)) >> 2)] = ptr;
    bufSize += stringToUTF8(string, ptr, Infinity) + 1;
    envp += 4;
  }
  return 0;
}

function _environ_sizes_get(penviron_count, penviron_buf_size) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(18, 0, 1, penviron_count, penviron_buf_size);
  var strings = getEnvStrings();
  (growMemViews(), HEAPU32)[((penviron_count) >> 2)] = strings.length;
  checkInt32(strings.length);
  var bufSize = 0;
  for (var string of strings) {
    bufSize += lengthBytesUTF8(string) + 1;
  }
  (growMemViews(), HEAPU32)[((penviron_buf_size) >> 2)] = bufSize;
  checkInt32(bufSize);
  return 0;
}

function _fd_close(fd) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(19, 0, 1, fd);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.close(stream);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

/** @param {number=} offset */ var doReadv = (stream, iov, iovcnt, offset) => {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = (growMemViews(), HEAPU32)[((iov) >> 2)];
    var len = (growMemViews(), HEAPU32)[(((iov) + (4)) >> 2)];
    iov += 8;
    try {
      var curr = FS.read(stream, (growMemViews(), HEAP8), ptr, len, offset);
    } catch (e) {
      // On a non-blocking stream a subsequent read may would-block after we
      // already gathered data. POSIX readv is a single gather-read: return
      // what we have rather than failing the whole call.
      if (ret > 0 && e instanceof FS.ErrnoError && (e.errno == 6 || e.errno == 6)) {
        break;
      }
      throw e;
    }
    if (curr < 0) return -1;
    ret += curr;
    if (curr < len) break;
    // nothing more to read
    if (typeof offset !== "undefined") {
      offset += curr;
    }
  }
  return ret;
};

function _fd_read(fd, iov, iovcnt, pnum) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(20, 0, 1, fd, iov, iovcnt, pnum);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doReadv(stream, iov, iovcnt);
    (growMemViews(), HEAPU32)[((pnum) >> 2)] = num;
    checkInt32(num);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

function _fd_seek(fd, offset, whence, newOffset) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(21, 0, 1, fd, offset, whence, newOffset);
  offset = bigintToI53Checked(offset);
  try {
    if (isNaN(offset)) return 22;
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.llseek(stream, offset, whence);
    (growMemViews(), HEAP64)[((newOffset) >> 3)] = BigInt(stream.position);
    checkInt64(stream.position);
    if (stream.getdents && !offset && whence === 0) stream.getdents = null;
    // reset readdir state
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

/** @param {number=} offset */ var doWritev = (stream, iov, iovcnt, offset) => {
  // Gather all iovecs into one contiguous buffer and issue a single
  // FS.write, matching POSIX writev's single gather-write semantics (as
  // __syscall_sendmsg already does). Per-iovec writes fragment a stream
  // socket send into multiple segments, breaking stream byte semantics.
  if (iovcnt == 1) {
    // Single iovec: write directly from HEAP8, no gather buffer needed.
    return FS.write(stream, (growMemViews(), HEAP8), (growMemViews(), HEAPU32)[((iov) >> 2)], (growMemViews(), 
    HEAPU32)[(((iov) + (4)) >> 2)], offset);
  }
  var total = 0;
  for (var i = 0, p = iov; i < iovcnt; i++, p += 8) {
    total += (growMemViews(), HEAPU32)[(((p) + (4)) >> 2)];
  }
  var view = new Uint8Array(total);
  var voff = 0;
  for (var i = 0; i < iovcnt; i++, iov += 8) {
    var ptr = (growMemViews(), HEAPU32)[((iov) >> 2)];
    var len = (growMemViews(), HEAPU32)[(((iov) + (4)) >> 2)];
    view.set((growMemViews(), HEAPU8).subarray(ptr, ptr + len), voff);
    voff += len;
  }
  return FS.write(stream, view, 0, total, offset);
};

function _fd_write(fd, iov, iovcnt, pnum) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(22, 0, 1, fd, iov, iovcnt, pnum);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doWritev(stream, iov, iovcnt);
    (growMemViews(), HEAPU32)[((pnum) >> 2)] = num;
    checkInt32(num);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}

var inetPton4 = str => {
  var b = str.split(".");
  for (var i = 0; i < 4; i++) {
    var tmp = Number(b[i]);
    if (isNaN(tmp)) return null;
    b[i] = tmp;
  }
  return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
};

var inetPton6 = str => {
  var words;
  var w, offset, z, i;
  /* http://home.deds.nl/~aeron/regex/ */ var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
  var parts = [];
  if (!valid6regx.test(str)) {
    return null;
  }
  if (str === "::") {
    return [ 0, 0, 0, 0, 0, 0, 0, 0 ];
  }
  // Z placeholder to keep track of zeros when splitting the string on ':'
  if (str.startsWith("::")) {
    str = str.replace("::", "Z:");
  } else {
    str = str.replace("::", ":Z:");
  }
  if (str.indexOf(".") > 0) {
    // parse IPv4 embedded address
    str = str.replace(new RegExp("[.]", "g"), ":");
    words = str.split(":");
    words[words.length - 4] = Number(words[words.length - 4]) + Number(words[words.length - 3]) * 256;
    words[words.length - 3] = Number(words[words.length - 2]) + Number(words[words.length - 1]) * 256;
    words = words.slice(0, words.length - 2);
  } else {
    words = str.split(":");
  }
  offset = 0;
  z = 0;
  for (w = 0; w < words.length; w++) {
    if (typeof words[w] === "string") {
      if (words[w] === "Z") {
        // compressed zeros - write appropriate number of zero words
        for (z = 0; z < (8 - words.length + 1); z++) {
          parts[w + z] = 0;
        }
        offset = z - 1;
      } else {
        // parse hex field to 16-bit value and write it in network byte-order
        parts[w + offset] = _htons(parseInt(words[w], 16));
      }
    } else {
      // parsed IPv4 words
      parts[w + offset] = words[w];
    }
  }
  return [ (parts[1] << 16) | parts[0], (parts[3] << 16) | parts[2], (parts[5] << 16) | parts[4], (parts[7] << 16) | parts[6] ];
};

var DNS = {
  address_map: {
    id: 1,
    addrs: {},
    names: {}
  },
  lookup_name(name) {
    // If the name is already a valid ipv4 / ipv6 address, don't generate a fake one.
    var res = inetPton4(name);
    if (res !== null) {
      return name;
    }
    res = inetPton6(name);
    if (res !== null) {
      return name;
    }
    // See if this name is already mapped.
    var addr;
    if (DNS.address_map.addrs[name]) {
      addr = DNS.address_map.addrs[name];
    } else {
      var id = DNS.address_map.id++;
      assert(id < 65535, "exceeded max address mappings of 65535");
      addr = "172.29." + (id & 255) + "." + (id & 65280);
      DNS.address_map.names[addr] = name;
      DNS.address_map.addrs[name] = addr;
    }
    return addr;
  },
  lookup_addr(addr) {
    if (DNS.address_map.names[addr]) {
      return DNS.address_map.names[addr];
    }
    return null;
  }
};

var inetNtop4 = addr => (addr & 255) + "." + ((addr >> 8) & 255) + "." + ((addr >> 16) & 255) + "." + ((addr >> 24) & 255);

var inetNtop6 = ints => {
  //  ref:  http://www.ietf.org/rfc/rfc2373.txt - section 2.5.4
  //  Format for IPv4 compatible and mapped  128-bit IPv6 Addresses
  //  128-bits are split into eight 16-bit words
  //  stored in network byte order (big-endian)
  //  |                80 bits               | 16 |      32 bits        |
  //  +-----------------------------------------------------------------+
  //  |               10 bytes               |  2 |      4 bytes        |
  //  +--------------------------------------+--------------------------+
  //  +               5 words                |  1 |      2 words        |
  //  +--------------------------------------+--------------------------+
  //  |0000..............................0000|0000|    IPv4 ADDRESS     | (compatible)
  //  +--------------------------------------+----+---------------------+
  //  |0000..............................0000|FFFF|    IPv4 ADDRESS     | (mapped)
  //  +--------------------------------------+----+---------------------+
  var str = "";
  var word = 0;
  var longest = 0;
  var lastzero = 0;
  var zstart = 0;
  var len = 0;
  var i = 0;
  var parts = [ ints[0] & 65535, (ints[0] >> 16), ints[1] & 65535, (ints[1] >> 16), ints[2] & 65535, (ints[2] >> 16), ints[3] & 65535, (ints[3] >> 16) ];
  // Handle IPv4-compatible, IPv4-mapped, loopback and any/unspecified addresses
  var hasipv4 = true;
  var v4part = "";
  // check if the 10 high-order bytes are all zeros (first 5 words)
  for (i = 0; i < 5; i++) {
    if (parts[i]) {
      hasipv4 = false;
      break;
    }
  }
  if (hasipv4) {
    // low-order 32-bits store an IPv4 address (bytes 13 to 16) (last 2 words)
    v4part = inetNtop4(parts[6] | (parts[7] << 16));
    // IPv4-mapped IPv6 address if 16-bit value (bytes 11 and 12) == 0xFFFF (6th word)
    if (parts[5] === -1) {
      str = "::ffff:";
      str += v4part;
      return str;
    }
    // IPv4-compatible IPv6 address if 16-bit value (bytes 11 and 12) == 0x0000 (6th word)
    if (!parts[5]) {
      str = "::";
      // special case IPv6 addresses
      if (v4part === "0.0.0.0") v4part = "";
      // any/unspecified address
      if (v4part === "0.0.0.1") v4part = "1";
      // loopback address
      str += v4part;
      return str;
    }
  }
  // Handle all other IPv6 addresses
  // first run to find the longest contiguous zero words
  for (word = 0; word < 8; word++) {
    if (!parts[word]) {
      if (word - lastzero > 1) {
        len = 0;
      }
      lastzero = word;
      len++;
    }
    if (len > longest) {
      longest = len;
      zstart = word - longest + 1;
    }
  }
  for (word = 0; word < 8; word++) {
    if (longest > 1) {
      // compress contiguous zeros - to produce '::'
      if (!parts[word] && word >= zstart && word < (zstart + longest)) {
        if (word === zstart) {
          str += ":";
          if (!zstart) str += ":";
        }
        continue;
      }
    }
    // converts 16-bit words from big-endian to little-endian before converting to hex string
    str += Number(_ntohs(parts[word] & 65535)).toString(16);
    str += word < 7 ? ":" : "";
  }
  return str;
};

var zeroMemory = (ptr, size) => (growMemViews(), HEAPU8).fill(0, ptr, ptr + size);

/** @param {number=} addrlen */ var writeSockaddr = (sa, family, addr, port, addrlen) => {
  switch (family) {
   case 2:
    // The address may still be an unresolved hostname (e.g. a peer name
    // recorded at connect time); map it to its fake IP here so callers can
    // pass names and IPs alike. Real sockets only ever see numeric addresses.
    addr = inetPton4(DNS.lookup_name(addr));
    zeroMemory(sa, 16);
    if (addrlen) {
      (growMemViews(), HEAP32)[((addrlen) >> 2)] = 16;
      checkInt32(16);
    }
    (growMemViews(), HEAP16)[((sa) >> 1)] = family;
    checkInt16(family);
    (growMemViews(), HEAP32)[(((sa) + (4)) >> 2)] = addr;
    checkInt32(addr);
    (growMemViews(), HEAP16)[(((sa) + (2)) >> 1)] = _htons(port);
    checkInt16(_htons(port));
    break;

   case 10:
    addr = inetPton6(DNS.lookup_name(addr));
    zeroMemory(sa, 28);
    if (addrlen) {
      (growMemViews(), HEAP32)[((addrlen) >> 2)] = 28;
      checkInt32(28);
    }
    (growMemViews(), HEAP32)[((sa) >> 2)] = family;
    checkInt32(family);
    (growMemViews(), HEAP32)[(((sa) + (8)) >> 2)] = addr[0];
    checkInt32(addr[0]);
    (growMemViews(), HEAP32)[(((sa) + (12)) >> 2)] = addr[1];
    checkInt32(addr[1]);
    (growMemViews(), HEAP32)[(((sa) + (16)) >> 2)] = addr[2];
    checkInt32(addr[2]);
    (growMemViews(), HEAP32)[(((sa) + (20)) >> 2)] = addr[3];
    checkInt32(addr[3]);
    (growMemViews(), HEAP16)[(((sa) + (2)) >> 1)] = _htons(port);
    checkInt16(_htons(port));
    break;

   default:
    return 5;
  }
  return 0;
};

function _getaddrinfo(node, service, hint, out) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(23, 0, 1, node, service, hint, out);
  // Note getaddrinfo currently only returns a single addrinfo with ai_next defaulting to NULL. When NULL
  // hints are specified or ai_family set to AF_UNSPEC or ai_socktype or ai_protocol set to 0 then we
  // really should provide a linked list of suitable addrinfo values.
  var addrs = [];
  var canon = null;
  var addr = 0;
  var port = 0;
  var flags = 0;
  var family = 0;
  var type = 0;
  var proto = 0;
  var ai, last;
  function allocaddrinfo(family, type, proto, canon, addr, port) {
    var sa, salen, ai;
    var errno;
    salen = family === 10 ? 28 : 16;
    addr = family === 10 ? inetNtop6(addr) : inetNtop4(addr);
    sa = _malloc(salen);
    errno = writeSockaddr(sa, family, addr, port);
    assert(!errno);
    ai = _malloc(32);
    (growMemViews(), HEAP32)[(((ai) + (4)) >> 2)] = family;
    checkInt32(family);
    (growMemViews(), HEAP32)[(((ai) + (8)) >> 2)] = type;
    checkInt32(type);
    (growMemViews(), HEAP32)[(((ai) + (12)) >> 2)] = proto;
    checkInt32(proto);
    (growMemViews(), HEAPU32)[(((ai) + (24)) >> 2)] = canon;
    (growMemViews(), HEAPU32)[(((ai) + (20)) >> 2)] = sa;
    if (family === 10) {
      (growMemViews(), HEAP32)[(((ai) + (16)) >> 2)] = 28;
      checkInt32(28);
    } else {
      (growMemViews(), HEAP32)[(((ai) + (16)) >> 2)] = 16;
      checkInt32(16);
    }
    (growMemViews(), HEAP32)[(((ai) + (28)) >> 2)] = 0;
    checkInt32(0);
    return ai;
  }
  if (hint) {
    flags = (growMemViews(), HEAP32)[((hint) >> 2)];
    family = (growMemViews(), HEAP32)[(((hint) + (4)) >> 2)];
    type = (growMemViews(), HEAP32)[(((hint) + (8)) >> 2)];
    proto = (growMemViews(), HEAP32)[(((hint) + (12)) >> 2)];
  }
  if (type && !proto) {
    proto = type === 2 ? 17 : 6;
  }
  if (!type && proto) {
    type = proto === 17 ? 2 : 1;
  }
  // If type or proto are set to zero in hints we should really be returning multiple addrinfo values, but for
  // now default to a TCP STREAM socket so we can at least return a sensible addrinfo given NULL hints.
  if (!proto) {
    proto = 6;
  }
  if (!type) {
    type = 1;
  }
  if (!node && !service) {
    return -2;
  }
  if (flags & ~(1 | 2 | 4 | 1024 | 8 | 16 | 32)) {
    return -1;
  }
  if (hint && ((growMemViews(), HEAP32)[((hint) >> 2)] & 2) && !node) {
    return -1;
  }
  if (flags & 32) {
    // TODO
    return -2;
  }
  if (type && type !== 1 && type !== 2) {
    return -7;
  }
  if (family !== 0 && family !== 2 && family !== 10) {
    return -6;
  }
  if (service) {
    service = UTF8ToString(service);
    port = parseInt(service, 10);
    if (isNaN(port)) {
      if (flags & 1024) {
        return -2;
      }
      // TODO support resolving well-known service names from:
      // http://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.txt
      return -8;
    }
  }
  if (!node) {
    if (family === 0) {
      family = 2;
    }
    if (!(flags & 1)) {
      if (family === 2) {
        addr = _htonl(2130706433);
      } else {
        addr = [ 0, 0, 0, _htonl(1) ];
      }
    }
    ai = allocaddrinfo(family, type, proto, null, addr, port);
    (growMemViews(), HEAPU32)[((out) >> 2)] = ai;
    return 0;
  }
  // try as a numeric address
  node = UTF8ToString(node);
  addr = inetPton4(node);
  if (addr !== null) {
    // incoming node is a valid ipv4 address
    if (family === 0 || family === 2) {
      family = 2;
    } else if (family === 10 && (flags & 8)) {
      addr = [ 0, 0, _htonl(65535), addr ];
      family = 10;
    } else {
      return -2;
    }
  } else {
    addr = inetPton6(node);
    if (addr !== null) {
      // incoming node is a valid ipv6 address
      if (family === 0 || family === 10) {
        family = 10;
      } else {
        return -2;
      }
    }
  }
  if (addr != null) {
    ai = allocaddrinfo(family, type, proto, node, addr, port);
    (growMemViews(), HEAPU32)[((out) >> 2)] = ai;
    return 0;
  }
  if (flags & 4) {
    return -2;
  }
  // try as a hostname
  // resolve the hostname to a temporary fake address
  node = DNS.lookup_name(node);
  addr = inetPton4(node);
  if (family === 0) {
    family = 2;
  } else if (family === 10) {
    addr = [ 0, 0, _htonl(65535), addr ];
  }
  ai = allocaddrinfo(family, type, proto, null, addr, port);
  (growMemViews(), HEAPU32)[((out) >> 2)] = ai;
  return 0;
}

const GL_MAX_TEMP_BUFFER_SIZE = 2097152;

const GL_NUM_TEMP_VERTEX_BUFFERS_PER_SIZE = 64;

var getEmscriptenSupportedExtensions = ctx => {
  // Restrict the list of advertised extensions to those that we actually
  // support.
  var supportedExtensions = [ // WebGL 2 extensions
  "EXT_color_buffer_float", "EXT_conservative_depth", "EXT_disjoint_timer_query_webgl2", "EXT_texture_norm16", "NV_shader_noperspective_interpolation", "WEBGL_clip_cull_distance", // WebGL 1 and WebGL 2 extensions
  "EXT_clip_control", "EXT_color_buffer_half_float", "EXT_depth_clamp", "EXT_float_blend", "EXT_polygon_offset_clamp", "EXT_texture_compression_bptc", "EXT_texture_compression_rgtc", "EXT_texture_filter_anisotropic", "KHR_parallel_shader_compile", "OES_texture_float_linear", "WEBGL_blend_func_extended", "WEBGL_compressed_texture_astc", "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_etc1", "WEBGL_compressed_texture_s3tc", "WEBGL_compressed_texture_s3tc_srgb", "WEBGL_debug_renderer_info", "WEBGL_debug_shaders", "WEBGL_lose_context", "WEBGL_multi_draw", "WEBGL_polygon_mode" ];
  // .getSupportedExtensions() can return null if context is lost, so coerce to empty array.
  return ctx.getSupportedExtensions()?.filter(ext => supportedExtensions.includes(ext)) ?? [];
};

var registerPreMainLoop = f => {
  // Does nothing unless $MainLoop is included/used.
  typeof MainLoop !== "undefined" && MainLoop.preMainLoop.push(f);
};

var webglBufferSubData = (target, offset, size, data, src = (growMemViews(), HEAPU8)) => {
  if (true) {
    size && GLctx.bufferSubData(target, offset, src, data, size);
    return;
  }
};

var webgl_enable_EXT_clip_control = ctx => !!(ctx.extClipControl = ctx.getExtension("EXT_clip_control"));

var webgl_enable_EXT_polygon_offset_clamp = ctx => !!(ctx.extPolygonOffsetClamp = ctx.getExtension("EXT_polygon_offset_clamp"));

var webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance = ctx => // Closure is expected to be allowed to minify the '.dibvbi' property, so not accessing it quoted.
!!(ctx.dibvbi = ctx.getExtension("WEBGL_draw_instanced_base_vertex_base_instance"));

var webgl_enable_WEBGL_multi_draw = ctx => // Closure is expected to be allowed to minify the '.multiDrawWebgl' property, so not accessing it quoted.
!!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));

var webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance = ctx => !!(ctx.mdibvbi = ctx.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance"));

var webgl_enable_WEBGL_polygon_mode = ctx => !!(ctx.webglPolygonMode = ctx.getExtension("WEBGL_polygon_mode"));

var GL = {
  counter: 1,
  buffers: [],
  mappedBuffers: {},
  programs: [],
  framebuffers: [],
  renderbuffers: [],
  textures: [],
  shaders: [],
  vaos: [],
  contexts: {},
  offscreenCanvases: {},
  queries: [],
  samplers: [],
  transformFeedbacks: [],
  syncs: [],
  byteSizeByTypeRoot: 5120,
  byteSizeByType: [ 1, 1, 2, 2, 4, 4, 4, 2, 3, 4, 8 ],
  stringCache: {},
  stringiCache: {},
  unpackAlignment: 4,
  unpackRowLength: 0,
  recordError: errorCode => {
    if (!GL.lastError) {
      GL.lastError = errorCode;
    }
  },
  getNewId: table => {
    var ret = GL.counter++;
    for (var i = table.length; i < ret; i++) {
      table[i] = null;
    }
    // Skip over any non-null elements that might have been created by
    // glBindBuffer.
    while (table[ret]) {
      ret = GL.counter++;
    }
    return ret;
  },
  genObject: (n, buffers, createFunction, objectTable) => {
    for (var i = 0; i < n; i++) {
      var buffer = GLctx[createFunction]();
      var id = buffer && GL.getNewId(objectTable);
      if (buffer) {
        buffer.name = id;
        objectTable[id] = buffer;
      } else {
        GL.recordError(1282);
      }
      (growMemViews(), HEAP32)[(((buffers) + (i * 4)) >> 2)] = id;
      checkInt32(id);
    }
  },
  log2ceilLookup: i => 32 - Math.clz32(i ? i - 1 : 0),
  generateTempBuffers: (quads, context) => {
    var largestIndex = GL.log2ceilLookup(GL_MAX_TEMP_BUFFER_SIZE);
    context.tempVertexBufferCounters1 = [];
    context.tempVertexBufferCounters2 = [];
    context.tempVertexBufferCounters1.length = context.tempVertexBufferCounters2.length = largestIndex + 1;
    context.tempVertexBuffers1 = [];
    context.tempVertexBuffers2 = [];
    context.tempVertexBuffers1.length = context.tempVertexBuffers2.length = largestIndex + 1;
    context.tempIndexBuffers = [];
    context.tempIndexBuffers.length = largestIndex + 1;
    for (var i = 0; i <= largestIndex; ++i) {
      context.tempIndexBuffers[i] = null;
      // Created on-demand
      context.tempVertexBufferCounters1[i] = context.tempVertexBufferCounters2[i] = 0;
      var ringbufferLength = GL_NUM_TEMP_VERTEX_BUFFERS_PER_SIZE;
      context.tempVertexBuffers1[i] = [];
      context.tempVertexBuffers2[i] = [];
      var ringbuffer1 = context.tempVertexBuffers1[i];
      var ringbuffer2 = context.tempVertexBuffers2[i];
      ringbuffer1.length = ringbuffer2.length = ringbufferLength;
      for (var j = 0; j < ringbufferLength; ++j) {
        ringbuffer1[j] = ringbuffer2[j] = null;
      }
    }
    if (quads) {
      // GL_QUAD indexes can be precalculated
      context.tempQuadIndexBuffer = GLctx.createBuffer();
      context.GLctx.bindBuffer(34963, context.tempQuadIndexBuffer);
      var numIndexes = GL_MAX_TEMP_BUFFER_SIZE >> 1;
      var quadIndexes = new Uint16Array(numIndexes);
      var i = 0, v = 0;
      while (1) {
        quadIndexes[i++] = v;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 1;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 2;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 2;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 3;
        if (i >= numIndexes) break;
        v += 4;
      }
      context.GLctx.bufferData(34963, quadIndexes, 35044);
      context.GLctx.bindBuffer(34963, null);
    }
  },
  getTempVertexBuffer: sizeBytes => {
    var idx = GL.log2ceilLookup(sizeBytes);
    var ringbuffer = GL.currentContext.tempVertexBuffers1[idx];
    var nextFreeBufferIndex = GL.currentContext.tempVertexBufferCounters1[idx];
    GL.currentContext.tempVertexBufferCounters1[idx] = (GL.currentContext.tempVertexBufferCounters1[idx] + 1) & (GL_NUM_TEMP_VERTEX_BUFFERS_PER_SIZE - 1);
    var vbo = ringbuffer[nextFreeBufferIndex];
    if (vbo) {
      return vbo;
    }
    var prevVBO = GLctx.getParameter(34964);
    ringbuffer[nextFreeBufferIndex] = GLctx.createBuffer();
    GLctx.bindBuffer(34962, ringbuffer[nextFreeBufferIndex]);
    GLctx.bufferData(34962, 1 << idx, 35048);
    GLctx.bindBuffer(34962, prevVBO);
    return ringbuffer[nextFreeBufferIndex];
  },
  getTempIndexBuffer: sizeBytes => {
    var idx = GL.log2ceilLookup(sizeBytes);
    var ibo = GL.currentContext.tempIndexBuffers[idx];
    if (ibo) {
      return ibo;
    }
    var prevIBO = GLctx.getParameter(34965);
    GL.currentContext.tempIndexBuffers[idx] = GLctx.createBuffer();
    GLctx.bindBuffer(34963, GL.currentContext.tempIndexBuffers[idx]);
    GLctx.bufferData(34963, 1 << idx, 35048);
    GLctx.bindBuffer(34963, prevIBO);
    return GL.currentContext.tempIndexBuffers[idx];
  },
  newRenderingFrameStarted: () => {
    if (!GL.currentContext) {
      return;
    }
    var vb = GL.currentContext.tempVertexBuffers1;
    GL.currentContext.tempVertexBuffers1 = GL.currentContext.tempVertexBuffers2;
    GL.currentContext.tempVertexBuffers2 = vb;
    vb = GL.currentContext.tempVertexBufferCounters1;
    GL.currentContext.tempVertexBufferCounters1 = GL.currentContext.tempVertexBufferCounters2;
    GL.currentContext.tempVertexBufferCounters2 = vb;
    var largestIndex = GL.log2ceilLookup(GL_MAX_TEMP_BUFFER_SIZE);
    for (var i = 0; i <= largestIndex; ++i) {
      GL.currentContext.tempVertexBufferCounters1[i] = 0;
    }
  },
  getSource: (shader, count, string, length) => {
    var source = "";
    for (var i = 0; i < count; ++i) {
      var len = length ? (growMemViews(), HEAPU32)[(((length) + (i * 4)) >> 2)] : undefined;
      source += UTF8ToString((growMemViews(), HEAPU32)[(((string) + (i * 4)) >> 2)], len);
    }
    return source;
  },
  calcBufLength: (size, type, stride, count) => {
    if (stride > 0) {
      return count * stride;
    }
    var typeSize = GL.byteSizeByType[type - GL.byteSizeByTypeRoot];
    return size * typeSize * count;
  },
  preDrawHandleClientVertexAttribBindings: count => {
    GL.resetBufferBinding = false;
    // TODO: initial pass to detect ranges we need to upload, might not need
    // an upload per attrib
    for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
      var cb = GL.currentContext.clientBuffers[i];
      if (!cb.clientside || !cb.enabled) continue;
      assert(count || !GLctx.currentElementArrayBufferBinding, "must use array buffers when using element buffer");
      GL.resetBufferBinding = true;
      var size = GL.calcBufLength(cb.size, cb.type, cb.stride, count);
      var buf = GL.getTempVertexBuffer(size);
      GLctx.bindBuffer(34962, buf);
      webglBufferSubData(34962, 0, size, cb.ptr);
      cb.vertexAttribPointerAdaptor.call(GLctx, i, cb.size, cb.type, cb.normalized, cb.stride, 0);
    }
  },
  postDrawHandleClientVertexAttribBindings: () => {
    if (GL.resetBufferBinding) {
      GLctx.bindBuffer(34962, GL.buffers[GLctx.currentArrayBufferBinding]);
    }
  },
  createContext: (/** @type {HTMLCanvasElement} */ canvas, webGLContextAttributes) => {
    // BUG: Workaround Safari WebGL issue: After successfully acquiring WebGL
    // context on a canvas, calling .getContext() will always return that
    // context independent of which 'webgl' or 'webgl2'
    // context version was passed. See:
    //   https://webkit.org/b/222758
    // and:
    //   https://github.com/emscripten-core/emscripten/issues/13295.
    // TODO: Once the bug is fixed and shipped in Safari, adjust the Safari
    // version field in above check.
    if (!canvas.getContextSafariWebGL2Fixed) {
      canvas.getContextSafariWebGL2Fixed = canvas.getContext;
      /** @type {function(this:HTMLCanvasElement, string, (Object|null)=): (RenderingContext|null)} */ function fixedGetContext(ver, attrs) {
        var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
        return ((ver == "webgl") == (gl instanceof WebGLRenderingContext)) ? gl : null;
      }
      canvas.getContext = fixedGetContext;
    }
    var ctx = canvas.getContext("webgl2", webGLContextAttributes);
    if (!ctx) return 0;
    var handle = GL.registerContext(ctx, webGLContextAttributes);
    return handle;
  },
  registerContext: (ctx, webGLContextAttributes) => {
    // with pthreads a context is a location in memory with some synchronized
    // data between threads
    var handle = _malloc(8);
    (growMemViews(), HEAPU32)[(((handle) + (4)) >> 2)] = _pthread_self();
    // the thread pointer of the thread that owns the control of the context
    var context = {
      handle,
      attributes: webGLContextAttributes,
      version: webGLContextAttributes.majorVersion,
      GLctx: ctx
    };
    // Store the created context object so that we can access the context
    // given a canvas without having to pass the parameters again.
    if (ctx.canvas) ctx.canvas.GLctxObject = context;
    GL.contexts[handle] = context;
    if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
      GL.initExtensions(context);
    }
    context.maxVertexAttribs = context.GLctx.getParameter(34921);
    context.clientBuffers = [];
    for (var i = 0; i < context.maxVertexAttribs; i++) {
      context.clientBuffers[i] = {
        enabled: false,
        clientside: false,
        size: 0,
        type: 0,
        normalized: 0,
        stride: 0,
        ptr: 0,
        vertexAttribPointerAdaptor: null
      };
    }
    GL.generateTempBuffers(false, context);
    return handle;
  },
  makeContextCurrent: contextHandle => {
    // Active Emscripten GL layer context object.
    GL.currentContext = GL.contexts[contextHandle];
    // Active WebGL context object.
    Module["ctx"] = GLctx = GL.currentContext?.GLctx;
    return !(contextHandle && !GLctx);
  },
  getContext: contextHandle => GL.contexts[contextHandle],
  deleteContext: contextHandle => {
    if (GL.currentContext === GL.contexts[contextHandle]) {
      GL.currentContext = null;
    }
    if (typeof JSEvents === "object") {
      // Release all JS event handlers on the DOM element that the GL context is
      // associated with since the context is now deleted.
      JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
    }
    // Make sure the canvas object no longer refers to the context object so
    // there are no GC surprises.
    if (GL.contexts[contextHandle]?.GLctx.canvas) {
      GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
    }
    _free(GL.contexts[contextHandle].handle);
    GL.contexts[contextHandle] = null;
  },
  initExtensions: context => {
    // If this function is called without a specific context object, init the
    // extensions of the currently active context.
    context ||= GL.currentContext;
    if (context.initExtensionsDone) return;
    context.initExtensionsDone = true;
    var gl = context.GLctx;
    // Detect the presence of a few extensions manually, since the GL interop
    // layer itself will need to know if they exist.
    // Extensions that are available in both WebGL 1 and WebGL 2
    webgl_enable_WEBGL_multi_draw(gl);
    webgl_enable_EXT_polygon_offset_clamp(gl);
    webgl_enable_EXT_clip_control(gl);
    webgl_enable_WEBGL_polygon_mode(gl);
    // Extensions that are available from WebGL >= 2 (no-op if called on a WebGL 1 context active)
    webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(gl);
    webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(gl);
    // On WebGL 2, EXT_disjoint_timer_query is replaced with an alternative
    // that's based on core APIs, and exposes only the queryCounterEXT()
    // entrypoint.
    if (context.version >= 2) {
      gl.disjointTimerQueryExt = gl.getExtension("EXT_disjoint_timer_query_webgl2");
    }
    // However, Firefox exposes the WebGL 1 version on WebGL 2 as well and
    // thus we look for the WebGL 1 version again if the WebGL 2 version
    // isn't present. https://bugzil.la/1328882
    if (context.version < 2 || !gl.disjointTimerQueryExt) {
      gl.disjointTimerQueryExt = gl.getExtension("EXT_disjoint_timer_query");
    }
    for (var ext of getEmscriptenSupportedExtensions(gl)) {
      // WEBGL_lose_context, WEBGL_debug_renderer_info and WEBGL_debug_shaders
      // are not enabled by default.
      if (!ext.includes("lose_context") && !ext.includes("debug")) {
        // Call .getExtension() to enable that extension permanently.
        gl.getExtension(ext);
      }
    }
  }
};

var GLctx;

var _emscripten_glActiveTexture = x0 => GLctx.activeTexture(x0);

var _emscripten_glAttachShader = (program, shader) => {
  GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
};

var _emscripten_glBindAttribLocation = (program, index, name) => {
  GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
};

var _emscripten_glBindBuffer = (target, buffer) => {
  // Calling glBindBuffer with an unknown buffer will implicitly create a
  // new one.  Here we bypass `GL.counter` and directly using the ID passed
  // in.
  if (buffer && !GL.buffers[buffer]) {
    var b = GLctx.createBuffer();
    b.name = buffer;
    GL.buffers[buffer] = b;
  }
  if (target == 34962) {
    GLctx.currentArrayBufferBinding = buffer;
  } else if (target == 34963) {
    GLctx.currentElementArrayBufferBinding = buffer;
  }
  if (target == 35051) {
    // In WebGL 2 glReadPixels entry point, we need to use a different WebGL 2
    // API function call when a buffer is bound to
    // GL_PIXEL_PACK_BUFFER_BINDING point, so must keep track whether that
    // binding point is non-null to know what is the proper API function to
    // call.
    GLctx.currentPixelPackBufferBinding = buffer;
  } else if (target == 35052) {
    // In WebGL 2 gl(Compressed)Tex(Sub)Image[23]D entry points, we need to
    // use a different WebGL 2 API function call when a buffer is bound to
    // GL_PIXEL_UNPACK_BUFFER_BINDING point, so must keep track whether that
    // binding point is non-null to know what is the proper API function to
    // call.
    GLctx.currentPixelUnpackBufferBinding = buffer;
  }
  GLctx.bindBuffer(target, GL.buffers[buffer]);
};

var _emscripten_glBindFramebuffer = (target, framebuffer) => {
  GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
};

var _emscripten_glBindRenderbuffer = (target, renderbuffer) => {
  GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
};

var _emscripten_glBindTexture = (target, texture) => {
  GLctx.bindTexture(target, GL.textures[texture]);
};

var _emscripten_glBindVertexArray = vao => {
  GLctx.bindVertexArray(GL.vaos[vao]);
  var ibo = GLctx.getParameter(34965);
  GLctx.currentElementArrayBufferBinding = ibo ? (ibo.name | 0) : 0;
};

var _emscripten_glBlendFunc = (x0, x1) => GLctx.blendFunc(x0, x1);

var _emscripten_glBlendFuncSeparate = (x0, x1, x2, x3) => GLctx.blendFuncSeparate(x0, x1, x2, x3);

var _emscripten_glBlitFramebuffer = (x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) => GLctx.blitFramebuffer(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9);

var _emscripten_glBufferData = (target, size, data, usage) => {
  if (true) {
    // If size is zero, WebGL would interpret uploading the whole input
    // arraybuffer (starting from given offset), which would not make sense in
    // WebAssembly, so avoid uploading if size is zero. However we must still
    // call bufferData to establish a backing storage of zero bytes.
    if (data && size) {
      GLctx.bufferData(target, (growMemViews(), HEAPU8), usage, data, size);
    } else {
      GLctx.bufferData(target, size, usage);
    }
    return;
  }
};

var _emscripten_glBufferSubData = (target, offset, size, data) => webglBufferSubData(target, offset, size, data);

var _emscripten_glCheckFramebufferStatus = x0 => GLctx.checkFramebufferStatus(x0);

var _emscripten_glClear = x0 => GLctx.clear(x0);

var _emscripten_glClearColor = (x0, x1, x2, x3) => GLctx.clearColor(x0, x1, x2, x3);

var _emscripten_glClearDepthf = x0 => GLctx.clearDepth(x0);

var _emscripten_glClearStencil = x0 => GLctx.clearStencil(x0);

var _emscripten_glClientWaitSync = (sync, flags, timeout) => {
  // WebGL2 vs GLES3 differences: in GLES3, the timeout parameter is a uint64, where 0xFFFFFFFFFFFFFFFFULL means GL_TIMEOUT_IGNORED.
  // In JS, there's no 64-bit value types, so instead timeout is taken to be signed, and GL_TIMEOUT_IGNORED is given value -1.
  // Inherently the value accepted in the timeout is lossy, and can't take in arbitrary u64 bit pattern (but most likely doesn't matter)
  // See https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.15
  timeout = Number(timeout);
  return GLctx.clientWaitSync(GL.syncs[sync], flags, timeout);
};

var _emscripten_glColorMask = (red, green, blue, alpha) => {
  GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
};

var _emscripten_glCompileShader = shader => {
  GLctx.compileShader(GL.shaders[shader]);
};

var _emscripten_glCompressedTexImage2D = (target, level, internalFormat, width, height, border, imageSize, data) => {
  // `data` may be null here, which means "allocate uninitialized space but
  // don't upload" in GLES parlance, but `compressedTexImage2D` requires the
  // final data parameter, so we simply pass a heap view starting at zero
  // effectively uploading whatever happens to be near address zero.  See
  // https://github.com/emscripten-core/emscripten/issues/19300.
  if (true) {
    if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
      GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data);
      return;
    }
    GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, (growMemViews(), 
    HEAPU8), data, imageSize);
    return;
  }
};

var _emscripten_glCompressedTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, imageSize, data) => {
  if (true) {
    if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
      GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data);
      return;
    }
    GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, (growMemViews(), 
    HEAPU8), data, imageSize);
    return;
  }
};

var _emscripten_glCopyTexSubImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7);

var _emscripten_glCreateProgram = () => {
  var id = GL.getNewId(GL.programs);
  var program = GLctx.createProgram();
  // Store additional information needed for each shader program:
  program.name = id;
  // Lazy cache results of
  // glGetProgramiv(GL_ACTIVE_UNIFORM_MAX_LENGTH/GL_ACTIVE_ATTRIBUTE_MAX_LENGTH/GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH)
  program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
  program.uniformIdCounter = 1;
  GL.programs[id] = program;
  return id;
};

var _emscripten_glCreateShader = shaderType => {
  var id = GL.getNewId(GL.shaders);
  GL.shaders[id] = GLctx.createShader(shaderType);
  return id;
};

var _emscripten_glCullFace = x0 => GLctx.cullFace(x0);

var _emscripten_glDeleteBuffers = (n, buffers) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((buffers) + (i * 4)) >> 2)];
    var buffer = GL.buffers[id];
    // From spec: "glDeleteBuffers silently ignores 0's and names that do not
    // correspond to existing buffer objects."
    if (!buffer) continue;
    GLctx.deleteBuffer(buffer);
    buffer.name = 0;
    GL.buffers[id] = null;
    if (id == GLctx.currentArrayBufferBinding) GLctx.currentArrayBufferBinding = 0;
    if (id == GLctx.currentElementArrayBufferBinding) GLctx.currentElementArrayBufferBinding = 0;
    if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
    if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0;
  }
};

var _emscripten_glDeleteFramebuffers = (n, framebuffers) => {
  for (var i = 0; i < n; ++i) {
    var id = (growMemViews(), HEAP32)[(((framebuffers) + (i * 4)) >> 2)];
    var framebuffer = GL.framebuffers[id];
    if (!framebuffer) continue;
    // GL spec: "glDeleteFramebuffers silently ignores 0s and names that do not correspond to existing framebuffer objects".
    GLctx.deleteFramebuffer(framebuffer);
    framebuffer.name = 0;
    GL.framebuffers[id] = null;
  }
};

var _emscripten_glDeleteProgram = id => {
  if (!id) return;
  var program = GL.programs[id];
  if (!program) {
    // glDeleteProgram actually signals an error when deleting a nonexisting
    // object, unlike some other GL delete functions.
    GL.recordError(1281);
    return;
  }
  GLctx.deleteProgram(program);
  program.name = 0;
  GL.programs[id] = null;
};

var _emscripten_glDeleteRenderbuffers = (n, renderbuffers) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((renderbuffers) + (i * 4)) >> 2)];
    var renderbuffer = GL.renderbuffers[id];
    if (!renderbuffer) continue;
    // GL spec: "glDeleteRenderbuffers silently ignores 0s and names that do not correspond to existing renderbuffer objects".
    GLctx.deleteRenderbuffer(renderbuffer);
    renderbuffer.name = 0;
    GL.renderbuffers[id] = null;
  }
};

var _emscripten_glDeleteShader = id => {
  if (!id) return;
  var shader = GL.shaders[id];
  if (!shader) {
    // glDeleteShader actually signals an error when deleting a nonexisting
    // object, unlike some other GL delete functions.
    GL.recordError(1281);
    return;
  }
  GLctx.deleteShader(shader);
  GL.shaders[id] = null;
};

var _emscripten_glDeleteSync = id => {
  if (!id) return;
  var sync = GL.syncs[id];
  if (!sync) {
    // glDeleteSync signals an error when deleting a nonexisting object, unlike some other GL delete functions.
    GL.recordError(1281);
    return;
  }
  GLctx.deleteSync(sync);
  sync.name = 0;
  GL.syncs[id] = null;
};

var _emscripten_glDeleteTextures = (n, textures) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((textures) + (i * 4)) >> 2)];
    var texture = GL.textures[id];
    // GL spec: "glDeleteTextures silently ignores 0s and names that do not
    // correspond to existing textures".
    if (!texture) continue;
    GLctx.deleteTexture(texture);
    texture.name = 0;
    GL.textures[id] = null;
  }
};

var _emscripten_glDeleteVertexArrays = (n, vaos) => {
  for (var i = 0; i < n; i++) {
    var id = (growMemViews(), HEAP32)[(((vaos) + (i * 4)) >> 2)];
    GLctx.deleteVertexArray(GL.vaos[id]);
    GL.vaos[id] = null;
  }
};

var _emscripten_glDepthFunc = x0 => GLctx.depthFunc(x0);

var _emscripten_glDepthMask = flag => {
  GLctx.depthMask(!!flag);
};

var _emscripten_glDisable = x0 => GLctx.disable(x0);

var _emscripten_glDisableVertexAttribArray = index => {
  var cb = GL.currentContext.clientBuffers[index];
  cb.enabled = false;
  GLctx.disableVertexAttribArray(index);
};

var _emscripten_glDrawArrays = (mode, first, count) => {
  // bind any client-side buffers
  GL.preDrawHandleClientVertexAttribBindings(first + count);
  GLctx.drawArrays(mode, first, count);
  GL.postDrawHandleClientVertexAttribBindings();
};

var _emscripten_glDrawElements = (mode, count, type, indices) => {
  var buf;
  var vertexes = 0;
  if (!GLctx.currentElementArrayBufferBinding) {
    var size = GL.calcBufLength(1, type, 0, count);
    buf = GL.getTempIndexBuffer(size);
    GLctx.bindBuffer(34963, buf);
    webglBufferSubData(34963, 0, size, indices);
    // Calculating vertex count if shader's attribute data is on client side
    if (count > 0) {
      for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
        var cb = GL.currentContext.clientBuffers[i];
        if (cb.clientside && cb.enabled) {
          let arrayClass;
          switch (type) {
           case 5121:
            arrayClass = Uint8Array;
            break;

           case 5123:
            arrayClass = Uint16Array;
            break;

           case 5125:
            arrayClass = Uint32Array;
            break;

           default:
            GL.recordError(1282);
            return;
          }
          vertexes = new arrayClass((growMemViews(), HEAPU8).buffer, indices, count).reduce((max, current) => Math.max(max, current)) + 1;
          break;
        }
      }
    }
    // the index is now 0
    indices = 0;
  }
  // bind any client-side buffers
  GL.preDrawHandleClientVertexAttribBindings(vertexes);
  GLctx.drawElements(mode, count, type, indices);
  GL.postDrawHandleClientVertexAttribBindings();
  if (!GLctx.currentElementArrayBufferBinding) {
    GLctx.bindBuffer(34963, null);
  }
};

var _emscripten_glEnable = x0 => GLctx.enable(x0);

var _emscripten_glEnableVertexAttribArray = index => {
  var cb = GL.currentContext.clientBuffers[index];
  cb.enabled = true;
  GLctx.enableVertexAttribArray(index);
};

var _emscripten_glFenceSync = (condition, flags) => {
  var sync = GLctx.fenceSync(condition, flags);
  if (sync) {
    var id = GL.getNewId(GL.syncs);
    sync.name = id;
    GL.syncs[id] = sync;
    return id;
  }
  return 0;
};

var _emscripten_glFramebufferRenderbuffer = (target, attachment, renderbuffertarget, renderbuffer) => {
  GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
};

var _emscripten_glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
  GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
};

var _emscripten_glGenBuffers = (n, buffers) => {
  GL.genObject(n, buffers, "createBuffer", GL.buffers);
};

var _emscripten_glGenFramebuffers = (n, ids) => {
  GL.genObject(n, ids, "createFramebuffer", GL.framebuffers);
};

var _emscripten_glGenRenderbuffers = (n, renderbuffers) => {
  GL.genObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
};

var _emscripten_glGenTextures = (n, textures) => {
  GL.genObject(n, textures, "createTexture", GL.textures);
};

var _emscripten_glGenVertexArrays = (n, arrays) => {
  GL.genObject(n, arrays, "createVertexArray", GL.vaos);
};

var _emscripten_glGenerateMipmap = x0 => GLctx.generateMipmap(x0);

var __glGetActiveAttribOrUniform = (funcName, program, index, bufSize, length, size, type, name) => {
  program = GL.programs[program];
  var info = GLctx[funcName](program, index);
  if (info) {
    // If an error occurs, nothing will be written to length, size and type and name.
    var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
    if (length) (growMemViews(), HEAP32)[((length) >> 2)] = numBytesWrittenExclNull;
    checkInt32(numBytesWrittenExclNull);
    if (size) (growMemViews(), HEAP32)[((size) >> 2)] = info.size;
    checkInt32(info.size);
    if (type) (growMemViews(), HEAP32)[((type) >> 2)] = info.type;
    checkInt32(info.type);
  }
};

var _emscripten_glGetActiveUniform = (program, index, bufSize, length, size, type, name) => __glGetActiveAttribOrUniform("getActiveUniform", program, index, bufSize, length, size, type, name);

var webglGetExtensions = () => {
  var exts = getEmscriptenSupportedExtensions(GLctx);
  exts = exts.concat(exts.map(e => "GL_" + e));
  return exts;
};

var emscriptenWebGLGet = (name_, p, type) => {
  // Guard against user passing a null pointer.
  // Note that GLES2 spec does not say anything about how passing a null
  // pointer should be treated.  Testing on desktop core GL 3, the application
  // crashes on glGetIntegerv to a null pointer, but better to report an error
  // instead of doing anything random.
  if (!p) {
    GL.recordError(1281);
    return;
  }
  var ret = undefined;
  switch (name_) {
   // Handle a few trivial GLES values
    case 36346:
    // GL_SHADER_COMPILER
    ret = 1;
    break;

   case 36344:
    // GL_SHADER_BINARY_FORMATS
    if (type != 0 && type != 1) {
      GL.recordError(1280);
    }
    // Do not write anything to the out pointer, since no binary formats are
    // supported.
    return;

   case 34814:
   // GL_NUM_PROGRAM_BINARY_FORMATS
    case 36345:
    // GL_NUM_SHADER_BINARY_FORMATS
    ret = 0;
    break;

   case 34466:
    // GL_NUM_COMPRESSED_TEXTURE_FORMATS
    // WebGL doesn't have GL_NUM_COMPRESSED_TEXTURE_FORMATS (it's obsolete
    // since GL_COMPRESSED_TEXTURE_FORMATS returns a JS array that can be
    // queried for length), so implement it ourselves to allow C++ GLES2
    // code to get the length.
    var formats = GLctx.getParameter(34467);
    ret = formats ? formats.length : 0;
    break;

   case 33309:
    // GL_NUM_EXTENSIONS
    if (GL.currentContext.version < 2) {
      // Calling GLES3/WebGL2 function with a GLES2/WebGL1 context
      GL.recordError(1282);
      return;
    }
    ret = webglGetExtensions().length;
    break;

   case 33307:
   // GL_MAJOR_VERSION
    case 33308:
    // GL_MINOR_VERSION
    if (GL.currentContext.version < 2) {
      GL.recordError(1280);
      // GL_INVALID_ENUM
      return;
    }
    ret = name_ == 33307 ? 3 : 0;
    // return version 3.0
    break;
  }
  if (ret === undefined) {
    var result = GLctx.getParameter(name_);
    switch (typeof result) {
     case "number":
      ret = result;
      break;

     case "boolean":
      ret = result ? 1 : 0;
      break;

     case "string":
      GL.recordError(1280);
      // GL_INVALID_ENUM
      return;

     case "object":
      if (result === null) {
        // null is a valid result for some (e.g., which buffer is bound -
        // perhaps nothing is bound), but otherwise can mean an invalid
        // name_, which we need to report as an error
        switch (name_) {
         case 34964:
         // ARRAY_BUFFER_BINDING
          case 35725:
         // CURRENT_PROGRAM
          case 34965:
         // ELEMENT_ARRAY_BUFFER_BINDING
          case 36006:
         // FRAMEBUFFER_BINDING or DRAW_FRAMEBUFFER_BINDING
          case 36007:
         // RENDERBUFFER_BINDING
          case 32873:
         // TEXTURE_BINDING_2D
          case 34229:
         // WebGL 2 GL_VERTEX_ARRAY_BINDING, or WebGL 1 extension OES_vertex_array_object GL_VERTEX_ARRAY_BINDING_OES
          case 36662:
         // COPY_READ_BUFFER_BINDING or COPY_READ_BUFFER
          case 36663:
         // COPY_WRITE_BUFFER_BINDING or COPY_WRITE_BUFFER
          case 35053:
         // PIXEL_PACK_BUFFER_BINDING
          case 35055:
         // PIXEL_UNPACK_BUFFER_BINDING
          case 36010:
         // READ_FRAMEBUFFER_BINDING
          case 35097:
         // SAMPLER_BINDING
          case 35869:
         // TEXTURE_BINDING_2D_ARRAY
          case 32874:
         // TEXTURE_BINDING_3D
          case 36389:
         // TRANSFORM_FEEDBACK_BINDING
          case 35983:
         // TRANSFORM_FEEDBACK_BUFFER_BINDING
          case 35368:
         // UNIFORM_BUFFER_BINDING
          case 34068:
          {
            // TEXTURE_BINDING_CUBE_MAP
            ret = 0;
            break;
          }

         default:
          {
            GL.recordError(1280);
            // GL_INVALID_ENUM
            return;
          }
        }
      } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
        for (var i = 0; i < result.length; ++i) {
          switch (type) {
           case 0:
            (growMemViews(), HEAP32)[(((p) + (i * 4)) >> 2)] = result[i];
            checkInt32(result[i]);
            break;

           case 2:
            (growMemViews(), HEAPF32)[(((p) + (i * 4)) >> 2)] = result[i];
            break;

           case 4:
            (growMemViews(), HEAP8)[(p) + (i)] = result[i] ? 1 : 0;
            checkInt8(result[i] ? 1 : 0);
            break;
          }
        }
        return;
      } else {
        try {
          ret = result.name | 0;
        } catch (e) {
          GL.recordError(1280);
          // GL_INVALID_ENUM
          err(`GL_INVALID_ENUM in glGet${type}v: Unknown object returned from WebGL getParameter(${name_})! (error: ${e})`);
          return;
        }
      }
      break;

     default:
      GL.recordError(1280);
      // GL_INVALID_ENUM
      err(`GL_INVALID_ENUM in glGet${type}v: Native code calling glGet${type}v(${name_}) and it returns ${result} of type ${typeof (result)}!`);
      return;
    }
  }
  switch (type) {
   case 1:
    writeI53ToI64(p, ret);
    break;

   case 0:
    (growMemViews(), HEAP32)[((p) >> 2)] = ret;
    checkInt32(ret);
    break;

   case 2:
    (growMemViews(), HEAPF32)[((p) >> 2)] = ret;
    break;

   case 4:
    (growMemViews(), HEAP8)[p] = ret ? 1 : 0;
    checkInt8(ret ? 1 : 0);
    break;
  }
};

var _emscripten_glGetIntegerv = (name_, p) => emscriptenWebGLGet(name_, p, 0);

var _emscripten_glGetProgramInfoLog = (program, maxLength, length, infoLog) => {
  var log = GLctx.getProgramInfoLog(GL.programs[program]);
  if (log === null) log = "(unknown error)";
  var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
  if (length) (growMemViews(), HEAP32)[((length) >> 2)] = numBytesWrittenExclNull;
  checkInt32(numBytesWrittenExclNull);
};

var _emscripten_glGetProgramiv = (program, pname, p) => {
  if (!p) {
    // GLES2 specification does not specify how to behave if p is a null
    // pointer. Since calling this function does not make sense if p == null,
    // issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  if (program >= GL.counter) {
    GL.recordError(1281);
    return;
  }
  program = GL.programs[program];
  if (pname == 35716) {
    // GL_INFO_LOG_LENGTH
    var log = GLctx.getProgramInfoLog(program);
    if (log === null) log = "(unknown error)";
    (growMemViews(), HEAP32)[((p) >> 2)] = log.length + 1;
    checkInt32(log.length + 1);
  } else if (pname == 35719) {
    if (!program.maxUniformLength) {
      var numActiveUniforms = GLctx.getProgramParameter(program, 35718);
      for (var i = 0; i < numActiveUniforms; ++i) {
        program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1);
      }
    }
    (growMemViews(), HEAP32)[((p) >> 2)] = program.maxUniformLength;
    checkInt32(program.maxUniformLength);
  } else if (pname == 35722) {
    if (!program.maxAttributeLength) {
      var numActiveAttributes = GLctx.getProgramParameter(program, 35721);
      for (var i = 0; i < numActiveAttributes; ++i) {
        program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1);
      }
    }
    (growMemViews(), HEAP32)[((p) >> 2)] = program.maxAttributeLength;
    checkInt32(program.maxAttributeLength);
  } else if (pname == 35381) {
    if (!program.maxUniformBlockNameLength) {
      var numActiveUniformBlocks = GLctx.getProgramParameter(program, 35382);
      for (var i = 0; i < numActiveUniformBlocks; ++i) {
        program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1);
      }
    }
    (growMemViews(), HEAP32)[((p) >> 2)] = program.maxUniformBlockNameLength;
    checkInt32(program.maxUniformBlockNameLength);
  } else {
    (growMemViews(), HEAP32)[((p) >> 2)] = GLctx.getProgramParameter(program, pname);
    checkInt32(GLctx.getProgramParameter(program, pname));
  }
};

var _emscripten_glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
  var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
  if (log === null) log = "(unknown error)";
  var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
  if (length) (growMemViews(), HEAP32)[((length) >> 2)] = numBytesWrittenExclNull;
  checkInt32(numBytesWrittenExclNull);
};

var _emscripten_glGetShaderiv = (shader, pname, p) => {
  if (!p) {
    // GLES2 specification does not specify how to behave if p is a null
    // pointer. Since calling this function does not make sense if p == null,
    // issue a GL error to notify user about it.
    GL.recordError(1281);
    return;
  }
  if (pname == 35716) {
    // GL_INFO_LOG_LENGTH
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    // The GLES2 specification says that if the shader has an empty info log,
    // a value of 0 is returned. Otherwise the log has a null char appended.
    // (An empty string is falsey, so we can just check that instead of
    // looking at log.length.)
    var logLength = log ? log.length + 1 : 0;
    (growMemViews(), HEAP32)[((p) >> 2)] = logLength;
    checkInt32(logLength);
  } else if (pname == 35720) {
    // GL_SHADER_SOURCE_LENGTH
    var source = GLctx.getShaderSource(GL.shaders[shader]);
    // source may be a null, or the empty string, both of which are falsey
    // values that we report a 0 length for.
    var sourceLength = source ? source.length + 1 : 0;
    (growMemViews(), HEAP32)[((p) >> 2)] = sourceLength;
    checkInt32(sourceLength);
  } else {
    (growMemViews(), HEAP32)[((p) >> 2)] = GLctx.getShaderParameter(GL.shaders[shader], pname);
    checkInt32(GLctx.getShaderParameter(GL.shaders[shader], pname));
  }
};

var _emscripten_glGetString = name_ => {
  var ret = GL.stringCache[name_];
  if (!ret) {
    switch (name_) {
     case 7939:
      ret = stringToNewUTF8(webglGetExtensions().join(" "));
      break;

     case 7936:
     case 7937:
     case 37445:
     case 37446:
      var s = GLctx.getParameter(name_);
      if (!s) {
        GL.recordError(1280);
      }
      ret = s ? stringToNewUTF8(s) : 0;
      break;

     case 7938:
      var webGLVersion = GLctx.getParameter(7938);
      // return GLES version string corresponding to the version of the WebGL context
      var glVersion = `OpenGL ES 2.0 (${webGLVersion})`;
      if (true) glVersion = `OpenGL ES 3.0 (${webGLVersion})`;
      ret = stringToNewUTF8(glVersion);
      break;

     case 35724:
      var glslVersion = GLctx.getParameter(35724);
      // extract the version number 'N.M' from the string 'WebGL GLSL ES N.M ...'
      var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
      var ver_num = glslVersion.match(ver_re);
      if (ver_num !== null) {
        if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
        // ensure minor version has 2 digits
        glslVersion = `OpenGL ES GLSL ES ${ver_num[1]} (${glslVersion})`;
      }
      ret = stringToNewUTF8(glslVersion);
      break;

     default:
      GL.recordError(1280);
    }
    GL.stringCache[name_] = ret;
  }
  return ret;
};

/** @suppress {checkTypes} */ var jstoi_q = str => parseInt(str);

/** @noinline */ var webglGetLeftBracePos = name => name.slice(-1) == "]" && name.lastIndexOf("[");

var webglPrepareUniformLocationsBeforeFirstUse = program => {
  var uniformLocsById = program.uniformLocsById, // Maps GLuint -> WebGLUniformLocation
  uniformSizeAndIdsByName = program.uniformSizeAndIdsByName, // Maps name -> [uniform array length, GLuint]
  i, j;
  // On the first time invocation of glGetUniformLocation on this shader program:
  // initialize cache data structures and discover which uniforms are arrays.
  if (!uniformLocsById) {
    // maps GLint integer locations to WebGLUniformLocations
    program.uniformLocsById = uniformLocsById = {};
    // maps integer locations back to uniform name strings, so that we can lazily fetch uniform array locations
    program.uniformArrayNamesById = {};
    var numActiveUniforms = GLctx.getProgramParameter(program, 35718);
    for (i = 0; i < numActiveUniforms; ++i) {
      var u = GLctx.getActiveUniform(program, i);
      var nm = u.name;
      var sz = u.size;
      var lb = webglGetLeftBracePos(nm);
      var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
      // Assign a new location.
      var id = program.uniformIdCounter;
      program.uniformIdCounter += sz;
      // Eagerly get the location of the uniformArray[0] base element.
      // The remaining indices >0 will be left for lazy evaluation to
      // improve performance. Those may never be needed to fetch, if the
      // application fills arrays always in full starting from the first
      // element of the array.
      uniformSizeAndIdsByName[arrayName] = [ sz, id ];
      // Store placeholder integers in place that highlight that these
      // >0 index locations are array indices pending population.
      for (j = 0; j < sz; ++j) {
        uniformLocsById[id] = j;
        program.uniformArrayNamesById[id++] = arrayName;
      }
    }
  }
};

var _emscripten_glGetUniformLocation = (program, name) => {
  name = UTF8ToString(name);
  if (program = GL.programs[program]) {
    webglPrepareUniformLocationsBeforeFirstUse(program);
    var uniformLocsById = program.uniformLocsById;
    // Maps GLuint -> WebGLUniformLocation
    var arrayIndex = 0;
    var uniformBaseName = name;
    // Invariant: when populating integer IDs for uniform locations, we must
    // maintain the precondition that arrays reside in contiguous addresses,
    // i.e. for a 'vec4 colors[10];', colors[4] must be at location
    // colors[0]+4.  However, user might call glGetUniformLocation(program,
    // "colors") for an array, so we cannot discover based on the user input
    // arguments whether the uniform we are dealing with is an array. The only
    // way to discover which uniforms are arrays is to enumerate over all the
    // active uniforms in the program.
    var leftBrace = webglGetLeftBracePos(name);
    // If user passed an array accessor "[index]", parse the array index off the accessor.
    if (leftBrace > 0) {
      arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
      // "index]", coerce parseInt(']') with >>>0 to treat "foo[]" as "foo[0]" and foo[-1] as unsigned out-of-bounds.
      uniformBaseName = name.slice(0, leftBrace);
    }
    // Have we cached the location of this uniform before?
    // A pair [array length, GLint of the uniform location]
    var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
    // If a uniform with this name exists, and if its index is within the
    // array limits (if it's even an array), query the WebGLlocation, or
    // return an existing cached location.
    if (sizeAndId && arrayIndex < sizeAndId[0]) {
      arrayIndex += sizeAndId[1];
      // Add the base location of the uniform to the array index offset.
      if ((uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name))) {
        return arrayIndex;
      }
    }
  } else {
    // N.b. we are currently unable to distinguish between GL program IDs that
    // never existed vs GL program IDs that have been deleted, so report
    // GL_INVALID_VALUE in both cases.
    GL.recordError(1281);
  }
  return -1;
};

var tempFixedLengthArray = [];

var _emscripten_glInvalidateFramebuffer = (target, numAttachments, attachments) => {
  var list = tempFixedLengthArray[numAttachments];
  for (var i = 0; i < numAttachments; i++) {
    list[i] = (growMemViews(), HEAP32)[(((attachments) + (i * 4)) >> 2)];
  }
  GLctx.invalidateFramebuffer(target, list);
};

var _emscripten_glLinkProgram = program => {
  program = GL.programs[program];
  GLctx.linkProgram(program);
  // Invalidate earlier computed uniform->ID mappings, those have now become stale
  program.uniformLocsById = 0;
  // Mark as null-like so that glGetUniformLocation() knows to populate this again.
  program.uniformSizeAndIdsByName = {};
};

var emscriptenWebGLGetBufferBinding = target => {
  switch (target) {
   case 34962:
    target = 34964;
    break;

   case 34963:
    target = 34965;
    break;

   case 35051:
    target = 35053;
    break;

   case 35052:
    target = 35055;
    break;

   case 35982:
    target = 35983;
    break;

   case 36662:
    target = 36662;
    break;

   case 36663:
    target = 36663;
    break;

   case 35345:
    target = 35368;
    break;
  }
  var buffer = GLctx.getParameter(target);
  if (buffer) return buffer.name | 0; else return 0;
};

var emscriptenWebGLValidateMapBufferTarget = target => {
  switch (target) {
   case 34962:
   // GL_ARRAY_BUFFER
    case 34963:
   // GL_ELEMENT_ARRAY_BUFFER
    case 36662:
   // GL_COPY_READ_BUFFER
    case 36663:
   // GL_COPY_WRITE_BUFFER
    case 35051:
   // GL_PIXEL_PACK_BUFFER
    case 35052:
   // GL_PIXEL_UNPACK_BUFFER
    case 35882:
   // GL_TEXTURE_BUFFER
    case 35982:
   // GL_TRANSFORM_FEEDBACK_BUFFER
    case 35345:
    // GL_UNIFORM_BUFFER
    return true;

   default:
    return false;
  }
};

var _emscripten_glMapBufferRange = (target, offset, length, access) => {
  if ((access & (1 | 32)) != 0) {
    err("glMapBufferRange access does not support MAP_READ or MAP_UNSYNCHRONIZED");
    return 0;
  }
  if ((access & 2) == 0) {
    err("glMapBufferRange access must include MAP_WRITE");
    return 0;
  }
  if ((access & (4 | 8)) == 0) {
    err("glMapBufferRange access must include INVALIDATE_BUFFER or INVALIDATE_RANGE");
    return 0;
  }
  if (!emscriptenWebGLValidateMapBufferTarget(target)) {
    GL.recordError(1280);
    err("GL_INVALID_ENUM in glMapBufferRange");
    return 0;
  }
  var mem = _malloc(length), binding = emscriptenWebGLGetBufferBinding(target);
  if (!mem) return 0;
  binding = GL.mappedBuffers[binding] ??= {};
  binding.offset = offset;
  binding.length = length;
  binding.mem = mem;
  binding.access = access;
  return mem;
};

var _emscripten_glPixelStorei = (pname, param) => {
  if (pname == 3317) {
    GL.unpackAlignment = param;
  } else if (pname == 3314) {
    GL.unpackRowLength = param;
  }
  GLctx.pixelStorei(pname, param);
};

var _emscripten_glPolygonOffset = (x0, x1) => GLctx.polygonOffset(x0, x1);

var heapObjectForWebGLType = type => {
  // Micro-optimization for size: Subtract lowest GL enum number (0x1400/* GL_BYTE */) from type to compare
  // smaller values for the heap, for shorter generated code size.
  // Also the type HEAPU16 is not tested for explicitly, but any unrecognized type will return out HEAPU16.
  // (since most types are HEAPU16)
  type -= 5120;
  if (type == 0) return growMemViews(), HEAP8;
  if (type == 1) return growMemViews(), HEAPU8;
  if (type == 2) return growMemViews(), HEAP16;
  if (type == 4) return growMemViews(), HEAP32;
  if (type == 6) return growMemViews(), HEAPF32;
  if (type == 5 || type == 28922 || type == 28520 || type == 30779 || type == 30782) return growMemViews(), 
  HEAPU32;
  return growMemViews(), HEAPU16;
};

var toTypedArrayIndex = (pointer, heap) => pointer >>> (31 - Math.clz32(heap.BYTES_PER_ELEMENT));

var _emscripten_glReadPixels = (x, y, width, height, format, type, pixels) => {
  if (true) {
    if (GLctx.currentPixelPackBufferBinding) {
      GLctx.readPixels(x, y, width, height, format, type, pixels);
      return;
    }
    var heap = heapObjectForWebGLType(type);
    var target = toTypedArrayIndex(pixels, heap);
    GLctx.readPixels(x, y, width, height, format, type, heap, target);
    return;
  }
};

var _emscripten_glRenderbufferStorage = (x0, x1, x2, x3) => GLctx.renderbufferStorage(x0, x1, x2, x3);

var _emscripten_glRenderbufferStorageMultisample = (x0, x1, x2, x3, x4) => GLctx.renderbufferStorageMultisample(x0, x1, x2, x3, x4);

var _emscripten_glShaderSource = (shader, count, string, length) => {
  var source = GL.getSource(shader, count, string, length);
  GLctx.shaderSource(GL.shaders[shader], source);
};

var _emscripten_glStencilFunc = (x0, x1, x2) => GLctx.stencilFunc(x0, x1, x2);

var _emscripten_glStencilMask = x0 => GLctx.stencilMask(x0);

var _emscripten_glStencilOp = (x0, x1, x2) => GLctx.stencilOp(x0, x1, x2);

var _emscripten_glStencilOpSeparate = (x0, x1, x2, x3) => GLctx.stencilOpSeparate(x0, x1, x2, x3);

var colorChannelsInGlTextureFormat = format => {
  // Micro-optimizations for size: map format to size by subtracting smallest
  // enum value (0x1902) from all values first.  Also omit the most common
  // size value (1) from the list, which is assumed by formats not on the
  // list.
  var colorChannels = {
    // 0x1902 /* GL_DEPTH_COMPONENT */ - 0x1902: 1,
    // 0x1906 /* GL_ALPHA */ - 0x1902: 1,
    5: 3,
    6: 4,
    // 0x1909 /* GL_LUMINANCE */ - 0x1902: 1,
    8: 2,
    29502: 3,
    29504: 4,
    // 0x1903 /* GL_RED */ - 0x1902: 1,
    26917: 2,
    26918: 2,
    // 0x8D94 /* GL_RED_INTEGER */ - 0x1902: 1,
    29846: 3,
    29847: 4
  };
  return colorChannels[format - 6402] || 1;
};

var computeUnpackAlignedImageSize = (width, height, sizePerPixel) => {
  function roundedToNextMultipleOf(x, y) {
    return (x + y - 1) & -y;
  }
  var plainRowSize = (GL.unpackRowLength || width) * sizePerPixel;
  var alignedRowSize = roundedToNextMultipleOf(plainRowSize, GL.unpackAlignment);
  return height * alignedRowSize;
};

var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels) => {
  var heap = heapObjectForWebGLType(type);
  var sizePerPixel = colorChannelsInGlTextureFormat(format) * heap.BYTES_PER_ELEMENT;
  var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel);
  return heap.subarray(toTypedArrayIndex(pixels, heap), toTypedArrayIndex(pixels + bytes, heap));
};

var _emscripten_glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
  if (true) {
    if (GLctx.currentPixelUnpackBufferBinding) {
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
      return;
    }
    if (pixels) {
      var heap = heapObjectForWebGLType(type);
      var index = toTypedArrayIndex(pixels, heap);
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, index);
      return;
    }
  }
  var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels) : null;
  GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData);
};

var _emscripten_glTexImage3D = (target, level, internalFormat, width, height, depth, border, format, type, pixels) => {
  if (GLctx.currentPixelUnpackBufferBinding) {
    GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, pixels);
  } else if (pixels) {
    var heap = heapObjectForWebGLType(type);
    GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, heap, toTypedArrayIndex(pixels, heap));
  } else {
    GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, null);
  }
};

var _emscripten_glTexParameteri = (x0, x1, x2) => GLctx.texParameteri(x0, x1, x2);

var _emscripten_glTexStorage2D = (x0, x1, x2, x3, x4) => GLctx.texStorage2D(x0, x1, x2, x3, x4);

var _emscripten_glTexStorage3D = (x0, x1, x2, x3, x4, x5) => GLctx.texStorage3D(x0, x1, x2, x3, x4, x5);

var _emscripten_glTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, type, pixels) => {
  if (true) {
    if (GLctx.currentPixelUnpackBufferBinding) {
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
      return;
    }
    if (pixels) {
      var heap = heapObjectForWebGLType(type);
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, toTypedArrayIndex(pixels, heap));
      return;
    }
  }
  var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels) : null;
  GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
};

var _emscripten_glTexSubImage3D = (target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels) => {
  if (GLctx.currentPixelUnpackBufferBinding) {
    GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels);
  } else if (pixels) {
    var heap = heapObjectForWebGLType(type);
    GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, heap, toTypedArrayIndex(pixels, heap));
  } else {
    GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, null);
  }
};

var webglGetProgramUniformLocation = (program, location) => {
  if (program) {
    var webglLoc = program.uniformLocsById[location];
    // program.uniformLocsById[location] stores either an integer, or a
    // WebGLUniformLocation.
    // If an integer, we have not yet bound the location, so do it now. The
    // integer value specifies the array index we should bind to.
    if (typeof webglLoc === "number") {
      program.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(program, program.uniformArrayNamesById[location] + (webglLoc > 0 ? `[${webglLoc}]` : ""));
    }
    // Else an already cached WebGLUniformLocation, return it.
    return webglLoc;
  } else {
    GL.recordError(1282);
  }
};

var webglGetUniformLocation = location => webglGetProgramUniformLocation(GLctx.currentProgram, location);

var _emscripten_glUniform1fv = (location, count, value) => {
  count && GLctx.uniform1fv(webglGetUniformLocation(location), (growMemViews(), HEAPF32), ((value) >> 2), count);
};

var _emscripten_glUniform1i = (location, v0) => {
  GLctx.uniform1i(webglGetUniformLocation(location), v0);
};

var _emscripten_glUniform2fv = (location, count, value) => {
  count && GLctx.uniform2fv(webglGetUniformLocation(location), (growMemViews(), HEAPF32), ((value) >> 2), count * 2);
};

var _emscripten_glUniform3fv = (location, count, value) => {
  count && GLctx.uniform3fv(webglGetUniformLocation(location), (growMemViews(), HEAPF32), ((value) >> 2), count * 3);
};

var _emscripten_glUniform4fv = (location, count, value) => {
  count && GLctx.uniform4fv(webglGetUniformLocation(location), (growMemViews(), HEAPF32), ((value) >> 2), count * 4);
};

var _emscripten_glUniformMatrix4fv = (location, count, transpose, value) => {
  count && GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, (growMemViews(), 
  HEAPF32), ((value) >> 2), count * 16);
};

var _emscripten_glUnmapBuffer = target => {
  if (!emscriptenWebGLValidateMapBufferTarget(target)) {
    GL.recordError(1280);
    err("GL_INVALID_ENUM in glUnmapBuffer");
    return 0;
  }
  var buffer = emscriptenWebGLGetBufferBinding(target);
  var mapping = GL.mappedBuffers[buffer];
  if (!mapping || !mapping.mem) {
    GL.recordError(1282);
    err("buffer was never mapped in glUnmapBuffer");
    return 0;
  }
  if (!(mapping.access & 16)) {
    /* GL_MAP_FLUSH_EXPLICIT_BIT */ webglBufferSubData(target, mapping.offset, mapping.length, mapping.mem);
  }
  _free(mapping.mem);
  mapping.mem = 0;
  return 1;
};

var _emscripten_glUseProgram = program => {
  program = GL.programs[program];
  GLctx.useProgram(program);
  // Record the currently active program so that we can access the uniform
  // mapping table of that program.
  GLctx.currentProgram = program;
};

var _emscripten_glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
  var cb = GL.currentContext.clientBuffers[index];
  if (!GLctx.currentArrayBufferBinding) {
    cb.size = size;
    cb.type = type;
    cb.normalized = normalized;
    cb.stride = stride;
    cb.ptr = ptr;
    cb.clientside = true;
    cb.vertexAttribPointerAdaptor = /** @this {WebGLRenderingContext} */ function(index, size, type, normalized, stride, ptr) {
      this.vertexAttribPointer(index, size, type, normalized, stride, ptr);
    };
    return;
  }
  cb.clientside = false;
  GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
};

var _emscripten_glViewport = (x0, x1, x2, x3) => GLctx.viewport(x0, x1, x2, x3);

function getFullscreenElement() {
  return document.fullscreenElement ?? document.webkitFullscreenElement;
}

/** @param {number=} timeout */ var safeSetTimeout = (func, timeout) => {
  runtimeKeepalivePush();
  var id = safeSetTimeout.nextId++;
  safeSetTimeout.pending.set(id, setTimeout(() => {
    safeSetTimeout.pending.delete(id);
    runtimeKeepalivePop();
    callUserCallback(func);
  }, timeout));
  return id;
};

var Browser = {
  useWebGL: false,
  isFullscreen: false,
  pointerLock: false,
  moduleContextCreatedCallbacks: [],
  preloadedImages: {},
  preloadedAudios: {},
  getCanvas: () => Module["canvas"],
  init() {
    if (Browser.initted) return;
    Browser.initted = true;
    // Support for plugins that can process preloaded files. You can add more of these to
    // your app by creating and appending to preloadPlugins.
    // Each plugin is asked if it can handle a file based on the file's name. If it can,
    // it is given the file's raw data. When it is done, it calls a callback with the file's
    // (possibly modified) data. For example, a plugin might decompress a file, or it
    // might create some side data structure for use later (like an Image element, etc.).
    var imagePlugin = {};
    imagePlugin["canHandle"] = name => !Module["noImageDecoding"] && /\.(jpg|jpeg|png|bmp|webp)$/i.test(name);
    imagePlugin["handle"] = async (byteArray, name) => {
      var b = new Blob([ byteArray ], {
        type: Browser.getMimetype(name)
      });
      if (b.size !== byteArray.length) {
        // Safari bug #118630
        // Safari's Blob can only take an ArrayBuffer
        b = new Blob([ (new Uint8Array(byteArray)).buffer ], {
          type: Browser.getMimetype(name)
        });
      }
      var url = URL.createObjectURL(b);
      return new Promise((resolve, reject) => {
        var img = new Image;
        img.onload = () => {
          assert(img.complete, `Image ${name} could not be decoded`);
          var canvas = /** @type {!HTMLCanvasElement} */ (document.createElement("canvas"));
          canvas.width = img.width;
          canvas.height = img.height;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          Browser.preloadedImages[name] = canvas;
          URL.revokeObjectURL(url);
          resolve(byteArray);
        };
        img.onerror = event => {
          err(`Image ${url} could not be decoded`);
          reject();
        };
        img.src = url;
      });
    };
    preloadPlugins.push(imagePlugin);
    var audioPlugin = {};
    audioPlugin["canHandle"] = name => !Module["noAudioDecoding"] && name.slice(-4) in {
      ".ogg": 1,
      ".wav": 1,
      ".mp3": 1
    };
    audioPlugin["handle"] = async (byteArray, name) => new Promise((resolve, reject) => {
      var done = false;
      function finish(audio) {
        if (done) return;
        done = true;
        Browser.preloadedAudios[name] = audio;
        resolve(byteArray);
      }
      var b = new Blob([ byteArray ], {
        type: Browser.getMimetype(name)
      });
      var url = URL.createObjectURL(b);
      // XXX we never revoke this!
      var audio = new Audio;
      audio.addEventListener("canplaythrough", () => finish(audio));
      // use addEventListener due to chromium bug 124926
      audio.onerror = event => {
        if (done) return;
        err(`warning: browser could not fully decode audio ${name}, trying slower base64 approach`);
        function encode64(data) {
          var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          const PAD = "=";
          var ret = "";
          var leftchar = 0;
          var leftbits = 0;
          for (var byte of data) {
            leftchar = (leftchar << 8) | byte;
            leftbits += 8;
            while (leftbits >= 6) {
              var curr = (leftchar >> (leftbits - 6)) & 63;
              leftbits -= 6;
              ret += BASE[curr];
            }
          }
          if (leftbits == 2) {
            ret += BASE[(leftchar & 3) << 4];
            ret += PAD + PAD;
          } else if (leftbits == 4) {
            ret += BASE[(leftchar & 15) << 2];
            ret += PAD;
          }
          return ret;
        }
        audio.src = "data:audio/x-" + name.slice(-3) + ";base64," + encode64(byteArray);
        finish(audio);
      };
      audio.src = url;
      // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
      safeSetTimeout(() => {
        finish(audio);
      }, 1e4);
    });
    preloadPlugins.push(audioPlugin);
    // Canvas event setup
    function pointerLockChange() {
      var canvas = Browser.getCanvas();
      Browser.pointerLock = document.pointerLockElement === canvas;
    }
    var canvas = Browser.getCanvas();
    if (canvas) {
      // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
      // Module['forcedAspectRatio'] = 4 / 3;
      document.addEventListener("pointerlockchange", pointerLockChange);
      if (Module["elementPointerLock"]) {
        canvas.addEventListener("click", ev => {
          if (!Browser.pointerLock && Browser.getCanvas().requestPointerLock) {
            Browser.getCanvas().requestPointerLock();
            ev.preventDefault();
          }
        });
      }
    }
  },
  createContext(/** @type {HTMLCanvasElement} */ canvas, useWebGL, setInModule, webGLContextAttributes) {
    if (useWebGL && Module["ctx"] && canvas == Browser.getCanvas()) return Module["ctx"];
    // no need to recreate GL context if it's already been created for this canvas.
    var ctx;
    var contextHandle;
    if (useWebGL) {
      // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
      var contextAttributes = {
        antialias: false,
        alpha: false,
        majorVersion: 2
      };
      if (webGLContextAttributes) {
        for (var attribute in webGLContextAttributes) {
          contextAttributes[attribute] = webGLContextAttributes[attribute];
        }
      }
      // This check of existence of GL is here to satisfy Closure compiler, which yells if variable GL is referenced below but GL object is not
      // actually compiled in because application is not doing any GL operations. TODO: Ideally if GL is not being used, this function
      // Browser.createContext() should not even be emitted.
      if (typeof GL !== "undefined") {
        contextHandle = GL.createContext(canvas, contextAttributes);
        if (contextHandle) {
          ctx = GL.getContext(contextHandle).GLctx;
        }
      }
    } else {
      ctx = canvas.getContext("2d");
    }
    if (!ctx) return null;
    if (setInModule) {
      if (!useWebGL) assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
      Module["ctx"] = ctx;
      if (useWebGL) GL.makeContextCurrent(contextHandle);
      Browser.useWebGL = useWebGL;
      Browser.moduleContextCreatedCallbacks.forEach(callback => callback());
      Browser.init();
    }
    return ctx;
  },
  fullscreenHandlersInstalled: false,
  lockPointer: undefined,
  resizeCanvas: undefined,
  requestFullscreen(lockPointer, resizeCanvas) {
    Browser.lockPointer = lockPointer;
    Browser.resizeCanvas = resizeCanvas;
    if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
    if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
    var canvas = Browser.getCanvas();
    function fullscreenChange() {
      Browser.isFullscreen = false;
      var canvasContainer = canvas.parentNode;
      if (getFullscreenElement() === canvasContainer) {
        canvas.exitFullscreen = Browser.exitFullscreen;
        if (Browser.lockPointer) canvas.requestPointerLock?.();
        Browser.isFullscreen = true;
        if (Browser.resizeCanvas) {
          Browser.setFullscreenCanvasSize();
        } else {
          Browser.updateCanvasDimensions(canvas);
        }
      } else {
        // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
        canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
        canvasContainer.parentNode.removeChild(canvasContainer);
        if (Browser.resizeCanvas) {
          Browser.setWindowedCanvasSize();
        } else {
          Browser.updateCanvasDimensions(canvas);
        }
      }
    }
    if (!Browser.fullscreenHandlersInstalled) {
      Browser.fullscreenHandlersInstalled = true;
      document.addEventListener("fullscreenchange", fullscreenChange);
      document.addEventListener("webkitfullscreenchange", fullscreenChange);
    }
    // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
    var canvasContainer = document.createElement("div");
    canvas.parentNode.insertBefore(canvasContainer, canvas);
    canvasContainer.appendChild(canvas);
    // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
    // Safari didn't support Element.requestFullscreen until 16.4
    // See: https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
    /** @suppress {checkTypes} */ canvasContainer.requestFullscreen ??= (canvasContainer["webkitRequestFullscreen"] ? () => canvasContainer["webkitRequestFullscreen"](Element.ALLOW_KEYBOARD_INPUT) : null) ?? (canvasContainer["webkitRequestFullScreen"] ? () => canvasContainer["webkitRequestFullScreen"](Element.ALLOW_KEYBOARD_INPUT) : null);
    canvasContainer.requestFullscreen();
  },
  exitFullscreen() {
    // This is workaround for chrome. Trying to exit from fullscreen
    // not in fullscreen state will cause 'TypeError: Document not active'
    // in chrome. See https://github.com/emscripten-core/emscripten/pull/8236
    if (!Browser.isFullscreen) {
      return false;
    }
    var CFS = document.exitFullscreen ?? document["webkitCancelFullScreen"];
    CFS.call(document);
    return true;
  },
  getMimetype(name) {
    return {
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png",
      "bmp": "image/bmp",
      "ogg": "audio/ogg",
      "wav": "audio/wav",
      "mp3": "audio/mpeg"
    }[name.slice(name.lastIndexOf(".") + 1)];
  },
  getMouseWheelDelta(event) {
    var delta = 0;
    switch (event.type) {
     case "DOMMouseScroll":
      // 3 lines make up a step
      delta = event.detail / 3;
      break;

     case "mousewheel":
      // 120 units make up a step
      delta = event.wheelDelta / 120;
      break;

     case "wheel":
      delta = event.deltaY;
      switch (event.deltaMode) {
       case 0:
        // DOM_DELTA_PIXEL: 100 pixels make up a step
        delta /= 100;
        break;

       case 1:
        // DOM_DELTA_LINE: 3 lines make up a step
        delta /= 3;
        break;

       case 2:
        // DOM_DELTA_PAGE: A page makes up 80 steps
        delta *= 80;
        break;

       default:
        abort("unrecognized mouse wheel delta mode: " + event.deltaMode);
      }
      break;

     default:
      abort("unrecognized mouse wheel event: " + event.type);
    }
    return delta;
  },
  mouseX: 0,
  mouseY: 0,
  mouseMovementX: 0,
  mouseMovementY: 0,
  touches: {},
  lastTouches: {},
  calculateMouseCoords(pageX, pageY) {
    // Calculate the movement based on the changes
    // in the coordinates.
    var canvas = Browser.getCanvas();
    var rect = canvas.getBoundingClientRect();
    var adjustedX = pageX - (window.scrollX + rect.left);
    var adjustedY = pageY - (window.scrollY + rect.top);
    // the canvas might be CSS-scaled compared to its backbuffer;
    // SDL-using content will want mouse coordinates in terms
    // of backbuffer units.
    adjustedX = adjustedX * (canvas.width / rect.width);
    adjustedY = adjustedY * (canvas.height / rect.height);
    return {
      x: adjustedX,
      y: adjustedY
    };
  },
  setMouseCoords(pageX, pageY) {
    const {x, y} = Browser.calculateMouseCoords(pageX, pageY);
    Browser.mouseMovementX = x - Browser.mouseX;
    Browser.mouseMovementY = y - Browser.mouseY;
    Browser.mouseX = x;
    Browser.mouseY = y;
  },
  calculateMouseEvent(event) {
    // event should be mousemove, mousedown or mouseup
    if (Browser.pointerLock) {
      // When the pointer is locked, calculate the coordinates
      // based on the movement of the mouse.
      Browser.mouseMovementX = event.movementX;
      Browser.mouseMovementY = event.movementY;
      // add the mouse delta to the current absolute mouse position
      Browser.mouseX += Browser.mouseMovementX;
      Browser.mouseY += Browser.mouseMovementY;
    } else {
      if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
        var touch = event.touch;
        if (touch === undefined) {
          return;
        }
        var coords = Browser.calculateMouseCoords(touch.pageX, touch.pageY);
        if (event.type === "touchstart") {
          Browser.lastTouches[touch.identifier] = coords;
          Browser.touches[touch.identifier] = coords;
        } else if (event.type === "touchend" || event.type === "touchmove") {
          var last = Browser.touches[touch.identifier];
          last ||= coords;
          Browser.lastTouches[touch.identifier] = last;
          Browser.touches[touch.identifier] = coords;
        }
        return;
      }
      Browser.setMouseCoords(event.pageX, event.pageY);
    }
  },
  resizeListeners: [],
  updateResizeListeners() {
    var canvas = Browser.getCanvas();
    Browser.resizeListeners.forEach(listener => listener(canvas.width, canvas.height));
  },
  setCanvasSize(width, height, noUpdates = undefined) {
    var canvas = Browser.getCanvas();
    Browser.updateCanvasDimensions(canvas, width, height);
    if (!noUpdates) Browser.updateResizeListeners();
  },
  setFullscreenCanvasSize() {
    // check if SDL is available
    if (typeof SDL !== "undefined") {
      var flags = (growMemViews(), HEAPU32)[((SDL.screen) >> 2)];
      flags = flags | 8388608;
      (growMemViews(), HEAP32)[((SDL.screen) >> 2)] = flags;
      checkInt32(flags);
    }
    Browser.updateCanvasDimensions(Browser.getCanvas());
    Browser.updateResizeListeners();
  },
  setWindowedCanvasSize() {
    // check if SDL is available
    if (typeof SDL !== "undefined") {
      var flags = (growMemViews(), HEAPU32)[((SDL.screen) >> 2)];
      flags = flags & ~8388608;
      (growMemViews(), HEAP32)[((SDL.screen) >> 2)] = flags;
      checkInt32(flags);
    }
    Browser.updateCanvasDimensions(Browser.getCanvas());
    Browser.updateResizeListeners();
  },
  updateCanvasDimensions(canvas, wNative = undefined, hNative = undefined) {
    if (wNative && hNative) {
      canvas.widthNative = wNative;
      canvas.heightNative = hNative;
    } else {
      wNative = canvas.widthNative;
      hNative = canvas.heightNative;
    }
    var w = wNative;
    var h = hNative;
    if ((getFullscreenElement() === canvas.parentNode) && (typeof screen !== "undefined")) {
      var factor = Math.min(screen.width / w, screen.height / h);
      w = Math.round(w * factor);
      h = Math.round(h * factor);
    }
    if (Browser.resizeCanvas) {
      if (canvas.width != w) canvas.width = w;
      if (canvas.height != h) canvas.height = h;
      if (typeof canvas.style !== "undefined") {
        canvas.style.removeProperty("width");
        canvas.style.removeProperty("height");
      }
    } else {
      if (canvas.width != wNative) canvas.width = wNative;
      if (canvas.height != hNative) canvas.height = hNative;
      if (typeof canvas.style !== "undefined") {
        if (w != wNative || h != hNative) {
          canvas.style.setProperty("width", w + "px", "important");
          canvas.style.setProperty("height", h + "px", "important");
        } else {
          canvas.style.removeProperty("width");
          canvas.style.removeProperty("height");
        }
      }
    }
  }
};

/** @constructor */ function GLFW_Window(id, width, height, framebufferWidth, framebufferHeight, title, monitor, share) {
  this.id = id;
  this.x = 0;
  this.y = 0;
  this.fullscreen = false;
  // Used to determine if app is in fullscreen mode
  this.storedX = 0;
  // Used to store X before fullscreen
  this.storedY = 0;
  // Used to store Y before fullscreen
  this.width = width;
  this.height = height;
  this.framebufferWidth = framebufferWidth;
  this.framebufferHeight = framebufferHeight;
  this.storedWidth = width;
  // Used to store width before fullscreen
  this.storedHeight = height;
  // Used to store height before fullscreen
  this.title = title;
  this.monitor = monitor;
  this.share = share;
  this.attributes = {
    ...GLFW.hints
  };
  this.inputModes = {
    208897: 212993,
    // GLFW_CURSOR (GLFW_CURSOR_NORMAL)
    208898: 0,
    // GLFW_STICKY_KEYS
    208899: 0
  };
  this.buttons = 0;
  this.keys = new Array;
  this.domKeys = new Array;
  this.shouldClose = 0;
  this.title = null;
  this.windowPosFunc = 0;
  // GLFWwindowposfun
  this.windowSizeFunc = 0;
  // GLFWwindowsizefun
  this.windowCloseFunc = 0;
  // GLFWwindowclosefun
  this.windowRefreshFunc = 0;
  // GLFWwindowrefreshfun
  this.windowFocusFunc = 0;
  // GLFWwindowfocusfun
  this.windowIconifyFunc = 0;
  // GLFWwindowiconifyfun
  this.windowMaximizeFunc = 0;
  // GLFWwindowmaximizefun
  this.framebufferSizeFunc = 0;
  // GLFWframebuffersizefun
  this.windowContentScaleFunc = 0;
  // GLFWwindowcontentscalefun
  this.mouseButtonFunc = 0;
  // GLFWmousebuttonfun
  this.cursorPosFunc = 0;
  // GLFWcursorposfun
  this.cursorEnterFunc = 0;
  // GLFWcursorenterfun
  this.scrollFunc = 0;
  // GLFWscrollfun
  this.dropFunc = 0;
  // GLFWdropfun
  this.keyFunc = 0;
  // GLFWkeyfun
  this.charFunc = 0;
  // GLFWcharfun
  this.userptr = 0;
}

var _emscripten_set_main_loop_timing = (mode, value) => {
  MainLoop.timingMode = mode;
  MainLoop.timingValue = value;
  if (!MainLoop.func) {
    err("emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.");
    return 1;
  }
  // If there is no existing scheduler then we are transitioning from
  // inactive to active and we add to runtime keepalive counter.
  if (!MainLoop.scheduler) {
    runtimeKeepalivePush();
  }
  if (mode == 0) {
    MainLoop.scheduler = function MainLoop_scheduler_setTimeout() {
      var timeUntilNextTick = Math.max(0, MainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
      setTimeout(MainLoop.runner, timeUntilNextTick);
    };
  } else if (mode == 1) {
    MainLoop.scheduler = function MainLoop_scheduler_rAF() {
      MainLoop.requestAnimationFrame(MainLoop.runner);
    };
  } else {
    assert(mode == 2);
    if (!MainLoop.setImmediate) {
      if (globalThis.scheduler) {
        // Some modern browsers implement scheduler.postTask, but not all.
        MainLoop.setImmediate = scheduler.postTask.bind(scheduler);
      } else {
        // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
        var setImmediates = [];
        var emscriptenMainLoopMessageId = "setimmediate";
        /** @param {Event} event */ var MainLoop_setImmediate_messageHandler = event => {
          if (event.data === emscriptenMainLoopMessageId) {
            event.stopPropagation();
            setImmediates.shift()();
          }
        };
        addEventListener("message", MainLoop_setImmediate_messageHandler, true);
        MainLoop.setImmediate = /** @type{function(function(): ?, ...?): number} */ (func => {
          setImmediates.push(func);
          if (ENVIRONMENT_IS_WORKER) {
            // The postMessge API in a Worker, sends message to the main
            // thread and does not support the `targetOrigin` (*) argument.
            postMessage(emscriptenMainLoopMessageId);
          } else {
            postMessage(emscriptenMainLoopMessageId, "*");
          }
        });
      }
    }
    MainLoop.scheduler = function MainLoop_scheduler_setImmediate() {
      MainLoop.setImmediate(MainLoop.runner);
    };
  }
  return 0;
};

/**
   * @param {number=} arg
   * @param {boolean=} noSetTiming
   */ var setMainLoop = (iterFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
  assert(!MainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once");
  MainLoop.func = iterFunc;
  MainLoop.arg = arg;
  var thisMainLoopId = MainLoop.currentlyRunningMainloop;
  function checkIsRunning() {
    if (thisMainLoopId < MainLoop.currentlyRunningMainloop) {
      maybeExit();
      return false;
    }
    return true;
  }
  // We create the loop runner here but it is not actually running until
  // _emscripten_set_main_loop_timing is called (which might happen at a
  // later time).
  MainLoop.runner = function MainLoop_runner() {
    if (ABORT) return;
    if (MainLoop.queue.length > 0) {
      var start = Date.now();
      var blocker = MainLoop.queue.shift();
      blocker.func(blocker.arg);
      if (MainLoop.remainingBlockers) {
        var remaining = MainLoop.remainingBlockers;
        var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
        if (blocker.counted) {
          MainLoop.remainingBlockers = next;
        } else {
          // not counted, but move the progress along a tiny bit
          next = next + .5;
          // do not steal all the next one's progress
          MainLoop.remainingBlockers = (8 * remaining + next) / 9;
        }
      }
      MainLoop.updateStatus();
      // catches pause/resume main loop from blocker execution
      if (!checkIsRunning()) return;
      setTimeout(MainLoop.runner, 0);
      return;
    }
    // catch pauses from non-main loop sources
    if (!checkIsRunning()) return;
    // Implement very basic swap interval control
    MainLoop.currentFrameNumber = MainLoop.currentFrameNumber + 1 | 0;
    if (MainLoop.timingMode == 1 && MainLoop.timingValue > 1 && MainLoop.currentFrameNumber % MainLoop.timingValue != 0) {
      // Not the scheduled time to render this frame - skip.
      MainLoop.scheduler();
      return;
    } else if (MainLoop.timingMode == 0) {
      MainLoop.tickStartTime = _emscripten_get_now();
      if (Module["ctx"]) {
        warnOnce("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
      }
    }
    MainLoop.runIter(iterFunc);
    // catch pauses from the main loop itself
    if (!checkIsRunning()) return;
    MainLoop.scheduler();
  };
  if (!noSetTiming) {
    if (fps > 0) {
      _emscripten_set_main_loop_timing(0, 1e3 / fps);
    } else {
      // Do rAF by rendering each frame (no decimating)
      _emscripten_set_main_loop_timing(1, 1);
    }
    MainLoop.scheduler();
  }
  if (simulateInfiniteLoop) {
    throw "unwind";
  }
};

var MainLoop = {
  func: null,
  scheduler: null,
  currentlyRunningMainloop: 0,
  arg: 0,
  timingMode: 0,
  timingValue: 0,
  currentFrameNumber: 0,
  queue: [],
  preMainLoop: [],
  postMainLoop: [],
  pause() {
    if (MainLoop.scheduler) {
      MainLoop.scheduler = null;
      // Incrementing this signals the previous main loop that it's now become old, and it must return.
      MainLoop.currentlyRunningMainloop++;
      runtimeKeepalivePop();
    }
  },
  resume() {
    MainLoop.currentlyRunningMainloop++;
    var timingMode = MainLoop.timingMode;
    var timingValue = MainLoop.timingValue;
    var func = MainLoop.func;
    MainLoop.func = null;
    // do not set timing and call scheduler, we will do it on the next lines
    setMainLoop(func, 0, false, MainLoop.arg, true);
    _emscripten_set_main_loop_timing(timingMode, timingValue);
    MainLoop.scheduler();
  },
  updateStatus() {
    if (Module["setStatus"]) {
      var message = Module["statusMessage"] || "Please wait...";
      var remaining = MainLoop.remainingBlockers ?? 0;
      var expected = MainLoop.expectedBlockers ?? 0;
      if (remaining) {
        if (remaining < expected) {
          Module["setStatus"](`${message} (${expected - remaining}/${expected})`);
        } else {
          Module["setStatus"](message);
        }
      } else {
        Module["setStatus"]("");
      }
    }
  },
  init() {},
  runIter(func) {
    if (ABORT) return;
    for (var pre of MainLoop.preMainLoop) {
      if (pre() === false) {
        return;
      }
    }
    callUserCallback(func);
    for (var post of MainLoop.postMainLoop) {
      post();
    }
    checkStackCookie();
  },
  nextRAF: 0,
  fakeRequestAnimationFrame(func) {
    // try to keep 60fps between calls to here
    var now = Date.now();
    if (!MainLoop.nextRAF) {
      MainLoop.nextRAF = now + 1e3 / 60;
    } else {
      while (now + 2 >= MainLoop.nextRAF) {
        // fudge a little, to avoid timer jitter causing us to do lots of delay:0
        MainLoop.nextRAF += 1e3 / 60;
      }
    }
    var delay = Math.max(MainLoop.nextRAF - now, 0);
    setTimeout(func, delay);
  },
  requestAnimationFrame(func) {
    if (globalThis.requestAnimationFrame) {
      requestAnimationFrame(func);
    } else {
      MainLoop.fakeRequestAnimationFrame(func);
    }
  }
};

function _emscripten_set_window_title(title) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(24, 0, 1, title);
  return document.title = UTF8ToString(title);
}

var GLFW = {
  WindowFromId: id => {
    if (id <= 0 || !GLFW.windows) return null;
    return GLFW.windows[id - 1];
  },
  joystickFunc: 0,
  errorFunc: 0,
  monitorFunc: 0,
  active: null,
  scale: null,
  windows: null,
  monitors: null,
  monitorString: null,
  versionString: null,
  initialTime: null,
  extensions: null,
  devicePixelRatioMQL: null,
  hints: null,
  primaryTouchId: null,
  defaultHints: {
    131073: 0,
    131074: 0,
    131075: 1,
    131076: 1,
    131077: 1,
    131082: 0,
    135169: 8,
    135170: 8,
    135171: 8,
    135172: 8,
    135173: 24,
    135174: 8,
    135175: 0,
    135176: 0,
    135177: 0,
    135178: 0,
    135179: 0,
    135180: 0,
    135181: 0,
    135182: 0,
    135183: 0,
    139265: 196609,
    139266: 1,
    139267: 0,
    139268: 0,
    139269: 0,
    139270: 0,
    139271: 0,
    139272: 0,
    139276: 0
  },
  DOMToGLFWKeyCode: keycode => {
    switch (keycode) {
     // these keycodes are only defined for GLFW3, assume they are the same for GLFW2
      case 32:
      return 32;

     // DOM_VK_SPACE -> GLFW_KEY_SPACE
      case 222:
      return 39;

     // DOM_VK_QUOTE -> GLFW_KEY_APOSTROPHE
      case 188:
      return 44;

     // DOM_VK_COMMA -> GLFW_KEY_COMMA
      case 173:
      return 45;

     // DOM_VK_HYPHEN_MINUS -> GLFW_KEY_MINUS
      case 189:
      return 45;

     // DOM_VK_MINUS -> GLFW_KEY_MINUS
      case 190:
      return 46;

     // DOM_VK_PERIOD -> GLFW_KEY_PERIOD
      case 191:
      return 47;

     // DOM_VK_SLASH -> GLFW_KEY_SLASH
      case 48:
      return 48;

     // DOM_VK_0 -> GLFW_KEY_0
      case 49:
      return 49;

     // DOM_VK_1 -> GLFW_KEY_1
      case 50:
      return 50;

     // DOM_VK_2 -> GLFW_KEY_2
      case 51:
      return 51;

     // DOM_VK_3 -> GLFW_KEY_3
      case 52:
      return 52;

     // DOM_VK_4 -> GLFW_KEY_4
      case 53:
      return 53;

     // DOM_VK_5 -> GLFW_KEY_5
      case 54:
      return 54;

     // DOM_VK_6 -> GLFW_KEY_6
      case 55:
      return 55;

     // DOM_VK_7 -> GLFW_KEY_7
      case 56:
      return 56;

     // DOM_VK_8 -> GLFW_KEY_8
      case 57:
      return 57;

     // DOM_VK_9 -> GLFW_KEY_9
      case 59:
      return 59;

     // DOM_VK_SEMICOLON -> GLFW_KEY_SEMICOLON
      case 61:
      return 61;

     // DOM_VK_EQUALS -> GLFW_KEY_EQUAL
      case 187:
      return 61;

     // DOM_VK_EQUALS -> GLFW_KEY_EQUAL
      case 65:
      return 65;

     // DOM_VK_A -> GLFW_KEY_A
      case 66:
      return 66;

     // DOM_VK_B -> GLFW_KEY_B
      case 67:
      return 67;

     // DOM_VK_C -> GLFW_KEY_C
      case 68:
      return 68;

     // DOM_VK_D -> GLFW_KEY_D
      case 69:
      return 69;

     // DOM_VK_E -> GLFW_KEY_E
      case 70:
      return 70;

     // DOM_VK_F -> GLFW_KEY_F
      case 71:
      return 71;

     // DOM_VK_G -> GLFW_KEY_G
      case 72:
      return 72;

     // DOM_VK_H -> GLFW_KEY_H
      case 73:
      return 73;

     // DOM_VK_I -> GLFW_KEY_I
      case 74:
      return 74;

     // DOM_VK_J -> GLFW_KEY_J
      case 75:
      return 75;

     // DOM_VK_K -> GLFW_KEY_K
      case 76:
      return 76;

     // DOM_VK_L -> GLFW_KEY_L
      case 77:
      return 77;

     // DOM_VK_M -> GLFW_KEY_M
      case 78:
      return 78;

     // DOM_VK_N -> GLFW_KEY_N
      case 79:
      return 79;

     // DOM_VK_O -> GLFW_KEY_O
      case 80:
      return 80;

     // DOM_VK_P -> GLFW_KEY_P
      case 81:
      return 81;

     // DOM_VK_Q -> GLFW_KEY_Q
      case 82:
      return 82;

     // DOM_VK_R -> GLFW_KEY_R
      case 83:
      return 83;

     // DOM_VK_S -> GLFW_KEY_S
      case 84:
      return 84;

     // DOM_VK_T -> GLFW_KEY_T
      case 85:
      return 85;

     // DOM_VK_U -> GLFW_KEY_U
      case 86:
      return 86;

     // DOM_VK_V -> GLFW_KEY_V
      case 87:
      return 87;

     // DOM_VK_W -> GLFW_KEY_W
      case 88:
      return 88;

     // DOM_VK_X -> GLFW_KEY_X
      case 89:
      return 89;

     // DOM_VK_Y -> GLFW_KEY_Y
      case 90:
      return 90;

     // DOM_VK_Z -> GLFW_KEY_Z
      case 219:
      return 91;

     // DOM_VK_OPEN_BRACKET -> GLFW_KEY_LEFT_BRACKET
      case 220:
      return 92;

     // DOM_VK_BACKSLASH -> GLFW_KEY_BACKSLASH
      case 221:
      return 93;

     // DOM_VK_CLOSE_BRACKET -> GLFW_KEY_RIGHT_BRACKET
      case 192:
      return 96;

     // DOM_VK_BACK_QUOTE -> GLFW_KEY_GRAVE_ACCENT
      case 27:
      return 256;

     // DOM_VK_ESCAPE -> GLFW_KEY_ESCAPE
      case 13:
      return 257;

     // DOM_VK_RETURN -> GLFW_KEY_ENTER
      case 9:
      return 258;

     // DOM_VK_TAB -> GLFW_KEY_TAB
      case 8:
      return 259;

     // DOM_VK_BACK -> GLFW_KEY_BACKSPACE
      case 45:
      return 260;

     // DOM_VK_INSERT -> GLFW_KEY_INSERT
      case 46:
      return 261;

     // DOM_VK_DELETE -> GLFW_KEY_DELETE
      case 39:
      return 262;

     // DOM_VK_RIGHT -> GLFW_KEY_RIGHT
      case 37:
      return 263;

     // DOM_VK_LEFT -> GLFW_KEY_LEFT
      case 40:
      return 264;

     // DOM_VK_DOWN -> GLFW_KEY_DOWN
      case 38:
      return 265;

     // DOM_VK_UP -> GLFW_KEY_UP
      case 33:
      return 266;

     // DOM_VK_PAGE_UP -> GLFW_KEY_PAGE_UP
      case 34:
      return 267;

     // DOM_VK_PAGE_DOWN -> GLFW_KEY_PAGE_DOWN
      case 36:
      return 268;

     // DOM_VK_HOME -> GLFW_KEY_HOME
      case 35:
      return 269;

     // DOM_VK_END -> GLFW_KEY_END
      case 20:
      return 280;

     // DOM_VK_CAPS_LOCK -> GLFW_KEY_CAPS_LOCK
      case 145:
      return 281;

     // DOM_VK_SCROLL_LOCK -> GLFW_KEY_SCROLL_LOCK
      case 144:
      return 282;

     // DOM_VK_NUM_LOCK -> GLFW_KEY_NUM_LOCK
      case 44:
      return 283;

     // DOM_VK_SNAPSHOT -> GLFW_KEY_PRINT_SCREEN
      case 19:
      return 284;

     // DOM_VK_PAUSE -> GLFW_KEY_PAUSE
      case 112:
      return 290;

     // DOM_VK_F1 -> GLFW_KEY_F1
      case 113:
      return 291;

     // DOM_VK_F2 -> GLFW_KEY_F2
      case 114:
      return 292;

     // DOM_VK_F3 -> GLFW_KEY_F3
      case 115:
      return 293;

     // DOM_VK_F4 -> GLFW_KEY_F4
      case 116:
      return 294;

     // DOM_VK_F5 -> GLFW_KEY_F5
      case 117:
      return 295;

     // DOM_VK_F6 -> GLFW_KEY_F6
      case 118:
      return 296;

     // DOM_VK_F7 -> GLFW_KEY_F7
      case 119:
      return 297;

     // DOM_VK_F8 -> GLFW_KEY_F8
      case 120:
      return 298;

     // DOM_VK_F9 -> GLFW_KEY_F9
      case 121:
      return 299;

     // DOM_VK_F10 -> GLFW_KEY_F10
      case 122:
      return 300;

     // DOM_VK_F11 -> GLFW_KEY_F11
      case 123:
      return 301;

     // DOM_VK_F12 -> GLFW_KEY_F12
      case 124:
      return 302;

     // DOM_VK_F13 -> GLFW_KEY_F13
      case 125:
      return 303;

     // DOM_VK_F14 -> GLFW_KEY_F14
      case 126:
      return 304;

     // DOM_VK_F15 -> GLFW_KEY_F15
      case 127:
      return 305;

     // DOM_VK_F16 -> GLFW_KEY_F16
      case 128:
      return 306;

     // DOM_VK_F17 -> GLFW_KEY_F17
      case 129:
      return 307;

     // DOM_VK_F18 -> GLFW_KEY_F18
      case 130:
      return 308;

     // DOM_VK_F19 -> GLFW_KEY_F19
      case 131:
      return 309;

     // DOM_VK_F20 -> GLFW_KEY_F20
      case 132:
      return 310;

     // DOM_VK_F21 -> GLFW_KEY_F21
      case 133:
      return 311;

     // DOM_VK_F22 -> GLFW_KEY_F22
      case 134:
      return 312;

     // DOM_VK_F23 -> GLFW_KEY_F23
      case 135:
      return 313;

     // DOM_VK_F24 -> GLFW_KEY_F24
      case 136:
      return 314;

     // 0x88 (not used?) -> GLFW_KEY_F25
      case 96:
      return 320;

     // DOM_VK_NUMPAD0 -> GLFW_KEY_KP_0
      case 97:
      return 321;

     // DOM_VK_NUMPAD1 -> GLFW_KEY_KP_1
      case 98:
      return 322;

     // DOM_VK_NUMPAD2 -> GLFW_KEY_KP_2
      case 99:
      return 323;

     // DOM_VK_NUMPAD3 -> GLFW_KEY_KP_3
      case 100:
      return 324;

     // DOM_VK_NUMPAD4 -> GLFW_KEY_KP_4
      case 101:
      return 325;

     // DOM_VK_NUMPAD5 -> GLFW_KEY_KP_5
      case 102:
      return 326;

     // DOM_VK_NUMPAD6 -> GLFW_KEY_KP_6
      case 103:
      return 327;

     // DOM_VK_NUMPAD7 -> GLFW_KEY_KP_7
      case 104:
      return 328;

     // DOM_VK_NUMPAD8 -> GLFW_KEY_KP_8
      case 105:
      return 329;

     // DOM_VK_NUMPAD9 -> GLFW_KEY_KP_9
      case 110:
      return 330;

     // DOM_VK_DECIMAL -> GLFW_KEY_KP_DECIMAL
      case 111:
      return 331;

     // DOM_VK_DIVIDE -> GLFW_KEY_KP_DIVIDE
      case 106:
      return 332;

     // DOM_VK_MULTIPLY -> GLFW_KEY_KP_MULTIPLY
      case 109:
      return 333;

     // DOM_VK_SUBTRACT -> GLFW_KEY_KP_SUBTRACT
      case 107:
      return 334;

     // DOM_VK_ADD -> GLFW_KEY_KP_ADD
      // case 0x0D:return 335; // DOM_VK_RETURN -> GLFW_KEY_KP_ENTER (DOM_KEY_LOCATION_RIGHT)
      // case 0x61:return 336; // DOM_VK_EQUALS -> GLFW_KEY_KP_EQUAL (DOM_KEY_LOCATION_RIGHT)
      case 16:
      return 340;

     // DOM_VK_SHIFT -> GLFW_KEY_LEFT_SHIFT
      case 17:
      return 341;

     // DOM_VK_CONTROL -> GLFW_KEY_LEFT_CONTROL
      case 18:
      return 342;

     // DOM_VK_ALT -> GLFW_KEY_LEFT_ALT
      case 91:
      return 343;

     // DOM_VK_WIN -> GLFW_KEY_LEFT_SUPER
      case 224:
      return 343;

     // DOM_VK_META -> GLFW_KEY_LEFT_SUPER
      // case 0x10:return 344; // DOM_VK_SHIFT -> GLFW_KEY_RIGHT_SHIFT (DOM_KEY_LOCATION_RIGHT)
      // case 0x11:return 345; // DOM_VK_CONTROL -> GLFW_KEY_RIGHT_CONTROL (DOM_KEY_LOCATION_RIGHT)
      // case 0x12:return 346; // DOM_VK_ALT -> GLFW_KEY_RIGHT_ALT (DOM_KEY_LOCATION_RIGHT)
      // case 0x5B:return 347; // DOM_VK_WIN -> GLFW_KEY_RIGHT_SUPER (DOM_KEY_LOCATION_RIGHT)
      case 93:
      return 348;

     // DOM_VK_CONTEXT_MENU -> GLFW_KEY_MENU
      // XXX: GLFW_KEY_WORLD_1, GLFW_KEY_WORLD_2 what are these?
      default:
      return -1;
    }
  },
  getModBits: win => {
    var mod = 0;
    if (win.keys[340]) mod |= 1;
    // GLFW_MOD_SHIFT
    if (win.keys[341]) mod |= 2;
    // GLFW_MOD_CONTROL
    if (win.keys[342]) mod |= 4;
    // GLFW_MOD_ALT
    if (win.keys[343] || win.keys[348]) mod |= 8;
    // GLFW_MOD_SUPER
    // add caps and num lock keys? only if lock_key_mod is set
    return mod;
  },
  onKeyPress: event => {
    if (!GLFW.active || !GLFW.active.charFunc) return;
    if (event.ctrlKey || event.metaKey) return;
    // correct unicode charCode is only available with onKeyPress event
    var charCode = event.charCode;
    if (charCode == 0 || (charCode >= 0 && charCode <= 31)) return;
    getWasmTableEntry(GLFW.active.charFunc)(GLFW.active.id, charCode);
  },
  onKeyChanged: (keyCode, status) => {
    if (!GLFW.active) return;
    var key = GLFW.DOMToGLFWKeyCode(keyCode);
    if (key == -1) return;
    var repeat = status && GLFW.active.keys[key];
    GLFW.active.keys[key] = status;
    GLFW.active.domKeys[keyCode] = status;
    if (GLFW.active.keyFunc) {
      if (repeat) status = 2;
      // GLFW_REPEAT
      getWasmTableEntry(GLFW.active.keyFunc)(GLFW.active.id, key, keyCode, status, GLFW.getModBits(GLFW.active));
    }
  },
  onGamepadConnected: event => {
    GLFW.refreshJoysticks();
  },
  onGamepadDisconnected: event => {
    GLFW.refreshJoysticks();
  },
  onKeydown: event => {
    GLFW.onKeyChanged(event.keyCode, 1);
    // GLFW_PRESS or GLFW_REPEAT
    // This logic comes directly from the sdl implementation. We cannot
    // call preventDefault on all keydown events otherwise onKeyPress will
    // not get called
    if (event.key == "Backspace" || event.key == "Tab") {
      event.preventDefault();
    }
  },
  onKeyup: event => {
    GLFW.onKeyChanged(event.keyCode, 0);
  },
  onBlur: event => {
    if (!GLFW.active) return;
    for (var i = 0; i < GLFW.active.domKeys.length; ++i) {
      if (GLFW.active.domKeys[i]) {
        GLFW.onKeyChanged(i, 0);
      }
    }
  },
  onMousemove: event => {
    if (!GLFW.active) return;
    if (event.type === "touchmove") {
      // Handling for touch events that are being converted to mouse input.
      // Don't let the browser fire a duplicate mouse event.
      event.preventDefault();
      let primaryChanged = false;
      for (let i of event.changedTouches) {
        // If our chosen primary touch moved, update Browser mouse coords
        if (GLFW.primaryTouchId === i.identifier) {
          Browser.setMouseCoords(i.pageX, i.pageY);
          primaryChanged = true;
          break;
        }
      }
      if (!primaryChanged) {
        // Do not send mouse events if some touch other than the primary triggered this.
        return;
      }
    } else {
      // Handling for non-touch mouse input events.
      Browser.calculateMouseEvent(event);
    }
    if (event.target != Browser.getCanvas() || !GLFW.active.cursorPosFunc) return;
    if (GLFW.active.cursorPosFunc) {
      getWasmTableEntry(GLFW.active.cursorPosFunc)(GLFW.active.id, Browser.mouseX, Browser.mouseY);
    }
  },
  DOMToGLFWMouseButton: event => {
    // DOM and glfw have different button codes.
    // See http://www.w3schools.com/jsref/event_button.asp.
    var eventButton = event["button"];
    if (eventButton > 0) {
      if (eventButton == 1) {
        eventButton = 2;
      } else {
        eventButton = 1;
      }
    }
    return eventButton;
  },
  onMouseenter: event => {
    if (!GLFW.active) return;
    if (event.target != Browser.getCanvas()) return;
    if (GLFW.active.cursorEnterFunc) {
      getWasmTableEntry(GLFW.active.cursorEnterFunc)(GLFW.active.id, 1);
    }
  },
  onMouseleave: event => {
    if (!GLFW.active) return;
    if (event.target != Browser.getCanvas()) return;
    if (GLFW.active.cursorEnterFunc) {
      getWasmTableEntry(GLFW.active.cursorEnterFunc)(GLFW.active.id, 0);
    }
  },
  onMouseButtonChanged: (event, status) => {
    if (!GLFW.active) return;
    if (event.target != Browser.getCanvas()) return;
    // Is this from a touch event?
    const isTouchType = event.type === "touchstart" || event.type === "touchend" || event.type === "touchcancel";
    // Only emulating mouse left-click behavior for touches.
    let eventButton = 0;
    if (isTouchType) {
      // Handling for touch events that are being converted to mouse input.
      // Don't let the browser fire a duplicate mouse event.
      event.preventDefault();
      let primaryChanged = false;
      // Set a primary touch if we have none.
      if (GLFW.primaryTouchId === null && event.type === "touchstart" && event.targetTouches.length > 0) {
        // Pick the first touch that started in the canvas and treat it as primary.
        const chosenTouch = event.targetTouches[0];
        GLFW.primaryTouchId = chosenTouch.identifier;
        Browser.setMouseCoords(chosenTouch.pageX, chosenTouch.pageY);
        primaryChanged = true;
      } else if (event.type === "touchend" || event.type === "touchcancel") {
        // Clear the primary touch if it ended.
        for (let i of event.changedTouches) {
          // If our chosen primary touch ended, remove it.
          if (GLFW.primaryTouchId === i.identifier) {
            GLFW.primaryTouchId = null;
            primaryChanged = true;
            break;
          }
        }
      }
      if (!primaryChanged) {
        // Do not send mouse events if some touch other than the primary triggered this.
        return;
      }
    } else {
      // Handling for non-touch mouse input events.
      Browser.calculateMouseEvent(event);
      eventButton = GLFW.DOMToGLFWMouseButton(event);
    }
    if (status == 1) {
      // GLFW_PRESS
      GLFW.active.buttons |= (1 << eventButton);
      try {
        event.target.setCapture();
      } catch (e) {}
    } else {
      // GLFW_RELEASE
      GLFW.active.buttons &= ~(1 << eventButton);
    }
    // Send mouse event to GLFW.
    if (GLFW.active.mouseButtonFunc) {
      getWasmTableEntry(GLFW.active.mouseButtonFunc)(GLFW.active.id, eventButton, status, GLFW.getModBits(GLFW.active));
    }
  },
  onMouseButtonDown: event => {
    if (!GLFW.active) return;
    GLFW.onMouseButtonChanged(event, 1);
  },
  onMouseButtonUp: event => {
    if (!GLFW.active) return;
    GLFW.onMouseButtonChanged(event, 0);
  },
  onMouseWheel: event => {
    // Note the minus sign that flips browser wheel direction (positive direction scrolls page down) to native wheel direction (positive direction is mouse wheel up)
    var delta = -Browser.getMouseWheelDelta(event);
    delta = (delta == 0) ? 0 : (delta > 0 ? Math.max(delta, 1) : Math.min(delta, -1));
    // Quantize to integer so that minimum scroll is at least +/- 1.
    GLFW.wheelPos += delta;
    if (!GLFW.active || !GLFW.active.scrollFunc || event.target != Browser.getCanvas()) return;
    var sx = 0;
    var sy = delta;
    if (event.type == "mousewheel") {
      sx = event.wheelDeltaX;
    } else {
      sx = event.deltaX;
    }
    getWasmTableEntry(GLFW.active.scrollFunc)(GLFW.active.id, sx, sy);
    event.preventDefault();
  },
  onCanvasResize: (width, height, framebufferWidth, framebufferHeight) => {
    if (!GLFW.active) return;
    var resizeNeeded = false;
    // If the client is requesting fullscreen mode
    if (getFullscreenElement()) {
      if (!GLFW.active.fullscreen) {
        resizeNeeded = width != screen.width || height != screen.height;
        GLFW.active.storedX = GLFW.active.x;
        GLFW.active.storedY = GLFW.active.y;
        GLFW.active.storedWidth = GLFW.active.width;
        GLFW.active.storedHeight = GLFW.active.height;
        GLFW.active.x = GLFW.active.y = 0;
        GLFW.active.width = screen.width;
        GLFW.active.height = screen.height;
        GLFW.active.fullscreen = true;
      }
    } else if (GLFW.active.fullscreen == true) {
      resizeNeeded = width != GLFW.active.storedWidth || height != GLFW.active.storedHeight;
      GLFW.active.x = GLFW.active.storedX;
      GLFW.active.y = GLFW.active.storedY;
      GLFW.active.width = GLFW.active.storedWidth;
      GLFW.active.height = GLFW.active.storedHeight;
      GLFW.active.fullscreen = false;
    }
    if (resizeNeeded) {
      // width or height is changed (fullscreen / exit fullscreen) which will call this listener back
      // with proper framebufferWidth/framebufferHeight
      Browser.setCanvasSize(GLFW.active.width, GLFW.active.height);
    } else if (GLFW.active.width != width || GLFW.active.height != height || GLFW.active.framebufferWidth != framebufferWidth || GLFW.active.framebufferHeight != framebufferHeight) {
      GLFW.active.width = width;
      GLFW.active.height = height;
      GLFW.active.framebufferWidth = framebufferWidth;
      GLFW.active.framebufferHeight = framebufferHeight;
      GLFW.onWindowSizeChanged();
      GLFW.onFramebufferSizeChanged();
    }
  },
  onWindowSizeChanged: () => {
    if (!GLFW.active) return;
    if (GLFW.active.windowSizeFunc) {
      getWasmTableEntry(GLFW.active.windowSizeFunc)(GLFW.active.id, GLFW.active.width, GLFW.active.height);
    }
  },
  onFramebufferSizeChanged: () => {
    if (!GLFW.active) return;
    if (GLFW.active.framebufferSizeFunc) {
      getWasmTableEntry(GLFW.active.framebufferSizeFunc)(GLFW.active.id, GLFW.active.framebufferWidth, GLFW.active.framebufferHeight);
    }
  },
  onWindowContentScaleChanged: scale => {
    GLFW.scale = scale;
    if (!GLFW.active) return;
    if (GLFW.active.windowContentScaleFunc) {
      getWasmTableEntry(GLFW.active.windowContentScaleFunc)(GLFW.active.id, GLFW.scale, GLFW.scale);
    }
  },
  getTime: () => _emscripten_get_now() / 1e3,
  setWindowTitle: (winid, title) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return;
    win.title = title;
    if (GLFW.active.id == win.id) {
      _emscripten_set_window_title(title);
    }
  },
  setJoystickCallback: cbfun => {
    var prevcbfun = GLFW.joystickFunc;
    GLFW.joystickFunc = cbfun;
    GLFW.refreshJoysticks();
    return prevcbfun;
  },
  joys: {},
  lastGamepadState: [],
  lastGamepadStateFrame: null,
  refreshJoysticks: () => {
    // Produce a new Gamepad API sample if we are ticking a new game frame, or if not using emscripten_set_main_loop() at all to drive animation.
    if (MainLoop.currentFrameNumber !== GLFW.lastGamepadStateFrame || !MainLoop.currentFrameNumber) {
      GLFW.lastGamepadState = navigator.getGamepads?.() ?? [];
      GLFW.lastGamepadStateFrame = MainLoop.currentFrameNumber;
      for (var joy = 0; joy < GLFW.lastGamepadState.length; ++joy) {
        var gamepad = GLFW.lastGamepadState[joy];
        if (gamepad) {
          if (!GLFW.joys[joy]) {
            out("glfw joystick connected:", joy);
            GLFW.joys[joy] = {
              id: stringToNewUTF8(gamepad.id),
              buttonsCount: gamepad.buttons.length,
              axesCount: gamepad.axes.length,
              buttons: _malloc(gamepad.buttons.length),
              axes: _malloc(gamepad.axes.length * 4)
            };
            if (GLFW.joystickFunc) {
              getWasmTableEntry(GLFW.joystickFunc)(joy, 262145);
            }
          }
          var data = GLFW.joys[joy];
          for (var i = 0; i < gamepad.buttons.length; ++i) {
            (growMemViews(), HEAP8)[data.buttons + i] = gamepad.buttons[i].pressed;
            checkInt8(gamepad.buttons[i].pressed);
          }
          for (var i = 0; i < gamepad.axes.length; ++i) {
            (growMemViews(), HEAPF32)[((data.axes + i * 4) >> 2)] = gamepad.axes[i];
          }
        } else {
          if (GLFW.joys[joy]) {
            out("glfw joystick disconnected", joy);
            if (GLFW.joystickFunc) {
              getWasmTableEntry(GLFW.joystickFunc)(joy, 262146);
            }
            _free(GLFW.joys[joy].id);
            _free(GLFW.joys[joy].buttons);
            _free(GLFW.joys[joy].axes);
            delete GLFW.joys[joy];
          }
        }
      }
    }
  },
  setKeyCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.keyFunc;
    win.keyFunc = cbfun;
    return prevcbfun;
  },
  setCharCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.charFunc;
    win.charFunc = cbfun;
    return prevcbfun;
  },
  setMouseButtonCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.mouseButtonFunc;
    win.mouseButtonFunc = cbfun;
    return prevcbfun;
  },
  setCursorPosCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.cursorPosFunc;
    win.cursorPosFunc = cbfun;
    return prevcbfun;
  },
  setScrollCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.scrollFunc;
    win.scrollFunc = cbfun;
    return prevcbfun;
  },
  setDropCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.dropFunc;
    win.dropFunc = cbfun;
    return prevcbfun;
  },
  onDrop: event => {
    if (!GLFW.active || !GLFW.active.dropFunc) return;
    if (!event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length == 0) return;
    event.preventDefault();
    var drop_dir = ".glfw_dropped_files";
    var filenames = _malloc(event.dataTransfer.files.length * 4);
    var filenamesArray = [];
    for (var i = 0; i < event.dataTransfer.files.length; ++i) {
      var path = `/${drop_dir}/${event.dataTransfer.files[i].name.replace(/\//g, "_")}`;
      var filename = stringToNewUTF8(path);
      filenamesArray.push(filename);
      (growMemViews(), HEAPU32)[(((filenames) + (i * 4)) >> 2)] = filename;
    }
    // Read and save the files to emscripten's FS
    var written = 0;
    FS.createPath("/", drop_dir);
    function save(file, in_path, numfiles) {
      var path = "/" + drop_dir + in_path + "/" + file.name.replace(/\//g, "_");
      var reader = new FileReader;
      reader.onloadend = e => {
        if (reader.readyState != 2) {
          // not DONE
          ++written;
          err(`failed to read dropped file: ${in_path}/${file.name}: ${reader.error}`);
          return;
        }
        var data = e.target.result;
        FS.writeFile(path, new Uint8Array(data));
        if (++written === numfiles) {
          getWasmTableEntry(GLFW.active.dropFunc)(GLFW.active.id, filenamesArray.length, filenames);
          for (var i = 0; i < filenamesArray.length; ++i) {
            _free(filenamesArray[i]);
          }
          _free(filenames);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    let filesQ = [];
    function finalize() {
      var count = filesQ.length;
      for (var i = 0; i < count; ++i) {
        save(filesQ[i].file, filesQ[i].path, count);
      }
    }
    if (DataTransferItem.prototype.webkitGetAsEntry) {
      let entriesTree = new Map;
      function markDone(fullpath, recursive) {
        if (entriesTree.get(fullpath).subpaths.length != 0) return;
        entriesTree.delete(fullpath);
        let parentpath = fullpath.substring(0, fullpath.lastIndexOf("/"));
        if (!entriesTree.has(parentpath)) {
          if (entriesTree.size == 0) finalize();
          return;
        }
        const fpIndex = entriesTree.get(parentpath).subpaths.indexOf(fullpath);
        if (fpIndex > -1) entriesTree.get(parentpath).subpaths.splice(fpIndex, 1);
        if (recursive) markDone(parentpath, true);
        if (entriesTree.size == 0) finalize();
      }
      function processEntry(entry) {
        let fp = entry.fullPath;
        let pp = fp.substring(0, fp.lastIndexOf("/"));
        entriesTree.set(fp, {
          subpaths: []
        });
        if (entry.isFile) {
          entry.file(f => {
            filesQ.push({
              file: f,
              path: pp
            });
            markDone(fp, false);
          });
        } else if (entry.isDirectory) {
          if (entriesTree.has(pp)) entriesTree.get(pp).subpaths.push(fp);
          FS.createPath("/" + drop_dir + pp, entry.name);
          var reader = entry.createReader();
          var rRead = function(dirEntries) {
            if (dirEntries.length == 0) {
              markDone(fp, true);
              return;
            }
            for (const ent of dirEntries) processEntry(ent);
            reader.readEntries(rRead);
          };
          reader.readEntries(rRead);
        }
      }
      for (const item of event.dataTransfer.items) {
        processEntry(item.webkitGetAsEntry());
      }
    } else {
      // fallback for browsers that does not support webkitGetAsEntry
      for (const file of event.dataTransfer.files) {
        filesQ.push({
          file,
          path: ""
        });
      }
      finalize();
    }
    return false;
  },
  onDragover: event => {
    if (!GLFW.active || !GLFW.active.dropFunc) return;
    event.preventDefault();
    return false;
  },
  setWindowSizeCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.windowSizeFunc;
    win.windowSizeFunc = cbfun;
    return prevcbfun;
  },
  setWindowCloseCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.windowCloseFunc;
    win.windowCloseFunc = cbfun;
    return prevcbfun;
  },
  setWindowRefreshCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.windowRefreshFunc;
    win.windowRefreshFunc = cbfun;
    return prevcbfun;
  },
  onClickRequestPointerLock: e => {
    var canvas = Browser.getCanvas();
    if (!Browser.pointerLock && canvas.requestPointerLock) {
      canvas.requestPointerLock();
      e.preventDefault();
    }
  },
  setInputMode: (winid, mode, value) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return;
    switch (mode) {
     case 208897:
      {
        // GLFW_CURSOR
        var canvas = Browser.getCanvas();
        switch (value) {
         case 212993:
          {
            // GLFW_CURSOR_NORMAL
            win.inputModes[mode] = value;
            canvas.removeEventListener("click", GLFW.onClickRequestPointerLock, true);
            document.exitPointerLock?.();
            break;
          }

         case 212994:
          {
            // GLFW_CURSOR_HIDDEN
            err("glfwSetInputMode called with GLFW_CURSOR_HIDDEN value not implemented");
            break;
          }

         case 212995:
          {
            // GLFW_CURSOR_DISABLED
            win.inputModes[mode] = value;
            canvas.addEventListener("click", GLFW.onClickRequestPointerLock, true);
            canvas.requestPointerLock?.();
            break;
          }

         default:
          {
            err(`glfwSetInputMode called with unknown value parameter value: ${value}`);
            break;
          }
        }
        break;
      }

     case 208898:
      {
        // GLFW_STICKY_KEYS
        err("glfwSetInputMode called with GLFW_STICKY_KEYS mode not implemented");
        break;
      }

     case 208899:
      {
        // GLFW_STICKY_MOUSE_BUTTONS
        err("glfwSetInputMode called with GLFW_STICKY_MOUSE_BUTTONS mode not implemented");
        break;
      }

     case 208900:
      {
        // GLFW_LOCK_KEY_MODS
        err("glfwSetInputMode called with GLFW_LOCK_KEY_MODS mode not implemented");
        break;
      }

     case 208901:
      {
        // GLFW_RAW_MOUSE_MOTION
        err("glfwSetInputMode called with GLFW_RAW_MOUSE_MOTION mode not implemented");
        break;
      }

     default:
      {
        err(`glfwSetInputMode called with unknown mode parameter value: ${mode}`);
        break;
      }
    }
  },
  getKey: (winid, key) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return 0;
    return win.keys[key];
  },
  getMouseButton: (winid, button) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return 0;
    return (win.buttons & (1 << button)) > 0;
  },
  getCursorPos: (winid, x, y) => {
    (growMemViews(), HEAPF64)[((x) >> 3)] = Browser.mouseX;
    (growMemViews(), HEAPF64)[((y) >> 3)] = Browser.mouseY;
  },
  getMousePos: (winid, x, y) => {
    (growMemViews(), HEAP32)[((x) >> 2)] = Browser.mouseX;
    checkInt32(Browser.mouseX);
    (growMemViews(), HEAP32)[((y) >> 2)] = Browser.mouseY;
    checkInt32(Browser.mouseY);
  },
  setCursorPos: (winid, x, y) => {},
  getWindowPos: (winid, x, y) => {
    var wx = 0;
    var wy = 0;
    var win = GLFW.WindowFromId(winid);
    if (win) {
      wx = win.x;
      wy = win.y;
    }
    if (x) {
      (growMemViews(), HEAP32)[((x) >> 2)] = wx;
      checkInt32(wx);
    }
    if (y) {
      (growMemViews(), HEAP32)[((y) >> 2)] = wy;
      checkInt32(wy);
    }
  },
  setWindowPos: (winid, x, y) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return;
    win.x = x;
    win.y = y;
  },
  getWindowSize: (winid, width, height) => {
    var ww = 0;
    var wh = 0;
    var win = GLFW.WindowFromId(winid);
    if (win) {
      ww = win.width;
      wh = win.height;
    }
    if (width) {
      (growMemViews(), HEAP32)[((width) >> 2)] = ww;
      checkInt32(ww);
    }
    if (height) {
      (growMemViews(), HEAP32)[((height) >> 2)] = wh;
      checkInt32(wh);
    }
  },
  setWindowSize: (winid, width, height) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return;
    if (GLFW.active.id == win.id) {
      Browser.setCanvasSize(width, height);
    }
  },
  defaultWindowHints: () => {
    GLFW.hints = {
      ...GLFW.defaultHints
    };
  },
  createWindow: (width, height, title, monitor, share) => {
    var i, id;
    for (i = 0; i < GLFW.windows.length && GLFW.windows[i] !== null; i++) {}
    if (i > 0) abort("glfwCreateWindow only supports one window at time currently");
    // id for window
    id = i + 1;
    // not valid
    if (width <= 0 || height <= 0) return 0;
    if (monitor) {
      Browser.requestFullscreen();
    } else {
      Browser.setCanvasSize(width, height);
    }
    // Create context when there are no existing alive windows
    for (i = 0; i < GLFW.windows.length && GLFW.windows[i] == null; i++) {}
    const canvas = Browser.getCanvas();
    var useWebGL = GLFW.hints[139265] > 0;
    // Use WebGL when we are told to based on GLFW_CLIENT_API
    if (i == GLFW.windows.length) {
      if (useWebGL) {
        var contextAttributes = {
          antialias: (GLFW.hints[135181] > 1),
          // GLFW_SAMPLES
          depth: (GLFW.hints[135173] > 0),
          // GLFW_DEPTH_BITS
          stencil: (GLFW.hints[135174] > 0),
          // GLFW_STENCIL_BITS
          alpha: (GLFW.hints[135172] > 0)
        };
        Browser.createContext(canvas, /*useWebGL=*/ true, /*setInModule=*/ true, contextAttributes);
      } else {
        Browser.init();
      }
    }
    // If context creation failed, do not return a valid window
    if (!Module["ctx"] && useWebGL) return 0;
    // Initializes the framebuffer size from the canvas
    var win = new GLFW_Window(id, width, height, canvas.width, canvas.height, title, monitor, share);
    // Set window to array
    if (id - 1 == GLFW.windows.length) {
      GLFW.windows.push(win);
    } else {
      GLFW.windows[id - 1] = win;
    }
    GLFW.active = win;
    GLFW.adjustCanvasDimensions();
    return win.id;
  },
  destroyWindow: winid => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return;
    if (win.windowCloseFunc) {
      getWasmTableEntry(win.windowCloseFunc)(win.id);
    }
    GLFW.windows[win.id - 1] = null;
    if (GLFW.active.id == win.id) {
      GLFW.active = null;
    }
    // Destroy context when no alive windows
    for (win of GLFW.windows) {
      if (win !== null) return;
    }
    delete Module["ctx"];
  },
  swapBuffers: winid => {},
  requestFullscreen(lockPointer, resizeCanvas) {
    Browser.lockPointer = lockPointer;
    Browser.resizeCanvas = resizeCanvas;
    if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
    if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
    var canvas = Browser.getCanvas();
    function fullscreenChange() {
      Browser.isFullscreen = false;
      var canvasContainer = canvas.parentNode;
      if (getFullscreenElement() === canvasContainer) {
        canvas.exitFullscreen = Browser.exitFullscreen;
        if (Browser.lockPointer) canvas.requestPointerLock?.();
        Browser.isFullscreen = true;
        if (Browser.resizeCanvas) {
          Browser.setFullscreenCanvasSize();
        } else {
          Browser.updateCanvasDimensions(canvas);
          Browser.updateResizeListeners();
        }
      } else {
        // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
        canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
        canvasContainer.parentNode.removeChild(canvasContainer);
        if (Browser.resizeCanvas) {
          Browser.setWindowedCanvasSize();
        } else {
          Browser.updateCanvasDimensions(canvas);
          Browser.updateResizeListeners();
        }
      }
    }
    if (!Browser.fullscreenHandlersInstalled) {
      Browser.fullscreenHandlersInstalled = true;
      document.addEventListener("fullscreenchange", fullscreenChange);
      document.addEventListener("webkitfullscreenchange", fullscreenChange);
    }
    // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
    var canvasContainer = document.createElement("div");
    canvas.parentNode.insertBefore(canvasContainer, canvas);
    canvasContainer.appendChild(canvas);
    // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
    // Safari didn't Element.requestFullscreen support until 16.4
    // See: https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
    /** @suppress {checkTypes} */ canvasContainer.requestFullscreen ??= (canvasContainer.webkitRequestFullscreen ? () => canvasContainer.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT) : null) ?? (canvasContainer.webkitRequestFullScreen ? () => canvasContainer.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT) : null);
    canvasContainer.requestFullscreen();
  },
  updateCanvasDimensions(canvas, wNative = undefined, hNative = undefined) {
    const scale = GLFW.getHiDPIScale();
    if (wNative && hNative) {
      canvas.widthNative = wNative;
      canvas.heightNative = hNative;
    } else {
      wNative = canvas.widthNative;
      hNative = canvas.heightNative;
    }
    var w = wNative;
    var h = hNative;
    if ((getFullscreenElement() === canvas.parentNode) && (typeof screen !== "undefined")) {
      var factor = Math.min(screen.width / w, screen.height / h);
      w = Math.round(w * factor);
      h = Math.round(h * factor);
    }
    if (Browser.resizeCanvas) {
      wNative = w;
      hNative = h;
    }
    const wNativeScaled = Math.floor(wNative * scale);
    const hNativeScaled = Math.floor(hNative * scale);
    if (canvas.width != wNativeScaled) canvas.width = wNativeScaled;
    if (canvas.height != hNativeScaled) canvas.height = hNativeScaled;
    if (typeof canvas.style !== "undefined") {
      if (!GLFW.isCSSScalingEnabled()) {
        canvas.style.setProperty("width", wNative + "px", "important");
        canvas.style.setProperty("height", hNative + "px", "important");
      } else {
        canvas.style.removeProperty("width");
        canvas.style.removeProperty("height");
      }
    }
  },
  calculateMouseCoords(pageX, pageY) {
    // Calculate the movement based on the changes
    // in the coordinates.
    const rect = Browser.getCanvas().getBoundingClientRect();
    var adjustedX = pageX - (window.scrollX + rect.left);
    var adjustedY = pageY - (window.scrollY + rect.top);
    // getBoundingClientRect() returns dimension affected by CSS, so as a result:
    // - when CSS scaling is enabled, this will fix the mouse coordinates to match the width/height of the window
    // - otherwise the CSS width/height are forced to the width/height of the GLFW window (see updateCanvasDimensions),
    //   so there is no need to adjust the position
    if (GLFW.isCSSScalingEnabled() && GLFW.active) {
      adjustedX = adjustedX * (GLFW.active.width / rect.width);
      adjustedY = adjustedY * (GLFW.active.height / rect.height);
    }
    return {
      x: adjustedX,
      y: adjustedY
    };
  },
  setWindowAttrib: (winid, attrib, value) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return;
    const isHiDPIAware = GLFW.isHiDPIAware();
    win.attributes[attrib] = value;
    if (isHiDPIAware !== GLFW.isHiDPIAware()) GLFW.adjustCanvasDimensions();
  },
  getDevicePixelRatio() {
    return (typeof devicePixelRatio === "number" && devicePixelRatio) || 1;
  },
  isHiDPIAware() {
    if (GLFW.active) return GLFW.active.attributes[139276] > 0; else return false;
  },
  isCSSScalingEnabled() {
    return !GLFW.isHiDPIAware();
  },
  adjustCanvasDimensions() {
    if (GLFW.active) {
      Browser.updateCanvasDimensions(Browser.getCanvas(), GLFW.active.width, GLFW.active.height);
      Browser.updateResizeListeners();
    }
  },
  getHiDPIScale() {
    return GLFW.isHiDPIAware() ? GLFW.scale : 1;
  },
  onDevicePixelRatioChange() {
    GLFW.onWindowContentScaleChanged(GLFW.getDevicePixelRatio());
    GLFW.adjustCanvasDimensions();
  },
  GLFW2ParamToGLFW3Param: param => {
    var table = {
      196609: 0,
      // GLFW_MOUSE_CURSOR
      196610: 0,
      // GLFW_STICKY_KEYS
      196611: 0,
      // GLFW_STICKY_MOUSE_BUTTONS
      196612: 0,
      // GLFW_SYSTEM_KEYS
      196613: 0,
      // GLFW_KEY_REPEAT
      196614: 0,
      // GLFW_AUTO_POLL_EVENTS
      131073: 0,
      // GLFW_OPENED
      131074: 0,
      // GLFW_ACTIVE
      131075: 0,
      // GLFW_ICONIFIED
      131076: 0,
      // GLFW_ACCELERATED
      131077: 135169,
      // GLFW_RED_BITS
      131078: 135170,
      // GLFW_GREEN_BITS
      131079: 135171,
      // GLFW_BLUE_BITS
      131080: 135172,
      // GLFW_ALPHA_BITS
      131081: 135173,
      // GLFW_DEPTH_BITS
      131082: 135174,
      // GLFW_STENCIL_BITS
      131083: 135183,
      // GLFW_REFRESH_RATE
      131084: 135175,
      // GLFW_ACCUM_RED_BITS
      131085: 135176,
      // GLFW_ACCUM_GREEN_BITS
      131086: 135177,
      // GLFW_ACCUM_BLUE_BITS
      131087: 135178,
      // GLFW_ACCUM_ALPHA_BITS
      131088: 135179,
      // GLFW_AUX_BUFFERS
      131089: 135180,
      // GLFW_STEREO
      131090: 0,
      // GLFW_WINDOW_NO_RESIZE
      131091: 135181,
      // GLFW_FSAA_SAMPLES
      131092: 139266,
      // GLFW_OPENGL_VERSION_MAJOR
      131093: 139267,
      // GLFW_OPENGL_VERSION_MINOR
      131094: 139270,
      // GLFW_OPENGL_FORWARD_COMPAT
      131095: 139271,
      // GLFW_OPENGL_DEBUG_CONTEXT
      131096: 139272
    };
    return table[param];
  }
};

var _glfwCreateWindow = (width, height, title, monitor, share) => GLFW.createWindow(width, height, title, monitor, share);

var _glfwDestroyWindow = winid => GLFW.destroyWindow(winid);

var _glfwGetFramebufferSize = (winid, width, height) => {
  var ww = 0;
  var wh = 0;
  var win = GLFW.WindowFromId(winid);
  if (win) {
    ww = win.framebufferWidth;
    wh = win.framebufferHeight;
  }
  if (width) {
    (growMemViews(), HEAP32)[((width) >> 2)] = ww;
    checkInt32(ww);
  }
  if (height) {
    (growMemViews(), HEAP32)[((height) >> 2)] = wh;
    checkInt32(wh);
  }
};

var _glfwInit = () => {
  if (GLFW.windows) return 1;
  // GL_TRUE
  GLFW.initialTime = GLFW.getTime();
  GLFW.defaultWindowHints();
  GLFW.windows = new Array;
  GLFW.active = null;
  GLFW.scale = GLFW.getDevicePixelRatio();
  window.addEventListener("gamepadconnected", GLFW.onGamepadConnected, true);
  window.addEventListener("gamepaddisconnected", GLFW.onGamepadDisconnected, true);
  window.addEventListener("keydown", GLFW.onKeydown, true);
  window.addEventListener("keypress", GLFW.onKeyPress, true);
  window.addEventListener("keyup", GLFW.onKeyup, true);
  window.addEventListener("blur", GLFW.onBlur, true);
  // watch for devicePixelRatio changes
  GLFW.devicePixelRatioMQL = window.matchMedia("(resolution: " + GLFW.getDevicePixelRatio() + "dppx)");
  GLFW.devicePixelRatioMQL.addEventListener("change", GLFW.onDevicePixelRatioChange);
  var canvas = Browser.getCanvas();
  canvas.addEventListener("touchmove", GLFW.onMousemove, true);
  canvas.addEventListener("touchstart", GLFW.onMouseButtonDown, true);
  canvas.addEventListener("touchcancel", GLFW.onMouseButtonUp, true);
  canvas.addEventListener("touchend", GLFW.onMouseButtonUp, true);
  canvas.addEventListener("mousemove", GLFW.onMousemove, true);
  canvas.addEventListener("mousedown", GLFW.onMouseButtonDown, true);
  canvas.addEventListener("mouseup", GLFW.onMouseButtonUp, true);
  canvas.addEventListener("wheel", GLFW.onMouseWheel, true);
  canvas.addEventListener("mousewheel", GLFW.onMouseWheel, true);
  canvas.addEventListener("mouseenter", GLFW.onMouseenter, true);
  canvas.addEventListener("mouseleave", GLFW.onMouseleave, true);
  canvas.addEventListener("drop", GLFW.onDrop, true);
  canvas.addEventListener("dragover", GLFW.onDragover, true);
  // Overriding implementation to account for HiDPI
  Browser.requestFullscreen = GLFW.requestFullscreen;
  Browser.calculateMouseCoords = GLFW.calculateMouseCoords;
  Browser.updateCanvasDimensions = GLFW.updateCanvasDimensions;
  Browser.resizeListeners.push((width, height) => {
    if (GLFW.isHiDPIAware()) {
      var canvas = Browser.getCanvas();
      GLFW.onCanvasResize(canvas.clientWidth, canvas.clientHeight, width, height);
    } else {
      GLFW.onCanvasResize(width, height, width, height);
    }
  });
  return 1;
};

var _glfwMakeContextCurrent = winid => 0;

var _glfwSetWindowSize = (winid, width, height) => GLFW.setWindowSize(winid, width, height);

var _glfwSwapBuffers = winid => GLFW.swapBuffers(winid);

var _glfwSwapInterval = interval => {
  interval = Math.abs(interval);
  // GLFW uses negative values to enable GLX_EXT_swap_control_tear, which we don't have, so just treat negative and positive the same.
  if (interval == 0) _emscripten_set_main_loop_timing(0, 0); else _emscripten_set_main_loop_timing(1, interval);
};

var _glfwTerminate = () => {
  window.removeEventListener("gamepadconnected", GLFW.onGamepadConnected, true);
  window.removeEventListener("gamepaddisconnected", GLFW.onGamepadDisconnected, true);
  window.removeEventListener("keydown", GLFW.onKeydown, true);
  window.removeEventListener("keypress", GLFW.onKeyPress, true);
  window.removeEventListener("keyup", GLFW.onKeyup, true);
  window.removeEventListener("blur", GLFW.onBlur, true);
  var canvas = Browser.getCanvas();
  canvas.removeEventListener("touchmove", GLFW.onMousemove, true);
  canvas.removeEventListener("touchstart", GLFW.onMouseButtonDown, true);
  canvas.removeEventListener("touchcancel", GLFW.onMouseButtonUp, true);
  canvas.removeEventListener("touchend", GLFW.onMouseButtonUp, true);
  canvas.removeEventListener("mousemove", GLFW.onMousemove, true);
  canvas.removeEventListener("mousedown", GLFW.onMouseButtonDown, true);
  canvas.removeEventListener("mouseup", GLFW.onMouseButtonUp, true);
  canvas.removeEventListener("wheel", GLFW.onMouseWheel, true);
  canvas.removeEventListener("mousewheel", GLFW.onMouseWheel, true);
  canvas.removeEventListener("mouseenter", GLFW.onMouseenter, true);
  canvas.removeEventListener("mouseleave", GLFW.onMouseleave, true);
  canvas.removeEventListener("drop", GLFW.onDrop, true);
  canvas.removeEventListener("dragover", GLFW.onDragover, true);
  if (GLFW.devicePixelRatioMQL) GLFW.devicePixelRatioMQL.removeEventListener("change", GLFW.onDevicePixelRatioChange);
  GLFW.windows = null;
  GLFW.active = null;
};

var _glfwWindowHint = (target, hint) => {
  GLFW.hints[target] = hint;
};

var getCFunc = ident => {
  var func = Module["_" + ident];
  // closure exported function
  assert(func, `Cannot call unknown function ${ident}, make sure it is exported`);
  return func;
};

var stringToUTF8OnStack = str => {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8(str, ret, size);
  return ret;
};

var writeArrayToMemory = (array, buffer) => {
  assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
  (growMemViews(), HEAP8).set(array, buffer);
};

/**
   * @param {string|null=} returnType
   * @param {Array=} argTypes
   * @param {Array=} args
   * @param {Object=} opts
   */ var ccall = (ident, returnType, argTypes, args, opts) => {
  // For fast lookup of conversion functions
  var toC = {
    "string": str => {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) {
        // null string
        ret = stringToUTF8OnStack(str);
      }
      return ret;
    },
    "array": arr => {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };
  function convertReturnValue(ret) {
    if (returnType === "string") {
      return UTF8ToString(ret);
    }
    if (returnType === "boolean") return Boolean(ret);
    return ret;
  }
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== "array", 'return type should not be "array"');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (!stack) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func(...cArgs);
  function onDone(ret) {
    if (stack) stackRestore(stack);
    return convertReturnValue(ret);
  }
  ret = onDone(ret);
  return ret;
};

/**
   * @param {string=} returnType
   * @param {Array=} argTypes
   * @param {Object=} opts
   */ var cwrap = (ident, returnType, argTypes, opts) => (...args) => ccall(ident, returnType, argTypes, args, opts);

var FS_createPath = (...args) => FS.createPath(...args);

var FS_unlink = (...args) => FS.unlink(...args);

var FS_createLazyFile = (...args) => FS.createLazyFile(...args);

var FS_createDevice = (...args) => FS.createDevice(...args);

var _exit = exitJS;

var syscallGetVarargP = syscallGetVarargI;

var _glActiveTexture = _emscripten_glActiveTexture;

var _glAttachShader = _emscripten_glAttachShader;

var _glBindAttribLocation = _emscripten_glBindAttribLocation;

var _glBindBuffer = _emscripten_glBindBuffer;

var _glBindFramebuffer = _emscripten_glBindFramebuffer;

var _glBindRenderbuffer = _emscripten_glBindRenderbuffer;

var _glBindTexture = _emscripten_glBindTexture;

var _glBindVertexArray = _emscripten_glBindVertexArray;

var _glBlendFunc = _emscripten_glBlendFunc;

var _glBlendFuncSeparate = _emscripten_glBlendFuncSeparate;

var _glBlitFramebuffer = _emscripten_glBlitFramebuffer;

var _glBufferData = _emscripten_glBufferData;

var _glBufferSubData = _emscripten_glBufferSubData;

var _glCheckFramebufferStatus = _emscripten_glCheckFramebufferStatus;

var _glClear = _emscripten_glClear;

var _glClearColor = _emscripten_glClearColor;

var _glClearDepthf = _emscripten_glClearDepthf;

var _glClearStencil = _emscripten_glClearStencil;

var _glClientWaitSync = _emscripten_glClientWaitSync;

var _glColorMask = _emscripten_glColorMask;

var _glCompileShader = _emscripten_glCompileShader;

var _glCompressedTexImage2D = _emscripten_glCompressedTexImage2D;

var _glCompressedTexSubImage2D = _emscripten_glCompressedTexSubImage2D;

var _glCopyTexSubImage2D = _emscripten_glCopyTexSubImage2D;

var _glCreateProgram = _emscripten_glCreateProgram;

var _glCreateShader = _emscripten_glCreateShader;

var _glCullFace = _emscripten_glCullFace;

var _glDeleteBuffers = _emscripten_glDeleteBuffers;

var _glDeleteFramebuffers = _emscripten_glDeleteFramebuffers;

var _glDeleteProgram = _emscripten_glDeleteProgram;

var _glDeleteRenderbuffers = _emscripten_glDeleteRenderbuffers;

var _glDeleteShader = _emscripten_glDeleteShader;

var _glDeleteSync = _emscripten_glDeleteSync;

var _glDeleteTextures = _emscripten_glDeleteTextures;

var _glDeleteVertexArrays = _emscripten_glDeleteVertexArrays;

var _glDepthFunc = _emscripten_glDepthFunc;

var _glDepthMask = _emscripten_glDepthMask;

var _glDisable = _emscripten_glDisable;

var _glDisableVertexAttribArray = _emscripten_glDisableVertexAttribArray;

var _glDrawArrays = _emscripten_glDrawArrays;

var _glDrawElements = _emscripten_glDrawElements;

var _glEnable = _emscripten_glEnable;

var _glEnableVertexAttribArray = _emscripten_glEnableVertexAttribArray;

var _glFenceSync = _emscripten_glFenceSync;

var _glFramebufferRenderbuffer = _emscripten_glFramebufferRenderbuffer;

var _glFramebufferTexture2D = _emscripten_glFramebufferTexture2D;

var _glGenBuffers = _emscripten_glGenBuffers;

var _glGenFramebuffers = _emscripten_glGenFramebuffers;

var _glGenRenderbuffers = _emscripten_glGenRenderbuffers;

var _glGenTextures = _emscripten_glGenTextures;

var _glGenVertexArrays = _emscripten_glGenVertexArrays;

var _glGenerateMipmap = _emscripten_glGenerateMipmap;

var _glGetActiveUniform = _emscripten_glGetActiveUniform;

var _glGetIntegerv = _emscripten_glGetIntegerv;

var _glGetProgramInfoLog = _emscripten_glGetProgramInfoLog;

var _glGetProgramiv = _emscripten_glGetProgramiv;

var _glGetShaderInfoLog = _emscripten_glGetShaderInfoLog;

var _glGetShaderiv = _emscripten_glGetShaderiv;

var _glGetString = _emscripten_glGetString;

var _glGetUniformLocation = _emscripten_glGetUniformLocation;

var _glInvalidateFramebuffer = _emscripten_glInvalidateFramebuffer;

var _glLinkProgram = _emscripten_glLinkProgram;

var _glMapBufferRange = _emscripten_glMapBufferRange;

var _glPixelStorei = _emscripten_glPixelStorei;

var _glPolygonOffset = _emscripten_glPolygonOffset;

var _glReadPixels = _emscripten_glReadPixels;

var _glRenderbufferStorage = _emscripten_glRenderbufferStorage;

var _glRenderbufferStorageMultisample = _emscripten_glRenderbufferStorageMultisample;

var _glShaderSource = _emscripten_glShaderSource;

var _glStencilFunc = _emscripten_glStencilFunc;

var _glStencilMask = _emscripten_glStencilMask;

var _glStencilOp = _emscripten_glStencilOp;

var _glStencilOpSeparate = _emscripten_glStencilOpSeparate;

var _glTexImage2D = _emscripten_glTexImage2D;

var _glTexImage3D = _emscripten_glTexImage3D;

var _glTexParameteri = _emscripten_glTexParameteri;

var _glTexStorage2D = _emscripten_glTexStorage2D;

var _glTexStorage3D = _emscripten_glTexStorage3D;

var _glTexSubImage2D = _emscripten_glTexSubImage2D;

var _glTexSubImage3D = _emscripten_glTexSubImage3D;

var _glUniform1fv = _emscripten_glUniform1fv;

var _glUniform1i = _emscripten_glUniform1i;

var _glUniform2fv = _emscripten_glUniform2fv;

var _glUniform3fv = _emscripten_glUniform3fv;

var _glUniform4fv = _emscripten_glUniform4fv;

var _glUniformMatrix4fv = _emscripten_glUniformMatrix4fv;

var _glUnmapBuffer = _emscripten_glUnmapBuffer;

var _glUseProgram = _emscripten_glUseProgram;

var _glVertexAttribPointer = _emscripten_glVertexAttribPointer;

var _glViewport = _emscripten_glViewport;

PThread.init();

FS.createPreloadedFile = FS_createPreloadedFile;

FS.preloadFile = FS_preloadFile;

FS.staticInit();

Fetch.init();

// Signal GL rendering layer that processing of a new frame is about to
// start. This helps it optimize VBO double-buffering and reduce GPU stalls.
registerPreMainLoop(() => GL.newRenderingFrameStarted());

for (let i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));

safeSetTimeout.pending = new Map;

safeSetTimeout.nextId = 1;

Module["requestAnimationFrame"] = MainLoop.requestAnimationFrame;

Module["pauseMainLoop"] = MainLoop.pause;

Module["resumeMainLoop"] = MainLoop.resume;

MainLoop.init();

// End JS library code
// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.
{
  // With WASM_ESM_INTEGRATION this has to happen at the top level and not
  // delayed until processModuleArgs.
  initMemory();
  // Begin ATMODULES hooks
  if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
  if (Module["print"]) out = Module["print"];
  if (Module["printErr"]) err = Module["printErr"];
  // End ATMODULES hooks
  checkIncomingModuleAPI();
  if (Module["arguments"]) programArgs = Module["arguments"];
  if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
  // Assertions on removed incoming Module JS APIs.
  assert(typeof Module["memoryInitializerPrefixURL"] === "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["pthreadMainPrefixURL"] === "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["cdInitializerPrefixURL"] === "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["filePackagePrefixURL"] === "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["read"] === "undefined", "Module.read option was removed");
  assert(typeof Module["readAsync"] === "undefined", "Module.readAsync option was removed (modify readAsync in JS)");
  assert(typeof Module["readBinary"] === "undefined", "Module.readBinary option was removed (modify readBinary in JS)");
  assert(typeof Module["setWindowTitle"] === "undefined", "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");
  assert(typeof Module["TOTAL_MEMORY"] === "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");
  assert(typeof Module["ENVIRONMENT"] === "undefined", "Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
  assert(typeof Module["STACK_SIZE"] === "undefined", "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");
  var preInit = Module["preInit"];
  if (preInit) {
    if (typeof preInit === "function") Module["preInit"] = preInit = [ preInit ];
    // Written as a loop so that preInit functions that themselves add more
    // preInit functions.  Is this actually needed?
    while (preInit.length > 0) {
      preInit.shift()();
    }
  }
  consumedModuleProp("preInit");
}

// Begin runtime exports
Module["addRunDependency"] = addRunDependency;

Module["removeRunDependency"] = removeRunDependency;

Module["ccall"] = ccall;

Module["cwrap"] = cwrap;

Module["FS_preloadFile"] = FS_preloadFile;

Module["FS_unlink"] = FS_unlink;

Module["FS_createPath"] = FS_createPath;

Module["FS_createDevice"] = FS_createDevice;

Module["FS_createDataFile"] = FS_createDataFile;

Module["FS_createLazyFile"] = FS_createLazyFile;

var missingLibrarySymbols = [ "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "convertI32PairToI53", "convertI32PairToI53Checked", "convertU32PairToI53", "getTempRet0", "setTempRet0", "createNamedFunction", "withStackSave", "readSockaddr", "runEmAsmFunction", "autoResumeAudioContext", "getDynCaller", "dynCall", "asmjsMangle", "addOnInit", "addOnPostCtor", "addOnPreMain", "addOnExit", "STACK_SIZE", "POINTER_SIZE", "ASSERTIONS", "convertJsFunctionToWasm", "getEmptyTableSlot", "updateTableMap", "getFunctionAddress", "addFunction", "removeFunction", "setValue", "getValue", "intArrayToString", "AsciiToString", "stringToAscii", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "registerKeyEventCallback", "maybeCStringToJsString", "findEventTarget", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "callCanvasResizedCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "currentFullscreenStrategy", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "registerBatteryEventCallback", "setCanvasElementSizeCallingThread", "setCanvasElementSizeMainThread", "setCanvasElementSize", "getCanvasSizeCallingThread", "getCanvasSizeMainThread", "getCanvasElementSize", "jsStackTrace", "getCallstack", "convertPCtoSourceLocation", "wasiRightsToMuslOFlags", "wasiOFlagsToMuslOFlags", "safeClearTimeout", "setImmediateWrapped", "safeRequestAnimationFrame", "clearImmediateWrapped", "registerPostMainLoop", "getPromise", "makePromise", "addPromise", "idsToPromises", "makePromiseCallback", "Browser_asyncPrepareDataCounter", "arraySum", "addDays", "getSocketFromFD", "getSocketAddress", "FS_mkdirTree", "_setNetworkCallback", "emscriptenWebGLGetUniform", "emscriptenWebGLGetVertexAttrib", "writeGLArray", "registerWebGlEventCallback", "runAndAbortIfError", "emscriptenWebGLGetIndexed", "writeStringToMemory", "writeAsciiToMemory", "allocateUTF8", "allocateUTF8OnStack", "demangle", "stackTrace", "getNativeTypeSize" ];

missingLibrarySymbols.forEach(missingLibrarySymbol);

var unexportedSymbols = [ "run", "out", "err", "callMain", "abort", "wasmExports", "writeStackCookie", "checkStackCookie", "writeI53ToI64", "readI53FromI64", "readI53FromU64", "INT53_MAX", "INT53_MIN", "bigintToI53Checked", "HEAP8", "HEAP16", "HEAPU16", "HEAPF32", "HEAPF64", "HEAP64", "HEAPU64", "stackSave", "stackRestore", "stackAlloc", "ptrToString", "zeroMemory", "exitJS", "getHeapMax", "growMemory", "ENV", "setStackLimits", "ERRNO_CODES", "strError", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "writeSockaddr", "DNS", "Protocols", "timers", "warnOnce", "readEmAsmArgsArray", "readEmAsmArgs", "runMainThreadEmAsm", "jstoi_q", "getExecutableName", "getWasmTableEntry", "handleException", "keepRuntimeAlive", "runtimeKeepalivePush", "runtimeKeepalivePop", "callUserCallback", "maybeExit", "asyncLoad", "alignMemory", "mmapAlloc", "HandleAllocator", "wasmTable", "wasmMemory", "getUniqueRunDependency", "noExitRuntime", "addOnPreRun", "addOnPostRun", "STACK_ALIGN", "freeTableIndexes", "functionsInTableMap", "PATH", "PATH_FS", "UTF8Decoder", "UTF8ArrayToString", "UTF8ToString", "stringToUTF8Array", "stringToUTF8", "lengthBytesUTF8", "intArrayFromString", "UTF16Decoder", "stringToNewUTF8", "stringToUTF8OnStack", "writeArrayToMemory", "JSEvents", "specialHTMLTargets", "findCanvasEventTarget", "restoreOldWindowedStyle", "UNWIND_CACHE", "ExitStatus", "getEnvStrings", "checkWasiClock", "doReadv", "doWritev", "initRandomFill", "randomFill", "safeSetTimeout", "emSetImmediate", "emClearImmediate", "registerPreMainLoop", "promiseMap", "getExceptionMessageCommon", "getCppExceptionTag", "getCppExceptionThrownObjectFromWebAssemblyException", "incrementUncaughtExceptionCount", "decrementUncaughtExceptionCount", "incrementExceptionRefcount", "decrementExceptionRefcount", "getExceptionMessage", "Browser", "requestFullscreen", "setCanvasSize", "createContext", "wget", "MONTH_DAYS_REGULAR", "MONTH_DAYS_LEAP", "MONTH_DAYS_REGULAR_CUMULATIVE", "MONTH_DAYS_LEAP_CUMULATIVE", "isLeapYear", "ydayFromDate", "SYSCALLS", "preloadPlugins", "FS_createPreloadedFile", "FS_modeStringToFlags", "FS_getMode", "FS_fileDataToTypedArray", "FS_stdin_getChar_buffer", "FS_stdin_getChar", "FS_readFile", "FS", "FS_lookupPath", "FS_getPath", "FS_hashName", "FS_hashAddNode", "FS_hashRemoveNode", "FS_lookupNode", "FS_createNode", "FS_destroyNode", "FS_isRoot", "FS_isMountpoint", "FS_isFile", "FS_isDir", "FS_isLink", "FS_isChrdev", "FS_isBlkdev", "FS_isFIFO", "FS_isSocket", "FS_flagsToPermissionString", "FS_nodePermissions", "FS_mayLookup", "FS_mayCreate", "FS_mayDelete", "FS_mayOpen", "FS_checkOpExists", "FS_nextfd", "FS_getStreamChecked", "FS_getStream", "FS_createStream", "FS_closeStream", "FS_dupStream", "FS_doSetAttr", "FS_major", "FS_minor", "FS_makedev", "FS_registerDevice", "FS_getDevice", "FS_getMounts", "FS_syncfs", "FS_mount", "FS_unmount", "FS_lookup", "FS_mknod", "FS_statfs", "FS_statfsStream", "FS_statfsNode", "FS_create", "FS_mkdir", "FS_mkdev", "FS_symlink", "FS_link", "FS_rename", "FS_rmdir", "FS_readdir", "FS_readlink", "FS_stat", "FS_fstat", "FS_lstat", "FS_doChmod", "FS_chmod", "FS_lchmod", "FS_fchmod", "FS_doChown", "FS_chown", "FS_lchown", "FS_fchown", "FS_doTruncate", "FS_truncate", "FS_ftruncate", "FS_utime", "FS_open", "FS_close", "FS_isClosed", "FS_llseek", "FS_read", "FS_write", "FS_mmap", "FS_msync", "FS_ioctl", "FS_writeFile", "FS_cwd", "FS_chdir", "FS_createDefaultDirectories", "FS_createDefaultDevices", "FS_createSpecialDirectories", "FS_createStandardStreams", "FS_staticInit", "FS_init", "FS_quit", "FS_analyzePath", "FS_createFile", "FS_forceLoadFile", "MEMFS", "TTY", "PIPEFS", "SOCKFS", "tempFixedLengthArray", "miniTempWebGLFloatBuffers", "miniTempWebGLIntBuffers", "heapObjectForWebGLType", "toTypedArrayIndex", "webgl_enable_WEBGL_multi_draw", "webgl_enable_EXT_polygon_offset_clamp", "webgl_enable_EXT_clip_control", "webgl_enable_WEBGL_polygon_mode", "GL", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "colorChannelsInGlTextureFormat", "emscriptenWebGLGetTexPixelData", "webglGetProgramUniformLocation", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "__glGetActiveAttribOrUniform", "emscriptenWebGLGetBufferBinding", "emscriptenWebGLValidateMapBufferTarget", "AL", "GLUT", "EGL", "GLEW", "IDBStore", "GLFW_Window", "GLFW", "waitAsyncPolyfilled", "webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance", "webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance", "print", "printErr", "jstoi_s", "PThread", "terminateWorker", "cleanupThread", "registerTLSInit", "spawnThread", "exitOnMainThread", "proxyToMainThread", "proxiedJSCallArgs", "invokeEntryPoint", "checkMailbox", "Fetch", "fetchDeleteCachedData", "fetchLoadCachedData", "fetchCacheData", "fetchXHR" ];

unexportedSymbols.forEach(unexportedRuntimeSymbol);

// End runtime exports
// Begin JS library exports
// End JS library exports
// end include: postlibrary.js
// proxiedFunctionTable specifies the list of functions that can be called
// either synchronously or asynchronously from other threads in postMessage()d
// or internally queued events. This way a pthread in a Worker can synchronously
// access e.g. the DOM on the main thread.
var proxiedFunctionTable = [ exitOnMainThread, _proc_exit, pthreadCreateProxied, ___syscall_dup3, ___syscall_fcntl64, ___syscall_fstat64, ___syscall_getcwd, ___syscall_getdents64, ___syscall_ioctl, ___syscall_lstat64, ___syscall_mkdirat, ___syscall_newfstatat, ___syscall_openat, ___syscall_readlinkat, ___syscall_rmdir, ___syscall_stat64, ___syscall_unlinkat, _environ_get, _environ_sizes_get, _fd_close, _fd_read, _fd_seek, _fd_write, _getaddrinfo, _emscripten_set_window_title ];

function checkIncomingModuleAPI() {
  ignoredModuleProp("fetchSettings");
  ignoredModuleProp("logReadFiles");
  ignoredModuleProp("loadSplitModule");
  ignoredModuleProp("onMalloc");
  ignoredModuleProp("onRealloc");
  ignoredModuleProp("onFree");
  ignoredModuleProp("onSbrkGrow");
  ignoredModuleProp("onCOSCacheHit");
  ignoredModuleProp("onCOSCacheMiss");
  ignoredModuleProp("onCOSStore");
  ignoredModuleProp("GL_MAX_TEXTURE_IMAGE_UNITS");
  ignoredModuleProp("SDL_canPlayWithWebAudio");
  ignoredModuleProp("SDL_numSimultaneouslyQueuedBuffers");
  ignoredModuleProp("freePreloadedMediaOnUse");
  ignoredModuleProp("preinitializedWebGLContext");
  ignoredModuleProp("keyboardListeningElement");
  ignoredModuleProp("doNotCaptureKeyboard");
  ignoredModuleProp("extraStackTrace");
  ignoredModuleProp("preloadPlugins");
  ignoredModuleProp("preMainLoop");
  ignoredModuleProp("postMainLoop");
  ignoredModuleProp("forcedAspectRatio");
  ignoredModuleProp("mainScriptUrlOrBlob");
  ignoredModuleProp("onFullScreen");
  ignoredModuleProp("INITIAL_MEMORY");
  ignoredModuleProp("wasmMemory");
  ignoredModuleProp("wasmBinary");
}

var ASM_CONSTS = {
  10855836: ($0, $1) => {
    try {
      localStorage.setItem("rblx2016.ds." + (Module.__rblxPlaceKey || "") + "|" + UTF8ToString($0), UTF8ToString($1));
    } catch (e) {}
    Module._free($0);
    Module._free($1);
  }
};

function rbx_audio_create_memory(token, data, len, loop) {
  var A = Module.__rbxAudio || (Module.__rbxAudio = {
    sounds: {},
    channels: {},
    masterVolume: 1,
    masterMute: false
  });
  try {
    var bytes = (growMemViews(), HEAPU8).slice(data, data + len);
    var blob = new Blob([ bytes ], {
      type: "audio/mpeg"
    });
    var url = URL.createObjectURL(blob);
    var audio = new Audio(url);
    audio.preload = "auto";
    A.sounds[token] = {
      url,
      audio,
      loop: !!loop
    };
    return 1;
  } catch (e) {
    console.warn("[rbx2016] audio create failed", e);
    return 0;
  }
}

function rbx_audio_create_url(token, path, loop) {
  var A = Module.__rbxAudio || (Module.__rbxAudio = {
    sounds: {},
    channels: {},
    masterVolume: 1,
    masterMute: false
  });
  try {
    var p = UTF8ToString(path);
    if (p.indexOf("rbxasset://") === 0) p = "/content/" + p.substring(11);
    var i = p.lastIndexOf("/content/");
    if (i >= 0) p = p.substring(i);
    var audio = new Audio(p);
    audio.preload = "auto";
    A.sounds[token] = {
      url: p,
      audio,
      loop: !!loop
    };
    return 1;
  } catch (e) {
    console.warn("[rbx2016] audio create url failed", e);
    return 0;
  }
}

function rbx_audio_play(soundToken, channelToken, paused) {
  var A = Module.__rbxAudio;
  if (!A || !A.sounds[soundToken]) return;
  var s = A.sounds[soundToken];
  try {
    var audio = new Audio(s.url);
    audio.loop = !!s.loop;
    audio.volume = Math.max(0, Math.min(1, A.masterMute ? 0 : A.masterVolume));
    var channel = {
      audio,
      volume: 1,
      loop: !!s.loop,
      paused: !!paused
    };
    A.channels[channelToken] = channel;
    audio.addEventListener("ended", function() {
      if (Module._rblx_audio_ended) Module._rblx_audio_ended(channelToken);
    });
    if (!paused) audio.play().catch(function(e) {
      if (e.name !== "AbortError") console.warn("[rbx2016] audio play failed", e);
    });
  } catch (e) {
    console.warn("[rbx2016] audio play exception", e);
  }
}

function rbx_audio_set_volume(token, v) {
  var A = Module.__rbxAudio, c = A && A.channels[token];
  if (!c) return;
  c.volume = v;
  c.audio.volume = Math.max(0, Math.min(1, v * (A.masterMute ? 0 : A.masterVolume)));
}

function rbx_audio_set_paused(token, paused) {
  var A = Module.__rbxAudio, c = A && A.channels[token];
  if (!c) return;
  c.paused = !!paused;
  try {
    if (paused) c.audio.pause(); else c.audio.play().catch(function(e) {
      if (e.name !== "AbortError") console.warn("[rbx2016] audio play failed", e);
    });
  } catch (e) {
    console.warn("[rbx2016] audio pause/play exception", e);
  }
}

function rbx_audio_stop(token) {
  var A = Module.__rbxAudio, c = A && A.channels[token];
  if (!c) return;
  try {
    c.audio.pause();
    c.audio.currentTime = 0;
  } catch (e) {}
  c.paused = true;
}

function rbx_audio_set_position(token, ms) {
  var A = Module.__rbxAudio, c = A && A.channels[token];
  if (!c) return;
  try {
    c.audio.currentTime = Math.max(0, ms) / 1e3;
  } catch (e) {}
}

function rbx_audio_set_frequency(token, hz) {
  var A = Module.__rbxAudio, c = A && A.channels[token];
  if (!c) return;
  try {
    c.audio.playbackRate = Math.max(.1, Math.min(4, hz / 48e3));
  } catch (e) {}
}

function rbx_audio_set_loop(token, loop) {
  var A = Module.__rbxAudio, c = A && A.channels[token];
  if (!c) return;
  c.loop = !!loop;
  try {
    c.audio.loop = !!loop;
  } catch (e) {}
}

function rbx_audio_release_sound(token) {
  var A = Module.__rbxAudio, s = A && A.sounds[token];
  if (!s) return;
  try {
    URL.revokeObjectURL(s.url);
  } catch (e) {}
  delete A.sounds[token];
}

function rbx_audio_master_volume(v) {
  var A = Module.__rbxAudio;
  if (!A) return;
  A.masterVolume = v;
  for (var k in A.channels) {
    var c = A.channels[k];
    c.audio.volume = Math.max(0, Math.min(1, c.volume * (A.masterMute ? 0 : A.masterVolume)));
  }
}

function rbx_audio_forget(token) {
  var A = Module.__rbxAudio;
  if (!A || !A.channels[token]) return;
  try {
    A.channels[token].audio.pause();
  } catch (e) {}
  delete A.channels[token];
}

function rbx_audio_master_mute(mute) {
  var A = Module.__rbxAudio;
  if (!A) return;
  A.masterMute = !!mute;
  for (var k in A.channels) {
    var c = A.channels[k];
    c.audio.volume = Math.max(0, Math.min(1, c.volume * (A.masterMute ? 0 : A.masterVolume)));
  }
}

// Imports from the Wasm binary.
var _free = Module["_free"] = makeInvalidEarlyAccess("_free");

var _malloc = Module["_malloc"] = makeInvalidEarlyAccess("_malloc");

var _realloc = makeInvalidEarlyAccess("_realloc");

var _pthread_self = makeInvalidEarlyAccess("_pthread_self");

var _htons = makeInvalidEarlyAccess("_htons");

var _fflush = makeInvalidEarlyAccess("_fflush");

var _strerror = makeInvalidEarlyAccess("_strerror");

var _htonl = makeInvalidEarlyAccess("_htonl");

var _ntohs = makeInvalidEarlyAccess("_ntohs");

var _rblx_ds_put = Module["_rblx_ds_put"] = makeInvalidEarlyAccess("_rblx_ds_put");

var _rblx_audio_pump = Module["_rblx_audio_pump"] = makeInvalidEarlyAccess("_rblx_audio_pump");

var _rblx_audio_ended = Module["_rblx_audio_ended"] = makeInvalidEarlyAccess("_rblx_audio_ended");

var _rblx_start_place = Module["_rblx_start_place"] = makeInvalidEarlyAccess("_rblx_start_place");

var _rblx_load_place = Module["_rblx_load_place"] = makeInvalidEarlyAccess("_rblx_load_place");

var _rblx_loading_gui_ready = Module["_rblx_loading_gui_ready"] = makeInvalidEarlyAccess("_rblx_loading_gui_ready");

var _rblx_set_asset_proxy = Module["_rblx_set_asset_proxy"] = makeInvalidEarlyAccess("_rblx_set_asset_proxy");

var _rblx_set_render_option = Module["_rblx_set_render_option"] = makeInvalidEarlyAccess("_rblx_set_render_option");

var _rblx_set_avatar = Module["_rblx_set_avatar"] = makeInvalidEarlyAccess("_rblx_set_avatar");

var _rblx_frame = Module["_rblx_frame"] = makeInvalidEarlyAccess("_rblx_frame");

var _rblx_request_thumbnail = Module["_rblx_request_thumbnail"] = makeInvalidEarlyAccess("_rblx_request_thumbnail");

var _rblx_thumbnail_ready = Module["_rblx_thumbnail_ready"] = makeInvalidEarlyAccess("_rblx_thumbnail_ready");

var _rblx_thumbnail_data = Module["_rblx_thumbnail_data"] = makeInvalidEarlyAccess("_rblx_thumbnail_data");

var _rblx_resize = Module["_rblx_resize"] = makeInvalidEarlyAccess("_rblx_resize");

var _rblx_set_fullscreen = Module["_rblx_set_fullscreen"] = makeInvalidEarlyAccess("_rblx_set_fullscreen");

var _rblx_set_unlock_fps = Module["_rblx_set_unlock_fps"] = makeInvalidEarlyAccess("_rblx_set_unlock_fps");

var _rblx_has_view = Module["_rblx_has_view"] = makeInvalidEarlyAccess("_rblx_has_view");

var _rblx_frame_count = Module["_rblx_frame_count"] = makeInvalidEarlyAccess("_rblx_frame_count");

var _rblx_engine_busy_frames = Module["_rblx_engine_busy_frames"] = makeInvalidEarlyAccess("_rblx_engine_busy_frames");

var _rblx_set_camera = Module["_rblx_set_camera"] = makeInvalidEarlyAccess("_rblx_set_camera");

var _rblx_key_event = Module["_rblx_key_event"] = makeInvalidEarlyAccess("_rblx_key_event");

var _rblx_set_xbox_mode = Module["_rblx_set_xbox_mode"] = makeInvalidEarlyAccess("_rblx_set_xbox_mode");

var _rblx_gamepad_connect = Module["_rblx_gamepad_connect"] = makeInvalidEarlyAccess("_rblx_gamepad_connect");

var _rblx_gamepad_button = Module["_rblx_gamepad_button"] = makeInvalidEarlyAccess("_rblx_gamepad_button");

var _rblx_gamepad_axis = Module["_rblx_gamepad_axis"] = makeInvalidEarlyAccess("_rblx_gamepad_axis");

var _rblx_mouse_button = Module["_rblx_mouse_button"] = makeInvalidEarlyAccess("_rblx_mouse_button");

var _rblx_mouse_wheel = Module["_rblx_mouse_wheel"] = makeInvalidEarlyAccess("_rblx_mouse_wheel");

var _rblx_mouse_move = Module["_rblx_mouse_move"] = makeInvalidEarlyAccess("_rblx_mouse_move");

var _rblx_touch_event = Module["_rblx_touch_event"] = makeInvalidEarlyAccess("_rblx_touch_event");

var _rblx_stop = Module["_rblx_stop"] = makeInvalidEarlyAccess("_rblx_stop");

var _rblx_last_error = Module["_rblx_last_error"] = makeInvalidEarlyAccess("_rblx_last_error");

var _rblx_force_character = Module["_rblx_force_character"] = makeInvalidEarlyAccess("_rblx_force_character");

var _rblx_run_script = Module["_rblx_run_script"] = makeInvalidEarlyAccess("_rblx_run_script");

var _rblx_set_script_year = Module["_rblx_set_script_year"] = makeInvalidEarlyAccess("_rblx_set_script_year");

var _rblx_set_membership = Module["_rblx_set_membership"] = makeInvalidEarlyAccess("_rblx_set_membership");

var _rblx_mp_in = Module["_rblx_mp_in"] = makeInvalidEarlyAccess("_rblx_mp_in");

var _rblx_mp_out = Module["_rblx_mp_out"] = makeInvalidEarlyAccess("_rblx_mp_out");

var _rblx_debug_player = Module["_rblx_debug_player"] = makeInvalidEarlyAccess("_rblx_debug_player");

var _rblx_debug_joints = Module["_rblx_debug_joints"] = makeInvalidEarlyAccess("_rblx_debug_joints");

var _rblx_debug_anim = Module["_rblx_debug_anim"] = makeInvalidEarlyAccess("_rblx_debug_anim");

var _rblx_debug_asset = Module["_rblx_debug_asset"] = makeInvalidEarlyAccess("_rblx_debug_asset");

var _rblx_debug_gui = Module["_rblx_debug_gui"] = makeInvalidEarlyAccess("_rblx_debug_gui");

var _rblx_test_thread = Module["_rblx_test_thread"] = makeInvalidEarlyAccess("_rblx_test_thread");

var _rblx_host_start = Module["_rblx_host_start"] = makeInvalidEarlyAccess("_rblx_host_start");

var _rblx_server_set_avatar = Module["_rblx_server_set_avatar"] = makeInvalidEarlyAccess("_rblx_server_set_avatar");

var _rblx_server_tick = Module["_rblx_server_tick"] = makeInvalidEarlyAccess("_rblx_server_tick");

var _rblx_server_player_count = Module["_rblx_server_player_count"] = makeInvalidEarlyAccess("_rblx_server_player_count");

var _rblx_join_start = Module["_rblx_join_start"] = makeInvalidEarlyAccess("_rblx_join_start");

var _rblx_server_eval = Module["_rblx_server_eval"] = makeInvalidEarlyAccess("_rblx_server_eval");

var _rblx_net_debug = Module["_rblx_net_debug"] = makeInvalidEarlyAccess("_rblx_net_debug");

var _rblx_net_state = Module["_rblx_net_state"] = makeInvalidEarlyAccess("_rblx_net_state");

var _rblx_net_message = Module["_rblx_net_message"] = makeInvalidEarlyAccess("_rblx_net_message");

var _main = makeInvalidEarlyAccess("_main");

var _rblx_net_set_ip = Module["_rblx_net_set_ip"] = makeInvalidEarlyAccess("_rblx_net_set_ip");

var _rblx_net_signal = Module["_rblx_net_signal"] = makeInvalidEarlyAccess("_rblx_net_signal");

var _rblx_net_take = Module["_rblx_net_take"] = makeInvalidEarlyAccess("_rblx_net_take");

var _rblx_net_push = Module["_rblx_net_push"] = makeInvalidEarlyAccess("_rblx_net_push");

var __emscripten_tls_init = makeInvalidEarlyAccess("__emscripten_tls_init");

var __emscripten_thread_init = makeInvalidEarlyAccess("__emscripten_thread_init");

var ___set_thread_state = makeInvalidEarlyAccess("___set_thread_state");

var __emscripten_thread_crashed = makeInvalidEarlyAccess("__emscripten_thread_crashed");

var _emscripten_stack_get_end = makeInvalidEarlyAccess("_emscripten_stack_get_end");

var _emscripten_stack_get_base = makeInvalidEarlyAccess("_emscripten_stack_get_base");

var __emscripten_run_js_on_main_thread_done = makeInvalidEarlyAccess("__emscripten_run_js_on_main_thread_done");

var __emscripten_run_js_on_main_thread = makeInvalidEarlyAccess("__emscripten_run_js_on_main_thread");

var __emscripten_thread_free_data = makeInvalidEarlyAccess("__emscripten_thread_free_data");

var __emscripten_thread_exit = makeInvalidEarlyAccess("__emscripten_thread_exit");

var __emscripten_check_mailbox = makeInvalidEarlyAccess("__emscripten_check_mailbox");

var ___trap = makeInvalidEarlyAccess("___trap");

var _emscripten_stack_init = makeInvalidEarlyAccess("_emscripten_stack_init");

var _emscripten_stack_set_limits = makeInvalidEarlyAccess("_emscripten_stack_set_limits");

var _emscripten_stack_get_free = makeInvalidEarlyAccess("_emscripten_stack_get_free");

var __emscripten_stack_restore = makeInvalidEarlyAccess("__emscripten_stack_restore");

var __emscripten_stack_alloc = makeInvalidEarlyAccess("__emscripten_stack_alloc");

var _emscripten_stack_get_current = makeInvalidEarlyAccess("_emscripten_stack_get_current");

var ___cxa_decrement_exception_refcount = makeInvalidEarlyAccess("___cxa_decrement_exception_refcount");

var ___cxa_increment_exception_refcount = makeInvalidEarlyAccess("___cxa_increment_exception_refcount");

var ___thrown_object_from_unwind_exception = makeInvalidEarlyAccess("___thrown_object_from_unwind_exception");

var ___get_exception_message = makeInvalidEarlyAccess("___get_exception_message");

var ___set_stack_limits = Module["___set_stack_limits"] = makeInvalidEarlyAccess("___set_stack_limits");

var __indirect_function_table = makeInvalidEarlyAccess("__indirect_function_table");

var ___cpp_exception = makeInvalidEarlyAccess("___cpp_exception");

var wasmTable = makeInvalidEarlyAccess("wasmTable");

function assignWasmExports(wasmExports) {
  assert(typeof wasmExports["free"] !== "undefined", "missing Wasm export: free");
  assert(typeof wasmExports["malloc"] !== "undefined", "missing Wasm export: malloc");
  assert(typeof wasmExports["realloc"] !== "undefined", "missing Wasm export: realloc");
  assert(typeof wasmExports["pthread_self"] !== "undefined", "missing Wasm export: pthread_self");
  assert(typeof wasmExports["htons"] !== "undefined", "missing Wasm export: htons");
  assert(typeof wasmExports["fflush"] !== "undefined", "missing Wasm export: fflush");
  assert(typeof wasmExports["strerror"] !== "undefined", "missing Wasm export: strerror");
  assert(typeof wasmExports["htonl"] !== "undefined", "missing Wasm export: htonl");
  assert(typeof wasmExports["ntohs"] !== "undefined", "missing Wasm export: ntohs");
  assert(typeof wasmExports["rblx_ds_put"] !== "undefined", "missing Wasm export: rblx_ds_put");
  assert(typeof wasmExports["rblx_audio_pump"] !== "undefined", "missing Wasm export: rblx_audio_pump");
  assert(typeof wasmExports["rblx_audio_ended"] !== "undefined", "missing Wasm export: rblx_audio_ended");
  assert(typeof wasmExports["rblx_start_place"] !== "undefined", "missing Wasm export: rblx_start_place");
  assert(typeof wasmExports["rblx_load_place"] !== "undefined", "missing Wasm export: rblx_load_place");
  assert(typeof wasmExports["rblx_loading_gui_ready"] !== "undefined", "missing Wasm export: rblx_loading_gui_ready");
  assert(typeof wasmExports["rblx_set_asset_proxy"] !== "undefined", "missing Wasm export: rblx_set_asset_proxy");
  assert(typeof wasmExports["rblx_set_render_option"] !== "undefined", "missing Wasm export: rblx_set_render_option");
  assert(typeof wasmExports["rblx_set_avatar"] !== "undefined", "missing Wasm export: rblx_set_avatar");
  assert(typeof wasmExports["rblx_frame"] !== "undefined", "missing Wasm export: rblx_frame");
  assert(typeof wasmExports["rblx_request_thumbnail"] !== "undefined", "missing Wasm export: rblx_request_thumbnail");
  assert(typeof wasmExports["rblx_thumbnail_ready"] !== "undefined", "missing Wasm export: rblx_thumbnail_ready");
  assert(typeof wasmExports["rblx_thumbnail_data"] !== "undefined", "missing Wasm export: rblx_thumbnail_data");
  assert(typeof wasmExports["rblx_resize"] !== "undefined", "missing Wasm export: rblx_resize");
  assert(typeof wasmExports["rblx_set_fullscreen"] !== "undefined", "missing Wasm export: rblx_set_fullscreen");
  assert(typeof wasmExports["rblx_set_unlock_fps"] !== "undefined", "missing Wasm export: rblx_set_unlock_fps");
  assert(typeof wasmExports["rblx_has_view"] !== "undefined", "missing Wasm export: rblx_has_view");
  assert(typeof wasmExports["rblx_frame_count"] !== "undefined", "missing Wasm export: rblx_frame_count");
  assert(typeof wasmExports["rblx_engine_busy_frames"] !== "undefined", "missing Wasm export: rblx_engine_busy_frames");
  assert(typeof wasmExports["rblx_set_camera"] !== "undefined", "missing Wasm export: rblx_set_camera");
  assert(typeof wasmExports["rblx_key_event"] !== "undefined", "missing Wasm export: rblx_key_event");
  assert(typeof wasmExports["rblx_set_xbox_mode"] !== "undefined", "missing Wasm export: rblx_set_xbox_mode");
  assert(typeof wasmExports["rblx_gamepad_connect"] !== "undefined", "missing Wasm export: rblx_gamepad_connect");
  assert(typeof wasmExports["rblx_gamepad_button"] !== "undefined", "missing Wasm export: rblx_gamepad_button");
  assert(typeof wasmExports["rblx_gamepad_axis"] !== "undefined", "missing Wasm export: rblx_gamepad_axis");
  assert(typeof wasmExports["rblx_mouse_button"] !== "undefined", "missing Wasm export: rblx_mouse_button");
  assert(typeof wasmExports["rblx_mouse_wheel"] !== "undefined", "missing Wasm export: rblx_mouse_wheel");
  assert(typeof wasmExports["rblx_mouse_move"] !== "undefined", "missing Wasm export: rblx_mouse_move");
  assert(typeof wasmExports["rblx_touch_event"] !== "undefined", "missing Wasm export: rblx_touch_event");
  assert(typeof wasmExports["rblx_stop"] !== "undefined", "missing Wasm export: rblx_stop");
  assert(typeof wasmExports["rblx_last_error"] !== "undefined", "missing Wasm export: rblx_last_error");
  assert(typeof wasmExports["rblx_force_character"] !== "undefined", "missing Wasm export: rblx_force_character");
  assert(typeof wasmExports["rblx_run_script"] !== "undefined", "missing Wasm export: rblx_run_script");
  assert(typeof wasmExports["rblx_set_script_year"] !== "undefined", "missing Wasm export: rblx_set_script_year");
  assert(typeof wasmExports["rblx_set_membership"] !== "undefined", "missing Wasm export: rblx_set_membership");
  assert(typeof wasmExports["rblx_mp_in"] !== "undefined", "missing Wasm export: rblx_mp_in");
  assert(typeof wasmExports["rblx_mp_out"] !== "undefined", "missing Wasm export: rblx_mp_out");
  assert(typeof wasmExports["rblx_debug_player"] !== "undefined", "missing Wasm export: rblx_debug_player");
  assert(typeof wasmExports["rblx_debug_joints"] !== "undefined", "missing Wasm export: rblx_debug_joints");
  assert(typeof wasmExports["rblx_debug_anim"] !== "undefined", "missing Wasm export: rblx_debug_anim");
  assert(typeof wasmExports["rblx_debug_asset"] !== "undefined", "missing Wasm export: rblx_debug_asset");
  assert(typeof wasmExports["rblx_debug_gui"] !== "undefined", "missing Wasm export: rblx_debug_gui");
  assert(typeof wasmExports["rblx_test_thread"] !== "undefined", "missing Wasm export: rblx_test_thread");
  assert(typeof wasmExports["rblx_host_start"] !== "undefined", "missing Wasm export: rblx_host_start");
  assert(typeof wasmExports["rblx_server_set_avatar"] !== "undefined", "missing Wasm export: rblx_server_set_avatar");
  assert(typeof wasmExports["rblx_server_tick"] !== "undefined", "missing Wasm export: rblx_server_tick");
  assert(typeof wasmExports["rblx_server_player_count"] !== "undefined", "missing Wasm export: rblx_server_player_count");
  assert(typeof wasmExports["rblx_join_start"] !== "undefined", "missing Wasm export: rblx_join_start");
  assert(typeof wasmExports["rblx_server_eval"] !== "undefined", "missing Wasm export: rblx_server_eval");
  assert(typeof wasmExports["rblx_net_debug"] !== "undefined", "missing Wasm export: rblx_net_debug");
  assert(typeof wasmExports["rblx_net_state"] !== "undefined", "missing Wasm export: rblx_net_state");
  assert(typeof wasmExports["rblx_net_message"] !== "undefined", "missing Wasm export: rblx_net_message");
  assert(typeof wasmExports["main"] !== "undefined", "missing Wasm export: main");
  assert(typeof wasmExports["rblx_net_set_ip"] !== "undefined", "missing Wasm export: rblx_net_set_ip");
  assert(typeof wasmExports["rblx_net_signal"] !== "undefined", "missing Wasm export: rblx_net_signal");
  assert(typeof wasmExports["rblx_net_take"] !== "undefined", "missing Wasm export: rblx_net_take");
  assert(typeof wasmExports["rblx_net_push"] !== "undefined", "missing Wasm export: rblx_net_push");
  assert(typeof wasmExports["_emscripten_tls_init"] !== "undefined", "missing Wasm export: _emscripten_tls_init");
  assert(typeof wasmExports["_emscripten_thread_init"] !== "undefined", "missing Wasm export: _emscripten_thread_init");
  assert(typeof wasmExports["__set_thread_state"] !== "undefined", "missing Wasm export: __set_thread_state");
  assert(typeof wasmExports["_emscripten_thread_crashed"] !== "undefined", "missing Wasm export: _emscripten_thread_crashed");
  assert(typeof wasmExports["emscripten_stack_get_end"] !== "undefined", "missing Wasm export: emscripten_stack_get_end");
  assert(typeof wasmExports["emscripten_stack_get_base"] !== "undefined", "missing Wasm export: emscripten_stack_get_base");
  assert(typeof wasmExports["_emscripten_run_js_on_main_thread_done"] !== "undefined", "missing Wasm export: _emscripten_run_js_on_main_thread_done");
  assert(typeof wasmExports["_emscripten_run_js_on_main_thread"] !== "undefined", "missing Wasm export: _emscripten_run_js_on_main_thread");
  assert(typeof wasmExports["_emscripten_thread_free_data"] !== "undefined", "missing Wasm export: _emscripten_thread_free_data");
  assert(typeof wasmExports["_emscripten_thread_exit"] !== "undefined", "missing Wasm export: _emscripten_thread_exit");
  assert(typeof wasmExports["_emscripten_check_mailbox"] !== "undefined", "missing Wasm export: _emscripten_check_mailbox");
  assert(typeof wasmExports["__trap"] !== "undefined", "missing Wasm export: __trap");
  assert(typeof wasmExports["emscripten_stack_init"] !== "undefined", "missing Wasm export: emscripten_stack_init");
  assert(typeof wasmExports["emscripten_stack_set_limits"] !== "undefined", "missing Wasm export: emscripten_stack_set_limits");
  assert(typeof wasmExports["emscripten_stack_get_free"] !== "undefined", "missing Wasm export: emscripten_stack_get_free");
  assert(typeof wasmExports["_emscripten_stack_restore"] !== "undefined", "missing Wasm export: _emscripten_stack_restore");
  assert(typeof wasmExports["_emscripten_stack_alloc"] !== "undefined", "missing Wasm export: _emscripten_stack_alloc");
  assert(typeof wasmExports["emscripten_stack_get_current"] !== "undefined", "missing Wasm export: emscripten_stack_get_current");
  assert(typeof wasmExports["__cxa_decrement_exception_refcount"] !== "undefined", "missing Wasm export: __cxa_decrement_exception_refcount");
  assert(typeof wasmExports["__cxa_increment_exception_refcount"] !== "undefined", "missing Wasm export: __cxa_increment_exception_refcount");
  assert(typeof wasmExports["__thrown_object_from_unwind_exception"] !== "undefined", "missing Wasm export: __thrown_object_from_unwind_exception");
  assert(typeof wasmExports["__get_exception_message"] !== "undefined", "missing Wasm export: __get_exception_message");
  assert(typeof wasmExports["__set_stack_limits"] !== "undefined", "missing Wasm export: __set_stack_limits");
  assert(typeof wasmExports["__indirect_function_table"] !== "undefined", "missing Wasm export: __indirect_function_table");
  assert(typeof wasmExports["__cpp_exception"] !== "undefined", "missing Wasm export: __cpp_exception");
  _free = Module["_free"] = createExportWrapper("free", wasmExports["free"], 1);
  _malloc = Module["_malloc"] = createExportWrapper("malloc", wasmExports["malloc"], 1);
  _realloc = createExportWrapper("realloc", wasmExports["realloc"], 2);
  _pthread_self = wasmExports["pthread_self"];
  _htons = createExportWrapper("htons", wasmExports["htons"], 1);
  _fflush = createExportWrapper("fflush", wasmExports["fflush"], 1);
  _strerror = createExportWrapper("strerror", wasmExports["strerror"], 1);
  _htonl = createExportWrapper("htonl", wasmExports["htonl"], 1);
  _ntohs = createExportWrapper("ntohs", wasmExports["ntohs"], 1);
  _rblx_ds_put = Module["_rblx_ds_put"] = createExportWrapper("rblx_ds_put", wasmExports["rblx_ds_put"], 2);
  _rblx_audio_pump = Module["_rblx_audio_pump"] = createExportWrapper("rblx_audio_pump", wasmExports["rblx_audio_pump"], 0);
  _rblx_audio_ended = Module["_rblx_audio_ended"] = createExportWrapper("rblx_audio_ended", wasmExports["rblx_audio_ended"], 1);
  _rblx_start_place = Module["_rblx_start_place"] = createExportWrapper("rblx_start_place", wasmExports["rblx_start_place"], 5);
  _rblx_load_place = Module["_rblx_load_place"] = createExportWrapper("rblx_load_place", wasmExports["rblx_load_place"], 0);
  _rblx_loading_gui_ready = Module["_rblx_loading_gui_ready"] = createExportWrapper("rblx_loading_gui_ready", wasmExports["rblx_loading_gui_ready"], 0);
  _rblx_set_asset_proxy = Module["_rblx_set_asset_proxy"] = createExportWrapper("rblx_set_asset_proxy", wasmExports["rblx_set_asset_proxy"], 1);
  _rblx_set_render_option = Module["_rblx_set_render_option"] = createExportWrapper("rblx_set_render_option", wasmExports["rblx_set_render_option"], 2);
  _rblx_set_avatar = Module["_rblx_set_avatar"] = createExportWrapper("rblx_set_avatar", wasmExports["rblx_set_avatar"], 1);
  _rblx_frame = Module["_rblx_frame"] = createExportWrapper("rblx_frame", wasmExports["rblx_frame"], 0);
  _rblx_request_thumbnail = Module["_rblx_request_thumbnail"] = createExportWrapper("rblx_request_thumbnail", wasmExports["rblx_request_thumbnail"], 2);
  _rblx_thumbnail_ready = Module["_rblx_thumbnail_ready"] = createExportWrapper("rblx_thumbnail_ready", wasmExports["rblx_thumbnail_ready"], 0);
  _rblx_thumbnail_data = Module["_rblx_thumbnail_data"] = createExportWrapper("rblx_thumbnail_data", wasmExports["rblx_thumbnail_data"], 0);
  _rblx_resize = Module["_rblx_resize"] = createExportWrapper("rblx_resize", wasmExports["rblx_resize"], 2);
  _rblx_set_fullscreen = Module["_rblx_set_fullscreen"] = createExportWrapper("rblx_set_fullscreen", wasmExports["rblx_set_fullscreen"], 1);
  _rblx_set_unlock_fps = Module["_rblx_set_unlock_fps"] = createExportWrapper("rblx_set_unlock_fps", wasmExports["rblx_set_unlock_fps"], 1);
  _rblx_has_view = Module["_rblx_has_view"] = createExportWrapper("rblx_has_view", wasmExports["rblx_has_view"], 0);
  _rblx_frame_count = Module["_rblx_frame_count"] = createExportWrapper("rblx_frame_count", wasmExports["rblx_frame_count"], 0);
  _rblx_engine_busy_frames = Module["_rblx_engine_busy_frames"] = createExportWrapper("rblx_engine_busy_frames", wasmExports["rblx_engine_busy_frames"], 0);
  _rblx_set_camera = Module["_rblx_set_camera"] = createExportWrapper("rblx_set_camera", wasmExports["rblx_set_camera"], 6);
  _rblx_key_event = Module["_rblx_key_event"] = createExportWrapper("rblx_key_event", wasmExports["rblx_key_event"], 4);
  _rblx_set_xbox_mode = Module["_rblx_set_xbox_mode"] = createExportWrapper("rblx_set_xbox_mode", wasmExports["rblx_set_xbox_mode"], 1);
  _rblx_gamepad_connect = Module["_rblx_gamepad_connect"] = createExportWrapper("rblx_gamepad_connect", wasmExports["rblx_gamepad_connect"], 2);
  _rblx_gamepad_button = Module["_rblx_gamepad_button"] = createExportWrapper("rblx_gamepad_button", wasmExports["rblx_gamepad_button"], 3);
  _rblx_gamepad_axis = Module["_rblx_gamepad_axis"] = createExportWrapper("rblx_gamepad_axis", wasmExports["rblx_gamepad_axis"], 5);
  _rblx_mouse_button = Module["_rblx_mouse_button"] = createExportWrapper("rblx_mouse_button", wasmExports["rblx_mouse_button"], 4);
  _rblx_mouse_wheel = Module["_rblx_mouse_wheel"] = createExportWrapper("rblx_mouse_wheel", wasmExports["rblx_mouse_wheel"], 3);
  _rblx_mouse_move = Module["_rblx_mouse_move"] = createExportWrapper("rblx_mouse_move", wasmExports["rblx_mouse_move"], 4);
  _rblx_touch_event = Module["_rblx_touch_event"] = createExportWrapper("rblx_touch_event", wasmExports["rblx_touch_event"], 4);
  _rblx_stop = Module["_rblx_stop"] = createExportWrapper("rblx_stop", wasmExports["rblx_stop"], 0);
  _rblx_last_error = Module["_rblx_last_error"] = createExportWrapper("rblx_last_error", wasmExports["rblx_last_error"], 0);
  _rblx_force_character = Module["_rblx_force_character"] = createExportWrapper("rblx_force_character", wasmExports["rblx_force_character"], 0);
  _rblx_run_script = Module["_rblx_run_script"] = createExportWrapper("rblx_run_script", wasmExports["rblx_run_script"], 1);
  _rblx_set_script_year = Module["_rblx_set_script_year"] = createExportWrapper("rblx_set_script_year", wasmExports["rblx_set_script_year"], 1);
  _rblx_set_membership = Module["_rblx_set_membership"] = createExportWrapper("rblx_set_membership", wasmExports["rblx_set_membership"], 1);
  _rblx_mp_in = Module["_rblx_mp_in"] = createExportWrapper("rblx_mp_in", wasmExports["rblx_mp_in"], 1);
  _rblx_mp_out = Module["_rblx_mp_out"] = createExportWrapper("rblx_mp_out", wasmExports["rblx_mp_out"], 0);
  _rblx_debug_player = Module["_rblx_debug_player"] = createExportWrapper("rblx_debug_player", wasmExports["rblx_debug_player"], 0);
  _rblx_debug_joints = Module["_rblx_debug_joints"] = createExportWrapper("rblx_debug_joints", wasmExports["rblx_debug_joints"], 0);
  _rblx_debug_anim = Module["_rblx_debug_anim"] = createExportWrapper("rblx_debug_anim", wasmExports["rblx_debug_anim"], 0);
  _rblx_debug_asset = Module["_rblx_debug_asset"] = createExportWrapper("rblx_debug_asset", wasmExports["rblx_debug_asset"], 1);
  _rblx_debug_gui = Module["_rblx_debug_gui"] = createExportWrapper("rblx_debug_gui", wasmExports["rblx_debug_gui"], 0);
  _rblx_test_thread = Module["_rblx_test_thread"] = createExportWrapper("rblx_test_thread", wasmExports["rblx_test_thread"], 0);
  _rblx_host_start = Module["_rblx_host_start"] = createExportWrapper("rblx_host_start", wasmExports["rblx_host_start"], 4);
  _rblx_server_set_avatar = Module["_rblx_server_set_avatar"] = createExportWrapper("rblx_server_set_avatar", wasmExports["rblx_server_set_avatar"], 2);
  _rblx_server_tick = Module["_rblx_server_tick"] = createExportWrapper("rblx_server_tick", wasmExports["rblx_server_tick"], 0);
  _rblx_server_player_count = Module["_rblx_server_player_count"] = createExportWrapper("rblx_server_player_count", wasmExports["rblx_server_player_count"], 0);
  _rblx_join_start = Module["_rblx_join_start"] = createExportWrapper("rblx_join_start", wasmExports["rblx_join_start"], 6);
  _rblx_server_eval = Module["_rblx_server_eval"] = createExportWrapper("rblx_server_eval", wasmExports["rblx_server_eval"], 1);
  _rblx_net_debug = Module["_rblx_net_debug"] = createExportWrapper("rblx_net_debug", wasmExports["rblx_net_debug"], 0);
  _rblx_net_state = Module["_rblx_net_state"] = createExportWrapper("rblx_net_state", wasmExports["rblx_net_state"], 0);
  _rblx_net_message = Module["_rblx_net_message"] = createExportWrapper("rblx_net_message", wasmExports["rblx_net_message"], 0);
  _main = createExportWrapper("main", wasmExports["main"], 2);
  _rblx_net_set_ip = Module["_rblx_net_set_ip"] = createExportWrapper("rblx_net_set_ip", wasmExports["rblx_net_set_ip"], 1);
  _rblx_net_signal = Module["_rblx_net_signal"] = createExportWrapper("rblx_net_signal", wasmExports["rblx_net_signal"], 0);
  _rblx_net_take = Module["_rblx_net_take"] = createExportWrapper("rblx_net_take", wasmExports["rblx_net_take"], 1);
  _rblx_net_push = Module["_rblx_net_push"] = createExportWrapper("rblx_net_push", wasmExports["rblx_net_push"], 5);
  __emscripten_tls_init = createExportWrapper("_emscripten_tls_init", wasmExports["_emscripten_tls_init"], 0);
  __emscripten_thread_init = createExportWrapper("_emscripten_thread_init", wasmExports["_emscripten_thread_init"], 6);
  ___set_thread_state = createExportWrapper("__set_thread_state", wasmExports["__set_thread_state"], 4);
  __emscripten_thread_crashed = createExportWrapper("_emscripten_thread_crashed", wasmExports["_emscripten_thread_crashed"], 0);
  _emscripten_stack_get_end = wasmExports["emscripten_stack_get_end"];
  _emscripten_stack_get_base = wasmExports["emscripten_stack_get_base"];
  __emscripten_run_js_on_main_thread_done = createExportWrapper("_emscripten_run_js_on_main_thread_done", wasmExports["_emscripten_run_js_on_main_thread_done"], 3);
  __emscripten_run_js_on_main_thread = createExportWrapper("_emscripten_run_js_on_main_thread", wasmExports["_emscripten_run_js_on_main_thread"], 5);
  __emscripten_thread_free_data = createExportWrapper("_emscripten_thread_free_data", wasmExports["_emscripten_thread_free_data"], 1);
  __emscripten_thread_exit = createExportWrapper("_emscripten_thread_exit", wasmExports["_emscripten_thread_exit"], 1);
  __emscripten_check_mailbox = createExportWrapper("_emscripten_check_mailbox", wasmExports["_emscripten_check_mailbox"], 0);
  ___trap = wasmExports["__trap"];
  _emscripten_stack_init = wasmExports["emscripten_stack_init"];
  _emscripten_stack_set_limits = wasmExports["emscripten_stack_set_limits"];
  _emscripten_stack_get_free = wasmExports["emscripten_stack_get_free"];
  __emscripten_stack_restore = wasmExports["_emscripten_stack_restore"];
  __emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"];
  _emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"];
  ___cxa_decrement_exception_refcount = createExportWrapper("__cxa_decrement_exception_refcount", wasmExports["__cxa_decrement_exception_refcount"], 1);
  ___cxa_increment_exception_refcount = createExportWrapper("__cxa_increment_exception_refcount", wasmExports["__cxa_increment_exception_refcount"], 1);
  ___thrown_object_from_unwind_exception = createExportWrapper("__thrown_object_from_unwind_exception", wasmExports["__thrown_object_from_unwind_exception"], 1);
  ___get_exception_message = createExportWrapper("__get_exception_message", wasmExports["__get_exception_message"], 3);
  ___set_stack_limits = Module["___set_stack_limits"] = createExportWrapper("__set_stack_limits", wasmExports["__set_stack_limits"], 2);
  __indirect_function_table = wasmTable = wasmExports["__indirect_function_table"];
  ___cpp_exception = wasmExports["__cpp_exception"];
}

var wasmImports;

function assignWasmImports() {
  wasmImports = {
    /** @export */ __assert_fail: ___assert_fail,
    /** @export */ __handle_stack_overflow: ___handle_stack_overflow,
    /** @export */ __pthread_create_js: ___pthread_create_js,
    /** @export */ __syscall_dup3: ___syscall_dup3,
    /** @export */ __syscall_fcntl64: ___syscall_fcntl64,
    /** @export */ __syscall_fstat64: ___syscall_fstat64,
    /** @export */ __syscall_getcwd: ___syscall_getcwd,
    /** @export */ __syscall_getdents64: ___syscall_getdents64,
    /** @export */ __syscall_ioctl: ___syscall_ioctl,
    /** @export */ __syscall_lstat64: ___syscall_lstat64,
    /** @export */ __syscall_mkdirat: ___syscall_mkdirat,
    /** @export */ __syscall_newfstatat: ___syscall_newfstatat,
    /** @export */ __syscall_openat: ___syscall_openat,
    /** @export */ __syscall_readlinkat: ___syscall_readlinkat,
    /** @export */ __syscall_rmdir: ___syscall_rmdir,
    /** @export */ __syscall_stat64: ___syscall_stat64,
    /** @export */ __syscall_uname: ___syscall_uname,
    /** @export */ __syscall_unlinkat: ___syscall_unlinkat,
    /** @export */ __throw_exception_with_stack_trace: ___throw_exception_with_stack_trace,
    /** @export */ _abort_js: __abort_js,
    /** @export */ _emscripten_init_main_thread_js: __emscripten_init_main_thread_js,
    /** @export */ _emscripten_notify_mailbox_postmessage: __emscripten_notify_mailbox_postmessage,
    /** @export */ _emscripten_receive_on_main_thread_js: __emscripten_receive_on_main_thread_js,
    /** @export */ _emscripten_thread_cleanup: __emscripten_thread_cleanup,
    /** @export */ _emscripten_thread_mailbox_await: __emscripten_thread_mailbox_await,
    /** @export */ _emscripten_thread_set_strongref: __emscripten_thread_set_strongref,
    /** @export */ _gmtime_js: __gmtime_js,
    /** @export */ _localtime_js: __localtime_js,
    /** @export */ _mktime_js: __mktime_js,
    /** @export */ _tzset_js: __tzset_js,
    /** @export */ clock_time_get: _clock_time_get,
    /** @export */ emscripten_asm_const_async_on_main_thread: _emscripten_asm_const_async_on_main_thread,
    /** @export */ emscripten_check_blocking_allowed: _emscripten_check_blocking_allowed,
    /** @export */ emscripten_date_now: _emscripten_date_now,
    /** @export */ emscripten_err: _emscripten_err,
    /** @export */ emscripten_exit_with_live_runtime: _emscripten_exit_with_live_runtime,
    /** @export */ emscripten_fetch_free: _emscripten_fetch_free,
    /** @export */ emscripten_get_heap_max: _emscripten_get_heap_max,
    /** @export */ emscripten_get_now: _emscripten_get_now,
    /** @export */ emscripten_num_logical_cores: _emscripten_num_logical_cores,
    /** @export */ emscripten_resize_heap: _emscripten_resize_heap,
    /** @export */ emscripten_run_script: _emscripten_run_script,
    /** @export */ emscripten_run_script_int: _emscripten_run_script_int,
    /** @export */ emscripten_start_fetch: _emscripten_start_fetch,
    /** @export */ environ_get: _environ_get,
    /** @export */ environ_sizes_get: _environ_sizes_get,
    /** @export */ exit: _exit,
    /** @export */ fd_close: _fd_close,
    /** @export */ fd_read: _fd_read,
    /** @export */ fd_seek: _fd_seek,
    /** @export */ fd_write: _fd_write,
    /** @export */ getaddrinfo: _getaddrinfo,
    /** @export */ glActiveTexture: _glActiveTexture,
    /** @export */ glAttachShader: _glAttachShader,
    /** @export */ glBindAttribLocation: _glBindAttribLocation,
    /** @export */ glBindBuffer: _glBindBuffer,
    /** @export */ glBindFramebuffer: _glBindFramebuffer,
    /** @export */ glBindRenderbuffer: _glBindRenderbuffer,
    /** @export */ glBindTexture: _glBindTexture,
    /** @export */ glBindVertexArray: _glBindVertexArray,
    /** @export */ glBlendFunc: _glBlendFunc,
    /** @export */ glBlendFuncSeparate: _glBlendFuncSeparate,
    /** @export */ glBlitFramebuffer: _glBlitFramebuffer,
    /** @export */ glBufferData: _glBufferData,
    /** @export */ glBufferSubData: _glBufferSubData,
    /** @export */ glCheckFramebufferStatus: _glCheckFramebufferStatus,
    /** @export */ glClear: _glClear,
    /** @export */ glClearColor: _glClearColor,
    /** @export */ glClearDepthf: _glClearDepthf,
    /** @export */ glClearStencil: _glClearStencil,
    /** @export */ glClientWaitSync: _glClientWaitSync,
    /** @export */ glColorMask: _glColorMask,
    /** @export */ glCompileShader: _glCompileShader,
    /** @export */ glCompressedTexImage2D: _glCompressedTexImage2D,
    /** @export */ glCompressedTexSubImage2D: _glCompressedTexSubImage2D,
    /** @export */ glCopyTexSubImage2D: _glCopyTexSubImage2D,
    /** @export */ glCreateProgram: _glCreateProgram,
    /** @export */ glCreateShader: _glCreateShader,
    /** @export */ glCullFace: _glCullFace,
    /** @export */ glDeleteBuffers: _glDeleteBuffers,
    /** @export */ glDeleteFramebuffers: _glDeleteFramebuffers,
    /** @export */ glDeleteProgram: _glDeleteProgram,
    /** @export */ glDeleteRenderbuffers: _glDeleteRenderbuffers,
    /** @export */ glDeleteShader: _glDeleteShader,
    /** @export */ glDeleteSync: _glDeleteSync,
    /** @export */ glDeleteTextures: _glDeleteTextures,
    /** @export */ glDeleteVertexArrays: _glDeleteVertexArrays,
    /** @export */ glDepthFunc: _glDepthFunc,
    /** @export */ glDepthMask: _glDepthMask,
    /** @export */ glDisable: _glDisable,
    /** @export */ glDisableVertexAttribArray: _glDisableVertexAttribArray,
    /** @export */ glDrawArrays: _glDrawArrays,
    /** @export */ glDrawElements: _glDrawElements,
    /** @export */ glEnable: _glEnable,
    /** @export */ glEnableVertexAttribArray: _glEnableVertexAttribArray,
    /** @export */ glFenceSync: _glFenceSync,
    /** @export */ glFramebufferRenderbuffer: _glFramebufferRenderbuffer,
    /** @export */ glFramebufferTexture2D: _glFramebufferTexture2D,
    /** @export */ glGenBuffers: _glGenBuffers,
    /** @export */ glGenFramebuffers: _glGenFramebuffers,
    /** @export */ glGenRenderbuffers: _glGenRenderbuffers,
    /** @export */ glGenTextures: _glGenTextures,
    /** @export */ glGenVertexArrays: _glGenVertexArrays,
    /** @export */ glGenerateMipmap: _glGenerateMipmap,
    /** @export */ glGetActiveUniform: _glGetActiveUniform,
    /** @export */ glGetIntegerv: _glGetIntegerv,
    /** @export */ glGetProgramInfoLog: _glGetProgramInfoLog,
    /** @export */ glGetProgramiv: _glGetProgramiv,
    /** @export */ glGetShaderInfoLog: _glGetShaderInfoLog,
    /** @export */ glGetShaderiv: _glGetShaderiv,
    /** @export */ glGetString: _glGetString,
    /** @export */ glGetUniformLocation: _glGetUniformLocation,
    /** @export */ glInvalidateFramebuffer: _glInvalidateFramebuffer,
    /** @export */ glLinkProgram: _glLinkProgram,
    /** @export */ glMapBufferRange: _glMapBufferRange,
    /** @export */ glPixelStorei: _glPixelStorei,
    /** @export */ glPolygonOffset: _glPolygonOffset,
    /** @export */ glReadPixels: _glReadPixels,
    /** @export */ glRenderbufferStorage: _glRenderbufferStorage,
    /** @export */ glRenderbufferStorageMultisample: _glRenderbufferStorageMultisample,
    /** @export */ glShaderSource: _glShaderSource,
    /** @export */ glStencilFunc: _glStencilFunc,
    /** @export */ glStencilMask: _glStencilMask,
    /** @export */ glStencilOp: _glStencilOp,
    /** @export */ glStencilOpSeparate: _glStencilOpSeparate,
    /** @export */ glTexImage2D: _glTexImage2D,
    /** @export */ glTexImage3D: _glTexImage3D,
    /** @export */ glTexParameteri: _glTexParameteri,
    /** @export */ glTexStorage2D: _glTexStorage2D,
    /** @export */ glTexStorage3D: _glTexStorage3D,
    /** @export */ glTexSubImage2D: _glTexSubImage2D,
    /** @export */ glTexSubImage3D: _glTexSubImage3D,
    /** @export */ glUniform1fv: _glUniform1fv,
    /** @export */ glUniform1i: _glUniform1i,
    /** @export */ glUniform2fv: _glUniform2fv,
    /** @export */ glUniform3fv: _glUniform3fv,
    /** @export */ glUniform4fv: _glUniform4fv,
    /** @export */ glUniformMatrix4fv: _glUniformMatrix4fv,
    /** @export */ glUnmapBuffer: _glUnmapBuffer,
    /** @export */ glUseProgram: _glUseProgram,
    /** @export */ glVertexAttribPointer: _glVertexAttribPointer,
    /** @export */ glViewport: _glViewport,
    /** @export */ glfwCreateWindow: _glfwCreateWindow,
    /** @export */ glfwDestroyWindow: _glfwDestroyWindow,
    /** @export */ glfwGetFramebufferSize: _glfwGetFramebufferSize,
    /** @export */ glfwInit: _glfwInit,
    /** @export */ glfwMakeContextCurrent: _glfwMakeContextCurrent,
    /** @export */ glfwSetWindowSize: _glfwSetWindowSize,
    /** @export */ glfwSwapBuffers: _glfwSwapBuffers,
    /** @export */ glfwSwapInterval: _glfwSwapInterval,
    /** @export */ glfwTerminate: _glfwTerminate,
    /** @export */ glfwWindowHint: _glfwWindowHint,
    /** @export */ memory: wasmMemory,
    /** @export */ rbx_audio_create_memory,
    /** @export */ rbx_audio_create_url,
    /** @export */ rbx_audio_forget,
    /** @export */ rbx_audio_master_mute,
    /** @export */ rbx_audio_master_volume,
    /** @export */ rbx_audio_play,
    /** @export */ rbx_audio_release_sound,
    /** @export */ rbx_audio_set_frequency,
    /** @export */ rbx_audio_set_loop,
    /** @export */ rbx_audio_set_paused,
    /** @export */ rbx_audio_set_position,
    /** @export */ rbx_audio_set_volume,
    /** @export */ rbx_audio_stop
  };
}

// include: postamble.js
// === Auto-generated postamble setup entry stuff ===
// include: runtime_pthread.js
// Pthread Web Worker handling code.
// This code runs only on pthread web workers and handles pthread setup
// and communication with the main thread via postMessage.
var startWorker;

if (ENVIRONMENT_IS_PTHREAD) {
  // Thread-local guard variable for one-time init of the JS state
  var initializedJS = false;
  // Turn unhandled rejected promises into errors so that the main thread will be
  // notified about them.
  self.onunhandledrejection = e => {
    throw e.reason || e;
  };
  function handleMessage(e) {
    try {
      var msgData = e.data;
      //dbg('msgData: ' + Object.keys(msgData));
      var cmd = msgData.cmd;
      if (cmd == CMD_LOAD) {
        // Preload command that is called once per worker to parse and load the Emscripten code.
        workerID = msgData.workerID;
        // Until we initialize the runtime, queue up any further incoming messages.
        let messageQueue = [];
        self.onmessage = e => messageQueue.push(e);
        // And add a callback for when the runtime is initialized.
        startWorker = () => {
          // Notify the main thread that this thread has loaded.
          postMessage({
            cmd: CMD_LOADED
          });
          // Process any messages that were queued before the thread was ready.
          for (let msg of messageQueue) {
            handleMessage(msg);
          }
          // Restore the real message handler.
          self.onmessage = handleMessage;
        };
        // Use `const` here to ensure that the variable is scoped only to
        // that iteration, allowing safe reference from a closure.
        for (const handler of msgData.handlers) {
          // If the main module has a handler for a certain event, but no
          // handler exists on the pthread worker, then proxy that handler
          // back to the main thread.
          if (!Module[handler] || Module[handler].proxy) {
            Module[handler] = (...args) => {
              postMessage({
                cmd: CMD_CALL_HANDLER,
                handler,
                args
              });
            };
            // Rebind the out / err handlers if needed
            if (handler == "print") out = Module[handler];
            if (handler == "printErr") err = Module[handler];
          }
        }
        wasmMemory = msgData.wasmMemory;
        updateMemoryViews();
        wasmModule = msgData.wasmModule;
        createWasm();
        run();
        startWorker();
      } else if (cmd == CMD_RUN) {
        assert(msgData.pthread_ptr);
        assert(wasmMemory, "CMD_RUN received before CMD_LOAD");
        // Call inside JS module to set up the stack frame for this pthread in JS module scope.
        // This needs to be the first thing that we do, as we cannot call to any C/C++ functions
        // until the thread stack is initialized.
        establishStackSpace(msgData.pthread_ptr);
        // Pass the thread address to wasm to store it for fast access.
        __emscripten_thread_init(msgData.pthread_ptr, /*is_main=*/ 0, /*is_runtime=*/ 0, /*can_block=*/ 1, 0, 0);
        PThread.threadInitTLS();
        // Await mailbox notifications with `Atomics.waitAsync` so we can start
        // using the fast `Atomics.notify` notification path.
        __emscripten_thread_mailbox_await(msgData.pthread_ptr);
        if (!initializedJS) {
          initializedJS = true;
        }
        try {
          invokeEntryPoint(msgData.start_routine, msgData.arg);
        } catch (ex) {
          if (ex != "unwind") {
            // The pthread "crashed".  Do not call `_emscripten_thread_exit` (which
            // would make this thread joinable).  Instead, re-throw the exception
            // and let the top level handler propagate it back to the main thread.
            throw ex;
          }
        }
      } else if (cmd == CMD_CHECK_MAILBOX) {
        if (initializedJS) {
          checkMailbox();
        }
      } else if (cmd) {
        // The received message looks like something that should be handled by this message
        // handler, (since there is a cmd field present), but is not one of the
        // recognized commands:
        err(`worker: received unknown command ${cmd}`);
        err(msgData);
      }
    } catch (ex) {
      err(`worker: onmessage() captured an uncaught exception: ${ex}`);
      if (ex?.stack) err(ex.stack);
      if (runtimeInitialized) __emscripten_thread_crashed();
      throw ex;
    }
  }
  self.onmessage = handleMessage;
}

// ENVIRONMENT_IS_PTHREAD
// end include: runtime_pthread.js
var calledRun;

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  // See $establishStackSpace for the equivalent code that runs on a thread
  assert(!ENVIRONMENT_IS_PTHREAD);
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

async function run() {
  assert(!calledRun);
  calledRun = true;
  if ((ENVIRONMENT_IS_PTHREAD)) {
    initRuntime();
    return;
  }
  stackCheckInit();
  preRun();
  if (runDependencies) {
    await resolveRunDependencies();
  }
  var setStatus = Module["setStatus"];
  if (setStatus) {
    setStatus("Running...");
    // Yield to the event loop to allow the browser to paint "Running..."
    await new Promise(resolve => setTimeout(resolve, 1));
    // Then we want to clear the status text, but only after the rest of this function runs.
    setTimeout(setStatus, 1, "");
  }
  if (ABORT) return;
  initRuntime();
  Module["onRuntimeInitialized"]?.();
  consumedModuleProp("onRuntimeInitialized");
  assert(!Module["_main"], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');
  postRun();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = x => {
    has = true;
  };
  try {
    // it doesn't matter if it fails
    _fflush(0);
    // also flush in the JS FS layer
    for (var tty of Object.values(TTY.ttys)) {
      if (tty.output.length) {
        has = true;
      }
    }
  } catch (e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.");
  }
}

var wasmExports;

if ((!(ENVIRONMENT_IS_PTHREAD))) {
  // Call createWasm on startup if we are the main thread.
  // Worker threads call this once they receive the module via postMessage
  // In modularize mode the generated code is within a factory function so we
  // can use await here (since it's not top-level-await).
  wasmExports = await createWasm();
  await run();
}

// end include: postamble.js
// include: postamble_modularize.js
// In MODULARIZE mode we wrap the generated code in a factory function
// and return either the Module itself, or a promise of the module.
// Assertion for attempting to access module properties on the incoming
// moduleArg.  In the past we used this object as the prototype of the module
// and assigned properties to it, but now we return a distinct object.  This
// keeps the instance private until it is ready (i.e the promise has been
// resolved).
for (const prop of Object.keys(Module)) {
  if (!(prop in moduleArg)) {
    Object.defineProperty(moduleArg, prop, {
      configurable: true,
      get() {
        abort(`Access to module property ('${prop}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`);
      }
    });
  }
}


    return Module;
  };
})();

// Export using a UMD style export, or ES6 exports if selected
if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = createRBLX2016Module;
  // This default export looks redundant, but it allows TS to import this
  // commonjs style module.
  module.exports.default = createRBLX2016Module;
} else if (typeof define === 'function' && define['amd'])
  define([], () => createRBLX2016Module);

// Create code for detecting if we are running in a pthread.
// Normally this detection is done when the module is itself run but
// when running in MODULARIZE mode we need use this to know if we should
// run the module constructor on startup (true only for pthreads).
var isPthread = globalThis.name?.startsWith('em-pthread');

isPthread && createRBLX2016Module();

