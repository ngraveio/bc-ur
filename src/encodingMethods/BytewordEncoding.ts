import { STYLES, decode, encode } from "./bytewords";
import { EncodingMethodName } from "../enums/EncodingMethodName";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";

export class BytewordEncoding implements IEncodingMethod<string, string> {
  private _name: EncodingMethodName = EncodingMethodName.bytewords;

  readonly _style: STYLES;

  get name(): EncodingMethodName {
      return this._name;
  }
  
  constructor(style: STYLES = STYLES.MINIMAL) {
    this._style = style;
  }
  encode(payload: string): string {
    return encode(payload, this._style);
  }
  decode(payload: string): string {
    return decode(payload, this._style);
  }
}
