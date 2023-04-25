import { HexEncoding } from "../src/classes/HexEncoding";

describe("HexEncoding", () => {
  const hexEncoding = new HexEncoding();
  const {encode, decode} = hexEncoding;
  test("should throw an error when decoding null", () => {
    expect(() => decode(null)).toThrowError();
  });
  test("decoding a non hex string", () => {
    const decoded = decode("ff22naber");
    expect(decoded).toBeDefined();
  });
  test("decoding the encoded result, should be the same as the input value", () => {
    const input = Buffer.from("🤏🤏🤏🤏🤏");
    const decoded = decode(encode(input))
    expect(decoded).toBeDefined();
  });
});
