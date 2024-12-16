//@ts-ignore
export { decode, encode, Tag, registerEncoder } from "../../commonjs/wrappers/cbor2Wrapper.js";
//@ts-ignore
export type { DecodeOptions, EncodeOptions } from "../../commonjs/wrappers/cbor2Wrapper.js";

// this is what will end up in the esm build
// need a ts-ignore because this is a hack.
//@ts-ignore
// import cjsState from '../../commonjs/wrappers/cbor2Wrapper.js'
// export const { state } = cjsState as { state: Record<string, any> }