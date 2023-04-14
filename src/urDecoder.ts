import FountainDecoder, { IFountainDecoder } from "./fountainDecoder";
import bytewords from "./bytewords";
import assert from "assert";
import { isURType, toUint32 } from "./utils";
import {
  InvalidSchemeError,
  InvalidPathLengthError,
  InvalidTypeError,
  InvalidSequenceComponentError,
} from "./errors";
import UR from "./ur";
import { FountainEncoderPart } from "./fountainEncoder";

export default class URDecoder {
  private expected_type: string;
  private result: UR | undefined;
  private error: Error | undefined;

  constructor(
    private _fountainDecoder: IFountainDecoder = new FountainDecoder(),
    public type: string = "bytes",
  ) {
    assert(isURType(type), "Invalid UR type");

    this.expected_type = "";
  }

  get fountainDecoder(){
    return this._fountainDecoder;
  }

  set fountainDecoder(fountainDecoder){
    this._fountainDecoder = fountainDecoder;
  }

  private decodeBody(type: string, message: string) {
    const cbor = bytewords.decode(message, bytewords.STYLES.MINIMAL);

    return new UR(Buffer.from(cbor, "hex"), type);
  }

  /**
   * validates the type of the UR part
   * @param type type of the UR part (e.g. "bytes")
   * @returns true if the type is valid and matches the expected type
   */
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

  public decode(message: string) {
    const [type, components] = URDecoder.parse(message);

    if (components.length === 0) {
      throw new InvalidPathLengthError();
    }

    const body = components[0];

    return this.decodeBody(type, body);
  }

  /**
   * Parses a UR and performs basic validation
   * @param message e.g. "UR:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL..."
   * @returns `[type, components]` // e.g. `["bytes", ["6-23", "lpamchcfatttcyclehgsdphdhgehfghkkkdl..."]]`
   */
  public static parse(message: string): [string, string[]] {
    const lowercase = message.toLowerCase(); // e.g. "ur:bytes/6-23/lpamchcfatttcyclehgsdphdhgehfghkkkdl..."
    const prefix = lowercase.slice(0, 3);

    if (prefix !== "ur:") {
      throw new InvalidSchemeError();
    }

    const components = lowercase.slice(3).split("/");
    const type = components[0]; //e.g. "bytes"

    if (components.length < 2) {
      throw new InvalidPathLengthError();
    }

    if (!isURType(type)) {
      throw new InvalidTypeError();
    }

    return [type, components.slice(1)];
  }

  /**
   * Parses a sequence component of a UR and performs basic validation
   * @param s e.g. "146-23"
   * @returns `[seqNum, seqLength]` // e.g. `[146, 23]`
   */
  public static parseSequenceComponent(s: string) {
    const components = s.split("-");

    if (components.length !== 2) {
      throw new InvalidSequenceComponentError();
    }

    const seqNum = toUint32(Number(components[0]));
    const seqLength = Number(components[1]);

    // seqNum, seqLength must be greater than 0
    if (seqNum < 1 || seqLength < 1) {
      throw new InvalidSequenceComponentError();
    }

    return [seqNum, seqLength];
  }

  /**
   * Receives a UR part and returns true if the UR part was successfully received
   * @param s e.g. "UR:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL..."
   * @returns true if the UR part was successfully received
   */
  public receivePart(s: string): boolean {

    // If we already have a result, we're done
    if (this.result !== undefined) {
      return false;
    }

    // e.g bytes ["6-23", "lpamchcfatttcyclehgsdphdhgehfghkkkdl..."]
    const [type, components] = URDecoder.parse(s);

    if (!this.validatePart(type)) {
      return false;
    }

    // TODO: "UR:BYTES/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL..."
    // If this is a single-part UR then we're done
    if (components.length === 1) {
      this.result = this.decodeBody(type, components[0]);

      return true;
    }

    if (components.length !== 2) {
      throw new InvalidPathLengthError();
    }

    const [seq, fragment] = components; // e.g. "6-23", "lpamchcfatttcyclehgsdphdhgehfghkkkdl..."
    const [seqNum, seqLength] = URDecoder.parseSequenceComponent(seq); // e.g. [6, 23]
    const cbor = bytewords.decode(fragment, bytewords.STYLES.MINIMAL); // e.g. "8506171907d11a21314c2d5857..."
    const part = FountainEncoderPart.fromCBOR(cbor); // {"_checksum": 556878893, "_fragment": [Object], "_messageLength": 2001, "_seqLength": 23, "_seqNum": 6}

    if (seqNum !== part.seqNum || seqLength !== part.seqLength) {
      return false;
    }

    if (!this.fountainDecoder.receivePart(part)) {
      return false;
    }

    if (this.fountainDecoder.isSuccess()) {
      this.result = new UR(this.fountainDecoder.resultMessage(), type);
    } else if (this.fountainDecoder.isFailure()) {
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
    return this.error ? this.error.message : "";
  }

  public getProgress() {
    return this.fountainDecoder.getProgress();
  }
}

type GetPartialURDecoder<
  T extends IFountainDecoder,
  KefOfFountainDecoder extends keyof IFountainDecoder,
  KefOfURDecoder extends keyof URDecoder
> = KefOfFountainDecoder extends keyof T ? Pick<URDecoder, KefOfURDecoder> : {};

type PartialFountainDecoder<T extends IFountainDecoder> = Omit<
  URDecoder,
  "getProgress"
> &
  GetPartialURDecoder<T, "getProgress", "getProgress">;

// export function urDecoderFactory<T extends IFountainDecoder>(
//   fountainDecoder: T,
//   type: string
// ): PartialFountainDecoder<T> {
//   return new URDecoder(fountainDecoder, type);
// }
