import { CborEncoding } from "./encodingMethods/CborEncoding.js";
import { Ur } from "./classes/Ur.js";
import { UrDecoder } from "./classes/UrDecoder.js";
import { UrEncoder } from "./classes/UrEncoder.js";
import UrFountainDecoder from "./classes/UrFountainDecoder.js";
import UrFountainEncoder from "./classes/UrFountainEncoder.js";
import { HexEncoding } from "./encodingMethods/HexEncoding.js";
import { BytewordEncoding } from "./encodingMethods/BytewordEncoding.js";
import { UrMultipartEncoder } from "./classes/UrMultipartEncoder.js";
import { UrMultipartDecoder } from "./classes/UrMultipartDecoder.js";
import { RegistryItem } from "./classes/RegistryItem.js";

/**
 * Factory function to create a transcoder used in the ngrave suite.
 * It implements the following encoding methods: cbor -> hex -> bytewords
 * Using encoders and decoders that originate from the same Transcoder makes sure that the encoded is decoded correctly and vice versa
 */
export function createUrTranscoder(): {
  encoder: UrEncoder;
  decoder: UrDecoder;
} {
  const methods = [
    // TODO: check if we can add key-map converter here
    new CborEncoding(),
    new HexEncoding(),
    new BytewordEncoding(),
  ];

  const encoder = new UrEncoder(methods);
  const decoder = new UrDecoder(methods);

  return {
    encoder,
    decoder,
  };
}

/**
 * Factory function to create a transcoder used in the ngrave suite.
 * It implements the following encoding methods: cbor -> hex -> bytewords
 */
export function createMultipartUrTranscoder(): {
  encoder: UrMultipartEncoder;
  decoder: UrMultipartDecoder;
} {
  const methods = [
    new CborEncoding(),
    new HexEncoding(),
    new BytewordEncoding(),
  ];

  const encoder = new UrMultipartEncoder(methods);
  const decoder = new UrMultipartDecoder(methods);

  return {
    encoder,
    decoder,
  };
}

/**
 * Factory function to create a transcoder used in the ngrave suite.
 * It implements the following encoding methods: cbor -> hex -> bytewords
 */
export function createFountainUrTranscoder(): {
  fountainEncoderCreator: (
    registryItem: RegistryItem,
    maxFragmentLength?: number,
    minFragmentLength?: number,
    firstSeqNum?: number
  ) => UrFountainEncoder;
  fountainDecoderCreator: () => UrFountainDecoder;
} {
  const methods = [
    new CborEncoding(),
    new HexEncoding(),
    new BytewordEncoding(),
  ];

  const fountainDecoderCreator = () => new UrFountainDecoder(methods);
  const fountainEncoderCreator = (
    registryItem: RegistryItem,
    maxFragmentLength?: number,
    minFragmentLength?: number,
    firstSeqNum?: number
  ) =>
    new UrFountainEncoder(
      methods,
      registryItem,
      maxFragmentLength,
      minFragmentLength,
      firstSeqNum
    );

  return {
    fountainEncoderCreator,
    fountainDecoderCreator,
  };
}
