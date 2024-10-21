import { EncodingMethodName } from "../enums/EncodingMethodName";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import { cborDecode, cborEncode } from "./cbor";

export class CborEncoding implements IEncodingMethod<any, Buffer> {
  private _name: EncodingMethodName = EncodingMethodName.cbor;

  get name(): EncodingMethodName {
    return this._name;
  }

  encode(payload: any): Buffer {
    return cborEncode(payload);
  }

  decode(payload: Buffer): any {
    return cborDecode(payload);
  }
}
