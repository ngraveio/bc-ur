import { AssertionError } from "assert";
import { createMultipartUrTranscoder } from "../src/ngraveTranscoder";
import { makeMessage } from "./utils";
import { RegistryItem } from "../src/classes/RegistryItem";
import { CryptoPortfolioMetadata } from "../src/classes/CryptoPortfolioMetadata";
import { CborEncoding } from "../src/encodingMethods/CborEncoding";
import { registry } from "../src";

// Create a MockRegistryItem class
export class MockRegistryItem extends RegistryItem {
  constructor(dataRaw?: any) {
    super("custom", 0, dataRaw);
  }
}

// add it to the registry
registry["custom"] = new MockRegistryItem();

describe("MultipartUrTranscoder", () => {
  const { encoder, decoder } = createMultipartUrTranscoder();
  test("should create 3 fragments when payloadlength is 13 and min/max fragment size is 5", () => {
    const item = new RegistryItem("custom");
    const fragmentLength = 5;
    const payloadLength = new CborEncoding().encode(item).length;
    const expectedFragmentLength = Math.ceil(payloadLength / fragmentLength);

    const fragments = encoder.encodeUr(item, fragmentLength, fragmentLength);

    expect(fragments.length).toEqual(expectedFragmentLength);
  });
  test("should encode/decode multipart ur's", () => {
    const item = new MockRegistryItem(makeMessage(100));
    const fragmentLength = 5;
    const fragments = encoder.encodeUr(item, fragmentLength, fragmentLength);

    const decoded = decoder.decodeUr(fragments);
    expect(decoded.data).toEqual(item.data);
  });
  describe("validateMultipartPayload", () => {
    const item = new MockRegistryItem(makeMessage(100));
    const multipartFragments = encoder.encodeUr(item, 50, 10);

    test("Should validate a correctly generated fragment", () => {
      const decodedFragment = decoder.decodeMultipartUr(multipartFragments[0]);
      const result = decoder.validateMultipartPayload(decodedFragment.payload);
      expect(result).toBeDefined();
    });
    test("Should throw an error when a multipart payload is not validated correctly", () => {
      const nonValidPayload = Buffer.from("foobar");
      expect(() =>
        decoder.validateMultipartPayload(nonValidPayload as any)
      ).toThrow(AssertionError);
    });
    test("encoder encode/decode an ngrave type", () => {
      const sync_id = Buffer.from("babe0000babe00112233445566778899", "hex");
      const metadata = new CryptoPortfolioMetadata({
        syncId: sync_id,
        device: "my-device",
        languageCode: "en",
        firmwareVersion: "1.0.0",
      });

      const encodedPayload = encoder.encodeUr(metadata, 10, 5);
      const decodedPayload: CryptoPortfolioMetadata =
        decoder.decodeUr(encodedPayload);

      expect(decodedPayload.getSyncId()).toEqual(metadata.getSyncId());
      expect(decodedPayload.getDevice()).toEqual(metadata.getDevice());
      expect(decodedPayload.getLanguageCode()).toEqual(
        metadata.getLanguageCode()
      );
      expect(decodedPayload.getFirmwareVersion()).toEqual(
        metadata.getFirmwareVersion()
      );
      expect(decodedPayload.tag).toEqual(metadata.tag);
    });
  });
});
