import { sha256Hash } from "./utils";
import BigNumber from 'bignumber.js'

const MAX_UINT64 = 0xFFFFFFFFFFFFFFFF;
const rotl = (x: bigint, k: number): bigint => asUintN(64, x << BigInt(k))
   | BigInt(
    asUintN(
      64,
      x >> (BigInt(64)- BigInt(k))
    )
  );

const asUintN = (bits: number, bigint: bigint) => {
  const p2bits = BigInt(1) << BigInt(bits);
  const mod = bigint & BigInt(p2bits - BigInt(1));
  return mod
};

export default class Xoshiro {
  private s: bigint[];

  constructor(seed: Buffer) {
    const digest = sha256Hash(seed);

    this.s = [BigInt(0), BigInt(0), BigInt(0), BigInt(0)];
    this.setS(digest);
  }

  private setS(digest: Buffer) {
    for (let i = 0; i < 4; i++) {
      let o = i * 8;
      let v = BigInt(0);
      for (let n = 0; n < 8; n++) {
        v = asUintN(64, v << BigInt(8));
        v = asUintN(64, v | BigInt(digest[o + n]));
      }
      this.s[i] = asUintN(64, v);
    }
  }

  private roll(): bigint {
    const result = asUintN(
      64,
      rotl(asUintN(64, this.s[1] * BigInt(5)), 7) * BigInt(9)
    );

    const t = asUintN(64, this.s[1] << BigInt(17));

    this.s[2] = asUintN(64, this.s[2] ^ BigInt(this.s[0]));
    this.s[3] = asUintN(64, this.s[3] ^ BigInt(this.s[1]));
    this.s[1] = asUintN(64, this.s[1] ^ BigInt(this.s[2]));
    this.s[0] = asUintN(64, this.s[0] ^ BigInt(this.s[3]));

    this.s[2] = asUintN(64, this.s[2] ^ BigInt(t));

    this.s[3] = asUintN(64, rotl(this.s[3], 45));

    return result;
  }

  next = (): BigNumber => {
    return new BigNumber(this.roll().toString())
  }

  nextDouble = (): BigNumber => {
    return new BigNumber(this.roll().toString()).div(MAX_UINT64 + 1)
  }

  nextInt = (low: number, high: number): number => {
    return Math.floor((this.nextDouble().toNumber() * (high - low + 1)) + low);
  }

  nextByte = () => this.nextInt(0, 255);

  nextData = (count: number) => (
    [...new Array(count)].map(() => this.nextByte())
  )
}
