import { InvalidChecksumError, InvalidSchemeError } from "../errors.js";
import { chooseFragments } from "../fountainUtils.js";
import {
  arrayContains,
  arraysEqual,
  bufferXOR,
  getCRC,
  setDifference,
} from "../utils.js";
import { MultipartUr } from "./MultipartUr.js";
import { MultipartPayload, UrMultipartDecoder } from "./UrMultipartDecoder.js";
import { Ur } from "./Ur.js";
import { RegistryItem } from "./RegistryItem.js";
import { CborEncoding } from "../encodingMethods/CborEncoding.js";
import { BytewordEncoding } from "../encodingMethods/BytewordEncoding.js";
import { HexEncoding } from "../encodingMethods/HexEncoding.js";

class FountainDecoderPart {
  constructor(private _indexes: number[], private _fragment: Buffer) {}

  get indexes() {
    return this._indexes;
  }
  get fragment() {
    return this._fragment;
  }

  public isSimple() {
    return this.indexes.length === 1;
  }
}

type PartIndexes = number[];
interface PartDict {
  key: PartIndexes;
  value: FountainDecoderPart;
}

export default class UrFountainDecoder extends UrMultipartDecoder {
  // Stores an error while decoding message
  private error: Error | undefined;
  // Stores the assembled raw result as a Buffer
  private resultAssembledRaw: Buffer | undefined = undefined;
  // Stores the decoded result as a RegistryItem
  private resultDecoded: RegistryItem | undefined = undefined;
  // Stores the expected type of the UR
  private expectedType: string;

  // Stores the expected length of the message
  private expectedMessageLength: number = 0;
  // Stores the expected checksum of the message
  private expectedChecksum: number = 0;
  // Stores the expected length of each fragment
  private expectedFragmentLength: number = 0;
  // Keeps track of the amount of times 'receivepart()' has been called.
  private processedPartsCount: number = 0;
  // Stores the expected indexes of the parts
  private expectedPartIndexes: PartIndexes = [];
  // Stores the indexes of the last part received
  private lastPartIndexes: PartIndexes = [];
  // Queue of parts to be processed
  private queuedParts: FountainDecoderPart[] = [];
  // Stores the indexes of the parts that have been received
  private receivedPartIndexes: PartIndexes = [];
  // Stores the mixed parts
  private mixedParts: PartDict[] = [];
  // Stores the simple parts
  private simpleParts: PartDict[] = [];

  /**
   * Set the expected values on the initial run the current decoder.
   * And check if the next multipart ur is a 'member' of the originally scanned ur with the current decoder.
   * @param decodedPart received multipart ur
   * @returns boolean indicating if the multipart ur is a 'member' of the originally scanned ur with the current decoder.
   */
  private validatePart(decodedPart: MultipartPayload): boolean {
    // If this is the first part we've seen
    if (this.expectedPartIndexes.length === 0) {
      // Record the things that all the other parts we see will have to match to be valid.
      [...new Array(decodedPart.seqLength)].forEach((_, index) =>
        this.expectedPartIndexes.push(index)
      );

      this.expectedMessageLength = decodedPart.messageLength;
      this.expectedChecksum = decodedPart.checksum;
      this.expectedFragmentLength = decodedPart.fragment.length;
    } else {
      // If this part's values don't match the first part's values, throw away the part
      if (this.expectedPartIndexes.length !== decodedPart.seqLength) {
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
    }

    // This part should be processed
    return true;
  }

  /**
   * Create a new decoderpart merging previously mixed parts with the newly received part
   * or return existing mixedpart.
   * @param a existing mixedpart
   * @param b newly received mixedpart
   * @returns
   */
  private reducePartByPart(
    a: FountainDecoderPart,
    b: FountainDecoderPart
  ): FountainDecoderPart {
    // If the fragments mixed into `b` are a strict (proper) subset of those in `a`...
    if (arrayContains(a.indexes, b.indexes)) {
      const newIndexes = setDifference(a.indexes, b.indexes);
      const newFragment = bufferXOR(a.fragment, b.fragment);

      return new FountainDecoderPart(newIndexes, newFragment);
    } else {
      // `a` is not reducable by `b`, so return a
      return a;
    }
  }

  /**
   * Try to get simple parts from mixed parts
   * @param part
   */
  private reduceMixedBy(part: FountainDecoderPart): void {
    const newMixed: PartDict[] = [];

    this.mixedParts
      .map(({ value: mixedPart }) => this.reducePartByPart(mixedPart, part))
      .forEach((reducedPart) => {
        if (reducedPart.isSimple()) {
          this.queuedParts.push(reducedPart);
        } else {
          newMixed.push({ key: reducedPart.indexes, value: reducedPart });
        }
      });

    this.mixedParts = newMixed;
  }

  /**
   * Process a "pure" fragment. These are not several fragments mixed together.
   * @param part object with the indexes and the fragment payload buffer.
   * @returns
   */
  private processSimplePart(part: FountainDecoderPart): void {
    // Don't process duplicate parts
    const fragmentIndex = part.indexes[0];

    if (this.receivedPartIndexes.includes(fragmentIndex)) {
      return;
    }

    this.simpleParts.push({ key: part.indexes, value: part });
    this.receivedPartIndexes.push(fragmentIndex);

    // If we've received all the parts
    if (arraysEqual(this.receivedPartIndexes, this.expectedPartIndexes)) {
      // Reassemble the message from its fragments
      const sortedParts = this.simpleParts
        .map(({ value }) => value)
        .sort((a, b) => a.indexes[0] - b.indexes[0]);
      const message = this.joinFragments(
        sortedParts.map((part) => part.fragment),
        this.expectedMessageLength
      );
      const checksum = getCRC(message);

      if (checksum === this.expectedChecksum) {
        this.resultAssembledRaw = message;
      } else {
        this.error = new InvalidChecksumError();
      }
    } else {
      this.reduceMixedBy(part);
    }
  }

  /**
   * Process the mixed parts
   * @param part
   * @returns
   */
  private processMixedPart(part: FountainDecoderPart): void {
    // Don't process duplicate parts
    if (
      this.mixedParts.some(({ key: indexes }) =>
        arraysEqual(indexes, part.indexes)
      )
    ) {
      return;
    }

    // Reduce this part by all the others
    let p2 = this.simpleParts.reduce(
      (acc, { value: p }) => this.reducePartByPart(acc, p),
      part
    );
    p2 = this.mixedParts.reduce(
      (acc, { value: p }) => this.reducePartByPart(acc, p),
      p2
    );

    // If the part is now simple
    if (p2.isSimple()) {
      // Add it to the queue
      this.queuedParts.push(p2);
    } else {
      this.reduceMixedBy(p2);

      this.mixedParts.push({ key: p2.indexes, value: p2 });
    }
  }

  private processQueuedItem(): void {
    if (this.queuedParts.length === 0) {
      return;
    }

    const part = this.queuedParts.shift()!;

    if (part.isSimple()) {
      this.processSimplePart(part);
    } else {
      this.processMixedPart(part);
    }
  }

  /**
   * validates the type of the UR part
   * @param type type of the UR part (e.g. "bytes")
   * @returns true if the type is valid and matches the expected type
   */
  private validateUrType(type: string): boolean {
    if (this.expectedType) {
      return this.expectedType === type;
    }

    if (!Ur.isURType(type)) {
      return false;
    }

    this.expectedType = type;

    return true;
  }

  receivePart(s: string): boolean {
    // If we already have a result, we're done
    if (this.resultDecoded !== undefined) {
      return false;
    }

    // e.g bytes ["6-23", "lpamchcfatttcyclehgsdphdhgehfghkkkdl..."]
    const { type, payload: bytewords, seqLength } = MultipartUr.parseUr(s);

    if (!this.validateUrType(type)) {
      return false;
    }

    // If this is a single-part UR then we're done
    if (!seqLength) {
      // For a single-part UR, the raw result is the same as the decoded result when calling this.decode, as it does not need reassembly.
      // We do the decoding steps manually to get the buffer and the decoded result.
      const hex = new BytewordEncoding().decode(bytewords);
      const buffer = new HexEncoding().decode(hex);
      this.resultAssembledRaw = buffer;
      this.resultDecoded = new CborEncoding().decode(buffer);
      return true;
    }

    const multipartUr = this.decodeMultipartUr(s);
    const validatedPayload = this.validateMultipartPayload(multipartUr.payload);

    if (
      multipartUr.seqNum !== validatedPayload.seqNum ||
      multipartUr.seqLength !== validatedPayload.seqLength
    ) {
      return false;
    }

    if (!this.receiveFountainPart(validatedPayload)) {
      return false;
    }

    if (this.isSuccess()) {
      const decodedMessage = new CborEncoding().decode(this.resultAssembledRaw);
      this.resultDecoded = decodedMessage;
    }

    return true;
  }

  public receiveFountainPart(encoderPart: MultipartPayload): boolean {
    if (this.isComplete()) {
      return false;
    }

    if (!this.validatePart(encoderPart)) {
      return false;
    }

    const indexes = chooseFragments(
      encoderPart.seqNum,
      encoderPart.seqLength,
      encoderPart.checksum
    );
    const fragment = encoderPart.fragment;

    const decoderPart = new FountainDecoderPart(indexes, fragment);

    this.lastPartIndexes = decoderPart.indexes;
    this.queuedParts.push(decoderPart);

    while (!this.isComplete() && this.queuedParts.length > 0) {
      this.processQueuedItem();
    }

    this.processedPartsCount += 1;

    return true;
  }

  private isComplete() {
    return Boolean(
      this.resultAssembledRaw !== undefined &&
        this.resultAssembledRaw.length > 0
    );
  }

  public isUrDecoderComplete(): boolean {
    if (this.resultDecoded) {
      return true;
    }
    return false;
  }

  public getResultRegistryItem(): RegistryItem {
    return this.resultDecoded;
  }

  public getRawResult(): Buffer {
    return this.resultAssembledRaw;
  }

  public isUrDecoderCompleteOrHasError(): boolean {
    return this.isUrDecoderComplete() || this.isFailure();
  }

  public isSuccess() {
    return Boolean(this.error === undefined && this.isComplete());
  }

  public isUrDecoderSuccess(): boolean {
    return !this.error && this.isUrDecoderComplete();
  }

  public isFailure() {
    return this.error !== undefined;
  }

  public resultError() {
    return this.error ? this.error.message : "";
  }

  public expectedPartCount(): number {
    return this.expectedPartIndexes.length;
  }

  public getExpectedPartIndexes(): PartIndexes {
    return [...this.expectedPartIndexes];
  }

  public getReceivedPartIndexes(): PartIndexes {
    return [...this.receivedPartIndexes];
  }

  public getLastPartIndexes(): PartIndexes {
    return [...this.lastPartIndexes];
  }

  public estimatedPercentComplete(): number {
    if (this.isComplete()) {
      return 1;
    }

    const expectedPartCount = this.expectedPartCount();

    if (expectedPartCount === 0) {
      return 0;
    }

    // We multiply the expectedPartCount by `1.75` as a way to compensate for the facet
    // that `this.processedPartsCount` also tracks the duplicate parts that have been
    // processeed.
    return Math.min(
      0.99,
      this.processedPartsCount / (expectedPartCount * 1.75)
    );
  }

  public getProgress(): number {
    if (this.isComplete()) {
      return 1;
    }

    const expectedPartCount = this.expectedPartCount();

    if (expectedPartCount === 0) {
      return 0;
    }

    return this.receivedPartIndexes.length / expectedPartCount;
  }
}
