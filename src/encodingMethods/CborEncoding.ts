import { Registry, registry as globalRegistry } from "../registry.js";
import { RegistryItem, RegistryItemClass } from "../classes/RegistryItem.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";
import { decode, DecodeOptions, encode, EncodeOptions } from "cbor2";
import { Tag } from "cbor2/tag";


export class CborEncoding<T extends RegistryItem>
  implements IEncodingMethod<T, Buffer>
{
  private _name: EncodingMethodName = EncodingMethodName.cbor;
  static registry: Registry = globalRegistry;

  /** Decoding options for CBOR2 library */
  cborLibEncoderOptions: EncodeOptions;
  cborLibDecoderOptions: DecodeOptions;

  constructor(cborLibEncoderOptions?: EncodeOptions, cborLibDecoderOptions?: DecodeOptions) {
    this.cborLibEncoderOptions = cborLibEncoderOptions;
    this.cborLibDecoderOptions = cborLibDecoderOptions;
  }

  get name(): EncodingMethodName {
    return this._name;
  }

  /**
   * Encode the given payload to CBOR
   * 
   * @param payload @type RegistryItem
   * @param cborLibOptions @type EncodeOptions
   * @returns @type Buffer
   */ 
  encode(payload: any, cborLibOptions?: EncodeOptions): Buffer {
    // Combine instance cborLibOptions with the given cborLibOptions
    const combinedOptions = {
      ...this.cborLibEncoderOptions,
      ...cborLibOptions,
    };

    // By default encode return Uint8Array
    const encoded = encode(payload, combinedOptions);
    // TODO: For web compatibility, we need to convert Buffer to Uint8Array
    return Buffer.from(encoded);
  }

  /**
   * Decode the CBOR encoded payload to the given type
   * @param payload @type Buffer
   * @param enforceType @type RegistryItemClass
   * @param cborLibOptions @type DecodeOptions
   * @returns @type T
   */
  decode(
    payload: Buffer,
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


  // ---- Static methods ----

  /**
   * Add all the items from the registry to CBOR registry
   */
  public static addAlltoRegistry(registry?: Registry) {
    // If registry is given, use that isolated one
    const myRegistry = registry || CborEncoding.registry;

    for (const key in myRegistry) {
      const item = myRegistry[key];
      CborEncoding.addToRegistry(item);
    }
  }

  /**
   * Add single item to CBOR registry
   * @param item @type RegistryItemClass
   */
  public static addToRegistry(item: RegistryItemClass) {
    // Add to global registry
    CborEncoding.registry[item.URType] = item;

    // Add decoder to CBOR2
    Tag.registerDecoder(item.tag, (tag: Tag, opts: DecodeOptions) => {
      return item.fromCBORData.bind(item)(tag.contents, opts);
    });
  }

  /**
   * Remove single item from CBOR registry
   * @param item @type RegistryItemClass
   */
  public static removeFromRegistry(item: RegistryItemClass) {
    // Remove from global registry
    delete CborEncoding.registry[item.URType];
    // Remove decoder from CBOR2
    Tag.clearDecoder(item.tag);
  }
}

// Call first time to update the registry
// TODO: find better approach
CborEncoding.addAlltoRegistry();
