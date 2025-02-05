import { stringToUint8Array } from "../src/helpers/uintArrayHelper";
import { HexEncoding } from "../src/encodingMethods/HexEncoding";

describe("HexEncoding", () => {
  const hexEncoding = new HexEncoding();
  const { encode, decode } = hexEncoding;
  test("should throw an error when decoding null", () => {
    expect(() => decode(null as unknown as string)).toThrow();
  });
  test("decoding a non-hex string", () => {
    expect(() => decode("ff22naber")).toThrow("Invalid hex string");
  });
  test("decoding the encoded result, should be the same as the input value", () => {
    const input = stringToUint8Array("🤏🤏🤏🤏🤏");
    const decoded = decode(encode(input));
    expect(decoded).toBeDefined();
  });
});
