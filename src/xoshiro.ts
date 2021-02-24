import { sha256Hash } from "./utils";
import BigNumber from 'bignumber.js'
import bigInt, { BigInteger } from 'big-integer'

const MAX_UINT64 = 0xFFFFFFFFFFFFFFFF;
const rotl = (x: BigInteger, k: number): BigInteger => asUintN(64, x.shiftLeft(k))
  .or(
    asUintN(
      64,
      x.shiftRight((bigInt(64).minus(k)))
    )
  );

const asUintN = (bits: number, bigint: BigInteger) => {
  const p2bits = bigInt(1).shiftLeft(bits);
  const mod = bigint.and(p2bits.subtract(1));
  return mod
};

export default class Xoshiro {
  private s: BigInteger[];

  constructor(seed: Buffer) {
    const digest = sha256Hash(seed);

    this.s = [bigInt(0), bigInt(0), bigInt(0), bigInt(0)];
    this.setS(digest);
  }

  private setS(digest: Buffer) {
    for (let i = 0; i < 4; i++) {
      let o = i * 8;
      let v = bigInt(0);
      for (let n = 0; n < 8; n++) {
        v = asUintN(64, v.shiftLeft(8));
        v = asUintN(64, v.or(digest[o + n]));
      }
      this.s[i] = asUintN(64, v);
    }
  }

  private roll(): BigInteger {
    const result = asUintN(
      64,
      rotl(
        asUintN(64, this.s[1].multiply(5)),
        7
      )
        .multiply(9)
    );

    const t = asUintN(64, this.s[1].shiftLeft(17));

    this.s[2] = asUintN(64, this.s[2].xor(this.s[0]));
    this.s[3] = asUintN(64, this.s[3].xor(this.s[1]));
    this.s[1] = asUintN(64, this.s[1].xor(this.s[2]));
    this.s[0] = asUintN(64, this.s[0].xor(this.s[3]));

    this.s[2] = asUintN(64, this.s[2].xor(t));

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
