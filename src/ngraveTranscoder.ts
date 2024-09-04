import { CborEncoding } from "./encodingMethods/CborEncoding";
import { Ur } from "./classes/Ur";
import { UrDecoder } from "./classes/UrDecoder";
import { UrEncoder } from "./classes/UrEncoder";
import UrFountainDecoder from "./classes/UrFountainDecoder";
import UrFountainEncoder from "./classes/UrFountainEncoder";
import { HexEncoding } from "./encodingMethods/HexEncoding";
import { BytewordEncoding } from "./encodingMethods/BytewordEncoding";
import { UrMultipartEncoder } from "./classes/UrMultipartEncoder";
import { UrMultipartDecoder } from "./classes/UrMultipartDecoder";

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
    ur: Ur,
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
    ur: Ur,
    maxFragmentLength?: number,
    minFragmentLength?: number,
    firstSeqNum?: number
  ) =>
    new UrFountainEncoder(
      methods,
      ur,
      maxFragmentLength,
      minFragmentLength,
      firstSeqNum
    );

  return {
    fountainEncoderCreator,
    fountainDecoderCreator,
  };
}
