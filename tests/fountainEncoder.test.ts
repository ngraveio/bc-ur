import { makeMessage } from "./utils";
import { NgraveTranscoder } from "../src/classes/Transcoder";
import { Ur } from "../src/classes/Ur";
import { IMultipartUr, MultipartUr } from "../src/classes/MultipartUr";

// TODO: check to reuse tests
describe("Fountain Encoder", () => {
  const { fountainEncoderCreator } = new NgraveTranscoder();
  describe("finds fragment length", () => {
    const fountainEncoder = fountainEncoderCreator(new Ur(null));

    const messageLength = 12345;
    const minFragmentLength = 1005;
    const maxFragmentLength = 1955;
    const fragmentLength = fountainEncoder.findNominalFragmentLength(
      messageLength,
      minFragmentLength,
      maxFragmentLength
    );

    test("fragments are within bounds", () => {
      expect(fragmentLength).toBeLessThan(maxFragmentLength);
      expect(fragmentLength).toBeGreaterThan(minFragmentLength);
    });
    test("last fragment is within bounds", () => {
      expect(messageLength % fragmentLength).toBeGreaterThan(minFragmentLength);
      expect(messageLength % fragmentLength).toBeLessThan(maxFragmentLength);
    });
  });

  test("is complete", () => {
    const message = makeMessage(256);
    const encoder = fountainEncoderCreator(new Ur(message),30);
    let generatedParts = 0;
    let part = ""
    while (!encoder.isComplete()) {
      part = encoder.nextPart();
      generatedParts += 1;
    }
    const parsedPart = MultipartUr.parseUr(part) as IMultipartUr

    expect(parsedPart.seqLength).toBe(generatedParts);
  });
});
