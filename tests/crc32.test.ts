import { getCRCHex } from "../src/utils";

describe('CRC32', () => {
  test('crc32 results', () => {
    expect(getCRCHex(Buffer.from('Hello, world!', 'utf-8')))
      .toBe('ebe6c6e6');
    expect(getCRCHex(Buffer.from('Wolf', 'utf-8')))
      .toBe('598c84dc');
    expect(getCRCHex(Buffer.from('d9012ca20150c7098580125e2ab0981253468b2dbc5202d8641947da', 'hex')))
      .toBe('d22c52b6');
  });

});