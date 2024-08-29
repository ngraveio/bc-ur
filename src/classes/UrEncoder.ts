import assert from "assert";
import { getCRC, split, toUint32 } from "../utils";
import { Encoder } from "./Encoder";
import { Ur, getUrString } from "./Ur";
import { IMultipartUr, getMultipartUrString } from "./MultipartUr";
import { chooseFragments, mixFragments } from "../fountainUtils";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import { EncodingMethodName } from "../enums/EncodingMethodName";

/**
 * [seqNum, fragments.length, totalPayloadLength, checksum, fragment]
 */
export type IMultipartUrPayload = [number, number, number, number, Buffer];

export type MultipartUrEncoderPart = IMultipartUr<IMultipartUrPayload>;

export class UrEncoder<T, U> extends Encoder<T, string> {
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
  }

  cborEncode(payload: T): Buffer {
    const cborEncoding = this.encodingMethods.find((method) => method.name === EncodingMethodName.cbor);
    if(!cborEncoding) {
      throw new Error("CBOR encoding method not found");
    }
    return cborEncoding.encode(payload);
  }

  /**
   * Get a single encoded ur fragment from the ur
   * @param ur ur that needs to be encoded.
   * @returns the encoded payload as a ur string
   */
  encodeUr(ur: Ur<T>): string {
    const encoded = super.encode(ur.payload);
    return getUrString(ur.registryType.type, encoded);
  }

  /**
   * get an array of encoded fragments, based on the payload length, max and min fragment length.
   * @param ur ur that needs to be encoded.
   * @param maxFragmentLength maximum length of a fragment
   * @param minFragmentLength minimum length of a fragment
   * @returns the encoded payload as an array of ur strings
   */
  getFragments(
    ur: Ur<T>,
    maxFragmentLength: number,
    minFragmentLength: number
  ): string[] {
    // encode first time to split the original payload up as cbor
    const cborMessage = this.cborEncode(ur.payload);
    const totalPayloadLength = cborMessage.length;
    const fragmentLength = this.findNominalFragmentLength(
      totalPayloadLength,
      minFragmentLength,
      maxFragmentLength
    );
    const checksum = getCRC(cborMessage);
    const fragments = this.partitionMessage(cborMessage, fragmentLength);
    const fountainUrs = fragments.map((fragment, index) => {
      const seqNum = toUint32(index + 1);
      // TODO: do I need to use Buffer.from on the fragment?
      const encodedFragment = super.encode<IMultipartUrPayload>([
        seqNum,
        fragments.length,
        totalPayloadLength,
        checksum,
        fragment,
      ]);
      return getMultipartUrString(
        ur.type,
        seqNum,
        fragments.length,
        encodedFragment
      );
    });
    return fountainUrs;
  }

  /**
   * get an array of encoded fragments, based on the payload length, max and min fragment length.
   * @param ur ur that needs to be encoded.
   * @param maxFragmentLength maximum length of a fragment
   * @param minFragmentLength minimum length of a fragment
   * @param redundancyRatio ratio of additional generated fragments
   * @returns the encoded payload as an array of ur strings
   */
  getFountainFragments(
    ur: Ur<T>,
    maxFragmentLength: number,
    minFragmentLength: number,
    // TODO: see what the best way is for the ratio to work.
    redundancyRatio: number = 0
  ): string[] {
    // encode first time to split the original payload up as cbor
    const cborMessage = this.cborEncode(ur.payload);
    const messageLength = cborMessage.length;
    const fragmentLength = this.findNominalFragmentLength(
      messageLength,
      minFragmentLength,
      maxFragmentLength
    );
    const checksum = getCRC(cborMessage);
    const fragments = this.partitionMessage(cborMessage, fragmentLength);
    // ceil to always get an integer
    const numberofParts = Math.ceil(fragments.length * (1 + redundancyRatio));
    const fountainUrs = [...new Array(numberofParts)].map((_, index) => {
      const seqNum = toUint32(index + 1);
      const indexes = chooseFragments(seqNum, fragments.length, checksum);
      const mixed = mixFragments(indexes, fragments, fragmentLength);
      // TODO: do I need to use Buffer.from on the fragment?
      const encodedFragment = super.encode([
        seqNum,
        fragments.length,
        messageLength,
        checksum,
        mixed,
      ]);
      return getMultipartUrString(
        ur.type,
        seqNum,
        fragments.length,
        encodedFragment
      );
    });
    return fountainUrs;
  }

  /**
   * Split the cbor encoded payload into multiple fragments.
   * @param message
   * @param fragmentLength
   * @returns
   */
  partitionMessage(message: Buffer, fragmentLength: number): Buffer[] {
    let remaining = Buffer.from(message);
    let fragment;
    let fragments: Buffer[] = [];

    while (remaining.length > 0) {
      [fragment, remaining] = split(remaining, -fragmentLength);
      fragment = Buffer.alloc(fragmentLength, 0) // initialize with 0's to achieve the padding
        .fill(fragment, 0, fragment.length);
      fragments.push(fragment);
    }

    return fragments;
  }

  /**
   * find fragment length that is between min and max and for all and last fragment (last fragment can be smaller)
   * @param messageLength length of the message that needs to be encoded
   * @param minFragmentLength minumum required length of a fragment
   * @param maxFragmentLength maximum length of a fragment.
   * @returns
   */
  findNominalFragmentLength(
    messageLength: number,
    minFragmentLength: number,
    maxFragmentLength: number
  ): number {
    assert(messageLength > 0, "MessageLength should be bigger then 0");
    assert(minFragmentLength > 0, "minFragmentLength should be bigger then 0");
    assert(
      maxFragmentLength >= minFragmentLength,
      "maxFragmentLength should be >= minFragmentLength"
    );

    // Calculate the maximum number of fragments that can be created with the minimum allowed length
    const maxFragmentCount = Math.ceil(messageLength / minFragmentLength);
    let fragmentLength = 0;

    // Try increasing the number of fragments until a suitable fragment length is found
    for (
      let fragmentCount = 1;
      fragmentCount <= maxFragmentCount;
      fragmentCount++
    ) {
      // Calculate the nominal fragment length for the current fragment count
      fragmentLength = Math.ceil(messageLength / fragmentCount);

      // If the nominal fragment length is less than or equal to the maximum allowed length,
      // then we have found a suitable fragment length, so we can stop searching
      if (fragmentLength <= maxFragmentLength) {
        break;
      }
    }

    return fragmentLength;
  }
}
