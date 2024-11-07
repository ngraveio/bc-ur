import { EncodingMethodName } from "../enums/EncodingMethodName.js";

/**
 * Encoding method that defines the incoming type T and the outgoing type U
 */
export interface IEncodingMethod<T, U> {
  name: EncodingMethodName | string;
  encode(payload: T): U;
  decode(payload: U): T;
}
