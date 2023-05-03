
import Xoshiro from "../src/xoshiro";
import { cborEncode } from '../src/encodingMethods/cbor';
import { Ur } from "../src/classes/Ur";
import { RegistryType } from "../src/interfaces/RegistryType";

export const makeMessage = (length: number, seed: string = 'Wolf'): Buffer => {
  const rng = new Xoshiro(Buffer.from(seed));

  return Buffer.from(rng.nextData(length));
}

export const makeCborUr = (length: number, registryType?: RegistryType, seed: string = 'Wolf'): Ur<Buffer> => {
  const message = makeMessage(length, seed);

  const cborMessage = cborEncode(message);

  return new Ur(cborMessage, registryType);
}