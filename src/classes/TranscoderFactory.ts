import { EncodingMethodName } from "../enums/EncodingMethodName";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import { ITranscoder, NgraveTranscoder } from "./Transcoder";

export class TranscoderFactory{
    static create(encodingMethods: EncodingMethodName[] | IEncodingMethod<any, any>[] = []): ITranscoder<any,any>{
        if(encodingMethods.length === 0){
            return new NgraveTranscoder()
        }
    }
    }