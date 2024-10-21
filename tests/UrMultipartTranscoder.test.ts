import { AssertionError } from "assert";
import { createMultipartUrTranscoder } from "../src/ngraveTranscoder";
import { makeMessage } from "./utils";
import { RegistryItem } from "../src/classes/RegistryItem";

describe("MultipartUrTranscoder", () => {
  const { encoder, decoder } = createMultipartUrTranscoder();
  test("should create 3 fragments when payloadlength is 13 and min/max fragment size is 5", () => {
    const item = new RegistryItem("custom");
    const fragmentLength = 5;
    const payloadLength = item.toCBOR().length;
    const expectedFragmentLength = Math.ceil(payloadLength / fragmentLength);

    const fragments = encoder.encodeUr(item, fragmentLength, fragmentLength);

    expect(fragments.length).toEqual(expectedFragmentLength);
  });
  test("should encode/decode multipart ur's", () => {
    const item = new RegistryItem("custom", 0, makeMessage(100));
    const fragmentLength = 5;
    const fragments = encoder.encodeUr(item, fragmentLength, fragmentLength);

    const decoded = decoder.decodeUr(fragments);
    expect(decoded.data).toEqual(item.data);
  });
  describe("validateMultipartPayload", () => {
    const item = new RegistryItem("custom", 0, makeMessage(100));
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
  });
});
