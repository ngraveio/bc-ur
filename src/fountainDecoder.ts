import { arrayContains, arraysEqual, bufferXOR, getCRC, setDifference, split } from "./utils";
import { chooseFragments } from "./fountainUtils";
import { FountainEncoderPart } from "./fountainEncoder";
import { InvalidChecksumError } from "./errors";

export class FountainDecoderPart {
  constructor(
    private _indexes: number[],
    private _fragment: Buffer
  ) { }

  get indexes() { return this._indexes; }
  get fragment() { return this._fragment; }

  public static fromEncoderPart(encoderPart: FountainEncoderPart) {
    const indexes = chooseFragments(encoderPart.seqNum, encoderPart.seqLength, encoderPart.checksum);
    const fragment = encoderPart.fragment;

    return new FountainDecoderPart(indexes, fragment);
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

export default class FountainDecoder {
  private error: Error | undefined;
  private result: Buffer | undefined = undefined;
  private expectedMessageLength: number = 0;
  private expectedChecksum: number = 0;
  private expectedFragmentLength: number = 0;
  private processedPartsCount: number = 0;
  private expectedPartIndexes: PartIndexes = [];
  private lastPartIndexes: PartIndexes = [];
  private queuedParts: FountainDecoderPart[] = [];
  private receivedPartIndexes: PartIndexes = [];
  private mixedParts: PartDict[] = [];
  private simpleParts: PartDict[] = [];


  private validatePart(part: FountainEncoderPart) {
    // If this is the first part we've seen
    if (this.expectedPartIndexes.length === 0) {
      // Record the things that all the other parts we see will have to match to be valid.
      [...new Array(part.seqLength)]
        .forEach((_, index) => this.expectedPartIndexes.push(index));

      this.expectedMessageLength = part.messageLength;
      this.expectedChecksum = part.checksum;
      this.expectedFragmentLength = part.fragment.length;
    }
    else {
      // If this part's values don't match the first part's values, throw away the part
      if (this.expectedPartIndexes.length !== part.seqLength) {
        return false;
      }
      if (this.expectedMessageLength !== part.messageLength) {
        return false;
      }
      if (this.expectedChecksum !== part.checksum) {
        return false;
      }
      if (this.expectedFragmentLength !== part.fragment.length) {
        return false;
      }
    }

    // This part should be processed
    return true;
  }

  private reducePartByPart(a: FountainDecoderPart, b: FountainDecoderPart): FountainDecoderPart {
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

  private reduceMixedBy(part: FountainDecoderPart): void {
    const newMixed: PartDict[] = [];

    this.mixedParts
      .map(({ value: mixedPart }) => this.reducePartByPart(mixedPart, part))
      .forEach(reducedPart => {
        if (reducedPart.isSimple()) {
          this.queuedParts.push(reducedPart)
        } else {
          newMixed.push({ key: reducedPart.indexes, value: reducedPart })
        }
      })

    this.mixedParts = newMixed;
  }

  private processSimplePart(part: FountainDecoderPart): void {
    // Don't process duplicate parts
    const fragmentIndex = part.indexes[0]

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
        .sort((a, b) => (a.indexes[0] - b.indexes[0]))
      const message = FountainDecoder.joinFragments(sortedParts.map(part => part.fragment), this.expectedMessageLength)
      const checksum = getCRC(message);

      if (checksum === this.expectedChecksum) {
        this.result = message;
      } else {
        this.error = new InvalidChecksumError();
      }
    }
    else {
      this.reduceMixedBy(part);
    }
  }

  private processMixedPart(part: FountainDecoderPart): void {
    // Don't process duplicate parts
    if (this.mixedParts.some(({ key: indexes }) => arraysEqual(indexes, part.indexes))) {
      return;
    }

    // Reduce this part by all the others
    let p2 = this.simpleParts.reduce((acc, { value: p }) => this.reducePartByPart(acc, p), part)
    p2 = this.mixedParts.reduce((acc, { value: p }) => this.reducePartByPart(acc, p), p2)

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

  public static joinFragments = (fragments: Buffer[], messageLength: number) => {
    return Buffer.concat(fragments).slice(0, messageLength)
  }

  public receivePart(encoderPart: FountainEncoderPart): boolean {
    if (this.isComplete()) {
      return false;
    }

    if (!this.validatePart(encoderPart)) {
      return false;
    }

    const decoderPart = FountainDecoderPart.fromEncoderPart(encoderPart);

    this.lastPartIndexes = decoderPart.indexes;
    this.queuedParts.push(decoderPart);

    while (!this.isComplete() && this.queuedParts.length > 0) {
      this.processQueuedItem();
    };

    this.processedPartsCount += 1;

    return true;
  }

  public isComplete() {
    return Boolean(this.result !== undefined && this.result.length > 0);
  }

  public isSuccess() {
    return Boolean(this.error === undefined && this.isComplete());
  }

  public resultMessage(): Buffer {
    return this.isSuccess() ? this.result! : Buffer.from([]);
  }

  public isFailure() {
    return this.error !== undefined;
  }

  public resultError() {
    return this.error ? this.error.message : '';
  }

  public expectedPartCount(): number {
    return this.expectedPartIndexes.length;
  }

  public getExpectedPartIndexes(): PartIndexes {
    return [...this.expectedPartIndexes]
  }

  public getReceivedPartIndexes(): PartIndexes {
    return [...this.receivedPartIndexes]
  }

  public getLastPartIndexes(): PartIndexes {
    return [...this.lastPartIndexes]
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
    return Math.min(0.99, this.processedPartsCount / (expectedPartCount * 1.75));
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

