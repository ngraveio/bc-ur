import { Decoder, IDecoder } from "./classes/Decoder";
import { Encoder, IEncoder } from "./classes/Encoder";
import { MultipartUr } from "./classes/MultipartUr";
import {
  createUrTranscoder,
  createMultipartUrTranscoder,
  createFountainUrTranscoder,
} from "./ngraveTranscoder";
import { Ur } from "./classes/Ur";
import { UrDecoder } from "./classes/UrDecoder";
import { UrEncoder } from "./classes/UrEncoder";
import { UrMultipartEncoder } from "./classes/UrMultipartEncoder";
import { UrMultipartDecoder } from "./classes/UrMultipartDecoder";
import UrFountainDecoder from "./classes/UrFountainDecoder";
import UrFountainEncoder from "./classes/UrFountainEncoder";
import { RegistryItem } from "./classes/RegistryItem";
import { CborEncoding } from "./encodingMethods/CborEncoding";

/**
 * Example implementation of a RegistryItem
 */
export class Bytes extends RegistryItem {
  constructor(dataRaw?: Buffer | string) {
    super("bytes", 0);
    if (dataRaw) {
      this.data = dataRaw;
    }
  }

  public static fromCBOR = (data: Buffer): Bytes => {
    return new Bytes(new CborEncoding().decode(data));
  };
}

// RegistryItemClass is a type that enforces that the class has a static method fromCBOR
type RegistryItemClass<T extends RegistryItem> = {
  new (...args: any[]): RegistryItem;
  fromCBOR(data: Buffer): T;
};

export const registry: { [type: string]: RegistryItemClass<any> } = {
  bytes: Bytes,
};

export const getFromRegistryByUrString = (urString: string): RegistryItemClass<any> => {
  const {registryType: {type}} = Ur.parseUr(urString);
  return registry[type];
}

export {
  RegistryItem,
  Ur,
  MultipartUr,
  createUrTranscoder,
  createMultipartUrTranscoder,
  createFountainUrTranscoder,
  IDecoder,
  Decoder,
  UrDecoder,
  UrMultipartDecoder as MultipartUrDecoder,
  UrFountainDecoder,
  IEncoder,
  Encoder,
  UrEncoder,
  UrMultipartEncoder as MultipartUrEncoder,
  UrFountainEncoder,
};
