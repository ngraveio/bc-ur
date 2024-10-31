import { Tagged } from "cbor";
import { encodeKeys, decodeKeys, IKeyMap } from "./key.helper";

/**
 * Static interface that RegistryItem classes should implement
 */
export interface IRegistryType {
  tag: number;
  URType: string;
  CDDL: string;
  keyMap?: IKeyMap;
}

export abstract class RegistryItemBase { //extends Tagged {
  readonly type: IRegistryType;
  /** If CDDL contains keys as numbers, map them to their respective values */
  keyMap: IKeyMap;
  /** Data that our item contains */
  // TODO: should we force this to be a map? It is much safer that way for injection attacks
  data: any; 
  
  constructor(registryType: IRegistryType, data: any, keyMap?: IKeyMap) {
    // super(registryType.tag, data);
    this.type = registryType;
    this.keyMap = keyMap;

    // Verify input
    const { valid, reasons } = this.verifyInput(data);
    if(!valid) {
      throw new Error(`Invalid input: ${reasons?.map(r => r.message).join(", ")}`);
    }
    this.data = data;
  }

  /**
   * Verify the input data 
   * 
   * @param input 
   */
  verifyInput(input: any): { valid: boolean, reasons?: Error[] } {
    // This should be implemented by the child class
    return {
      valid: true,
      reasons: undefined,
    }
  }

  get Tagged() {
    const converted = this.preCBOR();
    return new Tagged(this.type.tag, converted);
  }

  toString(): string {
    return `${this.type.URType}[${this.type.tag}](${JSON.stringify(this.data)})`;
  }

  toJSON() {
    return {
      type: this.type.URType,
      ...this.Tagged.toJSON()
    };
  }

  /**
   * Preprocess the data before encoding into CBOR Tagged instance
   */
  preCBOR() {
    // If key-map exists, convert keys to integers
    if(this.keyMap) {
      return encodeKeys(this.data, this.keyMap);
    }
    return this.data;
  }

  /**
   * Post process the data after decoding CBOR
   */
  static postCBOR(val: any) {
    throw new Error("PostCBOR needs to be implemented on the class as static method");
  }


  /**
   * Called by the CBOR encoder for encoding the data
   * 
   * [CBOR Docs](https://github.com/hildjj/node-cbor/tree/main/packages/cbor#encodecbor-method)
   * 
   * This is the easiest approach, if you can modify the class being encoded.   
   * Add an encodeCBOR method to your class, which takes a single parameter of the encoder currently being used.  
   * Your method should return true on success, else false.  
   * Your method may call encoder.push(buffer) or encoder.pushAny(any) as needed.  
   * 
   * @param encoder 
   * @returns 
   */
  encodeCBOR(encoder) {
    return encoder.pushAny(this.Tagged);
  };
}

/**
 * Factory function to create a new RegistryItem class
 * 
 * It injects static properties to the class and does preprocessing when needed
 * 
 * @param input 
 * @returns 
 */
export function registryItemFactory(input: IRegistryType) {
  const { tag, URType, CDDL, keyMap } = input;
  const _keyMap = keyMap;

  return class extends RegistryItemBase {
    // Add static properties to the class
    static tag: number = tag;
    static URType: string = URType;
    static CDDL: string = CDDL;
    static keyMap: IKeyMap = _keyMap;

    // Initiate base class with the values
    constructor(data: any, keyMap: IKeyMap = _keyMap) {
      super(input, data, keyMap);
    }

    /**
     * Post process the data after decoding CBOR
     */
    static postCBOR(val: any) {
      // If key-map exists, convert integer keys back to string keys
      if(keyMap) {
        return decodeKeys(val, keyMap);
      }
      return val;
    }


    /**
     * Static method to create an instance from CBOR data.
     * It processes the raw CBOR data if needed and returns a new instance of the class.
     */
    static fromCBORData(val: any, tagged?: any) {
      // Do some post processing data coming from the cbor decoder
      const data = this.postCBOR(val);
      
      // Return an instance of the generated class
      return new this(data); 
    }
  }

}

export type RegistryItemClass = ReturnType<typeof registryItemFactory>;
export type RegistryItem = InstanceType<RegistryItemClass>;