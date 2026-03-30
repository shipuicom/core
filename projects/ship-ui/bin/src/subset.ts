import { readFile } from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// @ts-ignore
import wawoff2 from 'wawoff2';

let harfbuzzInst: { harfbuzzJsWasm: any; heapu8: Uint8Array } | null = null;

async function loadAndInitializeHarfbuzz() {
  if (harfbuzzInst) return harfbuzzInst;

  const wasmPath = require.resolve('harfbuzzjs/hb-subset.wasm');
  const wasmBuffer = await readFile(wasmPath);
  const { instance } = await WebAssembly.instantiate(wasmBuffer);
  const harfbuzzJsWasm = instance.exports as any;
  const heapu8 = new Uint8Array(harfbuzzJsWasm.memory.buffer);

  harfbuzzInst = { harfbuzzJsWasm, heapu8 };
  return harfbuzzInst;
}

export default async function subsetFont(originalFont: Buffer, text: string): Promise<Buffer> {
  if (typeof text !== 'string') {
    throw new Error('The subset text must be given as a string');
  }

  const { harfbuzzJsWasm, heapu8 } = await loadAndInitializeHarfbuzz();

  const input = harfbuzzJsWasm.hb_subset_input_create_or_fail();
  if (input === 0) {
    throw new Error('hb_subset_input_create_or_fail (harfbuzz) returned zero');
  }

  const fontBuffer = harfbuzzJsWasm.malloc(originalFont.byteLength);
  heapu8.set(new Uint8Array(originalFont), fontBuffer);

  const blob = harfbuzzJsWasm.hb_blob_create(fontBuffer, originalFont.byteLength, 2, 0, 0);
  const face = harfbuzzJsWasm.hb_face_create(blob, 0);
  harfbuzzJsWasm.hb_blob_destroy(blob);

  // equivalent of --font-features=*
  const layoutFeatures = harfbuzzJsWasm.hb_subset_input_set(input, 6); // HB_SUBSET_SETS_LAYOUT_FEATURE_TAG
  harfbuzzJsWasm.hb_set_clear(layoutFeatures);
  harfbuzzJsWasm.hb_set_invert(layoutFeatures);

  // equivalent of noLayoutClosure: true
  harfbuzzJsWasm.hb_subset_input_set_flags(
    input,
    harfbuzzJsWasm.hb_subset_input_get_flags(input) | 0x00000200
  );

  // Add mapped unicode indices
  const inputUnicodes = harfbuzzJsWasm.hb_subset_input_unicode_set(input);
  for (const c of text) {
    const cp = c.codePointAt(0);
    if (cp) {
      harfbuzzJsWasm.hb_set_add(inputUnicodes, cp);
    }
  }

  let subset;
  try {
    subset = harfbuzzJsWasm.hb_subset_or_fail(face, input);
    if (subset === 0) {
      harfbuzzJsWasm.hb_face_destroy(face);
      harfbuzzJsWasm.free(fontBuffer);
      throw new Error('hb_subset_or_fail returned zero. Input corrupted?');
    }
  } finally {
    harfbuzzJsWasm.hb_subset_input_destroy(input);
  }

  const result = harfbuzzJsWasm.hb_face_reference_blob(subset);
  const offset = harfbuzzJsWasm.hb_blob_get_data(result, 0);
  const subsetByteLength = harfbuzzJsWasm.hb_blob_get_length(result);

  if (subsetByteLength === 0) {
    harfbuzzJsWasm.hb_blob_destroy(result);
    harfbuzzJsWasm.hb_face_destroy(subset);
    harfbuzzJsWasm.hb_face_destroy(face);
    harfbuzzJsWasm.free(fontBuffer);
    throw new Error('Failed to extract subset TTF blob from harfbuzz');
  }

  const subsetFontBuffer = Buffer.from(heapu8.subarray(offset, offset + subsetByteLength));

  harfbuzzJsWasm.hb_blob_destroy(result);
  harfbuzzJsWasm.hb_face_destroy(subset);
  harfbuzzJsWasm.hb_face_destroy(face);
  harfbuzzJsWasm.free(fontBuffer);

  // Direct compression from TTF -> WOFF2 internally
  const woff2Buffer = await wawoff2.compress(subsetFontBuffer);
  return Buffer.from(woff2Buffer);
}
