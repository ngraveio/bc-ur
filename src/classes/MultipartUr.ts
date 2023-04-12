import { Ur } from "./Ur";

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
    return getMultipartUrString(
      this.type,
      this.seqNum,
      this.seqLength,
      this.payload
    );
  }
}

export function getMultipartUrString(
  type: string,
  seqNum: number,
  seqLength: number,
  payload: string
): string {
  const seq = `${seqNum}-${seqLength}`;
  return Ur.encodeUR([type, seq, payload]);
}
