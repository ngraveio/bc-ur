import assert from "assert";
import { InvalidPathLengthError, InvalidSchemeError, InvalidTypeError } from "../errors";
import { RegistryType } from "../interfaces/RegistryType";

export interface IUr<T> {
  payload: T;
  registryType: RegistryType;
}
/**
 * Class that represents the structure of the data we encode/decode in this package.
 * e.g. 'ur:bytes/lpamcmcfatrdcyzcpldpgwhdhtiaiaecgyktgsflguhshthfghjtjngrhsfegtiafegaktgugui'
 * Based on the bc definition. TODO: add link to bc ur registry
 */
export class Ur<T> implements IUr<T> {
  payload: T; // TODO: this is a dataItem object
  registryType: RegistryType;

  constructor(
    payload: T,
    registryType: RegistryType = { type: "bytes", tag: undefined }
  ) {
    if (!Ur.isURType(registryType.type)) {
      throw new InvalidTypeError();
    }
    this.payload = payload;
    this.registryType = registryType;
  }

  /**
   * Gets the registry type of the UR.
   * e.g. bytes
   */
  get type(): string {
    return this.registryType.type;
  }

  get tag(): number | undefined {
    return this.registryType.tag;
  }

  /**
   * Checks if the given type is a valid UR type (consisting of lowercase letters, numbers or dashes)
   * @param type the type to be checked
   * @returns true if the type is a valid UR type
   */
  static isURType = (type: string): boolean => {
    const pattern = /^[a-z0-9-]*$/;
    return pattern.test(type);
  };

  /**
   * Generates a uri. e.g. 'ur:bytes/6-22/lpamcmcfatrdcyzcpldpgwhdhtiaiaecgyktgsflguhshthfghjtjngrhsfegtiafegaktgugui'
   * @param scheme scheme of the uri. e.g. "ur"
   * @param pathComponents adds additional information to the uri in the form of a path (divided by "/"). e.g. "bytes/6-22/lpamcmcfatrdcyzcpldpgwhdhtiaiaecgyktgsflguhshthfghjtjngrhsfegtiafegaktgugui"
   * @returns the complete uri.
   */
  private static joinUri(scheme: string, pathComponents: string[]): string {
    const path = pathComponents.join("/");
    return [scheme, path].join(":");
  }

  /**
   * appends the 'ur' scheme to the uri.
   * @param pathComponents
   * @returns
   */
  static combineUR(pathComponents: string[]): string {
    return Ur.joinUri("ur", pathComponents);
  }

  /**
   * Convert raw data into a Ur object
   * @param payload payload that was encoded
   * @param type registry type of the encoded ur
   * @param tag tag of the ur registry
   * @returns 
   */
  static toUr<U>(payload: U, registryType: RegistryType): Ur<U> {
    const {type} = registryType
    assert(typeof type === 'string', "registry type should be included in the ur payload");

    return new Ur(payload, { type });
  }

    /**
   * Parses a UR and performs basic validation
   * @param message e.g. "UR:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL..."
   * @returns `{
    type: string;
    bytewords: string;
  }` // e.g.
  {
    type: "bytes",
    bytewords: "lpamchcfatttcyclehgsdphdhgehfghkkkdl..."",
  } 
   */
  static parseUr(message: string): IUr<string>{
    const lowercase = message.toLowerCase(); // e.g. "ur:bytes/6-23/lpamchcfatttcyclehgsdphdhgehfghkkkdl..."
    const prefix = lowercase.slice(0, 3);

    if (prefix !== "ur:") {
      throw new InvalidSchemeError();
    }

    const components = lowercase.slice(3).split("/");

    if (components.length !== 2 ) {
      throw new InvalidPathLengthError();
    }

    const type = components[0]; //e.g. "bytes"

    if (!Ur.isURType(type)) {
      throw new InvalidTypeError();
    }

    // singlePart ur
    return {
      registryType: {type},
      payload: components[1],
    };
  }
}

export function getUrString(type: string, payload: string): string {
  return Ur.combineUR([type, payload]);
}
