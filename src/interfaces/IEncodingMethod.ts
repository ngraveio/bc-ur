import { EncodingMethodName } from "../enums/EncodingMethodName.js";

/**
 * Encoding method that defines the incoming type T and the outgoing type U
 */
export interface IEncodingMethod<T, U> {
  name: EncodingMethodName | string;
  encode(payload: T, config?: unknown): U;
  decode(payload: U, config?: unknown): T;
}
