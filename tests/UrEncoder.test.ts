import { Ur } from "../src/classes/Ur";
import { NgraveTranscoder } from "../src/classes/Transcoder";
import UrFountainEncoder from "../src/classes/UrFountainEncoder";
import { makeCborUr, makeMessage } from "./utils";
import { InvalidTypeError } from "../src/errors";
import { UrEncoder } from "../src/classes/UrEncoder";
import { BytewordEncoding } from "../src/encodingMethods/BytewordEncoding";
import { CborEncoding } from "../src/encodingMethods/CborEncoding";
import { HexEncoding } from "../src/encodingMethods/HexEncoding";

describe("getFragments", () => {
  const { encoder, decoder } = new NgraveTranscoder<{ name: string }>();
  test("should encode/decode a ur", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    const fragment = encoder.encodeUr(ur);

    const decodedFragment = decoder.decodeFragment(fragment);

    expect(decodedFragment.payload).toEqual(ur.payload);
  });
  test("should throw invalid type error for invalid ur type", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    ur.registryType.type = "è";
    const fragment = encoder.encodeUr(ur);

    expect(() => decoder.decodeFragment(fragment)).toThrow(InvalidTypeError);
  });
  test("should create 3 fragments when payloadlength is 13 and min/max fragment size is 5", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });

    const fragmentLength = 5;
    const payloadLength = encoder.cborEncode(ur).length;
    const expectedFragmentLength = Math.ceil(payloadLength / fragmentLength);

    const fragments = encoder.getFragments(ur, fragmentLength, fragmentLength);

    expect(fragments.length).toEqual(expectedFragmentLength);
  });
  test("should encode/decode multipart ur's", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    const fragmentLength = 5;
    const fragments = encoder.getFragments(ur, fragmentLength, fragmentLength);

    const decoded = decoder.decodeFragments(fragments);
    expect(decoded.payload).toEqual(ur.payload);
  });
  test("should create 10 fragments when payloadlength is 48 and min/max fragment size is 5, with default redundancy of 0", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });

    const fragmentLength = 5;
    // const payloadLength = encoder.cborEncode(ur).length;
    // Math.ceil(payloadLength / fragmentLength);
    const expectedFragmentLength = 10;

    const fountainFragments = encoder.getFountainFragments(
      ur,
      fragmentLength,
      fragmentLength
    );
    expect(fountainFragments.length).toEqual(expectedFragmentLength);
  });
  test("should have 20 fragments for a ratio of 1", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });

    const fragmentLength = 5;
    const ratio = 1;
    // const payloadLength = encoder.cborEncode(ur).length;
    // Math.ceil(payloadLength / fragmentLength) * 2;
    const expectedFragmentLength = 20;

    const fountainFragments = encoder.getFountainFragments(
      ur,
      fragmentLength,
      fragmentLength,
      ratio
    );
    expect(fountainFragments.length).toEqual(expectedFragmentLength);
  });
  test("should be able to fountain encode/decode the payload", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });

    const fountainFragments = encoder.getFountainFragments(ur, 10, 5);
    const decoded = decoder.decodeFragments(fountainFragments);

    expect(decoded.payload).toEqual(ur.payload);
  });
  test("should be able to fountain encode/decode the payload with a small maxFragmentLength", () => {
    const { encoder, decoder } = new NgraveTranscoder<Buffer>();

    const message = makeMessage(30);
    const ur = new Ur(message, { type: "custom" });

    const maxFragmentLength = 1;
    const fountainFragments = encoder.getFountainFragments(
      ur,
      maxFragmentLength,
      maxFragmentLength
    );

    const decoded = decoder.decodeFragments(fountainFragments);

    expect(decoded.payload).toEqual(ur.payload);
  });
  test("should be able to encode and decode cbor payload", () => {
    const { encoder, decoder } = new NgraveTranscoder<Buffer>();

    const message = makeMessage(250);
    const ur = new Ur(message, { type: "custom" });

    const fountainFragments = encoder.getFountainFragments(ur, 50, 5, 5);

    const decoded = decoder.decodeFragments(fountainFragments);
    expect(decoded.payload).toEqual(ur.payload);
  });
  test("using nextpart keeps generating multipart Ur's", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    const fountainEncoder = new UrFountainEncoder(
      encoder.encodingMethods,
      ur,
      10,
      10
    );
    const count = 10;
    const parts: string[] = [];
    for (let index = 0; index < count; index++) {
      const part = fountainEncoder.nextPart();
      parts.push(part);
    }
    expect(parts.length).toEqual(count);

    const decoded = decoder.decodeFragments(parts);
    expect(decoded.payload).toEqual(ur.payload);
  });
  test("FountainEncoder encoded ur should be equal to input ur", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    const fountainEncoder = new UrFountainEncoder(
      encoder.encodingMethods,
      ur,
      10,
      10
    );
    const count = 10;
    const parts: string[] = [];

    const minimumCount = fountainEncoder.getPureFragmentCount();

    for (let index = 0; index < minimumCount; index++) {
      const part = fountainEncoder.nextPart();
      parts.push(part);
    }

    const decoded = decoder.decodeFragments(parts);
    expect(decoded).toEqual(ur);
  });
  test("FountainEncoder should not be able to decode when the generated fragments are too little", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    const fountainEncoder = new UrFountainEncoder(
      encoder.encodingMethods,
      ur,
      5,
      5
    );
    const count = 1;
    const parts: string[] = [];

    for (let index = 0; index < count; index++) {
      const part = fountainEncoder.nextPart();
      parts.push(part);
    }

    const decoded = decoder.decodeFragments(parts);
    expect(decoded).not.toEqual(ur);
  });

  test("Should ignore ur parts of the second ur, that have a different ur types and return the correct result", () => {
    const ur = makeCborUr(40, { type: "1" });
    const ur2 = makeCborUr(20, { type: "2" });
    const fragments1 = encoder.getFragments(ur, 5, 5);
    const fragments2 = encoder.getFragments(ur2, 5, 5);
    // insert elements of the second ur fragments into the first one
    fragments1.splice(1, 0, ...fragments2.slice(0, 3));

    const result = decoder.decodeFragments(fragments1);

    expect(result.payload).toEqual(ur.payload);
  });
});

describe("UrEncoder", () => {
  test("should be able to define a custom input and output type", () => {
    type CurrentType = { numberToEncode: number };
    const encoder = new UrEncoder<CurrentType, string>([
      new CborEncoding(),
      new HexEncoding(),
      // return type actually depends on the return type of the last encoding method.
      new BytewordEncoding(),
    ]);
    const ur = new Ur({ numberToEncode: 9999 }, { type: "custom" });
    const fragment = encoder.encodeUr(ur);
    expect(fragment).toBeDefined()
    expect(typeof fragment).toBe("string")
  });
});
