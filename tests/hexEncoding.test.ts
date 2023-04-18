import { HexEncoding } from "../src/classes/HexEncoding";

describe("HexEncoding", () => {
    const hexEncoding = new HexEncoding();
    test("should throw an error when decoding null", () => {
        expect(() => hexEncoding.decode(null)).toThrowError();
      });
  test("decoding a non hex string", () => {

    const decoded = hexEncoding.decode("ff22naber");
    expect(decoded).toBeDefined();
  });
});
