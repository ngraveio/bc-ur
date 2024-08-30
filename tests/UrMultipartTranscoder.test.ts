import { AssertionError } from "assert";
import { Ur } from "../src/classes/Ur";
import { createMultipartUrTranscoder } from "../src/ngraveTranscoder";
import { makeCborUr } from "./utils";

describe("MultipartUrTranscoder", () => {
    const { encoder, decoder } = createMultipartUrTranscoder()
    test("should create 3 fragments when payloadlength is 13 and min/max fragment size is 5", () => {
      const ur = new Ur({ name: "Pieter" }, { type: "custom" });
  
      const fragmentLength = 5;
      const payloadLength = encoder.cborEncode(ur.payload).length;
      const expectedFragmentLength = Math.ceil(payloadLength / fragmentLength);
  
      const fragments = encoder.encodeUr(ur, fragmentLength, fragmentLength);
  
      expect(fragments.length).toEqual(expectedFragmentLength);
    });
    test("should encode/decode multipart ur's", () => {
      const ur = new Ur({ name: "Pieter" }, { type: "custom" });
      const fragmentLength = 5;
      const fragments = encoder.encodeUr(ur, fragmentLength, fragmentLength);
  
      const decoded = decoder.decodeUr(fragments);
      expect(decoded.payload).toEqual(ur.payload);
    });
    describe("validateMultipartPayload", () => {
      const ur = makeCborUr(100);
      const multipartFragments = encoder.encodeUr(ur, 50, 10);
  
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