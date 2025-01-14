import { difference, isSubset } from "../utils.js";
import { concatUint8Arrays, isUint8Array } from "../wrappers/uint8array.js";

import { InvalidChecksumError, InvalidSchemeError } from "../errors.js";
import { chooseFragments } from "../fountainUtils.js";
import { arrayContains, arraysEqual, bufferXOR, getCRC, setDifference } from "../utils.js";

import { CborEncoding } from "../encodingMethods/CborEncoding.js";

const cborEncoder = new CborEncoding();

export type MultipartPayload = {
  seqNum: number;
  seqLength: number;
  messageLength: number;
  checksum: number;
  fragment: Uint8Array;
};

class FountainBlock {
  constructor(protected _indexes: number[], protected _fragment: Uint8Array) {}
  /** What blocks is mixed in this block */
  get indexes() {
    return this._indexes;
  }

  /** Data */
  get fragment() {
    return this._fragment;
  }

  public isSimple() {
    return this.indexes.length === 1;
  }

  public isSubsetOf(other: FountainBlock) {
    // Dont use set use array
    // return isSubset(new Set(this.indexes), new Set(other.indexes));
    return arrayContains(other.indexes, this.indexes);
  }

  public isSupersetOf(other: FountainBlock) {
    // return isSubset(new Set(other.indexes), new Set(this.indexes));
    return arrayContains(this.indexes, other.indexes);
  }

  public reduceBy(other: FountainBlock): FountainBlock {
    // Check if the other block is a subset of this block
    if (!this.isSupersetOf(other)) {
      return this;
    }
    // Otherwise reduce the other block from this block
    // const newIndexes = difference(new Set(this.indexes), new Set(other.indexes));
    const newIndexes = setDifference(this.indexes, other.indexes);
    const newFragment = bufferXOR(this.fragment, other.fragment);

    return new FountainBlock([...newIndexes], newFragment);
  }
}


export class FountainDecoder {
  /** Did we received any parts and started decoding */
  public started: boolean = false;
  public done: boolean = false;

  /** Stores the error if decoding fauls */
  protected error: Error | undefined;
  /** Stores the decoded data*/
  protected resultRaw: Uint8Array | undefined = undefined;

  /** Stores the expected length of the final message */
  protected expectedMessageLength: number = 0;
  /** Stores the expected checksum of the final message */
  protected expectedChecksum: number = 0;
  /** Stores the expected message length of each fragment */
  protected expectedFragmentLength: number = 0;
  /** Total number of simple fragments */
  protected expectedPartCount: number = 0;

  /** Mixed Parts that we cannot reduce to simple parts yet */
  protected mixedBlocks: FountainBlock[] = [];
  /** Non-mixed single parts */
  protected simpleBlocks: FountainBlock[] = [];
  /** Queue of parts that may take part in reduction */
  protected queuedBlocks: FountainBlock[] = [];

  // For tracking the progress of decoding we can keep seen indexes and decoded indexes
  public seenBlocks: number[] = [];
  public decodedBlocks: number[] = [];
  /** Keeps track of the how many parts have been processed */
  protected processedPartsCount: number = 0;

  get result(): Uint8Array | Error | undefined {
    return this.resultRaw || this.error;
  }

  isSuccessful(): boolean {
    return this.done && !this.error;
  }

  constructor(parts: Uint8Array[] = []) {
    parts.forEach((part) => this.receivePart(part));
  }

  public reset(): void {
    this.error = undefined;
    this.resultRaw = undefined;
    this.expectedMessageLength = 0;
    this.expectedChecksum = 0;
    this.expectedFragmentLength = 0;

    this.mixedBlocks = [];
    this.simpleBlocks = [];
    this.queuedBlocks = [];

    this.seenBlocks = [];
    this.decodedBlocks = [];
    this.processedPartsCount = 0;
  }

  protected setExpectedValues(decodedPart: MultipartPayload): void {
    this.expectedPartCount = decodedPart.seqLength;
    this.expectedMessageLength = decodedPart.messageLength;
    this.expectedChecksum = decodedPart.checksum;
    this.expectedFragmentLength = decodedPart.fragment.length;

    this.seenBlocks = new Array(this.expectedPartCount).fill(0);
    this.decodedBlocks = new Array(this.expectedPartCount).fill(0);

    // Set started so we know we have expected values
    this.started = true;
    this.done = false;
  }

  /**
   * Set the expected values on the initial run the current decoder.
   * And check if the next multipart ur is a 'member' of the originally scanned ur with the current decoder.
   * @param decodedPart received multipart ur
   * @returns boolean indicating if the multipart ur is a 'member' of the originally scanned ur with the current decoder.
   */
  protected validatePart(decodedPart: MultipartPayload): boolean {
    // If this part's values don't match the first part's values, throw away the part
    if (this.expectedPartCount !== decodedPart.seqLength) {
      // TODO: display proper error message
      return false;
    }
    if (this.expectedMessageLength !== decodedPart.messageLength) {
      return false;
    }
    if (this.expectedChecksum !== decodedPart.checksum) {
      return false;
    }
    if (this.expectedFragmentLength !== decodedPart.fragment.length) {
      return false;
    }

    // This part should be processed
    return true;
  }

  public finalize() {
    if (this.simpleBlocks.length !== this.expectedPartCount) {
      console.warn("Not all parts have been received");
      return;
    }

    // Sort the simple blocks by their index
    const sortedParts = [...this.simpleBlocks].sort((a, b) => a.indexes[0] - b.indexes[0]);

    // Get fragments in order and combine them to message
    const message = joinFragments(
      sortedParts.map((p) => p.fragment),
      this.expectedMessageLength
    );

    // Get the final checksum
    const checksum = getCRC(message);

    if (checksum === this.expectedChecksum) {
      this.resultRaw = message;
    } else {
      this.error = new InvalidChecksumError();
    }

    this.done = true;
  }

  parseInput(input: Uint8Array | MultipartPayload): MultipartPayload {
    // Check the type of input payload
    if (input instanceof Uint8Array) {
      return parseMultipartCbor(input);
    } else if (typeof input === "object") {
      // Check its correct type
      if (!validateMultipartPayload(input)) {
        throw new Error("Invalid multipart payload");
      }
      return input;
    }

    throw new Error("Invalid input type");
  }

  receivePart(encodedPart: Uint8Array | MultipartPayload): boolean {
    // If we already have a result, we're done
    if (this.done) {
      return false;
    }

    let decodedPart: MultipartPayload;
    try {
      decodedPart = this.parseInput(encodedPart);
    } catch (error) {
      // Skip receiving invalid parts
      console.warn("Cannot parse part", error);
      return false;
    }

    try {
      // If this is the first part we've seen then set expected values
      if (!this.started) this.setExpectedValues(decodedPart);

      // Validate part
      if (!this.validatePart(decodedPart)) {
        return false;
      }

      // Now we can start processing the part
      // Find which original data fragments are in this fragment what is mixed in this
      let indexes = chooseFragments(decodedPart.seqNum, decodedPart.seqLength, decodedPart.checksum);
      // order the indexes
      indexes = indexes.sort((a, b) => a - b);
      // Get the data
      const fragment = decodedPart.fragment;

      const block = new FountainBlock(indexes, fragment);

      this.queuedBlocks.push(block);

      this.processQueue();

      this.processedPartsCount += 1;
    } catch (error) {
      // Skip receiving invalid parts
      console.warn("Error receiving part", error);
      return false;
    }

    return true;
  }

  // http://blog.notdot.net/2012/01/Damn-Cool-Algorithms-Fountain-Codes
  protected processQueue(): void {
    // Process the queued blocks until queue is empty or we're done
    while (!this.done && this.queuedBlocks.length > 0) {
      const block = this.queuedBlocks.shift()!;

      // Add indexes to seen indexes
      block.indexes.forEach((index) => {
        this.seenBlocks[index] = 1;
      });

      if (block.isSimple()) {
        this.processSimpleBlock(block);
      } else {
        this.processMixedBlock(block);
      }
    }
  }

  /**
   * Process a "pure" fragment. this is a original fragment that is not mixed with any other fragments.
   * @param block object with the indexes and the fragment payload buffer.
   * @returns
   */
  protected processSimpleBlock(block: FountainBlock): void {
    if (!block.isSimple()) {
      throw new Error("Part is not simple");
    }

    // Don't process duplicate blocks
    // if (this.simpleBlocks.has(block.indexes)) return;
    if (this.simpleBlocks.some((b) => arraysEqual(b.indexes, block.indexes))) return;

    // Add our block to simple blocks
    this.simpleBlocks.push(block);

    // Keep track of the decoded blocks
    this.decodedBlocks[block.indexes[0]] = 1;

    // If we've received all the parts
    if (this.simpleBlocks.length == this.expectedPartCount) {
      this.finalize();
    } else {
      // Otherwise try to reduce the all the mixed parts by this simple part
      this.reduceAllMixedBlocksBy(block);
    }
  }

  /**
   * Process the mixed parts
   * @param newPart
   * @returns
   */
  protected processMixedBlock(newPart: FountainBlock): void {
    // Check if already have this block, if so pass
    // if (this.mixedBlocks.has(newPart.indexes)) {
    //   return;
    // }

    if (this.mixedBlocks.some((b) => arraysEqual(b.indexes, newPart.indexes))) {
      return;
    }

    // Get all simple blocks that we have that makes up this part and reduce current block by whatever we have
    let reducedBlock: FountainBlock = this.simpleBlocks.reduce(
      (proccessed, currentSimple) => proccessed.reduceBy(currentSimple),
      newPart
    );

    // Now check if we have a simple part if so add it to the queue
    if (reducedBlock.isSimple()) {
      this.queuedBlocks.push(reducedBlock);
      return;
    }

    // We still have have a mixed block
    // So we will check if there are any subsets of this block that we can reduce
    // So if we have 1x2x3 try to find subparts (1x2, 2x3, 1x3) that will directly reduce this part to simple part
    // For now we will go though all the parts and try to reduce them so if we have 1x2x3x4 XOR 1x2 we will get 3x4
    reducedBlock = this.mixedBlocks.reduce(
      (proccessed, currentMixed) => proccessed.reduceBy(currentMixed),
      reducedBlock
    );

    // If after all the operations we have a simple part add it to the queue
    if (reducedBlock.isSimple()) {
      this.queuedBlocks.push(reducedBlock);
      return;
    }

    // If we dont have a simple part we will try to reduce all the mixed parts by this part
    this.reduceAllMixedBlocksBy(reducedBlock);

    // Then add our part to the mixed parts
    this.mixedBlocks.push(reducedBlock);
  }

  /**
   * Process all the mixed blocks by the given block
   * If the mixed part can be reduced to a simple part, add it to the queue
   * If a mixed part is reduced to simpler part add it to the mixed
   * @param block
   */
  protected reduceAllMixedBlocksBy(block: FountainBlock): void {
    const newMixed: FountainBlock[] = [];

    // Try to reduce all the mixed parts by this simple part
    this.mixedBlocks
      .map((mixedPart) => mixedPart.reduceBy(block))
      .forEach((reducedPart) => {
        if (reducedPart.isSimple()) {
          // Add to the queue if it is a simple part
          this.queuedBlocks.push(reducedPart);
        } else {
          // Otherwise add it to as a new mixed part
          newMixed.push(reducedPart);
        }
      });

    // Override the mixed parts with new reduces parts
    this.mixedBlocks = newMixed;
  }
  /**
   *
   *
   * The next part it receives is 3: A ⊕ B ⊕ C ⊕ D.
   * Each time a part is received, the decoder checks to see whether the set of fragments it contains
   *  is a proper subset or superset of the set of fragments in any part is has received.
   *  If so, it can reduce the superset part by the subset part. In this case,
   *  it discovers it can reduce the incoming part 3: A ⊕ B ⊕ C ⊕ D by XORing it with part 1: A ⊕ B ⊕ C,
   *  yielding the simple part 3: D.
   */

  /**
   *
   * Try the reduce mixed part A by the part B
   * If B is a subset of A then we can reduce A by B
   * Otherwise return A
   *
   * @param a existing mixedpart
   * @param b newly received mixedpart
   * @returns
   */
  private reducePartByPart_(a: FountainBlock, b: FountainBlock): FountainBlock {
    // If the fragments mixed into `b` are a strict (proper) subset of those in `a`...
    const aSet = new Set(a.indexes);
    const bSet = new Set(b.indexes);

    // If B is a subset of A then we can reduce A by B
    if (isSubset(bSet, aSet)) {
      // A - B => new indexes in the mixed part
      const newIndexes = difference(aSet, bSet);
      const newFragment = bufferXOR(a.fragment, b.fragment);

      return new FountainBlock([...newIndexes], newFragment);
    }
    // If A is a subset of B then we can reduce B by A
    // else if (isSubset(aSet, bSet)) {
    //   // B - A => new indexes in the mixed part
    //   const newIndexes = difference(bSet, aSet);
    //   const newFragment = bufferXOR(b.fragment, a.fragment);

    //   return new FountainEncodedPart([...newIndexes], newFragment);
    // }
    else {
      // If A is not reducable by B then return A
      return a;
    }
  }

  private reducePartByPart(a: FountainBlock, b: FountainBlock): FountainBlock {
    // If the fragments mixed into `b` are a strict (proper) subset of those in `a`...
    if (arrayContains(a.indexes, b.indexes)) {
      const newIndexes = setDifference(a.indexes, b.indexes);
      const newFragment = bufferXOR(a.fragment, b.fragment);

      return new FountainBlock(newIndexes, newFragment);
    } else {
      // `a` is not reducable by `b`, so return a
      return a;
    }
  }

  public estimatedPercentComplete(): number {
    if (this.done) {
      return 1;
    }

    const expectedPartCount = this.expectedPartCount;

    if (expectedPartCount === 0) {
      return 0;
    }

    // We multiply the expectedPartCount by `1.75` as a way to compensate for the facet
    // that `this.processedPartsCount` also tracks the duplicate parts that have been
    // processeed.
    return Math.min(0.99, this.processedPartsCount / (expectedPartCount * 1.75));
  }

  public getProgress(): number {
    if (this.done) {
      return 1;
    }

    const expectedPartCount = this.expectedPartCount;

    if (expectedPartCount === 0) {
      return 0;
    }

    return this.simpleBlocks.length / expectedPartCount;
  }
}

export type IMultipartUrPayload = [number, number, number, number, Uint8Array];

/**
 * Parse CBOR encoded Multipart Payload
 * @param encodeded
 * @returns
 */
export function parseMultipartCbor(encodeded: Uint8Array): MultipartPayload {
  const decoded = cborEncoder.decode(encodeded) as unknown as IMultipartUrPayload;
  return validateDecodedMultipart(decoded);
}

/**
 * Validate and convert the decoded multipart payload to MultipartPayload object
 * @param decoded
 * @returns
 */
export function validateDecodedMultipart(decoded: IMultipartUrPayload): MultipartPayload {
  const [seqNum, seqLength, messageLength, checksum, fragment] = decoded;
  if (!validateMultipartPayload({ seqNum, seqLength, messageLength, checksum, fragment })) {
    throw new Error("Invalid  multipart payload");
  }

  return { seqNum, seqLength, messageLength, checksum, fragment };
}

function validateMultipartPayload(decoded: MultipartPayload): boolean {
  if (
    typeof decoded.seqNum !== "number" ||
    typeof decoded.seqLength !== "number" ||
    typeof decoded.messageLength !== "number" ||
    typeof decoded.checksum !== "number" ||
    !isUint8Array(decoded.fragment) ||
    decoded.fragment.length === 0
  ) {
    return false;
  }

  return true;
}

/**
 * Join the fragments together.
 * @param fragments fragments to join
 * @param messageLength length of the expected message, full if not provided.
 * @returns the concatenated fragments with the expected length.
 */
function joinFragments(fragments: Uint8Array[], messageLength?: number): Uint8Array {
  let result = concatUint8Arrays(fragments);
  if (messageLength) {
    // with 'slice', we remove the additionally created buffer parts, needed to achieve the minimum fragment length.
    result = result.slice(0, messageLength);
  }
  return result;
}
