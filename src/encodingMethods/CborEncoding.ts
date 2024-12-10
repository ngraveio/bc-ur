import { URRegistry, globalUrRegistry } from "../registry.js";
import { RegistryItem, RegistryItemClass } from "../classes/RegistryItem.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";
import { decode, DecodeOptions, encode, EncodeOptions } from "cbor2";
import { registerEncoder } from "cbor2/encoder";
import { Tag } from "cbor2/tag";

interface inputOptions {
  registry?: URRegistry;
  cborLibEncoderOptions?: EncodeOptions;
  cborLibDecoderOptions?: DecodeOptions;
}

registerEncoder(Uint8Array, (b, _writer, _options) => {
  // This is a major type ( MT.BYTE_STRING ) so no tag is given
  return [NaN, b];
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
  encode(payload: any, cborLibOptions?: EncodeOptions): Uint8Array {
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
    enforceType?: RegistryItemClass,
    cborLibOptions?: DecodeOptions
  ): T {
    // Combine instance cborLibOptions with the given cborLibOptions
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
        return enforceType.fromCBORData(decoded.contents) as unknown as T;
      }
      // Try to create the instance of the enforced type from decoded data
      return enforceType.fromCBORData(decoded) as unknown as T;
    }

    // TODO: fix as unknown as T;
    return decoded as unknown as T;
  }
}
