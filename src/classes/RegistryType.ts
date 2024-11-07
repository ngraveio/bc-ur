import { IRegistryType } from "../interfaces/IRegistryType.js";

export class RegistryType implements IRegistryType {
  constructor(private _type: string, private _tag?: number) {}

  get tag(): number | undefined {
    return this._tag;
  }

  get type(): string {
    return this._type;
  }
}