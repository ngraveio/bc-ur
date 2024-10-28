import { Tagged } from "cbor";
import { TagFunction } from "cbor/types/lib/tagged";

export interface IRegistryType {
  tag: number;
  type: string;
  CDDL?: string;
  keyMap?: IKeyMap;
}

// Interface for the static method requirement
export interface IRegistryItem<T> {
  tag: number;
  type: string;
  CDDL: string;
  new (data: any): T;
  fromCBORData(data: any): T;
  keyMap?: IKeyMap;
}

export type IKeyMap = Record<string, string|number>;

// I want to be able to access the tag and UR type from the class
// I want to be able to access UR properties from the instance
// Note that data doesnt have to be a map or object, it can be just a string or number
export abstract class RegistryItemBase { //extends Tagged {
  readonly registryType: IRegistryType;
  // If CDDL contains keys as numbers, map them to their respective values
  keyMap: IKeyMap;

  // TODO: should we force this to be a map? It is much safer that way for injection attacks
  rawData: any;

  constructor(registryType: IRegistryType, data: any, keyMap?: IKeyMap) {
    this.registryType = registryType;
    this.rawData = data;
    this.keyMap = keyMap;
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
    // If key map exists, convert the data to a map
    if(this.keyMap) {
      return dataToMapHelper(this.rawData, this.keyMap);
    }
    return this.rawData;
  }  

  encodeCBOR(encoder) {
    return encoder.pushAny(this.Tagged);
  };
}

export function registryType(input: IRegistryType) {
  const { tag, type, CDDL, keyMap } = input;
  const _keyMap = keyMap;
  abstract class RegistryItem extends RegistryItemBase {
    // Add static properties to the class
    static tag: number = tag;
    static type: string = type;
    static CDDL: string = CDDL;
    static keyMap: IKeyMap = _keyMap;

    // Initiate base class with the values
    constructor(data: any, keyMap: IKeyMap = _keyMap) {
      super(input, data, keyMap);
    }
  }

  return RegistryItem;
}

export type RegistryItemClass = ReturnType<typeof registryType> & {fromCBORData: TagFunction};
export type RegistryItem = InstanceType<ReturnType<typeof registryType> & {fromCBORData: TagFunction}>;


/** Helper function for encoding data to cbor */
/** TODO: ask Pieter if we can put this into encoder process list */

export function dataToMapHelper(data: object, keyMap: IKeyMap): Map<string|number, any> {
  const map = new Map();
  // If we have a mapping, use it to map the data
  // Check if our data is an object
  if(typeof data !== "object") return undefined;

  // Create a set from the keys of the data
  const keys = new Set(Object.keys(data));

  // Add the keys in the correct order to the map
  for (const key in keyMap) {
    if(data[key]) map.set(keyMap[key], data[key]);
    keys.delete(key);
  }
  
  // Add other keys as string if they are not existent in the map
  keys.forEach(key => {
    map.set(key, data[key]);
  });

  return map;
}

export function mapToDataHelper(data: Map<string|number, any>, keyMap: IKeyMap): object {
  const result = {};
  // If we have a mapping, use it to map the data

  // Get all the keys in the data
  const keys = new Set(data.keys());

  // Add the keys in the correct order
  for (const key in keyMap) {
    if (data.has(keyMap[key])) result[key] = data.get(keyMap[key]);
    keys.delete(keyMap[key]);
  }

  // Add other keys as string if they are not existent in the map
  keys.forEach(key => {
    result[key] = data.get(key);
  });

  return result;
}