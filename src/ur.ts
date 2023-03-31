import { InvalidTypeError } from "./errors";
import { isURType } from "./utils";
import { cborEncode, cborDecode } from './cbor';

/**
 * The Uniform Resources specification is a method for encoding structured binary data in plain-text strings that are also well-formed URIs. 
 * It's usable with any binary data, but was developed with Bitcoin and other cryptocurrencies in mind.
 * https://github.com/BlockchainCommons/crypto-commons/blob/master/Docs/ur-1-overview.md
 */
export default class UR {
  constructor(
    private _cborPayload: Buffer,
    private _type: string = 'bytes'
  ) {
    if (!isURType(this._type)) {
      throw new InvalidTypeError();
    }
  }

  //FIXME: I HATE this method name. it converts a buffer into cbor and creates a 'UR' object from it.
  public static fromBuffer(buf: Buffer) {
    return new UR(cborEncode(buf));
  }

  public static from(value: any, encoding?: BufferEncoding) {
    return UR.fromBuffer(Buffer.from(value, encoding));
  }

  public decodeCBOR(): Buffer {
    return cborDecode(this._cborPayload);
  }

  /**
   * Gets the registry type of the UR.
   * e.g. bytes, 
   * TODO: add link to bc ur registry
   */
  get type(): string { return this._type; }

  /**
   * Gets the cbor payload as a buffer.
   */
  get cbor(): Buffer { return this._cborPayload; }

  public equals(ur2: UR) {
    return this.type === ur2.type && this.cbor.equals(ur2.cbor);
  }
}