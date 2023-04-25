import { AssertionError } from "assert";
import { NgraveTranscoder } from "../src/classes/Transcoder";
import {
  InvalidSchemeError,
  InvalidPathLengthError,
  InvalidSequenceComponentError,
} from "../src/errors";
import { makeCborUr } from "./utils";

describe("UrDecoder", () => {
  const { decoder, encoder } = new NgraveTranscoder();
  describe("parseUr()", () => {
    test("parses a valid simple UR message", () => {
      const message = "UR:BYTES/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL";
      const { bytewords, type, seqLength, seqNum } = decoder.parseUr(message);
      expect(type).toEqual("bytes");
      expect(seqNum).toBeUndefined();
      expect(seqLength).toBeUndefined();
      expect(bytewords).toEqual("lpamchcfatttcyclehgsdphdhgehfghkkkdl");
    });
    test("throw an error when the sequence has a wrong structure", () => {
      const message = "UR:BYTES/6/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL";
      expect(() => decoder.parseUr(message)).toThrow(
        InvalidSequenceComponentError
      );
    });
    test("parses a valid multipart UR message", () => {
      const message = "UR:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL";
      const { bytewords, type, seqLength, seqNum } = decoder.parseUr(message);
      expect(type).toEqual("bytes");
      expect(seqNum).toEqual(6);
      expect(seqLength).toEqual(23);
      expect(bytewords).toEqual("lpamchcfatttcyclehgsdphdhgehfghkkkdl");
    });
    test("throws InvalidSchemeError for invalid scheme", () => {
      const message = "foo:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL";
      expect(() => decoder.parseUr(message)).toThrow(InvalidSchemeError);
    });

    test("throws InvalidPathLengthError for missing path component", () => {
      const message = "UR:BYTES";
      expect(() => decoder.parseUr(message)).toThrow(InvalidPathLengthError);
    });

    test("throws InvalidPathLengthError for having to much path components", () => {
      const message =
        "ur:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL/lolololol";
      expect(() => decoder.parseUr(message)).toThrow(InvalidPathLengthError);
    });
  });
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
