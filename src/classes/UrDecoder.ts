import { Decoder } from "./Decoder";
import { Ur } from "./Ur";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";

export class UrDecoder<T,U> extends Decoder<string, U> {
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
  }

  /**
   * Decode single fragment into the original Ur.
   * @param fragment stringified Ur
   * @returns original encoded Ur.
   */
  decodeUr(fragment: string): Ur<T> {
    const { registryType, payload } = Ur.parseUr(fragment);
    const { type } = registryType;
    const decoded = super.decode<T>(payload);

    return new Ur(decoded, { type });
  }
}
