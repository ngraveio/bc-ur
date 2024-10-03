import { Decoder } from "./Decoder";
import { Ur } from "./Ur";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import { RegistryItem } from "./RegistryItem";

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
