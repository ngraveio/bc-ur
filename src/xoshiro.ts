import { sha256 } from "sha.js";

export const sha256Hash = (data) => {
  //@ts-ignore
  const SHA256 = new sha256();
  return SHA256.update(data).digest();
};

const MAX_UINT64 = BigInt("0xffffffffffffffff");

const rotl = (x: bigint, k: number): bigint =>
  (x << BigInt(k) | x >> BigInt(64 - k)) & MAX_UINT64;

export default class Xoshiro {
  private s: bigint[];

  constructor(seed: Uint8Array) {
    const digest = sha256Hash(seed);

    this.s = [0n, 0n, 0n, 0n];
    this.setS(digest);
  }

  private setS = (digest: Uint8Array) => {
    for (let i = 0; i < 4; i++) {
      let o = i * 8;
      let v = 0n;
      for (let n = 0; n < 8; n++) {
        v = (v << 8n) | BigInt(digest[o + n]);
      }
      this.s[i] = v & MAX_UINT64;
    }
  };

  private roll = (): bigint => {
    const result =
      ((rotl((this.s[1] * 5n) & MAX_UINT64, 7) * 9n) & MAX_UINT64);

    const t = (this.s[1] << 17n) & MAX_UINT64;

    this.s[2] ^= this.s[0];
    this.s[3] ^= this.s[1];
    this.s[1] ^= this.s[2];
    this.s[0] ^= this.s[3];

    this.s[2] ^= t;
    this.s[3] = rotl(this.s[3], 45);

    return result;
  };

  next = (): bigint => {
    return this.roll();
  };

  nextDouble = (): number => {
    return Number(this.roll()) / Number(MAX_UINT64 + 1n);
  };

  nextInt = (low: number, high: number): number => {
    return Math.floor(this.nextDouble() * (high - low + 1) + low);
  };

  nextByte = () => this.nextInt(0, 255);

  nextData = (count: number) =>
    [...new Array(count)].map(() => this.nextByte());
}
