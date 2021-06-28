import FountainDecoder from './fountainDecoder';
import bytewords from './bytewords';
import assert from 'assert';
import { isURType, toUint32 } from './utils';
import { InvalidSchemeError, InvalidPathLengthError, InvalidTypeError, InvalidSequenceComponentError } from './errors';
import UR from './ur';
import { FountainEncoderPart } from './fountainEncoder';

export default class URDecoder {
  private expected_type: string;
  private result: UR | undefined;
  private error: Error | undefined;

  constructor(
    private fountainDecoder: FountainDecoder = new FountainDecoder(),
    public type: string = 'bytes'
  ) {
    assert(isURType(type), 'Invalid UR type');

    this.expected_type = '';
  }

  private static decodeBody(type: string, message: string): UR {
    const cbor = bytewords.decode(message, bytewords.STYLES.MINIMAL);

    return new UR(Buffer.from(cbor, 'hex'), type);
  }

  private validatePart(type: string): boolean {
    if (this.expected_type) {
      return this.expected_type === type;
    }

    if (!isURType(type)) {
      return false;
    }

    this.expected_type = type;

    return true;
  }

  public static decode(message: string): UR {
    const [type, components] = this.parse(message);

    if (components.length === 0) {
      throw new InvalidPathLengthError();
    }

    const body = components[0];

    return URDecoder.decodeBody(type, body);
  }

  public static parse(message: string): [string, string[]] {
    const lowercase = message.toLowerCase();
    const prefix = lowercase.slice(0, 3);

    if (prefix !== 'ur:') {
      throw new InvalidSchemeError();
    }

    const components = lowercase.slice(3).split('/')
    const type = components[0];

    if (components.length < 2) {
      throw new InvalidPathLengthError();
    }

    if (!isURType(type)) {
      throw new InvalidTypeError();
    }

    return [type, components.slice(1)]
  }

  public static parseSequenceComponent(s: string) {
    const components = s.split('-');

    if (components.length !== 2) {
      throw new InvalidSequenceComponentError();
    }

    const seqNum = toUint32(Number(components[0]));
    const seqLength = Number(components[1]);

    if (seqNum < 1 || seqLength < 1) {
      throw new InvalidSequenceComponentError();
    }

    return [seqNum, seqLength];
  }

  public receivePart(s: string): boolean {
    if (this.result !== undefined) {
      return false;
    }

    const [type, components] = URDecoder.parse(s)

    if (!this.validatePart(type)) {
      return false;
    }

    // If this is a single-part UR then we're done
    if (components.length === 1) {
      this.result = URDecoder.decodeBody(type, components[0])

      return true;
    }

    if (components.length !== 2) {
      throw new InvalidPathLengthError();
    }

    const [seq, fragment] = components;
    const [seqNum, seqLength] = URDecoder.parseSequenceComponent(seq);
    const cbor = bytewords.decode(fragment, bytewords.STYLES.MINIMAL);
    const part = FountainEncoderPart.fromCBOR(cbor);

    if (seqNum !== part.seqNum || seqLength !== part.seqLength) {
      return false;
    }

    if (!this.fountainDecoder.receivePart(part)) {
      return false;
    }

    if (this.fountainDecoder.isSuccess()) {
      this.result = new UR(this.fountainDecoder.resultMessage(), type);
    }
    else if (this.fountainDecoder.isFailure()) {
      this.error = new InvalidSchemeError();
    }

    return true;
  }

  public resultUR(): UR {
    return this.result ? this.result : new UR(Buffer.from([]));
  }

  public isComplete(): boolean {
    return this.result && this.result.cbor.length > 0;
  }

  public isSuccess(): boolean {
    return !this.error && this.isComplete();
  }

  public isError(): boolean {
    return this.error !== undefined;
  }

  public resultError() {
    return this.error ? this.error.message : '';
  }

  public expectedPartCount() {
    return this.fountainDecoder.expectedPartCount();
  }

  public expectedPartIndexes() {
    return this.fountainDecoder.getExpectedPartIndexes();
  }

  public receivedPartIndexes() {
    return this.fountainDecoder.getReceivedPartIndexes();
  }

  public lastPartIndexes() {
    return this.fountainDecoder.getLastPartIndexes();
  }

  public estimatedPercentComplete() {
    return this.fountainDecoder.estimatedPercentComplete();
  }

  public getProgress() {
    return this.fountainDecoder.getProgress();
  }
}