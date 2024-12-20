import shajs from "sha.js";
//@ts-ignore
import { crc32 } from "crc";
import Xoshiro from "./xoshiro.js";
import { stringToUint8Array, toUint8Array } from "./wrappers/uint8array.js";

export const sha256Hash = (data: Uint8Array | string) =>
  shajs("sha256").update(data).digest();

export const partition = (s: string, n: number): string[] =>
  s.match(new RegExp(".{1," + n + "}", "g")) || [s];

export const split = (
  s: Uint8Array,
  length: number
): [Uint8Array, Uint8Array] => [s.slice(0, -length), s.slice(-length)];

export const getCRC = (message: Uint8Array): number => crc32(message);

export const getCRCHex = (message: Uint8Array): string =>
  crc32(message).toString(16).padStart(8, "0");

export const toUint32 = (number: number): number => number >>> 0;

export const intToBytes = (num: number): Uint8Array => {
  const arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
  const view = new DataView(arr);

  view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false

  return toUint8Array(arr);
};

export const arraysEqual = (ar1: number[], ar2: number[]): boolean => {
  if (ar1.length !== ar2.length) {
    return false;
  }

  return ar1.every((el) => ar2.includes(el));
};

/**
 * Checks if ar1 contains all elements of ar2
 * @param ar1 the outer array
 * @param ar2 the array to be contained in ar1
 */
export const arrayContains = (ar1: number[], ar2: number[]): boolean => {
  return ar2.every((v) => ar1.includes(v));
};

/**
 * Returns the difference array of  `ar1` - `ar2`
 */
export const setDifference = (ar1: number[], ar2: number[]): number[] => {
  return ar1.filter((x) => ar2.indexOf(x) < 0);
};

export const bufferXOR = (a: Uint8Array, b: Uint8Array): Uint8Array => {
  const length = Math.max(a.length, b.length);
  const uInt8Array = new Uint8Array(length);

  for (let i = 0; i < length; ++i) {
    uInt8Array[i] = a[i] ^ b[i];
  }

  return uInt8Array;
};

export const makeMessage = (
  length: number,
  seed: string = "Wolf"
): Uint8Array => {
  const rng = new Xoshiro(stringToUint8Array(seed));

  return new Uint8Array(rng.nextData(length));
};
