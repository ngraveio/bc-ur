import { STYLES } from "../bytewords";
import { BytewordEncoding } from "./BytewordEncoding";
import { CborEncoding } from "./CborEncoding";
import { Decoder } from "./Decoder";
import { Encoder } from "./Encoder";
import { HexEncoding } from "./HexEncoding";
import { Ur } from "./Ur";
import { UrDecoder } from "./UrDecoder";
import { UrEncoder } from "./UrEncoder";
import UrFountainDecoder from "./UrFountainDecoder";
import UrFountainEncoder from "./UrFountainEncoder";

export interface ITranscoder<T, U> {
  encoder: Encoder<T, U>;
  decoder: Decoder<U, T>;
  fountainEncoderCreator: (
    ur: Ur,
    maxFragmentLength?: number,
    minFragmentLength?: number,
    firstSeqNum?: number
  ) => UrFountainEncoder;
//   fountainDecoder?: () => Decoder<U, T>;
}

export class NgraveTranscoder implements ITranscoder<any, string> {
  encoder: UrEncoder;
  decoder: UrDecoder;
  // We want to create a new instance of the fountain encoder & decoder so it does not keep it's internal state
  fountainDecoderCreator: () => UrFountainDecoder;
  fountainEncoderCreator: (
    ur: Ur,
    maxFragmentLength?: number,
    minFragmentLength?: number,
    firstSeqNum?: number
  ) => UrFountainEncoder;
  constructor() {
    const methods = [
      new CborEncoding(),
      new HexEncoding(),
      new BytewordEncoding(),
    ];
    this.encoder = new UrEncoder(methods);
    this.decoder = new UrDecoder(methods);
    this.fountainDecoderCreator = () => new UrFountainDecoder(methods)
    this.fountainEncoderCreator = (
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
  }
}
