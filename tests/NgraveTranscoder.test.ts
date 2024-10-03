import { RegistryItem } from "../src";
import { CryptoPortfolioMetadata } from "../src/classes/CryptoPortfolioMetadata";
import {
  createFountainUrTranscoder,
  createUrTranscoder,
} from "../src/ngraveTranscoder";

describe("NgraveTranscoder", () => {
  test("encoder encode/decode an ngrave type", () => {
    const sync_id = Buffer.from("babe0000babe00112233445566778899", "hex");
    const metadata = new CryptoPortfolioMetadata({
      syncId: sync_id,
      device: "my-device",
      languageCode: "en",
      firmwareVersion: "1.0.0",
    });

    const { encoder, decoder } = createUrTranscoder();

    const encodedPayload = encoder.encodeUr(metadata);
    const decodedPayload =
      decoder.decodeUr<CryptoPortfolioMetadata>(encodedPayload);

    expect(decodedPayload).toBeInstanceOf(CryptoPortfolioMetadata);
    expect(decodedPayload.getSyncId()).toEqual(metadata.getSyncId());
    expect(decodedPayload.getDevice()).toEqual(metadata.getDevice());
    expect(decodedPayload.getLanguageCode()).toEqual(
      metadata.getLanguageCode()
    );
    expect(decodedPayload.getFirmwareVersion()).toEqual(
      metadata.getFirmwareVersion()
    );
    expect(decodedPayload.tag).toEqual(metadata.tag);
  });
  test("encoder encode/decode a primitive value", () => {
    const input = "test";
    const { encoder, decoder } = createUrTranscoder();
    const encodedPayload = encoder.encode(input);
    const decodedPayload = decoder.decode(encodedPayload);
    expect(decodedPayload).toEqual(input);
  });
  test("encoder encode/decode an object", () => {
    const input = { value: "this is a test value" };
    const { encoder, decoder } = createUrTranscoder();
    const encodedPayload = encoder.encode(input);
    const decodedPayload = decoder.decode(encodedPayload);
    expect(decodedPayload).toEqual(input);
  });
  test("encoder encode/decode an array", () => {
    const input = [1, 2, 3, 4, 5];
    const { encoder, decoder } = createUrTranscoder();
    const encodedPayload = encoder.encode(input);
    const decodedPayload = decoder.decode(encodedPayload);
    expect(decodedPayload).toEqual(input);
  });
  test("Transcoder creates Fountain encoder", () => {
    const { fountainEncoderCreator } = createFountainUrTranscoder();
    expect(fountainEncoderCreator).toBeInstanceOf(Function);

    if (fountainEncoderCreator) {
      const fountainEncoder = fountainEncoderCreator(new RegistryItem("test"));
      const part = fountainEncoder.nextPart();
      expect(part).toBeDefined();
    }
  });
});
