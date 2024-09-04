import { Decoder } from "./Decoder";
import { Ur } from "./Ur";
import { IEncodingMethod } from "../interfaces/IEncodingMethod";
import { RegistryItem } from "./RegistryItem";
import { registry } from "..";


export class UrDecoder extends Decoder<string, Buffer> {
  constructor(encodingMethods: IEncodingMethod<any, any>[]) {
    super(encodingMethods);
  }

  /**
   * Decode single fragment into the original Ur.
   * @param fragment stringified Ur
   * @returns original encoded Ur.
   */
  decodeUr<T extends RegistryItem>(fragment: string): Ur<T> {
    const { payload,registryType } = Ur.parseUr(fragment);
    const decoded = super.decode(payload);
    const registryItem = registry[registryType.type].fromCBOR(decoded);
    return new Ur<T>(registryItem);
  }
}
