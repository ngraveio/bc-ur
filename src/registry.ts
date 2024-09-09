import { RegistryItem } from "./classes/RegistryItem";
import { CborEncoding } from "./encodingMethods/CborEncoding";

/**
 * Example implementation of a RegistryItem
 */
export class Bytes extends RegistryItem {
  constructor(dataRaw?: any) {
    super("bytes", 0, dataRaw);
  }

  public static fromCBOR = (data: Buffer): Bytes => {
    return new Bytes(new CborEncoding().decode(data));
  };
}

// RegistryItemClass is a type that enforces that the class has a static method fromCBOR
type RegistryItemClass<T extends RegistryItem> = {
  new (...args: any[]): RegistryItem;
  fromCBOR(data: Buffer): T;
};

export const registry: { [type: string]: RegistryItemClass<any> } = {
  bytes: Bytes,
};

/**
 * This function is used to get the correct RegistryItem class from the registry
 * and ensures that the default class is returned if none were found.
 * @param type registry type
 * @returns
 */
export function getItemFromRegistry(type: string): RegistryItemClass<any> {
  return registry[type] || RegistryItem;
}
