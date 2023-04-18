import assert from "assert";
import { Ur } from "./Ur";
import { RegistryType } from "../interfaces/RegistryType";

export class MultipartUr extends Ur {
  seqNum: number;
  seqLength: number;
  constructor(payload, registryType, seqNum, seqLength) {
    super(payload, registryType);
    this.seqNum = seqNum;
    this.seqLength = seqLength;
  }

  /**
   * get multipart ur represented as a string
   * @returns string representation of a multipart Ur
   */
  getUrString(): string {
    // FIXME: payload can be anything, so we do not know how to convert it to string.
    return getMultipartUrString(
      this.type,
      this.seqNum,
      this.seqLength,
      this.payload
    );
  }

  static fromMultipartUr(payload: any, registryType: RegistryType, seqNum: number, seqLength:number): MultipartUr {
    // first validate the basic ur
    const ur = Ur.fromUr(payload, registryType);
    const {registryType: validatedRegistryType} = ur
    // validated Multipart ur
    assert(typeof seqNum === 'number');
    assert(typeof seqLength === 'number');

    // FIXME: multipart is inherently encoded with cbor and so the payload is a buffer.
    // assert(Buffer.isBuffer(payload) && payload.length > 0);
    // return combined result
    return new MultipartUr(payload, validatedRegistryType,seqNum,seqLength);
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
