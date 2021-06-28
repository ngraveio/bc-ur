import shajs from 'sha.js';
import { crc32 } from 'crc';

export const sha256Hash = (data: Buffer | string) => shajs('sha256').update(data).digest();

export const partition = (s: string, n: number): string[] => s.match(new RegExp('.{1,' + n + '}', 'g')) || [s];

export const split = (s: Buffer, length: number): [Buffer, Buffer] => [s.slice(0, -length), s.slice(-length)]

export const getCRC = (message: Buffer): number => crc32(message);

export const getCRCHex = (message: Buffer): string => crc32(message).toString(16).padStart(8, '0');

export const toUint32 = (number: number): number => number >>> 0;

export const intToBytes = (num: number): Buffer => {
  const arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
  const view = new DataView(arr);

  view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false

  return Buffer.from(arr);
}

export const isURType = (type: string): boolean => {
  return type.split('').every((_, index) => {
    let c = type.charCodeAt(index);

    if ('a'.charCodeAt(0) <= c && c <= 'z'.charCodeAt(0)) return true;
    if ('0'.charCodeAt(0) <= c && c <= '9'.charCodeAt(0)) return true;
    if (c === '-'.charCodeAt(0)) return true;
    return false;
  })
}

export const hasPrefix = (s: string, prefix: string): boolean => s.indexOf(prefix) === 0;

export const arraysEqual = (ar1: any[], ar2: any[]): boolean => {
  if (ar1.length !== ar2.length) {
    return false;
  }

  return ar1.every(el => ar2.includes(el))
}

/**
 * Checks if ar1 contains all elements of ar2
 * @param ar1 the outer array
 * @param ar2 the array to be contained in ar1
 */
export const arrayContains = (ar1: any[], ar2: any[]): boolean => {
  return ar2.every(v => ar1.includes(v))
}

/**
 * Returns the difference array of  `ar1` - `ar2`
 */
export const setDifference = (ar1: any[], ar2: any[]): any[] => {
  return ar1.filter(x => ar2.indexOf(x) < 0)
}

export const bufferXOR = (a: Buffer, b: Buffer): Buffer => {
  const length = Math.max(a.length, b.length);
  const buffer = Buffer.allocUnsafe(length);

  for (let i = 0; i < length; ++i) {
    buffer[i] = a[i] ^ b[i];
  }

  return buffer;
}