import { Tagged } from "cbor";
import { TagFunction } from "cbor/types/lib/tagged";

export interface IRegistryType {
  tag: number;
  type: string;
  CDDL: string;
}

// Interface for the static method requirement
export interface IRegistryItem<T> {
  tag: number;
  type: string;
  CDDL: string;
  new (data: any): T;
  fromCBORData(data: any): T;
}

// I want to be able to access the tag and UR type from the class
// I want to be able to access UR properties from the instance
// Note that data doesnt have to be a map or object, it can be just a string or number
export abstract class RegistryItemBase { //extends Tagged {
  readonly registryType: IRegistryType;

  // TODO: should we force this to be a map? It is much safer that way for injection attacks
  rawData: any;

  constructor(registryType: IRegistryType, data: any, keyMap: Record<string, string|number> = {}) {
    this.registryType = registryType;
    this.rawData = data;
  }

  get data() {
    return this.rawData;
  };

  get Tagged() {
    const converted = this.toCBORData();
    return new Tagged(this.registryType.tag, converted);
  }

  toString(): string {
    return `${this.registryType.type}[${this.registryType.tag}](${JSON.stringify(this.data)})`;
  }

  toJSON() {
    return {
      type: this.registryType.type,
      ...this.Tagged.toJSON()
    };
  }

  toCBORData() {
    // If our data is a map, we can do conversion here
    return this.rawData;
  }  

  encodeCBOR(encoder) {
    return encoder.pushAny(this.Tagged);
  };
}

export function registryType(input: IRegistryType) {
  const { tag, type, CDDL } = input;
  abstract class RegistryItem extends RegistryItemBase {
    // Add static properties to the class
    static tag: number = tag;
    static type: string = type;
    static CDDL: string = CDDL;

    // Initiate base class with the values
    constructor(data: any) {
      super(input, data);
    }
  }

  return RegistryItem;
}

export type RegistryItemClass = ReturnType<typeof registryType> & {fromCBORData: TagFunction};
export type RegistryItem = InstanceType<ReturnType<typeof registryType> & {fromCBORData: TagFunction}>;



  // /**
  //  * Based on class CDDL, convert the data to a map and keep the order
  //  * If CDDL contains keys as numbers, map them to their respective values
  //  */
  // toMap(data: object): Map<string|number, any> {
  //   // If all the keys are strings, then we dont need to map them
  //   const map = new Map();
  //   // If we have a mapping, use it to map the data
  //   for (const key in this.keyMap) {
  //     map.set(this.keyMap[key], this.rawData[key]);
  //   }

  //   return map;
  // }

  export function dataToMapHelper(data: object, keyMap: Record<string, string|number>): Map<string|number, any> {
    const map = new Map();
    // If we have a mapping, use it to map the data
    // Check if our data is an object
    if(typeof data !== "object") return undefined;

    for (const key in keyMap) {
      if(data[key]) map.set(keyMap[key], data[key]);
    }

    return map;
  }