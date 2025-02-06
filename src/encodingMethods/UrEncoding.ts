import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";
import { UR } from "../classes/UR.js";
import { RegistryItem } from "../classes/RegistryItem.js";

export class UrEncoding implements IEncodingMethod<RegistryItem, UR> {
  private _name: EncodingMethodName = EncodingMethodName.ur;

  get name(): EncodingMethodName {
    return this._name;
  }

  encode(payload: RegistryItem): UR {
    return UR.fromRegistryItem(payload);
  }
  decode(payload: UR): RegistryItem {
    return payload.toRegistryItem();
  }
}
