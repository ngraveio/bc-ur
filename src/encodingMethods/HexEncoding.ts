import { EncodingMethodName } from "../enums/EncodingMethodName";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";

export class HexEncoding implements IEncodingMethod<Buffer, string> {

  private _name: EncodingMethodName = EncodingMethodName.hex;

  get name(): EncodingMethodName {
      return this._name;
  }
  
  encode(payload: Buffer): string {
    return payload.toString("hex");
  }
  decode(payload: string): Buffer {
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(payload)) {
        throw new Error("Invalid hex string");
    }
    return Buffer.from(payload, "hex");
  }
}
