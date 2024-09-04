import { Bytes, getFromRegistryByUrString, registry } from "../src";
import { Ur } from "../src/classes/Ur";
import { createMultipartUrTranscoder, createUrTranscoder } from "../src/ngraveTranscoder";

describe("Regsitry", () => {
  const { encoder, decoder } = createUrTranscoder();
  const {encoder: multipartEncoder, decoder: multipartDecoder} = createMultipartUrTranscoder();
  test("encodes and decodes a registryItem", () => {
    const message = "UR:bytes/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL";
    const RegistryClass = getFromRegistryByUrString(message);
    const UrHexString = new Ur(new RegistryClass());
    const encoded = encoder.encodeUr(UrHexString);
    console.log("encoded", encoded);
    const multipartEncoded = multipartEncoder.encodeUr(UrHexString, 10, 5);
    console.log('multipartEncoded', multipartEncoded)
    expect(UrHexString.registryItem.type).toEqual("bytes");
    
    const decoded = decoder.decodeUr<Bytes>(encoded);
    console.log("decoded", decoded);
    const multipartDecoded = multipartDecoder.decodeUr(multipartEncoded);
    console.log('multipartDecoded', multipartDecoded)
    expect(decoded.registryItem).toBeInstanceOf(Bytes);
  });
});
