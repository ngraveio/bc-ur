import { Ur } from "../src/classes/Ur";
import { NgraveTranscoder } from "../src/classes/Transcoder";
import { makeMessage } from "./utils";

describe("getFragments", () => {
  const { encoder, decoder } = new NgraveTranscoder();
  test("should encode/decode a ur", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom", tag: 0 });
    const fragment = encoder.getFragment(ur);
    console.log("fragment", fragment);

    const decodedFragment = decoder.decodeFragment(fragment);
    console.log("decoded", decodedFragment);

    expect(decodedFragment.payload).toEqual(ur.payload);
  });
  test("should encode/decode multipart ur's", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom", tag: 0 });

    const fragments = encoder.getFragments(ur, 5, 5);
    console.log("fragments", fragments);

    const decoded = decoder.decodeFragments(fragments);
    console.log("decodedFragments", decoded);
    expect(decoded.payload).toEqual(ur.payload);
  });
  test("should create 3 fragments when payloadlength is 13 and min/max fragment size is 5", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom", tag: 0 });

    const fragments = encoder.getFragments(ur, 5, 5);

    expect(fragments.length).toEqual(3);
  });
  test("should create 6 fragments when payloadlength is 13 and min/max fragment size is 5, with default redundancy of 2", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom", tag: 0 });

    const fountainFragments = encoder.getFountainFragments(ur, 5, 5);
    console.log("fountainFragments", fountainFragments);
    expect(fountainFragments.length).toEqual(6);

    const decoded = decoder.decodeFragments(fountainFragments);
    console.log('decoded', decoded)
  });
  test("should create 30 fragments when payloadlength is 13 and min/max fragment size is 5, with redundancy of 10", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom", tag: 0 });

    const fountainFragments = encoder.getFountainFragments(ur, 5, 5,10);
    console.log("fountainFragments", fountainFragments);
    expect(fountainFragments.length).toEqual(30);

    const decoded = decoder.decodeFragments(fountainFragments);
    console.log('decoded', decoded)
  });
  test("should be able to decode the payload even if there are fountain fragments", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom", tag: 0 });

    const fountainFragments = encoder.getFountainFragments(ur, 5, 5,10);
    console.log("fountainFragments", fountainFragments);
    expect(fountainFragments.length).toEqual(30);

    const decoded = decoder.decodeFragments(fountainFragments);
    expect(decoded.payload).toEqual(ur.payload);
  });
  test("should be able to encode and decode cbor payload", () => {
    const message = makeMessage(250);
    const ur = new Ur(message, { type: "custom", tag: 0 });

    const fountainFragments = encoder.getFountainFragments(ur, 50, 5,5);
    console.log("fountainFragments", fountainFragments);

    const decoded = decoder.decodeFragments(fountainFragments);
    expect(decoded.payload).toEqual(ur.payload);
  });
});
