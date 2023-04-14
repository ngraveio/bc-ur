import assert from "assert";
import { InvalidTypeError } from "../errors";
import { RegistryType } from "../interfaces/RegistryType";

export class Ur {
  payload: any;
  registryType: RegistryType;

  constructor(
    payload: any,
    registryType: RegistryType = { type: "bytes", tag: 0 }
  ) {
    if (!Ur.isURType(registryType.type)) {
      throw new InvalidTypeError();
    }
    this.payload = payload;
    this.registryType = registryType;
  }

  /**
   * Gets the registry type of the UR.
   * e.g. bytes,
   * TODO: add link to bc ur registry
   */
  get type(): string {
    return this.registryType.type;
  }

  /**
   * get ur represented as a string
   * @returns Ur object as a string
   */
  getUrString(): string {
    return getUrString(this.type, this.payload);
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
  static encodeUR(pathComponents: string[]): string {
    return Ur.joinUri("ur", pathComponents);
  }

  /**
   * Convert raw data into a Ur object
   * @param payload payload that was encoded
   * @param type registry type of the encoded ur
   * @param tag tag of the ur registry
   * @returns 
   */
  static fromUr(payload: any, registryType: {type: string, tag: number}): Ur {
    const {type, tag} = registryType
    assert(typeof type === 'string', "registry type should be included in the ur payload");
    assert(typeof tag === 'number', "registry type should have a tag");

    return new Ur(payload, { type, tag });
  }
}

export function getUrString(type: string, payload: string): string {
  return Ur.encodeUR([type, payload]);
}
