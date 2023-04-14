import { chooseFragments, mix } from "../fountainUtils";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import { toUint32, getCRC } from "../utils";
import { getMultipartUrString } from "./MultipartUr";
import { Ur } from "./Ur";
import { UrEncoder } from "./UrEncoder";

/**
 * Encode data on the fly. This encoder uses an internal state to keep generating ur fragments of the payload.
 */
export default class UrFountainEncoder extends UrEncoder {
  private _messageLength: number;
  private _fragments: Buffer[];
  private _nominalFragmentLength: number;
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
    this._type = ur.type;
    this._seqNum = toUint32(firstSeqNum);

    // We need to encode the message as a Buffer, because we mix them later on
    const cborMessage = super.cborEncode(ur);
    this._messageLength = cborMessage.length;
    this._checksum = getCRC(cborMessage);

    // Check for the nominal length of a fragment.
    const fragmentLength = super.findNominalFragmentLength(
      cborMessage.length,
      minFragmentLength,
      maxFragmentLength
    );

    this._nominalFragmentLength = fragmentLength;

    // Split up the message buffer in an array of buffers, by the nominal length
    this._fragments = super.partitionMessage(cborMessage, fragmentLength);
  }

  /**
   * Checks if all the pure fragments (full payload data) for this ur is generated.
   * @returns boolean indicating if generated fragments have included all the data.
   */
  public isComplete(): boolean {
    return this._seqNum >= this.getPureFragmentCount();
  }

  /**
   * Checks if there is only one fragment generated for the ur.
   * @returns boolean if the ur payload is contained in one fragment.
   */
  public isSinglePart(): boolean {
    return this.getPureFragmentCount() === 1;
  }

  /**
   * Gets the count of the "pure" fragments. These are fragments where the data is not mixed.
   * @returns The count of the "pure" fragments.
   */
  public getPureFragmentCount(): number {
    return this._fragments.length
  }

  /**
   * Give the 'next' fragment for the ur for which the fountainEncoder was created.
   * @returns the 'next' fragment, represented as a Ur multipart string.
   */
  public nextPart(): string {
    this._seqNum = toUint32(this._seqNum + 1);

    const indexes = chooseFragments(
      this._seqNum,
      this._fragments.length,
      this._checksum
    );
    const mixed = mix(indexes, this._fragments,this._nominalFragmentLength);

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
