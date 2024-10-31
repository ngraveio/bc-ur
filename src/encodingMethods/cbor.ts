import * as cbor from "cbor";
import { DecoderOptions } from "cbor/types/lib/decoder";
import { allDecoders } from "../registry";
import { User } from "../classes/SomeItems";
import { RegistryItemClass } from "../classes/RegistryItem";

// TODO: Check https://github.com/hildjj/node-cbor/tree/main/packages/cbor#addsemantictype

export const cborEncode = (data: any): Buffer => {
  return cbor.encode(data);
};

export const cborDecode = (
  data: string | Buffer,
  options: DecoderOptions
): any => {
  // get all items from the registry and add them to the decoder
  const tags = allDecoders();

  return cbor.decode(
    Buffer.isBuffer(data) ? data : Buffer.from(data as string, "hex"),
    { ...options, tags }
  );
};

export const cborDecode2 = (
  data: string | Buffer,
  options?: DecoderOptions,
  contiueOnErrors?: boolean,
  enforceType?: RegistryItemClass,
): any => {
  // get all items from the registry and add them to the decoder
  const decoders = allDecoders();

  const decoded = cbor.decode(
    Buffer.isBuffer(data) ? data : Buffer.from(data as string, "hex"),
    { ...options, tags: {...decoders} }
  );

  // Check if enforce type is given, if so then give the value to the enforced type
  if(enforceType) {
    // If we already have a tagged instance, then we need to check if the tag matches the enforced type
    if(decoded instanceof cbor.Tagged) {
      if(decoded.tag !== enforceType.tag) {
        throw new Error(`Enforced type does not match the tag of ${enforceType.URType}:${enforceType.tag} !== ${decoded.tag}`);
      }
      // Try to create the instance of the enforced type
      return enforceType.fromCBORData(decoded.value);
    }
    // If we dont have a tagged instance, then we need to create the instance of the enforced type
    return enforceType.fromCBORData(decoded);
  }

  // Check if there are any errors, if so, return the error
  if (decoded instanceof cbor.Tagged) {
    // Check if tag contains an error
    if (decoded.err) {
      if(contiueOnErrors) {
        return decoded;
      }
      throw decoded.err;
    }
  }

  return decoded;
}
