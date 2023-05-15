import { AssertionError } from "assert";
import { NgraveTranscoder } from "../src/classes/Transcoder";
import { makeCborUr } from "./utils";

describe("UrDecoder", () => {
  const { decoder, encoder } = new NgraveTranscoder();
  describe("validateMultipartPayload", () => {
    const ur = makeCborUr(100);
    const multipartFragments = encoder.getFragments(ur, 50, 10);

    test("Should validate a correctly generated fragment", () => {
      const decodedFragment = decoder.decodeMultipartUr(multipartFragments[0]);
      const result = decoder.validateMultipartPayload(decodedFragment.payload);
      expect(result).toBeDefined();
    });
    test("Should throw an error when a multipart payload is not validated correctly", () => {
      const nonValidPayload = Buffer.from("foobar");
      expect(() => decoder.validateMultipartPayload(nonValidPayload)).toThrow(AssertionError);
    });
  });
});
