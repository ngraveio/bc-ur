import { Encoder } from "./Encoder";
import { Ur, getUrString } from "./Ur";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";


export class UrEncoder<T, U> extends Encoder<T, string> {
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
  }

  /**
   * Get a single encoded ur fragment from the ur
   * @param ur ur that needs to be encoded.
   * @returns the encoded payload as a ur string
   */
  encodeUr(ur: Ur<T>): string {
    const encoded = super.encode(ur.payload);
    return getUrString(ur.registryType.type, encoded);
  }
}
