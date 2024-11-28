import { Encoder } from "./Encoder.js";
import { Ur, getUrString } from "./Ur.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";
import { RegistryItem } from "./RegistryItem.js";

export class UrEncoder extends Encoder<RegistryItem, string> {
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
  }

  /**
   * Get a single encoded ur fragment from the ur
   * @param ur ur that needs to be encoded.
   * @returns the encoded payload as a ur string
   */
  encodeUr(item: RegistryItem): string {
    const encoded = super.encode(item);
    return getUrString(item.type.URType, encoded);
  }
}
