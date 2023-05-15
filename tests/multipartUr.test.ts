import { MultipartUr } from "../src/classes/MultipartUr";
import { Ur } from "../src/classes/Ur";
import {
  InvalidSequenceComponentError,
  InvalidSchemeError,
  InvalidPathLengthError,
} from "../src/errors";

describe("parseUr()", () => {
  test("parses a valid simple UR message", () => {
    const message = "UR:BYTES/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL";
    const {
      payload: bytewords,
      registryType: { type },
      seqLength,
      seqNum,
    } = Ur.parseUr(message) as any;
    expect(type).toEqual("bytes");
    expect(seqNum).toBeUndefined();
    expect(seqLength).toBeUndefined();
    expect(bytewords).toEqual("lpamchcfatttcyclehgsdphdhgehfghkkkdl");
  });
  test("throw an error when the sequence has a wrong structure", () => {
    const message = "UR:BYTES/6/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL";
    expect(() => MultipartUr.parseUr(message)).toThrow(
      InvalidSequenceComponentError
    );
  });
  test("parses a valid multipart UR message", () => {
    const message = "UR:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL";
    const {
      payload: bytewords,
      registryType: { type },
      seqLength,
      seqNum,
    } = MultipartUr.parseUr(message);
    expect(type).toEqual("bytes");
    expect(seqNum).toEqual(6);
    expect(seqLength).toEqual(23);
    expect(bytewords).toEqual("lpamchcfatttcyclehgsdphdhgehfghkkkdl");
  });
  test("throws InvalidSchemeError for invalid scheme", () => {
    const message = "foo:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL";
    expect(() => MultipartUr.parseUr(message)).toThrow(InvalidSchemeError);
  });

  test("throws InvalidPathLengthError for missing path component", () => {
    const message = "UR:BYTES";
    expect(() => MultipartUr.parseUr(message)).toThrow(InvalidPathLengthError);
  });

  test("throws InvalidPathLengthError for having to much path components", () => {
    const message =
      "ur:BYTES/6-23/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL/lolololol";
    expect(() => MultipartUr.parseUr(message)).toThrow(InvalidPathLengthError);
  });
});
