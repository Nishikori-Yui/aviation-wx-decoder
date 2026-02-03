let wasmModulePromise = null;

async function loadWasmModule() {
  if (wasmModulePromise) {
    return wasmModulePromise;
  }
  wasmModulePromise = (async () => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const moduleUrl = new URL(`${baseUrl}wasm/aviation_wx_wasm.js`, window.location.origin).toString();
    const wasmUrl = new URL(`${baseUrl}wasm/aviation_wx_wasm_bg.wasm`, window.location.origin).toString();
    const module = await import(/* @vite-ignore */ moduleUrl);
    const init = module.default;
    if (typeof init !== "function") {
      throw new Error("Invalid wasm loader export");
    }
    await init(wasmUrl);
    if (!module.decode_json) {
      throw new Error("decode_json not found in wasm module");
    }
    return module;
  })();
  return wasmModulePromise;
}

export async function decodeWithWasm({ message, type }) {
  const module = await loadWasmModule();
  const json = module.decode_json(message, type || "auto");
  if (typeof json !== "string") {
    throw new Error("Invalid wasm decode result");
  }
  return JSON.parse(json);
}

export async function detectWasmAvailable() {
  try {
    await loadWasmModule();
    return true;
  } catch (err) {
    return false;
  }
}
