
import { decode, DecodeOptions, diagnose, encode } from 'cbor2';
import { Tag } from 'cbor2/tag';
import { registerEncoder } from 'cbor2/encoder.js';

// let cbor2: any;
// let Tag: any;
// let registerEncoder: any;
// let DecodeOptions: any;

// Dynamically load `cbor2` modules
// (async () => {
//   cbor2 = await import("cbor2");
//   Tag = await import("cbor2/tag");
//   registerEncoder = await import("cbor2/encoder");
//   DecodeOptions = cbor2.DecodeOptions;
//   addDecoders();
// })();

import { registry } from "../registry.js";
import { RegistryItemClass } from "../classes/RegistryItem.js";

function addDecoders() {
  for (const key in registry) {
    const item = registry[key];
    Tag.registerDecoder(item.tag, item.fromCBORData.bind(item));
  }
}

addDecoders();

export const cborEncode = (data: any): Buffer => {
  const encoded = encode(data);
  return Buffer.from(encoded);
};

export const cborDecode = (
  data: string | Buffer,
  options: DecodeOptions,
): any => {
  return decode(
    Buffer.isBuffer(data) ? data : Buffer.from(data as string, "hex"),
    { ...options }
  );
};

export const cborDecode2 = (
  data: string | Buffer,
  options?: DecodeOptions,
  contiueOnErrors?: boolean,
  enforceType?: RegistryItemClass,
): any => {
  const decoded = decode(
    Buffer.isBuffer(data) ? data : Buffer.from(data as string, "hex"),
    { ...options }
  );

  return decoded;
};
