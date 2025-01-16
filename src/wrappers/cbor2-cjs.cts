// This is the common ground for both esm and commonjs modules
// To overcome dual-package-hazard
//@ts-ignore
export { decode, encode, Tag, registerEncoder } from "./cbor2Wrapper.js";
//@ts-ignore
export type { DecodeOptions, EncodeOptions } from "./cbor2Wrapper.js";