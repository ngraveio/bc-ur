import { Decoder } from "./Decoder.js";
import { Ur } from "./Ur.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";
import { RegistryItem } from "./RegistryItem.js";

export class UrDecoder extends Decoder<string, RegistryItem> {
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
  }

  /**
   * Decode single fragment into the original Ur.
   * @param ur stringified Ur
   * @returns original encoded Ur.
   */
  decodeUr<T extends RegistryItem>(ur: string): T {
    const { payload } = Ur.parseUr(ur);
    const registryItem = super.decode<T>(payload);
    return registryItem;
  }
}
