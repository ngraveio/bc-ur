import { concatUint8Arrays } from "../wrappers/uint8array.js";
import { bufferXOR, intToBytes } from "./utils.js";
import Xoshiro from "../xoshiro.js";
import {sample as randomSampler} from "@keystonehq/alias-sampling";

export const chooseDegree = (seqLenth: number, rng: Xoshiro): number => {
  const degreeProbabilities = [...new Array(seqLenth)].map(
    (_, index) => 1 / (index + 1)
  );
  //@ts-ignore
  const degreeChooser = randomSampler(
    degreeProbabilities,
    undefined,
    rng.nextDouble
  );

  return degreeChooser.next() + 1;
};

export const shuffle = (items: number[], rng: Xoshiro, degree?: number): number[] => {
  if (!degree) degree = items.length;
  
  let remaining:number[] = [...items];
  let result:number[] = [];

  let i = 1;
  while (remaining.length > 0 && i <= degree) {
    let index = rng.nextInt(0, remaining.length - 1);
    let item = remaining[index];
    // remaining.erase(remaining.begin() + index);
    remaining.splice(index, 1);
    result.push(item);
    i++;
  }

  return result;
};


/**
 * Get an array of indexes for the fragments that we want to mix with each other.
 * The first `seqLenth` parts are the "pure" fragments, not mixed with any others.
 * This means that if you only generate the first `seqLenth` parts,
 * then you have all the parts you need to decode the message.
 * @param seqNum sequence (index + 1) of the fragment.
 * @param seqLength total length of pure fragments.
 * @param checksum
 * @returns array of fragment indexes.
 */
export const chooseFragments = (
  seqNum: number,
  seqLength: number,
  checksum: number
): number[] => {
  //The first `seqLenth` parts are the "pure" fragments
  if (seqNum <= seqLength) {
    // return the index of the current fragment.
    return [seqNum - 1];
  } else {
    const seed = concatUint8Arrays([intToBytes(seqNum), intToBytes(checksum)]);
    const rng = new Xoshiro(seed);
    const degree = chooseDegree(seqLength, rng);
    const indexes = [...new Array(seqLength)].map((_, index) => index);
    const shuffledIndexes = shuffle(indexes, rng, degree);
    // return a mix of indexes that we want to include.
    return shuffledIndexes;
  }
};

/**
 * Mix the fragments of the passed indexes.
 * @param indexes array of indexes to include in the mix.
 * @param fragments array of pure fragments for a given payload.
 * @returns A mixed fragment, represented as a Uint8Array.
 */
export const mixFragments = (
  indexes: number[],
  fragments: Uint8Array[],
  nominalFragmentLength: number
): Uint8Array => {
  return indexes.reduce(
    (result, index) => bufferXOR(fragments[index], result),
    new Uint8Array(nominalFragmentLength).fill(0)
  );
};


  /**
   * Find fragment length that is between min and max and for all and last fragment (last fragment can be smaller)
   * @param messageLength length of the message that needs to be encoded
   * @param minFragmentLength minumum required length of a fragment
   * @param maxFragmentLength maximum length of a fragment.
   * @returns
   * 
   * @docs https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2024-001-multipart-ur.md#determining-fragment-length
   */
  export function findNominalFragmentLength(
    messageLength: number,
    maxFragmentLength: number,
    minFragmentLength: number = 10,
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
    for (let fragmentCount = 1; fragmentCount <= maxFragmentCount; fragmentCount++) {
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


/**
 * Splits the given message into fixed-length fragments, padding the final fragment with zeros if necessary.
 *
 * @param message - The input message as a Uint8Array.
 * @param fragmentLength - The desired length of each fragment.
 * @returns An array of Uint8Array fragments, each of the specified length. The last fragment will be padded with zeros if it is shorter than the fragment length.
 * @throws Error if the fragmentLength is not a positive number.
 */
export function partitionMessage(message: Uint8Array, fragmentLength: number): Uint8Array[] {
  if (fragmentLength <= 0) {
    throw new Error("Fragment length must be a positive number.");
  }

  const fragments: Uint8Array[] = [];
  const totalFragments = Math.ceil(message.length / fragmentLength);

  for (let i = 0; i < totalFragments; i++) {
    const start = i * fragmentLength;
    const end = Math.min(start + fragmentLength, message.length);
    const fragment = new Uint8Array(fragmentLength);

    // Copy the actual bytes into the fragment
    fragment.set(message.subarray(start, end));

    fragments.push(fragment);
  }

  return fragments;
}

function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}