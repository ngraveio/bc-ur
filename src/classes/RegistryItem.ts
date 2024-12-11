import { encodeKeys, decodeKeys, IKeyMap } from "./key.helper.js";

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

  /** allow the keys that are not explicitely defined in the keyMap */
  allowKeysNotInMap?: boolean;

  constructor(
    registryType: IRegistryType,
    data?: any,
    keyMap?: IKeyMap,
    allowKeysNotInMap?: boolean
  ) {
    this.type = registryType;
    this.keyMap = keyMap;
    this.allowKeysNotInMap = allowKeysNotInMap;

    // Verify input
    const { valid, reasons } = this.verifyInput(data);
    if (!valid) {
      throw new Error(
        `Invalid input: ${reasons?.map((r) => r.message).join(", ")}`
      );
    }
    this.data = data;
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
    return `${this.type.URType}[${this.type.tag}](${JSON.stringify(
      this.data
    )})`;
  }

  toJSON() {
    return {
      type: this.type.URType,
      ...this.data,
    };
  }

  /**
   * Preprocess the data before encoding into CBOR Tagged instance
   */
  preCBOR() {
    // If key-map exists, convert keys to integers
    if (this.keyMap) {
      return encodeKeys(this.data, this.keyMap);
    }
    return this.data;
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
    const processed = this.preCBOR();
    return [this.type.tag, processed];
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
export function registryItemFactory(input: IRegistryType) {
  const { tag, URType, CDDL, keyMap, allowKeysNotInMap } = input;
  const _keyMap = keyMap;
  const _allowKeysNotInMap = allowKeysNotInMap ?? true;

  return class extends RegistryItemBase {
    // Add static properties to the class
    static tag: number = tag;
    static URType: string = URType;
    static CDDL: string = CDDL;
    static keyMap: IKeyMap = _keyMap;
    static allowKeysNotInMap: boolean = _allowKeysNotInMap;

    // Initiate base class with the values
    constructor(
      data?: any,
      keyMap: IKeyMap = _keyMap,
      allowKeysNotInMap: boolean = _allowKeysNotInMap
    ) {
      super(input, data, keyMap, allowKeysNotInMap);
    }

    /**
     * Post process the data after decoding CBOR
     */
    static postCBOR(val: any, allowKeysNotInMapOverwrite?: boolean) {
      // If key-map exists, convert integer keys back to string keys
      if (keyMap) {
        return decodeKeys(
          val,
          keyMap,
          allowKeysNotInMapOverwrite ?? allowKeysNotInMap
        );
      }
      return val;
    }

    /**
     * Static method to create an instance from CBOR data.
     * It processes the raw CBOR data if needed and returns a new instance of the class.
     */
    static fromCBORData(val: any, allowKeysNotInMap?: boolean, tagged?: any) {
      // Do some post processing data coming from the cbor decoder
      const data = this.postCBOR(val, allowKeysNotInMap);

      // Return an instance of the generated class
      return new this(data);
    }
  };
}

export type RegistryItemClass = ReturnType<typeof registryItemFactory>;
export type RegistryItem = InstanceType<RegistryItemClass>;
