import { RegistryType } from '../classes/RegistryType';
import { CborEncoding } from '../encodingMethods/CborEncoding';
import { IRegistryType } from '../interfaces/IRegistryType';

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

constructor(type: string, tag?: number, dataRaw?: any) {
    this._registryType = new RegistryType(type, tag);
    this.data = dataRaw;
}

public toCBOR = (): Buffer => {
  return new CborEncoding().encode(this.data)
};

public static fromCBOR = (data: Buffer): any => {
  const decoded = new CborEncoding().decode(data);
  // NOTE: 'type' and 'tag' should be defined in the constructor of the class that extends RegistryItem
  return new RegistryItem("BASE_REGISTRY_ITEM", -1, decoded);
};

}
