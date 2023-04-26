import { STYLES, decode, encode } from "./bytewords";
import { EncodingMethodName } from "../enums/EncodingMethodName";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";

export class BytewordEncoding implements IEncodingMethod<string, string> {
  name: EncodingMethodName.bytewords;
  readonly _style: STYLES;

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
