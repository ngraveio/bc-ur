import assert from "assert";
import { getCRC, split, toUint32 } from "../utils";
import { BytewordEncoding } from "./BytewordEncoding";
import { CborEncoding } from "./CborEncoding";
import { Encoder } from "./Encoder";
import { HexEncoding } from "./HexEncoding";
import { Ur, getUrString } from "./Ur";
import { MultipartUr, getMultipartUrString } from "./MultipartUr";
import { chooseFragments, mix } from "../fountainUtils";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import FountainEncoder from "../fountainEncoder";

export class UrEncoder extends Encoder<any, string> {

  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
  }

  encode(ur: Ur): string {
    return super.encode(ur.payload);
  }

/**
 * Get a single encoded ur fragment from the ur
 * @param ur ur that needs to be encoded.
 * @returns the encoded payload as a ur string
 */
  getFragment(ur: Ur): string {
    const encoded = this.encode(ur);
    return getUrString(ur.registryType.type, encoded);
  }

  /**
   * get an array of encoded fragments, based on the payload length, max en min fragment length.
   * @param ur ur that needs to be encoded.
   * @param maxFragmentLength maximum length of a fragment
   * @param minFragmentLength minimum length of a fragment
   * @returns the encoded payload as am array of ur strings
   */
  getFragments(
    ur: Ur,
    maxFragmentLength: number,
    minFragmentLength: number,
  ): string[] {
    // encode first time to split the original payload up as cbor
    const cborMessage = this._encodingMethods[0].encode(ur.payload);
    const totalPayloadLength = cborMessage.length;
    const fragmentLength = UrEncoder.findNominalFragmentLength(
      totalPayloadLength,
      minFragmentLength,
      maxFragmentLength
    );
    const checksum = getCRC(cborMessage);
    const fragments = UrEncoder.partitionMessage(cborMessage, fragmentLength);
    const fountainUrs = fragments.map((fragment, index) => {
      const seqNum = toUint32(index + 1);
      // TODO: do I need to use Buffer.from on the fragment?
      const encodedFragment = super.encode([
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
   * get an array of encoded fragments, based on the payload length, max en min fragment length.
   * @param ur ur that needs to be encoded.
   * @param maxFragmentLength maximum length of a fragment
   * @param minFragmentLength minimum length of a fragment
   * @param redundancy ratio of additional generated fragments
   * @returns the encoded payload as am array of ur strings
   */
  getFountainFragments(
    ur: Ur,
    maxFragmentLength: number,
    minFragmentLength: number,
    redundancy: number = 2
  ): string[] {
    // encode first time to split the original payload up as cbor
    const cborMessage = this._encodingMethods[0].encode(ur.payload);
    const messageLength = cborMessage.length;
    const fragmentLength = UrEncoder.findNominalFragmentLength(
      messageLength,
      minFragmentLength,
      maxFragmentLength
    );
    const checksum = getCRC(cborMessage);
    const fragments = UrEncoder.partitionMessage(cborMessage, fragmentLength);
    // ceil to always get an integer
    const numberofParts = Math.ceil(fragments.length * redundancy);
    const fountainUrs = [...new Array(numberofParts)].map((_,index) => {
      const seqNum = toUint32(index + 1);
      const indexes = chooseFragments(seqNum, fragments.length, checksum);
      const mixed = mix(indexes, fragments);
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
  public static partitionMessage(
    message: Buffer,
    fragmentLength: number
  ): Buffer[] {
    let remaining = Buffer.from(message);
    let fragment;
    let _fragments: Buffer[] = [];

    while (remaining.length > 0) {
      [fragment, remaining] = split(remaining, -fragmentLength);
      fragment = Buffer.alloc(fragmentLength, 0) // initialize with 0's to achieve the padding
        .fill(fragment, 0, fragment.length);
      _fragments.push(fragment);
    }

    return _fragments;
  }

  /**
   * find fragment length that is between min and max and for all and last fragment (last fragment can be smaller)
   * @param messageLength length of the message that needs to be encoded
   * @param minFragmentLength minumum required length of a fragment
   * @param maxFragmentLength maximum length of a fragment.
   * @returns
   */
  static findNominalFragmentLength(
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

    const maxFragmentCount = Math.ceil(messageLength / minFragmentLength);
    let fragmentLength = 0;

    for (
      let fragmentCount = 1;
      fragmentCount <= maxFragmentCount;
      fragmentCount++
    ) {
      fragmentLength = Math.ceil(messageLength / fragmentCount);

      if (fragmentLength <= maxFragmentLength) {
        break;
      }
    }

    return fragmentLength;
  }
}
