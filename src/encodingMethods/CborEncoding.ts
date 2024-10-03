import { RegistryItem } from "../classes/RegistryItem";
import { EncodingMethodName } from "../enums/EncodingMethodName";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import cborEncode, { cborDecode } from "./cbor";

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
