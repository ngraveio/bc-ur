
import Xoshiro from "../src/xoshiro";

export const makeMessage = (length: number, seed: string = 'Wolf'): Buffer => {
  const rng = new Xoshiro(Buffer.from(seed));

  return Buffer.from(rng.nextData(length));
}