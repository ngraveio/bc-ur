import { RegistryItem, RegistryItemBase } from "../classes/RegistryItem.js";
import { Ur } from "./Ur.js";
import { FountainEncoder } from "./FountainEncoder.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";


/**
 * Encode data on the fly. This encoder uses an internal state to keep generating ur fragments of the payload.
 */
export class UrFountainEncoder extends FountainEncoder {
  /** Ur type of the input data */
  private _type: string;
  /** Original Input data as UR */
  private _inputUr: Ur;

  constructor(
    input: RegistryItem | Ur,
    maxFragmentLength: number = 100,
    minFragmentLength: number = 10,
    firstSeqNum: number = 0
  ) {

    // If the input is a RegistryItem, convert it to a Ur
    if (input instanceof RegistryItemBase) {
      input = Ur.fromRegistryItem(input);
    }
    
    // Input in CBOR
    let inputCBOR = input.getPayloadCbor();

    super(inputCBOR, maxFragmentLength, minFragmentLength, firstSeqNum);

    this._inputUr = input;
    this._type = input.type;
  }


  /**
   * Return all the fragments based on the fountain ratio at once as an array of Uint8Arrays.
   * @param fountainRatio The ratio of the fountain fragments to the pure fragments. Default is 0.
   * @returns 
   */
  getAllPartsUr(fountainRatio: number = 0): Ur[] {
    const allParts = super.getAllParts(fountainRatio);
    return allParts.map((part, index) => this.fragment2Ur(index, part));
  }

  /**
   * Give the 'next' fragment for the ur for which the fountainEncoder was created.
   * @returns the 'next' fragment, represented as a Ur multipart string.
   */
  public nextPartUr(): Ur {
    const encodedFragment = super.nextPart();
    return this.fragment2Ur(this._seqNum, encodedFragment);
  }

  private fragment2Ur(seqNum:number, fragment:Uint8Array) {
    // Fragment is already encoded in CBOR
    // Just convert it to bytewords instead of encoding it again
    const payload = Ur.pipeline.encode(fragment, {from: EncodingMethodName.hex});
    if (this.isSinglePart()) {
      return new Ur({
        type: this._type,
        payload: payload,
      });
    }
    return new Ur({
      type: this._type,
      payload: payload,
      seqNum: seqNum,
      seqLength: this._pureFragments.length,
      isFragment: true,
    })    
  }  
}