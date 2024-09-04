import { RegistryType } from '../classes/RegistryType';
import { CborEncoding } from '../encodingMethods/CborEncoding';
import { IRegistryType } from '../interfaces/IRegistryType';

export class RegistryItem {

 private _registryType: IRegistryType;
 private _data: string | Buffer;

 get tag(): number | undefined {
    return this._registryType.tag;
  }

  get type(): string {
    return this._registryType.type;
  }

  get data(): string | Buffer {
    return this._data;
  }

  set data(data: string | Buffer) {
    this._data = data;
  }

constructor(type: string, tag?: number) {
    this._registryType = new RegistryType(type, tag);
}

public toCBOR = (): Buffer => {
  return new CborEncoding().encode(this.data)
};

public static fromCBOR = (data: Buffer): any => {
  return new RegistryItem(new CborEncoding().decode(data));
};

}
