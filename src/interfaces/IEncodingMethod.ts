import { EncodingMethodName } from "../enums/EncodingMethodName";

/**
 * Encoding method that defines the incoming type T and the outgoing type U
 */
export interface IEncodingMethod<T, U> {
  name: EncodingMethodName;
  // has another encoding method that encodes the output value of this one.
  encodingMethod?: IEncodingMethod<U, any>;
  encode(payload: T): U;
  decode(payload: U): T;
}
