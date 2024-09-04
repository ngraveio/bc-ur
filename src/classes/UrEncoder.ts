import { Encoder } from "./Encoder";
import { Ur, getUrString } from "./Ur";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import { RegistryItem } from "./RegistryItem";


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
    const encoded = super.encode(item.toCBOR());
    return getUrString(item.type, encoded);
  }
}
