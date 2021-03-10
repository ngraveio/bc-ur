import assert from "assert";
import { bufferXOR, getCRC, split, toUint32 } from "./utils";
import { chooseFragments } from "./fountainUtils";
import { cborEncode, cborDecode } from './cbor';

export class FountainEncoderPart {
  constructor(
    private _seqNum: number,
    private _seqLength: number,
    private _messageLength: number,
    private _checksum: number,
    private _fragment: Buffer,
  ) { }

  get messageLength() { return this._messageLength; }
  get fragment() { return this._fragment; }
  get seqNum() { return this._seqNum; }
  get seqLength() { return this._seqLength; }
  get checksum() { return this._checksum; }

  public cbor(): Buffer {
    const result = cborEncode([
      this._seqNum,
      this._seqLength,
      this._messageLength,
      this._checksum,
      this._fragment
    ])

    return Buffer.from(result);
  }

  public description(): string {
    return `seqNum:${this._seqNum}, seqLen:${this._seqLength}, messageLen:${this._messageLength}, checksum:${this._checksum}, data:${this._fragment.toString('hex')}`
  }

  public static fromCBOR(cborPayload: string | Buffer) {
    const [
      seqNum,
      seqLength,
      messageLength,
      checksum,
      fragment,
    ] = cborDecode(cborPayload);

    assert(typeof seqNum === 'number');
    assert(typeof seqLength === 'number');
    assert(typeof messageLength === 'number');
    assert(typeof checksum === 'number');
    assert(Buffer.isBuffer(fragment) && fragment.length > 0);

    return new FountainEncoderPart(
      seqNum,
      seqLength,
      messageLength,
      checksum,
      Buffer.from(fragment),
    )
  }
}

export default class FountainEncoder {
  private _messageLength: number;
  private _fragments: Buffer[];
  private fragmentLength: number;
  private seqNum: number;
  private checksum: number;

  constructor(
    message: Buffer,
    maxFragmentLength: number = 100,
    firstSeqNum: number = 0,
    minFragmentLength: number = 10
  ) {
    const fragmentLength = FountainEncoder.findNominalFragmentLength(message.length, minFragmentLength, maxFragmentLength);

    this._messageLength = message.length;
    this._fragments = FountainEncoder.partitionMessage(message, fragmentLength);
    this.fragmentLength = fragmentLength;
    this.seqNum = toUint32(firstSeqNum);
    this.checksum = getCRC(message)
  }

  public get fragmentsLength() { return this._fragments.length; }
  public get fragments() { return this._fragments; }
  public get messageLength() { return this._messageLength; }

  public isComplete(): boolean {
    return this.seqNum >= this._fragments.length;
  }

  public isSinglePart(): boolean {
    return this._fragments.length === 1;
  }

  public seqLength(): number {
    return this._fragments.length;
  }

  public mix(indexes: number[]) {
    return indexes.reduce(
      (result, index) => bufferXOR(this._fragments[index], result),
      Buffer.alloc(this.fragmentLength, 0)
    )
  }

  public nextPart(): FountainEncoderPart {
    this.seqNum = toUint32(this.seqNum + 1);

    const indexes = chooseFragments(this.seqNum, this._fragments.length, this.checksum);
    const mixed = this.mix(indexes);

    return new FountainEncoderPart(
      this.seqNum,
      this._fragments.length,
      this._messageLength,
      this.checksum,
      mixed
    )
  }

  public static findNominalFragmentLength(
    messageLength: number,
    minFragmentLength: number,
    maxFragmentLength: number
  ): number {
    assert(messageLength > 0)
    assert(minFragmentLength > 0)
    assert(maxFragmentLength >= minFragmentLength)

    const maxFragmentCount = Math.ceil(messageLength / minFragmentLength);
    let fragmentLength = 0;

    for (let fragmentCount = 1; fragmentCount <= maxFragmentCount; fragmentCount++) {
      fragmentLength = Math.ceil(messageLength / fragmentCount);

      if (fragmentLength <= maxFragmentLength) {
        break;
      }
    }

    return fragmentLength;
  }

  public static partitionMessage(message: Buffer, fragmentLength: number): Buffer[] {
    let remaining = Buffer.from(message);
    let fragment;
    let _fragments: Buffer[] = [];

    while (remaining.length > 0) {
      [fragment, remaining] = split(remaining, -fragmentLength)
      fragment = Buffer
        .alloc(fragmentLength, 0) // initialize with 0's to achieve the padding
        .fill(fragment, 0, fragment.length)
      _fragments.push(fragment)
    }

    return _fragments;
  }
}

