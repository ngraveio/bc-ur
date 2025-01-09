import { URRegistry, globalUrRegistry } from "../registry.js";
import { RegistryItem, RegistryItemClass, registryItemFactory } from "../classes/RegistryItem.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";

import {
  DecodeOptions,
  EncodeOptions,
  decode, encode, Tag, registerEncoder
} from "../wrappers/cbor2.js";

interface inputOptions {
  registry?: URRegistry;
  cborLibEncoderOptions?: EncodeOptions & {ignoreTopLevelTag?: boolean};
  cborLibDecoderOptions?: DecodeOptions;
}

interface decodeOptions {
  enforceType?: RegistryItemClass;
  cborLibOptions?: DecodeOptions;
}

// For Node.js we are going to convert buffer into Uint8Array
// This code should only run in Node.js
// TODO: Handle checking if it is Node.js or not
registerEncoder(Buffer, (b, _writer, _options) => {
  // Conver buffer to Uint8Array
  const u8 = new Uint8Array(b);
  // This is a major type ( MT.BYTE_STRING ) so no tag is given
  return [NaN, u8];
});
export class CborEncoding<T extends RegistryItem>
  implements IEncodingMethod<T, Uint8Array>
{
  private _name: EncodingMethodName = EncodingMethodName.cbor;
  public registry: URRegistry = globalUrRegistry;

  /** Decoding options for CBOR2 library */
  cborLibEncoderOptions: EncodeOptions;
  cborLibDecoderOptions: DecodeOptions;

  constructor(options?: inputOptions) {
    this.cborLibEncoderOptions = options?.cborLibEncoderOptions;
    this.cborLibDecoderOptions = options?.cborLibDecoderOptions;
  }

  get name(): EncodingMethodName {
    return this._name;
  }

  /**
   * Encode the given payload to CBOR
   *
   * @param payload @type RegistryItem
   * @param cborLibOptions @type EncodeOptions
   * @returns @type Uint8Array
   */
  encode(payload: any, cborLibOptions?: EncodeOptions & {ignoreTopLevelTag?: boolean}): Uint8Array {
    // Combine instance cborLibOptions with the given cborLibOptions
    const combinedOptions = {
      ...this.cborLibEncoderOptions,
      ...cborLibOptions,
    };

    // By default encode return Uint8Array
    const encoded = encode(payload, combinedOptions);
    return encoded;
  }

  /**
   * Decode the CBOR encoded payload to the given type
   * @param payload @type Uint8Array
   * @param enforceType Forces decoding into given type or throws error if it cannot be decoded @type RegistryItemClass
   * @param cborLibOptions @type DecodeOptions
   * @returns @type T
   */
  decode(
    payload: Uint8Array,
    options?: decodeOptions,
  ): T {
    // Combine instance cborLibOptions with the given cborLibOptions
    const { cborLibOptions, enforceType } = options || {};
    const combinedOptions = {
      ...this.cborLibDecoderOptions,
      ...cborLibOptions,
    };

    const decoded = decode(payload, combinedOptions);

    // Check if enforce type is given, if so then give the value to the enforced type
    // Unless it is already given type
    if (enforceType && !(decoded instanceof enforceType)) {
      // If we already have a tagged instance
      // then we need to check if the tag matches the enforced type
      if (decoded instanceof Tag) {
        if (decoded.tag !== enforceType.tag) {
          throw new Error(
            `Enforced type does not match the tag of ${enforceType.URType}:${enforceType.tag} !== ${decoded.tag}`
          );
        }
        // Try to create the instance of the enforced type from tag contents
        return enforceType.fromCBORData(
          decoded.contents,
          enforceType.allowKeysNotInMap
        ) as unknown as T;
      }
      // Try to create the instance of the enforced type from decoded data
      return enforceType.fromCBORData(
        decoded,
        enforceType.allowKeysNotInMap
      ) as unknown as T;
    }

    // If we still have a cbor tag but not resgistry item
    if (decoded instanceof Tag) {
      return tag2registryItem(decoded) as unknown as T;
    }


    // TODO: fix as unknown as T;
    return decoded as unknown as T;
  }
}

/**
 * Converts a CBOR tag to a registry item
 * @param unkownTag 
 * @returns 
 */
function tag2registryItem(unkownTag: Tag): RegistryItem {
  const tag = unkownTag.tag;
  const data = unkownTag.contents;

  const registryItem = globalUrRegistry.queryByTag(tag);
  if (registryItem) {
    return registryItem.fromCBORData(
      data,
      registryItem.allowKeysNotInMap
    );
  } 

  // If we dont have the tag in the registry return unknown item
  const UnknownTag = class extends registryItemFactory({
    tag: tag,
    URType: "unknown-tag",
    CDDL: ``,
  }) {};

  const unknownItem = new UnknownTag(data);

  // Search through all the children in unknownItem.data if any one of them are tags
  deepSearchObject(unknownItem.data);

  return unknownItem;
}

/**
 * Search through the object and convert tags to registry items
 * @param obj 
 * @returns 
 */
function deepSearchObject(obj: any) {
  if (typeof obj !== "object") {
    return obj;
  }

  for (const key in obj) {
    if (obj[key] instanceof Tag) {
      obj[key] = tag2registryItem(obj[key]);
    } else if (typeof obj[key] === "object") {
      deepSearchObject(obj[key]);
    }
  }
}
