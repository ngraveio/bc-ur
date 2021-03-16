import { InvalidTypeError } from "./errors";
import { isURType } from "./utils";
import { cborEncode, cborDecode } from './cbor';

export default class UR {
  constructor(
    private _cborPayload: Buffer,
    private _type: string = 'bytes'
  ) {
    if (!isURType(this._type)) {
      throw new InvalidTypeError();
    }
  }

  public static fromBuffer(buf: Buffer) {
    return new UR(cborEncode(buf));
  }

  public static from(value: any, encoding?: BufferEncoding) {
    return UR.fromBuffer(Buffer.from(value, encoding));
  }

  public decodeCBOR(): Buffer {
    return cborDecode(this._cborPayload);
  }

  get type() { return this._type; }
  get cbor() { return this._cborPayload; }

  public equals(ur2: UR) {
    return this.type === ur2.type && this.cbor.equals(ur2.cbor);
  }
}