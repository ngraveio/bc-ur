import { RegistryItem, RegistryItemBase } from "./RegistryItem.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { EncodingPipeline } from "../encodingMethods/pipeline.js";
import {
  InvalidPathLengthError,
  InvalidSchemeError,
  InvalidTypeError,
} from "../errors.js";
import { dataPipeline } from "../encodingMethods/index.js";
import { ReplaceKeyType } from "../helpers/type.helper.js";

export interface IUR {
  type: string; // bc-ur type defined in the registry
  payload: string; // encoded data
  seqNum?: number; // sequence number if multipart starting with index 1 - if single part, this is 0
  seqLength?: number; // total number of parts in the multipart message - if single part, this is 0
  isFragment?: boolean; // if the ur is a fragment of a multipart message
}

/**
 * https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md
 * Class that represents the structure of the data we encode/decode in this package.
 * e.g. 'ur:bytes/lpamcmcfatrdcyzcpldpgwhdhtiaiaecgyktgsflguhshthfghjtjngrhsfegtiafegaktgugui'
 *
 *
 * Single part = ur:<type>/<message(payload)>
 * Multi part =  ur:<type>/<seqNum-seqLength>/<fragment(payload)>
 * 
 * CBOR encoding should not include tag on top level when UR has a tag
 * 
 * I want to be able to create UR from encoding normal js types
 * Or from any type in the pipeline
 * 
 * Should i do it on the encoder or ur class itself?
 */
export class UR {
  public type: string;
  public payload: string;
  public seqNum?: number;
  public seqLength?: number;
  public isFragment: boolean;

  static pipeline: EncodingPipeline<any, string> = dataPipeline;

  // If type is unknown it should be cbor, because default encoding will take any and convert to cbor without tagging
  constructor(input: IUR | RegistryItem) {
    // Create from registry item
    if (input instanceof RegistryItemBase) {
      const ur = UR.fromRegistryItem(input as RegistryItem);
      this.type = ur.type;
      this.payload = ur.payload;
      this.seqNum = ur.seqNum;
      this.seqLength = ur.seqLength;
      this.isFragment = ur.isFragment;
    } 
    // Create from raw data
    else if (typeof input == "object" && 'type' in input && 'payload' in input) {
      const { type, payload, seqNum = 0, seqLength = 0 } = input;
      this.payload = payload; 
      this.type = type;
      this.seqNum = seqNum;
      this.seqLength = seqLength;
      this.isFragment = seqLength > 0;
    } 
    else {
      throw new InvalidTypeError();
    }
  }

  // Decode
  decode(until?: EncodingMethodName) {
    return UR.pipeline.decode(this.payload, {until, enforceType: this.isFragment ? undefined : this.type});
  }

  // Get string representation
  toString() {
    return UR.getUrString(this.type, this.payload, this.seqNum, this.seqLength);
  }

  // Get payload in bytewords
  getPayloadBytewords() {
    return this.payload;
  }

  // Get payload in hex
  getPayloadHex() {
    return UR.pipeline.decode<string>(this.payload, { until: EncodingMethodName.hex });
    // TODO: add tag information
  }

  // Get Payload in cbor
  getPayloadCbor() {
    return UR.pipeline.decode<Uint8Array>(this.payload, {until: EncodingMethodName.cbor} );
    // TODO: add tag information
  }

  toRegistryItem() {
    if (this.isFragment) {
      throw new Error(
        "Cannot convert a multipart ur to registry item, it needs to be decoded first"
      );
    }
    // Enforce type
    // registrtqueryByURType
    return UR.decode(this);
  }

  /// Static methods

  static fromRegistryItem(item: RegistryItem) {
    // First convert Registry item to bytewords
    // Only on the top level, we should not include the tag
    const bytewords = UR.pipeline.encode(item, {ignoreTopLevelTag: true});

    // Now create new UR
    return new UR({
      type: item.type.URType,
      payload: bytewords,
    });
  }

  /**
   * Create UR from native javascript types by encoding them to bytewords
   * @param input 
   * @returns 
   */
  static fromData(input: ReplaceKeyType<IUR, 'payload', any>) {
    const bytewords = UR.pipeline.encode(input.payload);

    // Now create new UR
    return new UR({
      ...input,
      payload: bytewords,
    });    
  }

  static fromCbor(input: ReplaceKeyType<IUR, 'payload', Uint8Array>) {
    const bytewords = UR.pipeline.encode(input.payload, { from: EncodingMethodName.cbor });

    return new UR({
      ...input,
      payload: bytewords,
    });      
  }

  static fromHex(input: ReplaceKeyType<IUR, 'payload', string>) {
    const bytewords = UR.pipeline.encode(input.payload, { from: EncodingMethodName.hex });

    return new UR({
      ...input,
      payload: bytewords,
    });    
  }

  static fromBytewords(input: IUR) {
    return new UR({
      ...input,
    });    
  }

  static from(input: ReplaceKeyType<IUR, 'payload', any>, type: EncodingMethodName) {
    switch (type) {
      case EncodingMethodName.bytewords:
        return UR.fromBytewords(input);
      case EncodingMethodName.cbor:
        return UR.fromCbor(input);
      case EncodingMethodName.hex:
        return UR.fromHex(input);
      case EncodingMethodName.ur:
        return UR.fromData(input);
      default:
        throw new Error("Invalid encoding method");
    }
  }

  static fromString(ur: string) {
    return new UR(UR.parseUr(ur));
  }

  static encode = this.fromRegistryItem;
  static decode(ur: UR): RegistryItem {
    // Force cbor type
    return UR.pipeline.decode(ur.payload);
  }

  /**
   * Check if the given string is a valid UR
   * For single part ur, it should be in the form of "ur:<type>/<payload>" which is "ur:<lowercase letters, numbers or dashes>/<bytewords>"
   * For multi part ur, it should be in the form of "ur:<type>/<seqNum-seqLength>/<fragment>" which is "ur:<lowercase letters, numbers or dashes>/<number-number>/<bytewords>"
   * ur uses minimal bytewords encoding style which is a-z and has checksome bytes at the end
   *
   * @param input
   * @returns
   */
  static validate(input: string): boolean {
    // TODO: use bytewords encoding to validate the payload

    const singlePartPattern = /^ur:[a-z0-9-]+\/[a-z]+$/;
    const multiPartPattern = /^ur:[a-z0-9-]+\/[0-9]+-[0-9]+\/[a-z]+$/;

    return singlePartPattern.test(input) || multiPartPattern.test(input);
  }

  /**
   * Generates a UR string from the given type and payload.
   * Single part = ur:<type>/<message(payload)> if seqNum and seqLength are 0
   * Multi part =  ur:<type>/<seqNum-seqLength>/<fragment(payload)>
   */
  static getUrString(
    type: string,
    payload: string,
    seqNum = 0,
    seqLen = 0
  ): string {
    // Single UR
    if (seqNum === 0 && seqLen === 0) {
      return joinUri("ur", [type, payload]);
    }

    // Multi part UR
    const seq = `${seqNum}-${seqLen}`;
    return joinUri("ur", [type, seq, payload]);
  }

  /**
   * Parses a UR and performs basic validation
   * @param message e.g. "UR:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL..."
   */
  static parseUr(message: string): IUR {
    const lowercase = message.toLowerCase(); // e.g. "ur:bytes/6-23/lpamchcfatttcyclehgsdphdhgehfghkkkdl..."

    // check if it is valid ur string
    if (!UR.validate(lowercase)) {
      throw new Error("Invalid UR string");
    }

    const components = lowercase.slice(3).split("/");
    let isFragment = false;
    let seqNum = 0;
    let seqLength = 0;
    let payload = "";

    // Check for the number of components
    switch (components.length) {
      case 2:
        // single part ur
        isFragment = false;
        break;
      case 3:
        // multi part ur
        isFragment = true;
        break;
      default:
        throw new InvalidPathLengthError();
    }

    const type = components[0]; //e.g. "bytes"
    if (isFragment) {
      const seq = components[1]; //e.g. "6-23"
      const [num, length] = seq.split("-").map(Number);
      seqNum = num;
      seqLength = length;
      payload = components[2];
    } else {
      payload = components[1];
    }

    return {
      type,
      payload,
      seqNum,
      seqLength,
      isFragment,
    };
  }
}

/// Helper functions

/**
 * Generates a uri. e.g. 'ur:bytes/6-22/lpamcmcfatrdcyzcpldpgwhdhtiaiaecgyktgsflguhshthfghjtjngrhsfegtiafegaktgugui'
 * @param scheme scheme of the uri. e.g. "ur"
 * @param pathComponents adds additional information to the uri in the form of a path (divided by "/"). e.g. "bytes/6-22/lpamcmcfatrdcyzcpldpgwhdhtiaiaecgyktgsflguhshthfghjtjngrhsfegtiafegaktgugui"
 * @returns the complete uri.
 */
function joinUri(scheme: string, pathComponents: string[]): string {
  const path = pathComponents.join("/");
  return [scheme, path].join(":");
}



/**
 * [seqNum, fragments.length, totalPayloadLength, checksum, fragment]
 * 
 * part = [
 *	uint32 seqNum,
 *	uint seqLen,
 *	uint messageLen,
 *	uint32 checksum,
 *	bytes data
 *  ] 
 */
export type IMultipartUrPayload = [number, number, number, number, Uint8Array];
