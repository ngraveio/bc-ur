import { Registry, registry } from "../registry.js";
import { RegistryItem, RegistryItemClass } from "../classes/RegistryItem.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";
import { decode, DecodeOptions, encode } from 'cbor2';
import { Tag } from 'cbor2/tag';

export class CborEncoding<T extends RegistryItem>
  implements IEncodingMethod<T, Buffer>
{
  private _name: EncodingMethodName = EncodingMethodName.cbor;
  // Use global registry
  static registry: Registry = registry;

  /** Decoding options for CBOR2 library */
  cborLibDecoderOptions: DecodeOptions;

  constructor(registy?: Registry, cborLibDecoderOptions?: DecodeOptions) {
    this.cborLibDecoderOptions = cborLibDecoderOptions;
  }

  get name(): EncodingMethodName {
    return this._name;
  }

  encode(payload: any): Buffer {
    // By default encode return Uint8Array
    const encoded = encode(payload);
    // TODO: For web compatibility, we need to convert Buffer to Uint8Array
    return Buffer.from(encoded);
  }

  // Return the type of 
  decode(payload: Buffer, enforceType?: RegistryItemClass, cborLibOptions?: DecodeOptions): T {

    // Combine instance cborLibOptions with the given cborLibOptions
    const combinedOptions = { ...this.cborLibDecoderOptions, ...cborLibOptions };

    const decoded = decode(payload, { ...combinedOptions });
  
    // Check if enforce type is given, if so then give the value to the enforced type
    if(enforceType) {
      // If we already have a tagged instance
      // then we need to check if the tag matches the enforced type
      if(decoded instanceof Tag) {
        if(decoded.tag !== enforceType.tag) {
          throw new Error(`Enforced type does not match the tag of ${enforceType.URType}:${enforceType.tag} !== ${decoded.tag}`);
        }
        // Try to create the instance of the enforced type from tag contents
        return enforceType.fromCBORData(decoded.contents) as unknown as T;;
      }
      // Try to create the instance of the enforced type from decoded data
      return enforceType.fromCBORData(decoded) as unknown as T;
    }

    // TODO: fix as unknown as T;
    return decoded as unknown as T;;
  }

  public static updateCborRegistry() {
    for (const key in registry) {
      const item = registry[key];
      Tag.registerDecoder(item.tag, (tag: Tag, opts: DecodeOptions) => {
        return item.fromCBORData.bind(item)(tag.contents);
      });
    };
  }
}


// Call first time to update the registry
// TODO: find better approach
CborEncoding.updateCborRegistry();