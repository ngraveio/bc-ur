import assert from "assert";
import { IUr, Ur } from "./Ur";
import { RegistryType } from "../interfaces/RegistryType";
import {
  InvalidSchemeError,
  InvalidPathLengthError,
  InvalidTypeError,
  InvalidSequenceComponentError,
} from "../errors";
import { toUint32 } from "../utils";

export interface IMultipartUr extends IUr {
  seqNum: number;
  seqLength: number;
}

/**
 * Extends the basic Ur class to add support for a Ur splitted into multiple parts.
 * e.g. 'ur:bytes/6-22/lpamcmcfatrdcyzcpldpgwhdhtiaiaecgyktgsflguhshthfghjtjngrhsfegtiafegaktgugui'
 */
export class MultipartUr extends Ur implements IMultipartUr {
  seqNum: number;
  seqLength: number;
  constructor(payload, registryType, seqNum, seqLength) {
    super(payload, registryType);
    this.seqNum = seqNum;
    this.seqLength = seqLength;
  }

  get description(): string {
    return `type: ${this.type} seqNum:${this.seqNum} seqLen:${this.seqLength} data:${this.payload}`;
  }

  static toMultipartUr(
    payload: any,
    registryType: RegistryType,
    seqNum: number,
    seqLength: number
  ): MultipartUr {
    // first validate the basic ur
    const ur = Ur.toUr(payload, registryType);
    const { registryType: validatedRegistryType } = ur;
    // validated Multipart ur
    assert(typeof seqNum === "number");
    assert(typeof seqLength === "number");

    // FIXME: multipart is inherently encoded with cbor and so the payload is a buffer.
    // assert(Buffer.isBuffer(payload) && payload.length > 0);
    // return combined result
    return new MultipartUr(payload, validatedRegistryType, seqNum, seqLength);
  }

  static fromMultipartUr(ur: MultipartUr): string {
    return getMultipartUrString(ur.type, ur.seqNum, ur.seqLength, ur.payload);
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
  static parseUr(message: string): IMultipartUr {
    const lowercase = message.toLowerCase(); // e.g. "ur:bytes/6-23/lpamchcfatttcyclehgsdphdhgehfghkkkdl..."
    const prefix = lowercase.slice(0, 3);

    if (prefix !== "ur:") {
      throw new InvalidSchemeError();
    }

    const components = lowercase.slice(3).split("/");

    if (components.length !== 3) {
      throw new InvalidPathLengthError();
    }

    const type = components[0]; //e.g. "bytes"

    if (!Ur.isURType(type)) {
      throw new InvalidTypeError();
    }

    // sequence is included
    const { seqNum, seqLength } = MultipartUr.parseSequenceComponent(
      components[1]
    );
    return {
      registryType: { type },
      seqNum,
      seqLength,
      payload: components[2],
    };
  }

  /**
   * Parses a sequence component of a UR and performs basic validation
   * @param s e.g. "146-23"
   * @returns `{seqNum, seqLength}` // e.g. `{seqNum: 146, seqLength:23}`
   */
  private static parseSequenceComponent(s: string) {
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

export function getMultipartUrString(
  type: string,
  seqNum: number,
  seqLength: number,
  payload: string
): string {
  const seq = `${seqNum}-${seqLength}`;
  return Ur.combineUR([type, seq, payload]);
}
