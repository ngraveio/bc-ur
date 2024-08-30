import { Ur } from "../src/classes/Ur";
import { makeCborUr } from "./utils";
import { InvalidTypeError } from "../src/errors";
import {createMultipartUrTranscoder, createUrTranscoder} from "../src/ngraveTranscoder";
import { AssertionError } from "assert";

describe("UrEncoder", () => {
  const { encoder, decoder } = createUrTranscoder()

  test("should encode/decode a ur", () => {
    const ur = new Ur({ name: "Pieter"}, { type: "custom" });
    const fragment = encoder.encodeUr(ur);

    const decodedFragment = decoder.decodeUr(fragment);

    expect(decodedFragment.payload).toEqual(ur.payload);
  });
  test("should throw invalid type error for invalid ur type", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    ur.registryType.type = "è";
    const fragment = encoder.encodeUr(ur);

    expect(() => decoder.decodeUr(fragment)).toThrow(InvalidTypeError);
  });
});

describe("UrDecoder", () => {
  const { decoder, encoder } = createMultipartUrTranscoder();
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



