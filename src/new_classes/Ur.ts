import { CborEncoding } from "../encodingMethods/CborEncoding.js";
import { HexEncoding } from "../encodingMethods/HexEncoding.js";
import { BytewordEncoding } from "../encodingMethods/BytewordEncoding.js";
import { RegistryItem } from "../classes/RegistryItem.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { EncodingPipeline } from "../encodingMethods/pipeline.js";
import {
  InvalidPathLengthError,
  InvalidSchemeError,
  InvalidTypeError,
} from "../errors.js";

// By itself encoding goes like this -> registryItem -> cbor -> hex -> bytewords -> ur -> multipartur
// But i need the input registryItem to have ur type so I need to have access to the registryItem and output Ur directly
// I want to add until or to parameter on encode and decode so we can stop at a certain encoding method
// When decoding, ur can force the type of decoding cbor.

//////////////////

const cborEnc = new CborEncoding();
const hexEnc = new HexEncoding();
const bytewordsEnc = new BytewordEncoding();

// Create a pipeline that encodes registry registryItem -> cbor -> hex -> bytewords
export const registry2Bytewords = new EncodingPipeline<RegistryItem | any, string>([
  cborEnc,
  hexEnc,
  bytewordsEnc,
]);

export interface IUr {
  type: string; // bc-ur type defined in the registry
  payload: string; // encoded data
  seqNum?: number; // sequence number if multipart starting with index 1 - if single part, this is 0
  seqLength?: number; // total number of parts in the multipart message - if single part, this is 0
  isFragment?: boolean; // if the ur is a fragment of a multipart message
}

type IUrInput = IUr | { payload: Uint8Array };

/**
 * https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md
 * Class that represents the structure of the data we encode/decode in this package.
 * e.g. 'ur:bytes/lpamcmcfatrdcyzcpldpgwhdhtiaiaecgyktgsflguhshthfghjtjngrhsfegtiafegaktgugui'
 *
 *
 * Single part = ur:<type>/<message(payload)>
 * Multi part =  ur:<type>/<seqNum-seqLength>/<fragment(payload)>
 */
export class Ur {
  public type: string;
  public payload: string;
  // public tag: number;
  public seqNum?: number;
  public seqLength?: number;
  public isFragment: boolean;

  static pipeline: EncodingPipeline<any, string> = registry2Bytewords;

  constructor(input: IUrInput | RegistryItem) {
    if ('type' in input && 'payload' in input) {
      const { type, payload, seqNum = 0, seqLength = 0 } = input;
      if (typeof payload == "string") {
        this.payload = payload;
      }
      else {
        this.payload = Ur.pipeline.encode(payload);
      }       
      this.type = type;
      this.seqNum = seqNum;
      this.seqLength = seqLength;
      this.isFragment = seqLength > 0;
    } else {
      const ur = Ur.fromRegistryItem(input as RegistryItem);
      this.type = ur.type;
      this.payload = ur.payload;
      this.seqNum = ur.seqNum;
      this.seqLength = ur.seqLength;
      this.isFragment = ur.isFragment;
    }
  }

  // Decode to
  decode(until?: EncodingMethodName) {
    return Ur.pipeline.decode(this.payload, {until});
  }

  // Get string representation
  toString() {
    return Ur.getUrString(this.type, this.payload, this.seqNum, this.seqLength);
  }

  // Get payload in bytewords
  getPayload() {
    return this.payload;
  }

  // Get payload in hex
  getPayloadHex() {
    return Ur.pipeline.decode<string>(this.payload, { until: EncodingMethodName.hex });
  }

  // Get Payload in cbor
  getPayloadCbor() {
    return Ur.pipeline.decode<Uint8Array>(this.payload, {until: EncodingMethodName.cbor} );
  }

  toRegistryItem() {
    if (this.isFragment) {
      throw new Error(
        "Cannot convert a multipart ur to registry item, it needs to be decoded first"
      );
    }
    return Ur.decode(this);
  }

  /// Static methods

  static fromRegistryItem(item: RegistryItem) {
    // First convert Registry item to bytewords
    const bytewords = Ur.pipeline.encode(item);

    // Now create new UR
    return new Ur({
      type: item.type.URType,
      payload: bytewords,
    });
  }

  static fromString(ur: string) {
    return new Ur(Ur.parseUr(ur));
  }

  static encode = this.fromRegistryItem;
  static decode(ur: Ur): RegistryItem {
    // Force cbor type
    return Ur.pipeline.decode(ur.payload);
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
  static parseUr(message: string): IUr {
    const lowercase = message.toLowerCase(); // e.g. "ur:bytes/6-23/lpamchcfatttcyclehgsdphdhgehfghkkkdl..."

    // check if it is valid ur string
    if (!Ur.validate(lowercase)) {
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
