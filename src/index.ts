import { UR } from "./classes/UR.js"
import { UrRegistry } from "./registry.js"
import { registryItemFactory, RegistryItemBase } from "./classes/RegistryItem.js"
import { UrFountainEncoder } from "./classes/UrFountainEncoder.js"
import { UrFountainDecoder } from "./classes/UrFountainDecoder.js"
import { FountainEncoder } from "./classes/FountainEncoder.js"
import { FountainDecoder } from "./classes/FountainDecoder.js"
import { defaultEncoders, dataPipeline } from "./encodingMethods/index.js"

// Encodings
import { CborEncoding } from "./encodingMethods/CborEncoding.js"
import { BytewordEncoding } from "./encodingMethods/BytewordEncoding.js"
import { HexEncoding } from "./encodingMethods/HexEncoding.js"

// CBOR2 library
import * as cbor2 from "./wrappers/cbor2.js";

export {
  UrRegistry,
  registryItemFactory,
  RegistryItemBase,
  UR,
  UrFountainDecoder,
  UrFountainEncoder,
  FountainDecoder,
  FountainEncoder,
  CborEncoding,
  BytewordEncoding,
  HexEncoding,  
  defaultEncoders,
  dataPipeline,
  cbor2,
}

// Export types
import type { RegistryItem, RegistryItemClass } from "./classes/RegistryItem.js"
import type { DecodeOptions as DecodeOptionsType, EncodeOptions as EncodeOptionsType, CommentOptions as CommentOptionsType } from "./wrappers/cbor2.js";
export namespace cbor2Types {
  export type DecodeOptions = DecodeOptionsType;
  export type EncodeOptions = EncodeOptionsType;
  export type CommentOptions = CommentOptionsType;
}
export type { RegistryItem, RegistryItemClass }