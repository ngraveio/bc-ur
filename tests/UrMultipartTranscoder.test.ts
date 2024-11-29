import { AssertionError } from "assert";
import { createMultipartUrTranscoder } from "../src/ngraveTranscoder";
import { registryItemFactory } from "../src/classes/RegistryItem";
import { CborEncoding } from "../src/encodingMethods/CborEncoding";
import { globalUrRegistry } from "../src";
import { makeMessage } from "../src/utils";

export class MockRegistryItem extends registryItemFactory({
  tag: 998,
  URType: "custom1",
  CDDL: ``,
}) {}

export class Metadata extends registryItemFactory({
  tag: 999,
  URType: "metadata",
  CDDL: ``,
}) {}

describe("FountainTranscoder", () => {
  describe("MultipartUrTranscoder", () => {
    const { encoder, decoder } = createMultipartUrTranscoder();
    beforeAll(() => {
      // Add the MockRegistryItem to the registry
      globalUrRegistry.addItem(MockRegistryItem);
      globalUrRegistry.addItem(Metadata);
    });
    afterAll(() => {
      // Remove the MockRegistryItem from the registry
      globalUrRegistry.removeItem(MockRegistryItem);
      globalUrRegistry.removeItem(Metadata);
    });
    test("should create 3 fragments when payloadlength is 13 and min/max fragment size is 5", () => {
      const item = new MockRegistryItem("custom");
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
        const decodedFragment = decoder.decodeMultipartUr(
          multipartFragments[0]
        );
        const result = decoder.validateMultipartPayload(
          decodedFragment.payload
        );
        expect(result).toBeDefined();
      });
      test("Should throw an error when a multipart payload is not validated correctly", () => {
        const nonValidPayload = Buffer.from("foobar");
        expect(() =>
          decoder.validateMultipartPayload(nonValidPayload as any)
        ).toThrow(AssertionError);
      });
      test("Should be able to access the properties of the urtype after encoding/decoding", () => {
        const sync_id = Buffer.from("babe0000babe00112233445566778899", "hex");
        const metadata = new Metadata({
          syncId: sync_id,
          device: "my-device",
          languageCode: "en",
          firmwareVersion: "1.0.0",
        });

        const encodedPayload = encoder.encodeUr(metadata, 10, 5);
        const decodedPayload = decoder.decodeUr(encodedPayload);
        expect(decodedPayload).toBeInstanceOf(Metadata);
        expect(decodedPayload.data.syncId).toEqual(metadata.data.syncId);
        expect(decodedPayload.data.device).toEqual(metadata.data.device);
        expect(decodedPayload.data.languageCode).toEqual(
          metadata.data.languageCode
        );
        expect(decodedPayload.data.firmwareVersion).toEqual(
          metadata.data.firmwareVersion
        );
        expect(decodedPayload.type.tag).toEqual(Metadata.tag);
      });
    });
  });
});
