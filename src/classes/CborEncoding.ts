import { EncodingMethodName } from "../enums/EncodingMethodName";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import { cborEncode, cborDecode } from '../cbor';

export class CborEncoding implements IEncodingMethod<any,Buffer> {
    name: EncodingMethodName.cbor;
    encode(payload: any): Buffer {
        return cborEncode(payload)
    }
    decode(payload: Buffer):any {
        return cborDecode(payload);
    }
}