import { UR } from "./UR.js";
import { encodeKeys, decodeKeys, IKeyMap } from "./key.helper.js";

// Define the symbol
export const registryItemSymbol = Symbol.for("RegistryItemBase");

/**
 * Static interface that RegistryItem classes should implement
 */
export interface IRegistryType {
  /**
   * Cbor Tags
   * Finalized versions defined in: https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml
   */
  tag: number;
  /**
   * Uniform Resource ID
   *
   * Links:
   * - https://developer.blockchaincommons.com/ur/
   * - https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-006-urtypes.md
   * - https://github.com/ngraveio/Research
   * - https://github.com/KeystoneHQ/Keystone-developer-hub/tree/main/research
   *
   */
  URType: string;
  /** CDDL definition for CBOR encoding */
  CDDL: string;
  /** Key name to key in integer map for smaller encoded data size */
  keyMap?: IKeyMap;
  /** allow the keys that are not explicitely defined in the keyMap */
  allowKeysNotInMap?: boolean;
}

export abstract class RegistryItemBase {
  readonly type: IRegistryType;
  /** If CDDL contains keys as numbers, map them to their respective values */
  keyMap: IKeyMap;
  /** Data that our item contains */
  // TODO: should we force this to be a map? It is much safer that way for injection attacks
  data: any;
  static allowKeysNotInMap: any;

  constructor(registryType: IRegistryType, data?: any, keyMap?: IKeyMap) {
    this.type = registryType;
    this.keyMap = keyMap;

    // Verify input
    const { valid, reasons } = this.verifyInput(data);
    if (!valid) {
      throw new Error(`Invalid input: ${reasons?.map((r) => r.message).join(", ")}`);
    }
    this.data = data;
    (this as any)[registryItemSymbol] = true;
  }

  /**
   * Verify the input data
   *
   * @param input
   */
  verifyInput(input: any): { valid: boolean; reasons?: Error[] } {
    // This should be implemented by the child class
    return {
      valid: true,
      reasons: undefined,
    };
  }

  toString(): string {
    return `${this.type.URType}[${this.type.tag}](${JSON.stringify(this.data)})`;
  }

  toJSON() {
    // TODO: if there is any registry item in the data (could be nested or in array), we should call toJSON on them as well
    return {
      type: this.type.URType,
      tag: this.type.tag,
      ...this.data,
    };
  }

  /**
   * Preprocess the data before encoding into CBOR Tagged instance
   *
   * @param data, data before keymap conversion, if left empty, it will use the this.data property
   */
  preCBOR(data = this.data) {
    // If key-map exists, convert keys to integers
    if (this.keyMap) {
      const allowKeysNotInMap = (this.constructor as typeof RegistryItemBase).allowKeysNotInMap;
      return encodeKeys(data, this.keyMap, allowKeysNotInMap);
    }
    return data;
  }

  /**
   * Called by the CBOR encoder for encoding the data
   *
   * [CBOR Docs](https://github.com/hildjj/cbor2?tab=readme-ov-file#tocbor-method)
   *
   * This is the easiest approach, if you can modify the class being encoded.
   * Add a toCBOR() method to your class, which should return a two-element array containing the tag number and data item that encodes your class.
   * If the tag number is NaN, no tag will be written. If you return undefined, nothing will be written.
   * In this case you will likely write custom bytes to the Writer instance that is passed in,
   * perhaps using the encoding options.
   *
   * @param encoder
   * @returns
   */
  toCBOR(_writer, _options) {
    const processed = this.preCBOR(this.data);
    let tag = this.type.tag;
    // TODO: find a better way to ignore top level tag on encoder
    if (_options?.ignoreTopLevelTag) {
      tag = NaN; // Do not tag the top level item
      // Set it back to false for child items
      _options.ignoreTopLevelTag = false;
    }
    return [tag, processed];
  }

  toUr() {
    return new UR(this);
  }

  toHex() {
    return this.toUr().getPayloadHex();
  }

  toBytes() {
    return this.toUr().getPayloadCbor();
  }

  public encodeKeys = encodeKeys;
  public decodeKeys = decodeKeys;

  // Custom inspection method for Node.js
  public [Symbol.for("nodejs.util.inspect.custom")](
    _depth: number,
    inspectOptions: object,
    inspect: (val: unknown, opts: object) => unknown
  ): string {
    return `${this.type.URType}[${this.type.tag}](${inspect(this.data, inspectOptions)})`;
  }
}

/**
 * Factory function to create a new RegistryItem class
 *
 * It injects static properties to the class and does preprocessing when needed
 *
 * @param input
 * @returns
 */
export function registryItemFactory<T extends RegistryItemBase>(input: IRegistryType): RegistryItemClass<T> {
  const { tag, URType, CDDL, keyMap, allowKeysNotInMap = true } = input;
  const _keyMap = keyMap;

  return class extends RegistryItemBase {
    // Add static properties to the class
    static tag: number = tag;
    static URType: string = URType;
    static CDDL: string = CDDL;
    static keyMap: IKeyMap = _keyMap;
    static allowKeysNotInMap: boolean = allowKeysNotInMap;

    // Initiate base class with the values
    constructor(data?: any, keyMap: IKeyMap = _keyMap) {
      super(input, data, keyMap);
    }

    /**
     * Post process the data after decoding CBOR
     */
    static postCBOR(val: any, allowKeysNotInMapOverwrite?: boolean) {
      // If key-map exists, convert integer keys back to string keys
      if (keyMap) {
        return decodeKeys(val, keyMap, allowKeysNotInMapOverwrite ?? allowKeysNotInMap);
      }
      return val;
    }

    static fromUr(ur: UR | string): T {
      const urObj = typeof ur === "string" ? UR.fromString(ur) : ur;
      const decoded = urObj.decode() as unknown;

      return decoded as T;
    }

    static fromHex(hex: string): T {
      const ur = UR.fromHex({ type: URType, payload: hex });
      const decoded = ur.decode() as unknown;

      return decoded as T;
    }

    /**
     * Static method to create an instance from CBOR DataItem data.
     * It processes the raw CBOR data if needed and returns a new instance of the class.
     */
    static fromCBORData(val: any, allowKeysNotInMap?: boolean, tagged?: any) {
      // Do some post processing data coming from the cbor decoder
      const data = this.postCBOR(val, allowKeysNotInMap);

      // Return an instance of the generated class
      return new this(data);
    }

  } as RegistryItemClass<T>;
}

// Helper type to define the RegistryItem class with custom constructors and static properties
export type RegistryItemClass<T extends RegistryItemBase = RegistryItemBase> = {
  new (...args: any[]): T;
  tag: number;
  URType: string;
  CDDL: string;
  keyMap?: IKeyMap;
  allowKeysNotInMap: boolean;
  postCBOR(val: any, allowKeysNotInMapOverwrite?: boolean): any;
  fromCBORData(val: any, allowKeysNotInMap?: boolean, tagged?: any): T;
  fromUr(ur: UR | string): T;
  fromHex(hex: string): T;
};
export type RegistryItem = InstanceType<RegistryItemClass>;

/**
 * Function to check if an object is an instance of RegistryItemBase or its subclasses
 * @param obj - The object to check
 * @returns true if the object is an instance of RegistryItemBase or its subclasses
 */
export function isRegistryItem(obj: any): obj is RegistryItem {
  return (
    obj instanceof RegistryItemBase ||
    (obj && obj[registryItemSymbol] === true) ||
    //(obj && typeof obj.toCBOR === 'function' && typeof obj.toUr === 'function' && typeof obj.toHex === 'function' && typeof obj.toBytes === 'function' && obj.type !== undefined && obj.data !== undefined)
    (obj && typeof obj.toCBOR === 'function' && typeof obj.toUr === 'function' && typeof obj.toHex === 'function' && obj.type !== undefined && obj.data !== undefined)
  );
}
