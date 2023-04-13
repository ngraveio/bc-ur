import { BytewordEncoding } from "./BytewordEncoding";
import { CborEncoding } from "./CborEncoding";
import { Decoder } from "./Decoder";
import { Encoder } from "./Encoder";
import { HexEncoding } from "./HexEncoding";
import { Ur } from "./Ur";
import { UrDecoder } from "./UrDecoder";
import { UrEncoder } from "./UrEncoder";
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
  fountainEncoderCreator: (
    ur: Ur,
    maxFragmentLength?: number,
    minFragmentLength?: number,
    firstSeqNum?: number
  ) => UrFountainEncoder;
  // fountainDecoder: UrDecoder;
  constructor() {
    const methods = [
      new CborEncoding(),
      new HexEncoding(),
      new BytewordEncoding(),
    ];
    this.encoder = new UrEncoder(methods);
    this.decoder = new UrDecoder(methods);
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
