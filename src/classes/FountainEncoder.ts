import { chooseFragments, findNominalFragmentLength, mixFragments, partitionMessage } from "../helpers/fountainUtils.js";
import { toUint32, getCRC } from "../helpers/utils.js";
import { CborEncoding } from "../encodingMethods/CborEncoding.js";

const cborEncoder = new CborEncoding();

/** [seqNum, seqLength, messageLength, checksum, fragment] */
export type IMultipartUrPayload = [number, number, number, number, Uint8Array];

/**
 * Encode data on the fly. This encoder uses an internal state to keep generating ur fragments of the payload.
 */
export class FountainEncoder {
  public fragmentLenghtFinder = findNominalFragmentLength;

  /** Total data size of the input message */
  public _messageLength: number;
  /** Maximum data size in the fragment */
  protected _maxFragmentLength: number;
  /** Minumum data size in the fragment */
  protected _minFragmentLength: number;
  /** Calculated data size in the fragment */
  public _nominalFragmentLength: number;
  /** Array of pure fragments (without any fountain encoded) */
  public _pureFragments: Uint8Array[];
  /** Current index of the fragment start from 1 */
  protected _seqNum: number;
  /** Checksum of the original data */
  protected _checksum: number;
  /** Original Input data as UR */
  protected _input: Uint8Array;

  constructor(
    input: Uint8Array,
    maxFragmentLength: number = 100,
    minFragmentLength: number = 10,
    firstSeqNum: number = 0
  ) {


    // Validate the input
    if (!input) {
      throw new Error("input should be defined");
    }

    if(!(input instanceof Uint8Array)) {
      throw new Error("input should be Uint8Array")
    }

    if (typeof maxFragmentLength !== "number") {
      throw new Error("maxFragmentLength should be a number");
    }

    if (typeof minFragmentLength !== "number") {
      throw new Error("minFragmentLength should be a number");
    }

    if (typeof firstSeqNum !== "number") {
      throw new Error("firstSeqNum should be a number");
    }

    if (maxFragmentLength < 1) {
      throw new Error("maxFragmentLength should be > 0");
    }

    if(maxFragmentLength < minFragmentLength) {
      throw new Error("maxFragmentLength should be >= minFragmentLength");
    } 


    this._input = input;
    this._maxFragmentLength = maxFragmentLength;
    this._minFragmentLength = minFragmentLength;
    this._seqNum = toUint32(firstSeqNum);
    
    // Get the length of the message
    this._messageLength = input.length;

    // Check if message is less than maxFragmentLength, then return the message as a single fragment
    if (input.length <= maxFragmentLength) {
      this._pureFragments = [input];
      this._nominalFragmentLength = this._messageLength;
    }
    // Otherwise calciulate the nominal fragment length and neseccary fragments
    else {
      // Check for the nominal length of a fragment.
      const fragmentLength = this.fragmentLenghtFinder(input.length, maxFragmentLength, minFragmentLength);
      this._nominalFragmentLength = fragmentLength;
      // Calculate the checksum of the message
      this._checksum = getCRC(input);
      // Split up the message buffer in an array of buffers, by the nominal length
      this._pureFragments = partitionMessage(input, fragmentLength);
    }   
  }

  setFragmentLengthFinder(fn: typeof findNominalFragmentLength) {
    this.fragmentLenghtFinder = fn;
  }  

  /**
   * Return all the fragments based on the fountain ratio at once as an array of Uint8Arrays.
   * @param fountainRatio The ratio of the fountain fragments to the pure fragments. Default is 0.
   * @returns 
   */
  getAllParts(fountainRatio: number = 0): Uint8Array[] {
    // First check if the input is a single fragment
    if (this.isSinglePart()) {
      return [this._input];
    }
    // Ceil to always get an integer
    const numberofParts = Math.ceil(this.getPureFragmentCount() * (1 + fountainRatio));
    // Save state
    const oldSeqNum = this._seqNum;
    // Reset state to start generating fragments from the beginning
    this._seqNum = 0;
    // Generate fragments
    let fragments = []
    for (let i = 0; i < numberofParts; i++) {
      fragments.push(this.nextPart());
    }
    // Bring state back
    this._seqNum = oldSeqNum;
    return fragments;
  }

  // Encode fragment with correct CBOR structure
  protected encodeFragment(seqNum:number, fragment:Uint8Array): Uint8Array {
    // Shape for the CBOR payload
    const payload: IMultipartUrPayload = [seqNum, this._pureFragments.length, this._messageLength, this._checksum, fragment];
    const encodedFragment = cborEncoder.encode(payload);

    return encodedFragment;
  }

  /**
   * Reset the state of the encoder to start generating fragments from the beginning.
   */
  public reset() {
    this._seqNum = 0;
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
    return this._pureFragments.length;
  }

  /**
   * Get the pure fragments of the ur.
   * @returns the pure fragments of the ur as an array of Uint8Arrays.
   */
  public getPureFragments(): Uint8Array[] {
    return this._pureFragments;
  }

  /**
   * Give the 'next' fragment for the ur for which the fountainEncoder was created.
   * @returns the 'next' fragment, represented as a Ur multipart string.
   */
  public nextPart(): Uint8Array {
    this._seqNum = toUint32(this._seqNum + 1);
    
    // when the seqnum restarts because of a number bigger than Uint32, we need to make sure to skip 0 to prevent invalid Multipart URs.
    if (this._seqNum === 0) {
      this._seqNum = toUint32(this._seqNum + 1);
    }
    
    // If its single part, return the original input
    if (this.isSinglePart()) {
      return this._input;
    }
    
    // For the first seqNum of the pure fragments, return the pure fragment
    if (!this.isComplete()) {
      return this.encodeFragment(this._seqNum, this._pureFragments[this._seqNum - 1]);
    }

    // For the fountain fragments, mix the fragments
    const indexes = chooseFragments(
      this._seqNum,
      this._pureFragments.length,
      this._checksum
    );
    const mixed = mixFragments(
      indexes,
      this._pureFragments,
      this._nominalFragmentLength
    );

    return this.encodeFragment(this._seqNum, mixed);
  }
}
