import { hexToUint8Array, uint8ArrayToHex } from "../wrappers/uint8array.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";

export class HexEncoding implements IEncodingMethod<Uint8Array, string> {
  private _name: EncodingMethodName = EncodingMethodName.hex;

  get name(): EncodingMethodName {
    return this._name;
  }

  encode(payload: Uint8Array): string {
    // return payload.toString("hex");
    return uint8ArrayToHex(payload);
  }
  decode(payload: string): Uint8Array {
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(payload)) {
      throw new Error("Invalid hex string");
    }
    return hexToUint8Array(payload);
  }
}
