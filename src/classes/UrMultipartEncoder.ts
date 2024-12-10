import assert from "assert";
import { getCRC, split, toUint32 } from "../utils.js";
import { Encoder } from "./Encoder.js";
import { getMultipartUrString } from "./MultipartUr.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";
import { RegistryItem } from "./RegistryItem.js";
import { CborEncoding } from "../encodingMethods/CborEncoding.js";

/**
 * [seqNum, fragments.length, totalPayloadLength, checksum, fragment]
 */
export type IMultipartUrPayload = [number, number, number, number, Uint8Array];

export class UrMultipartEncoder extends Encoder<Buffer, string> {
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
  }

  /**
   * get an array of encoded fragments, based on the payload length, max and min fragment length.
   * @param ur ur that needs to be encoded.
   * @param maxFragmentLength maximum length of a fragment
   * @param minFragmentLength minimum length of a fragment
   * @returns the encoded payload as an array of ur strings
   * and force the multipart and fountain UR to be cbor encoded.
   */
  encodeUr(
    registryItem: RegistryItem,
    maxFragmentLength: number,
    minFragmentLength: number
  ): string[] {
    // encode first time to split the original payload up as cbor
    const cborMessage = new CborEncoding().encode(registryItem);
    const totalPayloadLength = cborMessage.length;
    const fragmentLength = this.findNominalFragmentLength(
      totalPayloadLength,
      minFragmentLength,
      maxFragmentLength
    );
    const checksum = getCRC(cborMessage);
    const fragments = this.partitionMessage(cborMessage, fragmentLength);
    const multipartUrStrings = fragments.map((fragment, index) => {
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
        registryItem.type.URType,
        seqNum,
        fragments.length,
        encodedFragment
      );
    });
    return multipartUrStrings;
  }

  /**
   * Split the cbor encoded payload into multiple fragments.
   * @param message
   * @param fragmentLength
   * @returns
   */
  partitionMessage(message: Uint8Array, fragmentLength: number): Uint8Array[] {
    let remaining = Uint8Array.from(message);
    let fragment;
    let fragments: Uint8Array[] = [];

    while (remaining.length > 0) {
      [fragment, remaining] = split(remaining, -fragmentLength);
      fragment = new Uint8Array(fragmentLength)
        .fill(0) // initialize with 0's to achieve the padding
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
