import { CborEncoding } from "../encodingMethods/CborEncoding";
import { Decoder } from "./Decoder";
import { Encoder } from "./Encoder";
import { Ur } from "./Ur";
import { UrDecoder } from "./UrDecoder";
import { UrEncoder } from "./UrEncoder";
import UrFountainDecoder from "./UrFountainDecoder";
import UrFountainEncoder from "./UrFountainEncoder";
import { HexEncoding } from "../encodingMethods/HexEncoding";
import { BytewordEncoding } from "../encodingMethods/BytewordEncoding";

/**
 * A Transcoder creates encoders and decoders that use the same encodingMethods.
 * Using encoders and decoders that originate from the same Transcoder makes sure that the encoded is decoded correctly and vice versa
 */
export interface ITranscoder<T, U> {
  encoder: Encoder<T, U>;
  decoder: Decoder<U, T>;
  fountainEncoderCreator: (
    ur: Ur<T>,
    maxFragmentLength?: number,
    minFragmentLength?: number,
    firstSeqNum?: number
  ) => UrFountainEncoder<T>;
  fountainDecoderCreator: () => Decoder<U, T>;
}

/**
 * Transcoder used in the ngrave suite.
 * It implements the following encoding methods: cbor -> hex -> bytewords
 */
export class NgraveTranscoder<T = any> implements ITranscoder<T, string> {
  encoder: UrEncoder<T, string>;
  decoder: UrDecoder<string,T>;
  /**
   * Function that creates a fountain decoder class.
   * We want to create a new instance of the fountain encoder & decoder so it does not keep it's internal state
   * */
  fountainDecoderCreator: () => UrFountainDecoder<T>;
  /**
   * Function that creates a fountain encoder class for a specific Ur.
   * We want to create a new instance of the fountain encoder & decoder so it does not keep it's internal state
   * */
  fountainEncoderCreator: (
    ur: Ur<T>,
    maxFragmentLength?: number,
    minFragmentLength?: number,
    firstSeqNum?: number
  ) => UrFountainEncoder<T>;
  constructor() {
    const methods = [
      new CborEncoding(),
      new HexEncoding(),
      new BytewordEncoding(),
    ];
    this.encoder = new UrEncoder(methods);
    this.decoder = new UrDecoder(methods);
    this.fountainDecoderCreator = () => new UrFountainDecoder(methods);
    this.fountainEncoderCreator = (
      ur: Ur<T>,
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
  }
}
