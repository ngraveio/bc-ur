import { BytewordEncoding } from "./BytewordEncoding";
import { CborEncoding } from "./CborEncoding";
import { Decoder } from "./Decoder";
import { Encoder } from "./Encoder";
import { HexEncoding } from "./HexEncoding";

export interface ITranscoder<T,U> {
    encoder: Encoder<T,U>;
    decoder: Decoder<U,T>;
}

export class NgraveTranscoder implements ITranscoder<any,string> {
    encoder: Encoder<any,string>;
    decoder: Decoder<string,any>;

    constructor(){
        const methods = [new CborEncoding(), new HexEncoding(), new BytewordEncoding()]
        this.encoder = new Encoder(methods);
        this.decoder = new Decoder(methods)
    }
}