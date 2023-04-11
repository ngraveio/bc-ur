import { IEncodingMethod } from "../interfaces/IEncodingMethod";

export interface IEncoder<T, U> {
  _encodingMethods: IEncodingMethod<any, any>[];
  encode(payload: T): U;
}

export class Encoder<T, U> implements IEncoder<T, U> {
  _encodingMethods: IEncodingMethod<any, any>[];
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    this._encodingMethods = encodingMethods;
  }
  encode(payload: T): U {
    let encodedValue: any = payload;

    // Apply each encoding method in sequence
    for (const encodingMethod of this._encodingMethods) {
      console.log('encodedValue', encodedValue);
      encodedValue = encodingMethod.encode(encodedValue);
    }

    return encodedValue;
  }
}
