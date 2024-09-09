import { IEncodingMethod } from "../interfaces/IEncodingMethod";

export interface IEncoder<T, U> {
  encodingMethods: IEncodingMethod<any, any>[];
  encode(payload: T): U;
}

export class Encoder<T, U> implements IEncoder<T, U> {
  private _encodingMethods: IEncodingMethod<any, any>[];
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    this._encodingMethods = encodingMethods;
  }

  get encodingMethods() {
    return this._encodingMethods;
  }
  
  encode<V = T>(payload: V): U {
    let encodedValue: any = payload;

    // Apply each encoding method in sequence
    for (const encodingMethod of this._encodingMethods) {
      encodedValue = encodingMethod.encode(encodedValue);
    }

    return encodedValue;
  }

}
