import { Encoder } from "./Encoder";
import { Ur, getUrString } from "./Ur";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";


export class UrEncoder extends Encoder<Buffer, string> {
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
  }

  /**
   * Get a single encoded ur fragment from the ur
   * @param ur ur that needs to be encoded.
   * @returns the encoded payload as a ur string
   */
  encodeUr(ur: Ur): string {
    const encoded = super.encode(ur.toCBOR());
    return getUrString(ur.registryItem.type, encoded);
  }
}
