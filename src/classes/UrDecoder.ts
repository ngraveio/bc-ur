import {
  InvalidPathLengthError,
  InvalidSchemeError,
  InvalidSequenceComponentError,
  InvalidTypeError,
} from "../errors";
import { toUint32 } from "../utils";
import { Decoder } from "./Decoder";
import { MultipartUr } from "./MultipartUr";
import { Ur } from "./Ur";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import assert from "assert";
import { RegistryType } from "../interfaces/RegistryType";

export type MultipartPayload = {
  seqNum: number;
  seqLength: number;
  messageLength: number;
  checksum: number;
  fragment: Buffer;
};

export class UrDecoder extends Decoder<string, any> {
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
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
    const { type, bytewords } = this.parseUr(fragment);

    const decoded = this.decode(bytewords);

    return new Ur(decoded, { type });
  }

  /**
   * Decode multipart fragments into the original Ur.
   * Take into account that in order to use this function, the fragments should be in the correct order.
   * Otherwise you can sort them yourself, or use the fountainDecoder.
   * @param fragments array of stringified Ur's, in the correct order.
   * @returns original encoded Ur.
   */
  decodeFragments(fragments: string[]): Ur {
    let expectedRegistryType = null;
    let expectedPayload: {
      indexes: number[];
      messageLength: number;
      checksum: number;
      fragmentLength: number;
    } = null;

    const fragmentPayloads = fragments.map((fragment) => {
      const multipart = this.decodeMultipartUr(fragment);
      const validatedPayload = this.validateMultipartPayload(multipart.payload);

      // set expected registryType if it does not exist
      if (!expectedRegistryType && Ur.isURType(multipart?.registryType?.type)) {
        expectedRegistryType = multipart.registryType;
      }

      // set expected payload if it does not exist
      if (!expectedPayload) {
        expectedPayload = {
          indexes: new Array(validatedPayload.seqLength)
            .fill(0)
            .map((_, i) => i),
          messageLength: validatedPayload.messageLength,
          checksum: validatedPayload.checksum,
          fragmentLength: validatedPayload.fragment.length,
        };
      }

      // compare expected type with the received the fragment
      if (
        expectedRegistryType &&
        !this.compareRegistryType(expectedRegistryType, multipart.registryType)
      ) {
        console.warn("Did not expect this ur type");
        // return default value.
        return Buffer.from([]);
      }

      // compare expected payload with the received fragment
      if (
        expectedPayload &&
        !this.compareMultipartUrPayload(expectedPayload, validatedPayload)
      ) {
        console.warn("Did not expect this payload");
        // return default value.
        return Buffer.from([]);
      }
      // fourth part of the array payload is the actual fragment.
      // TODO: pass in a type of the payload
      return validatedPayload.fragment;
    });

    // concat all the buffer payloads to a single buffer
    const cborPayload = Buffer.concat(fragmentPayloads);

    // decode the buffer as a whole.
    const decoded = this.decodeCbor(cborPayload);

    return Ur.fromUr(decoded.payload, { ...expectedRegistryType });
  }

  private compareMultipartUrPayload(
    expected: {
      indexes: number[];
      messageLength: number;
      checksum: number;
      fragmentLength: number;
    },
    decodedPart: MultipartPayload
  ): boolean {
    // If this part's values don't match the first part's values, throw away the part
    if (expected.indexes.length !== decodedPart.seqLength) {
      return false;
    }
    if (expected.messageLength !== decodedPart.messageLength) {
      return false;
    }
    if (expected.checksum !== decodedPart.checksum) {
      return false;
    }
    if (expected.fragmentLength !== decodedPart.fragment.length) {
      return false;
    }
    // This part should be processed
    return true;
  }

  /**
   * Create a decoded, multipart Ur from an encoded ur string.
   * @param payload
   * @returns
   */
  decodeMultipartUr(payload: string): MultipartUr {
    const { bytewords, type, seqNum, seqLength } = this.parseUr(payload);

    const decoded = this.decode(bytewords); // {"_checksum": 556878893, "_fragment": [Object] (type of Buffer), "_messageLength": 2001, "_seqLength": 23, "_seqNum": 6}

    return MultipartUr.fromMultipartUr(decoded, { type }, seqNum, seqLength);
  }

  public validateMultipartPayload(decoded: Buffer): MultipartPayload {
    const [seqNum, seqLength, messageLength, checksum, fragment] = decoded;

    assert(typeof seqNum === "number");
    assert(typeof seqLength === "number");
    assert(typeof messageLength === "number");
    assert(typeof checksum === "number");
    assert(Buffer.isBuffer(fragment) && fragment.length > 0);

    return { seqNum, seqLength, messageLength, checksum, fragment };
  }

  /**
   * validates the type of the UR part
   * @param registryType type of the UR part (e.g. "bytes")
   * @returns true if the type is valid and matches the expected type
   */
  private compareRegistryType(
    expectedRegistryType: RegistryType,
    registryType: RegistryType
  ): boolean {
    const { type: expectedType } = expectedRegistryType;
    const { type } = registryType;

    return expectedType === type;
  }

  /**
   * Parses a UR and performs basic validation
   * @param message e.g. "UR:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL..."
   * @returns `{
    type: string;
    bytewords: string;
    seqNum?: number;
    seqLength?: number;
  }` // e.g.
  {
    type: "bytes",
    bytewords: "lpamchcfatttcyclehgsdphdhgehfghkkkdl..."",
    seqNum: 6,
    seqLength: 23
  } 
   */
  public parseUr(message: string): {
    type: string;
    bytewords: string;
    seqNum?: number;
    seqLength?: number;
  } {
    const lowercase = message.toLowerCase(); // e.g. "ur:bytes/6-23/lpamchcfatttcyclehgsdphdhgehfghkkkdl..."
    const prefix = lowercase.slice(0, 3);

    if (prefix !== "ur:") {
      throw new InvalidSchemeError();
    }

    const components = lowercase.slice(3).split("/");

    if (components.length !== 2 && components.length !== 3) {
      throw new InvalidPathLengthError();
    }

    const type = components[0]; //e.g. "bytes"

    if (!Ur.isURType(type)) {
      throw new InvalidTypeError();
    }

    // if we have 3 components, it means we are dealing with a multipart ur.
    if (components.length === 3) {
      // sequence is included
      const { seqNum, seqLength } = this.parseSequenceComponent(components[1]);
      return {
        type,
        seqNum,
        seqLength,
        bytewords: components[2],
      };
    }

    // singlePart ur
    return {
      type,
      bytewords: components[1],
    };
  }

  /**
   * Parses a sequence component of a UR and performs basic validation
   * @param s e.g. "146-23"
   * @returns `{seqNum, seqLength}` // e.g. `{seqNum: 146, seqLength:23}`
   */
  public parseSequenceComponent(s: string) {
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

    return { seqNum, seqLength };
  }
}
