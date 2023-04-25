import { NgraveTranscoder } from "../src/classes/Transcoder";
import { Ur } from "../src/classes/Ur";

describe("NgraveTranscoder", () => {
  test("encoder encode/decode a primitive value", () => {
    const input = "test";
    const { encoder, decoder } = new NgraveTranscoder();
    const encodedPayload = encoder.encode(input);
    const decodedPayload = decoder.decode(encodedPayload);
    expect(decodedPayload).toEqual(input);
  });
  test("encoder encode/decode an object", () => {
    const input = { value: "this is a test value" };
    const { encoder, decoder } = new NgraveTranscoder();
    const encodedPayload = encoder.encode(input);
    const decodedPayload = decoder.decode(encodedPayload);
    expect(decodedPayload).toEqual(input);
  });
  test("encoder encode/decode an array", () => {
    const input = [1, 2, 3, 4, 5];
    const { encoder, decoder } = new NgraveTranscoder();
    const encodedPayload = encoder.encode(input);
    const decodedPayload = decoder.decode(encodedPayload);
    expect(decodedPayload).toEqual(input);
  });
  test("Transcoder creates Fountain encoder", () => {
    const transcoder = new NgraveTranscoder();
    const { fountainEncoderCreator } = transcoder;
    expect(fountainEncoderCreator).toBeInstanceOf(Function);

    if (fountainEncoderCreator) {
      const fountainEncoder = fountainEncoderCreator(new Ur("test"));
      const part = fountainEncoder.nextPart();
      expect(part).toBeDefined();
    }
  });
});
