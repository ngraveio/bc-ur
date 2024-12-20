import { concatUint8Arrays } from "./wrappers/uint8array.js";
import { bufferXOR, intToBytes } from "./utils.js";
import Xoshiro from "./xoshiro.js";
import randomSampler from "@apocentre/alias-sampling";

export const chooseDegree = (seqLenth: number, rng: Xoshiro): number => {
  const degreeProbabilities = [...new Array(seqLenth)].map(
    (_, index) => 1 / (index + 1)
  );
  const degreeChooser = randomSampler(
    degreeProbabilities,
    null,
    rng.nextDouble
  );

  return degreeChooser.next() + 1;
};

export const shuffle = (items: any[], rng: Xoshiro): any[] => {
  let remaining = [...items];
  let result = [];

  while (remaining.length > 0) {
    let index = rng.nextInt(0, remaining.length - 1);
    let item = remaining[index];
    // remaining.erase(remaining.begin() + index);
    remaining.splice(index, 1);
    result.push(item);
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
    const shuffledIndexes = shuffle(indexes, rng);
    // return a mix of indexes that we want to include.
    return shuffledIndexes.slice(0, degree);
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
