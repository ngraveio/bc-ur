import UR from "../src/ur";
import Xoshiro from "../src/xoshiro";
import { cborEncode } from '../src/cbor';
import { Ur } from "../src/classes/Ur";
import { RegistryType } from "../src/interfaces/RegistryType";

export const makeMessage = (length: number, seed: string = 'Wolf'): Buffer => {
  const rng = new Xoshiro(Buffer.from(seed));

  return Buffer.from(rng.nextData(length));
}

export const makeMessageUR = (length: number, seed: string = 'Wolf'): UR => {
  const message = makeMessage(length, seed);

  const cborMessage = cborEncode(message);

  return new UR(cborMessage);
}

export const makeCborUr = (length: number, registryType?: RegistryType, seed: string = 'Wolf'): Ur => {
  const message = makeMessage(length, seed);

  const cborMessage = cborEncode(message);

  return new Ur(cborMessage, registryType);
}