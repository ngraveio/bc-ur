import { hexToUint8Array, uint8ArrayToHex } from "../wrappers/uint8array.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { IEncodingMethod } from "../interfaces/IEncodingMethod.js";
import { Ur } from "../classes/Ur.js";
import { RegistryItem } from "../classes/RegistryItem.js";


export class UrEncoding implements IEncodingMethod<RegistryItem, Ur> {
  private _name: EncodingMethodName = EncodingMethodName.ur;

  get name(): EncodingMethodName {
    return this._name;
  }

  encode(payload: RegistryItem): Ur {
    // return payload.toString("hex");
    return Ur.fromRegistryItem(payload);
  }
  decode(payload: Ur): RegistryItem {
    return payload.toRegistryItem();
  }
}
