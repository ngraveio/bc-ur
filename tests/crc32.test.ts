import { hexToUint8Array, stringToUint8Array } from "uint8array-extras";
import { getCRCHex } from "../src/utils";

describe("CRC32", () => {
  test("crc32 results", () => {
    expect(getCRCHex(stringToUint8Array("Hello, world!"))).toBe("ebe6c6e6");
    expect(getCRCHex(stringToUint8Array("Wolf"))).toBe("598c84dc");
    expect(
      getCRCHex(
        hexToUint8Array(
          "d9012ca20150c7098580125e2ab0981253468b2dbc5202d8641947da"
        )
      )
    ).toBe("d22c52b6");
  });
});
