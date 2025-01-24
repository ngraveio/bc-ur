// If you need a provide an ESM dialect that doesn't support CommonJS (eg, deno, browser, etc), then you can do this:
// No dual package hazard here
//@ts-ignore
export { decode, encode, Tag, registerEncoder } from "./cbor2Wrapper.js";
//@ts-ignore
export type { DecodeOptions, EncodeOptions } from "./cbor2Wrapper.js";