import { EncodingMethodName } from "../enums/EncodingMethodName";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";

export class HexEncoding implements IEncodingMethod<Buffer,string> {
    name: EncodingMethodName.hex;
    encode(payload: Buffer): string {
        return payload.toString("hex");
    }
    decode(payload: string):Buffer {
        return Buffer.from(payload, "hex");
    }
}