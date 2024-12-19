// This file will end in esm folder as cbor.js
// It will use commonjs/wrappers/cbor2Wrapper.js in order to get away from 
// Dual package hazard, in turn both esm and commonjs will use the same cbor2Wrapper.js
// So we only have one source of truth for cbor2

//@ts-ignore
export { decode, encode, Tag, registerEncoder } from "../../commonjs/wrappers/cbor2Wrapper.js";
//@ts-ignore
export type { DecodeOptions, EncodeOptions } from "../../commonjs/wrappers/cbor2Wrapper.js";

// export { decode, encode, Tag, registerEncoder } from "./cbor2Wrapper.js";
// export type { DecodeOptions, EncodeOptions } from "./cbor2Wrapper.js";