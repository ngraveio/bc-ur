import { chooseFragments, mixFragments } from "../fountainUtils";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import { toUint32, getCRC } from "../utils";
import { getMultipartUrString } from "./MultipartUr";
import { UrMultipartEncoder } from "./UrMultipartEncoder";
import { RegistryItem } from "./RegistryItem";
import { CborEncoding } from "../encodingMethods/CborEncoding";

/**
 * Encode data on the fly. This encoder uses an internal state to keep generating ur fragments of the payload.
 */
export default class UrFountainEncoder extends UrMultipartEncoder {
  private _messageLength: number;
  private _maxFragmentLength: number;
  private _minFragmentLength: number;
  private _fragments: Buffer[];
  private _nominalFragmentLength: number;
  private _seqNum: number;
  private _checksum: number;
  private _type: string;

  constructor(
    encodingMethods: IEncodingMethod<any, any>[],
    registryItem: RegistryItem,
    maxFragmentLength: number = 100,
    minFragmentLength: number = 10,
    firstSeqNum: number = 0
  ) {
    super(encodingMethods);
    this._type = registryItem.type;
    this._seqNum = toUint32(firstSeqNum);

    // We need to encode the message as a Buffer, because we mix them later on
    const cborMessage = new CborEncoding().encode(registryItem);

    this._messageLength = cborMessage.length;
    this._checksum = getCRC(cborMessage);

    // Check for the nominal length of a fragment.
    const fragmentLength = super.findNominalFragmentLength(
      cborMessage.length,
      minFragmentLength,
      maxFragmentLength
    );

    this._maxFragmentLength = maxFragmentLength;
    this._minFragmentLength = minFragmentLength;
    this._nominalFragmentLength = fragmentLength;

    // Split up the message buffer in an array of buffers, by the nominal length
    this._fragments = super.partitionMessage(cborMessage, fragmentLength);
  }

  /**
* get an array of encoded fragments, based on the payload length, max and min fragment length.
* @param ur ur that needs to be encoded.
* @param maxFragmentLength maximum length of a fragment
* @param minFragmentLength minimum length of a fragment
// TODO: see what the best way is for the ratio to work.
* @param redundancyRatio ratio of additional generated fragments
* @returns the encoded payload as an array of ur strings
*/
  encodeUr<T extends RegistryItem>(
    registryItem: T,
    redundancyRatio: number = 0
  ): string[] {
    // encode first time to split the original payload up as cbor
    const cborMessage = new CborEncoding().encode(registryItem);
    const messageLength = cborMessage.length;
    const fragmentLength = this.findNominalFragmentLength(
      messageLength,
      this._minFragmentLength,
      this._maxFragmentLength
    );
    const checksum = getCRC(cborMessage);
    const fragments = this.partitionMessage(cborMessage, fragmentLength);
    // ceil to always get an integer
    const numberofParts = Math.ceil(fragments.length * (1 + redundancyRatio));
    const fountainUrs = [...new Array(numberofParts)].map((_, index) => {
      const seqNum = toUint32(index + 1);
      const indexes = chooseFragments(seqNum, fragments.length, checksum);
      const mixed = mixFragments(indexes, fragments, fragmentLength);
      // TODO: do I need to use Buffer.from on the fragment?
      const encodedFragment = super.encode([
        seqNum,
        fragments.length,
        messageLength,
        checksum,
        mixed,
      ]);
      return getMultipartUrString(
        registryItem.type,
        seqNum,
        fragments.length,
        encodedFragment
      );
    });
    return fountainUrs;
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
    return this._fragments.length;
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
    const mixed = mixFragments(
      indexes,
      this._fragments,
      this._nominalFragmentLength
    );

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
