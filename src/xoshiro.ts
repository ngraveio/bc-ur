import { sha256Hash } from "./utils";
import BigNumber from 'bignumber.js'
import JSBI from 'jsbi'

const MAX_UINT64 = 0xFFFFFFFFFFFFFFFF;
const rotl = (x: JSBI, k: number): JSBI => JSBI.bitwiseXor(
  JSBI.asUintN(64, JSBI.leftShift(x, JSBI.BigInt(k))),
  JSBI.BigInt(
    JSBI.asUintN(
      64,
      JSBI.signedRightShift(x, (JSBI.subtract(JSBI.BigInt(64), JSBI.BigInt(k))))
    )
  )
);

export default class Xoshiro {
  private s: JSBI[];

  constructor(seed: Buffer) {
    const digest = sha256Hash(seed);

    this.s = [JSBI.BigInt(0), JSBI.BigInt(0), JSBI.BigInt(0), JSBI.BigInt(0)];
    this.setS(digest);
  }

  private setS(digest: Buffer) {
    for (let i = 0; i < 4; i++) {
      let o = i * 8;
      let v = JSBI.BigInt(0);
      for (let n = 0; n < 8; n++) {
        v = JSBI.asUintN(64, JSBI.leftShift(v, JSBI.BigInt(8)));
        v = JSBI.asUintN(64, JSBI.bitwiseOr(v, JSBI.BigInt(digest[o + n])));
      }
      this.s[i] = JSBI.asUintN(64, v);
    }
  }

  private roll(): JSBI {
    const result = JSBI.asUintN(
      64,
      JSBI.multiply(
        rotl(
          JSBI.asUintN(64, JSBI.multiply(this.s[1], JSBI.BigInt(5))),
          7
        ),
        JSBI.BigInt(9)
      )
    );

    const t = JSBI.asUintN(64, JSBI.leftShift(this.s[1], JSBI.BigInt(17)));

    this.s[2] = JSBI.asUintN(64, JSBI.bitwiseXor(this.s[2], JSBI.BigInt(this.s[0])));
    this.s[3] = JSBI.asUintN(64, JSBI.bitwiseXor(this.s[3], JSBI.BigInt(this.s[1])));
    this.s[1] = JSBI.asUintN(64, JSBI.bitwiseXor(this.s[1], JSBI.BigInt(this.s[2])));
    this.s[0] = JSBI.asUintN(64, JSBI.bitwiseXor(this.s[0], JSBI.BigInt(this.s[3])));

    this.s[2] = JSBI.asUintN(64, JSBI.bitwiseXor(this.s[2], JSBI.BigInt(t)));

    this.s[3] = JSBI.asUintN(64, rotl(this.s[3], 45));

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
