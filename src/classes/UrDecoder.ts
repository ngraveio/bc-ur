import {
  InvalidPathLengthError,
  InvalidSchemeError,
  InvalidSequenceComponentError,
  InvalidTypeError,
} from "../errors";
import { toUint32 } from "../utils";
import { BytewordEncoding } from "./BytewordEncoding";
import { CborEncoding } from "./CborEncoding";
import { Decoder } from "./Decoder";
import { MultipartUr } from "./MultipartUr";
import { HexEncoding } from "./HexEncoding";
import { Ur } from "./Ur";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";

export class UrDecoder extends Decoder<string, any> {
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
  }

  decode(payload: string): any {
    return super.decode(payload);
  }

  decodeCbor(payload: Buffer): any {
    return this._encodingMethods[this._encodingMethods.length - 1].decode(
      payload
    );
  }

  /**
   * Decode single fragment into the original Ur.
   * @param fragment stringified Ur
   * @returns original encoded Ur.
   */
  decodeFragment(fragment: string): Ur {
    const [type, components] = UrDecoder.parseUr(fragment);

    const [bytewords] = components;

    const decoded = this.decode(bytewords);

    return new Ur(decoded, { type, tag: 0 });
  }

  /**
   * Decode multipart fragments into the original Ur.
   * @param fragments array of stringified Ur's, in the correct order.
   * @returns original encoded Ur.
   */
  decodeFragments(fragments: string[]): Ur {
    let type = "";
    const fragmentPayloads = fragments.map((f) => {
      const multipart = this.decodeMultipartUr(f);
      type = multipart.type;
      // fourth part of the array payload is the actual fragment.
      return multipart.payload[4];
    });
    // concat all the buffer payloads to a single buffer
    const cborPayload = Buffer.concat(fragmentPayloads);
    // decode the buffer as a whole.
    const decoded = this.decodeCbor(cborPayload);
    return new Ur(decoded, { type, tag: 0 });
  }

  /**
   * Create a decoded, multipart Ur from an encoded ur string.
   * @param payload
   * @returns
   */
  private decodeMultipartUr(payload: string): MultipartUr {
    const [type, components] = UrDecoder.parseUr(payload);

    const [sequence, bytewords] = components;
    const [seqNum, seqLength] = UrDecoder.parseSequenceComponent(sequence);

    const decoded = this.decode(bytewords);

    return new MultipartUr(decoded, { type, tag: 0 }, seqNum, seqLength);
  }

  /**
   * Parses a UR and performs basic validation
   * @param message e.g. "UR:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL..."
   * @returns `[type, components]` // e.g. `["bytes", ["6-23", "lpamchcfatttcyclehgsdphdhgehfghkkkdl..."]]`
   */
  public static parseUr(message: string): [string, string[]] {
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

    if (!Ur.isURType(type)) {
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
}
