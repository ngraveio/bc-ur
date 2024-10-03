import { RegistryType } from "../classes/RegistryType";
import { IRegistryType } from "../interfaces/IRegistryType";
import { Tagged } from "cbor";

export class RegistryItem {
  private _registryType: IRegistryType;
  private _data: any;

  get tag(): number | undefined {
    return this._registryType.tag;
  }

  get type(): string {
    return this._registryType.type;
  }

  get data(): any {
    return this._data;
  }

  set data(data: any) {
    this._data = data;
  }

  constructor(type: string, tag: number = 99999, dataRaw?: any) {
    this._registryType = new RegistryType(type, tag);
    this.data = dataRaw;
  }

  public encodeCBOR = (encoder) => {
    const tagged = new Tagged(this.tag, this.data);
    return encoder.pushAny(tagged);
  };

  public fromCBOR = () => ({
    [this.tag]: (val) => new RegistryItem(this.type, this.tag, val),
  });
}
