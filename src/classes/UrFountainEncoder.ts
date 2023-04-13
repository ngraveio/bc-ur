import { chooseFragments, mix } from "../fountainUtils";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import { toUint32, getCRC } from "../utils";
import { getMultipartUrString } from "./MultipartUr";
import { Ur } from "./Ur";
import { UrEncoder } from "./UrEncoder";

export default class UrFountainEncoder extends UrEncoder {
  private _messageLength: number;
  private _fragments: Buffer[];
  private _seqNum: number;
  private _checksum: number;
  private _type: string;

  constructor(
    encodingMethods: IEncodingMethod<any, any>[],
    ur: Ur,
    maxFragmentLength: number = 100,
    minFragmentLength: number = 10,
    firstSeqNum: number = 0,
  ) {
    super(encodingMethods);

    const cborMessage = super.cborEncode(ur);

    const fragmentLength = super.findNominalFragmentLength(
      cborMessage.length,
      minFragmentLength,
      maxFragmentLength
    );

    this._messageLength = cborMessage.length;
    this._fragments = super.partitionMessage(cborMessage, fragmentLength);
    this._seqNum = toUint32(firstSeqNum);
    this._checksum = getCRC(cborMessage);
    this._type = ur.type;
  }

  public isComplete(): boolean {
    return this._seqNum >= this._fragments.length;
  }

  public isSinglePart(): boolean {
    return this.getPureFragmentCount() === 1;
  }

  public getPureFragmentCount(): number {
    return this._fragments.length
  }

  public nextPart(): string {
    this._seqNum = toUint32(this._seqNum + 1);

    const indexes = chooseFragments(
      this._seqNum,
      this._fragments.length,
      this._checksum
    );
    const mixed = mix(indexes, this._fragments);

    const encodedFragment = super.encode([
      this._seqNum,
      this._fragments.length,
      this._messageLength,
      this._checksum,
      mixed,
    ]);

    return getMultipartUrString(
      this._type,
      this._seqNum,
      this._fragments.length,
      encodedFragment
    );
  }
}
