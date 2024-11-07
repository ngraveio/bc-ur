import { RegistryItem } from "../classes/RegistryItem.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";
import { cborDecode, cborEncode } from "./cbor.js";

export class CborEncoding<T extends RegistryItem>
  implements IEncodingMethod<T, Buffer>
{
  private _name: EncodingMethodName = EncodingMethodName.cbor;

  get name(): EncodingMethodName {
    return this._name;
  }

  encode(payload: any): Buffer {
    return cborEncode(payload);
  }

  decode(payload: Buffer, options?: any): T {
    return cborDecode(payload, options);
  }
}
