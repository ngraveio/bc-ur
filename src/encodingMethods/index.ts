import { BytewordEncoding } from "./BytewordEncoding.js";
import { CborEncoding } from "./CborEncoding.js";
import { HexEncoding } from "./HexEncoding.js";
import { EncodingPipeline } from "./pipeline.js";

/**
 * Pipeline that encodes registry registryItem | any -> cbor -> hex -> bytewords
 * 
 * Uses default encoding options for each encoding method
 * 1. Cbor: CBOR2 library
 * 2. Hex: Uint8Array -> hex string
 * 3. Bytewords: Uint8Array -> bytewords string with checksum and minimal style
 * 
 */

export const defaultEncoders = {
  cbor: new CborEncoding(),
  hex: new HexEncoding(),
  bytewords: new BytewordEncoding(),
}

export const dataPipeline = new EncodingPipeline<any, string>([
  defaultEncoders.cbor,
  defaultEncoders.hex,
  defaultEncoders.bytewords,
]);