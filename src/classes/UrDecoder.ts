import { Decoder } from "./Decoder";
import { Ur } from "./Ur";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import { RegistryItem } from "./RegistryItem";
import { getRegistryItemClassByUrString } from "..";


export class UrDecoder extends Decoder<string, Buffer> {
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
  }

  /**
   * Decode single fragment into the original Ur.
   * @param ur stringified Ur
   * @returns original encoded Ur.
   */
  decodeUr<T extends RegistryItem>(ur: string): T {
    const { payload} = Ur.parseUr(ur);
    const decoded = super.decode(payload);
    const registryItem = getRegistryItemClassByUrString(ur).fromCBOR(decoded);
    return registryItem;
  }
}
