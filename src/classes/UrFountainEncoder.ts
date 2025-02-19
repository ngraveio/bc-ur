import { RegistryItem, RegistryItemBase } from "../classes/RegistryItem.js";
import { UR } from "./UR.js";
import { FountainEncoder } from "./FountainEncoder.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";

/**
 * UrFountainEncoder encodes data on the fly using an internal state to keep generating UR fragments of the payload.
 * It extends the FountainEncoder class to provide additional functionality specific to UR encoding.
 */
export class UrFountainEncoder extends FountainEncoder {
  /** The UR type of the input data */
  private _type: string;
  /** The original input data as a UR object */
  private _inputUr: UR;
  /** Reset counter to 1 after hitting `fragmentCount * ratio`; if undefined or 0, it goes forever */
  public repeatAfterRatio = 2;

  /**
   * Creates an instance of UrFountainEncoder.
   * @param input - The input data to be encoded, either as a RegistryItem or UR.
   * @param maxFragmentLength - The maximum length of each fragment.
   * @param minFragmentLength - The minimum length of each fragment.
   * @param firstSeqNum - The sequence number to start with.
   * @param repeatAfterRatio - The ratio after which the sequence number resets. Default is 2. If 0 fountain goes forever.
   */
  constructor(
    input: RegistryItem | UR,
    maxFragmentLength: number = 100,
    minFragmentLength: number = 10,
    firstSeqNum: number = 0,
    repeatAfterRatio = 2
  ) {

    // If the input is a RegistryItem, convert it to a Ur
    if (input instanceof RegistryItemBase) {
      input = UR.fromRegistryItem(input);
    }
    
    // Input in CBOR
    let inputCBOR = input.getPayloadCbor();

    super(inputCBOR, maxFragmentLength, minFragmentLength, firstSeqNum);

    this._inputUr = input;
    this._type = input.type;
    this.repeatAfterRatio = repeatAfterRatio;
  }


  /**
   * Return all the fragments based on the fountain ratio at once as an array of Uint8Arrays.
   * @param fountainRatio - The ratio of the fountain fragments to the pure fragments. Default is 0.
   * @returns An array of UR objects representing the fragments.
   */
  getAllPartsUr(fountainRatio: number = 0): UR[] {
    const allParts = super.getAllParts(fountainRatio);
    return allParts.map((part, index) => this.fragment2Ur(index+1, part));
  }

  /**
   * Give the 'next' fragment for the ur for which the fountainEncoder was created.
   * @returns The 'next' fragment, represented as a Ur multipart string.
   */
  public nextPartUr(): UR {
    // Reset the sequence number if we hit the ratio
    if (this.repeatAfterRatio) {
      if (this._seqNum > this._pureFragments.length * this.repeatAfterRatio) {
        this._seqNum = 0;
      }
    }
    const encodedFragment = super.nextPart();
    return this.fragment2Ur(this._seqNum, encodedFragment);
  }

  /**
   * Converts a fragment to a UR object.
   * @param seqNum - The sequence number of the fragment.
   * @param fragment - The fragment data as a Uint8Array.
   * @returns A UR object representing the fragment.
   */
  private fragment2Ur(seqNum:number, fragment:Uint8Array) {
    // Fragment is already encoded in CBOR
    // Just convert it to bytewords instead of encoding it again
    const payload = UR.pipeline.encode(fragment, {from: EncodingMethodName.hex});
    if (this.isSinglePart()) {
      return new UR({
        type: this._type,
        payload: payload,
      });
    }
    return new UR({
      type: this._type,
      payload: payload,
      seqNum: seqNum,
      seqLength: this._pureFragments.length,
      isFragment: true,
    })    
  }  
}