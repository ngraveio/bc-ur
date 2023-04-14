import { Ur } from "../src/classes/Ur";
import { NgraveTranscoder } from "../src/classes/Transcoder";
import UrFountainEncoder from "../src/classes/UrFountainEncoder";
import { makeMessage } from "./utils";

describe("getFragments", () => {
  const { encoder, decoder, fountainDecoderCreator } = new NgraveTranscoder();
  test("should encode/decode a ur", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    const fragment = encoder.getFragment(ur);
    console.log("fragment", fragment);

    const decodedFragment = decoder.decodeFragment(fragment);
    console.log("decoded", decodedFragment);

    expect(decodedFragment.payload).toEqual(ur.payload);
  });
  test("should encode/decode multipart ur's", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    const fragmentLength = 5
    const fragments = encoder.getFragments(ur, fragmentLength, fragmentLength);
    console.log("fragments", fragments);

    const decoded = decoder.decodeFragments(fragments);
    console.log("decodedFragments", decoded);
    expect(decoded.payload).toEqual(ur.payload);
  });
  test("should create 3 fragments when payloadlength is 13 and min/max fragment size is 5", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });

    const fragmentLength = 5
    const payloadLength = encoder.cborEncode(ur).length;
    const expectedFragmentLength = Math.ceil(payloadLength / fragmentLength);

    const fragments = encoder.getFragments(ur, fragmentLength, fragmentLength);

    expect(fragments.length).toEqual(expectedFragmentLength);
  });
  test("should create 6 fragments when payloadlength is 13 and min/max fragment size is 5, with default redundancy of 2", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });

    const fragmentLength = 5
    const payloadLength = encoder.cborEncode(ur).length;
    const expectedFragmentLength = Math.ceil(payloadLength / fragmentLength);

    const fountainFragments = encoder.getFountainFragments(ur, fragmentLength, fragmentLength);
    console.log("fountainFragments", fountainFragments);
    expect(fountainFragments.length).toEqual(expectedFragmentLength);

    const decoded = decoder.decodeFragments(fountainFragments);
    console.log('decoded', decoded)
  });
  test("should have twice the amount of fragments for a ratio of 1", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });

    const fragmentLength = 5
    const payloadLength = encoder.cborEncode(ur).length;
    const ratio = 1
    const expectedFragmentLength = Math.ceil(payloadLength / fragmentLength) * 2;
    const fountainFragments = encoder.getFountainFragments(ur, fragmentLength, fragmentLength,ratio);
    console.log("fountainFragments", fountainFragments);
    expect(fountainFragments.length).toEqual(expectedFragmentLength );

    const decoded = decoder.decodeFragments(fountainFragments);
    console.log('decoded', decoded)
  });
  test("should be able to fountain encode/decode the payload", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });

    const fountainFragments = encoder.getFountainFragments(ur, 10, 5);
    console.log("fountainFragments", fountainFragments);
    const decoded = decoder.decodeFragments(fountainFragments);

    expect(decoded.payload).toEqual(ur.payload);
  });
  test("should be able to fountain encode/decode the payload with a small maxFragmentLength", () => {
    const message = makeMessage(30);
    const ur = new Ur(message, { type: "custom" });

    const maxFragmentLength = 1
    const fountainFragments = encoder.getFountainFragments(ur, maxFragmentLength, maxFragmentLength);

    const decoded = decoder.decodeFragments(fountainFragments);

    expect(decoded.payload).toEqual(ur.payload);
  });
  test("should be able to encode and decode cbor payload", () => {
    const message = makeMessage(250);
    const ur = new Ur(message, { type: "custom" });

    const fountainFragments = encoder.getFountainFragments(ur, 50, 5,5);
    console.log("fountainFragments", fountainFragments);

    const decoded = decoder.decodeFragments(fountainFragments);
    expect(decoded.payload).toEqual(ur.payload);
  });
  test("using nextpart keeps generating multipart Ur's", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    const fountainEncoder = new UrFountainEncoder(encoder._encodingMethods,ur,10,10)
    const count = 10;
    const parts: string[] = [];
    for (let index = 0; index < count; index++) {
      const part = fountainEncoder.nextPart();
      parts.push(part);
    }
    expect(parts.length).toEqual(count);

    const decoded = decoder.decodeFragments(parts);
    expect(decoded.payload).toEqual(ur.payload)
  });
  test("FountainEncoder encoded ur should be equal to input ur", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    const fountainEncoder = new UrFountainEncoder(encoder._encodingMethods,ur,10,10)
    const count = 10;
    const parts: string[] = [];

    const minimumCount = fountainEncoder.getPureFragmentCount();

    for (let index = 0; index < minimumCount; index++) {
      const part = fountainEncoder.nextPart();
      parts.push(part);
    }

    const decoded = decoder.decodeFragments(parts);
    expect(decoded).toEqual(ur)
  });
  test("FountainEncoder should not be able to decode when the generated fragments are too little", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    const fountainEncoder = new UrFountainEncoder(encoder._encodingMethods,ur,5,5)
    const count = 1;
    const parts: string[] = [];

    for (let index = 0; index < count; index++) {
      const part = fountainEncoder.nextPart();
      parts.push(part);
    }

    const decoded = decoder.decodeFragments(parts);
    expect(decoded).not.toEqual(ur)
  });
});