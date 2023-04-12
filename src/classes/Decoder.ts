import { IEncodingMethod } from "../interfaces/IEncodingMethod";

export interface IDecoder<T, U> {
  _encodingMethods: IEncodingMethod<any, any>[];
  decode(payload: T): U;
}

export class Decoder<T, U> implements IDecoder<T, U> {
  _encodingMethods: IEncodingMethod<any, any>[];

  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    this._encodingMethods = [...encodingMethods].reverse();
  }
  
  decode(payload: T): U {
    let decodedValue: any = payload;

    // Apply each decoding method in reverse sequence
    for (const encodingMethod of this._encodingMethods) {
      decodedValue = encodingMethod.decode(decodedValue);
    }

    return decodedValue;
  }
}
