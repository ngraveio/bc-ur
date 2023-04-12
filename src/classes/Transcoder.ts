import { BytewordEncoding } from "./BytewordEncoding";
import { CborEncoding } from "./CborEncoding";
import { Decoder } from "./Decoder";
import { Encoder } from "./Encoder";
import { HexEncoding } from "./HexEncoding";
import { UrDecoder } from "./UrDecoder";
import { UrEncoder } from "./UrEncoder";

export interface ITranscoder<T,U> {
    encoder: Encoder<T,U>;
    decoder: Decoder<U,T>;
}

export class NgraveTranscoder implements ITranscoder<any,string> {
    encoder: UrEncoder;
    decoder: UrDecoder;

    constructor(){
        const methods = [new CborEncoding(), new HexEncoding(), new BytewordEncoding()]
        this.encoder = new UrEncoder(methods);
        this.decoder = new UrDecoder(methods)
    }
}