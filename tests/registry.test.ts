import exp from "constants";
import { Bytes, getRegistryItemClassByUrString, registry } from "../src";
import { Ur } from "../src/classes/Ur";
import { createMultipartUrTranscoder, createUrTranscoder } from "../src/ngraveTranscoder";

describe("Regsitry", () => {
  const { encoder, decoder } = createUrTranscoder();
  const {encoder: multipartEncoder, decoder: multipartDecoder} = createMultipartUrTranscoder();
  test("encodes and decodes a registryItem", () => {
    const message = "UR:bytes/LPAMCHCFATTTCYCLEHGSDPHDHGEHFGHKKKDL";
    const RegistryClass = getRegistryItemClassByUrString(message);
    const item = new RegistryClass();
    expect(item).toBeInstanceOf(Bytes);
    const encoded = encoder.encodeUr(item);
    console.log("encoded", encoded);
    const multipartEncoded = multipartEncoder.encodeUr(item, 10, 5);
    console.log('multipartEncoded', multipartEncoded)
    expect(item.type).toEqual("bytes");
    
    const decoded = decoder.decodeUr<Bytes>(encoded);
    console.log("decoded", decoded);
    const multipartDecoded = multipartDecoder.decodeUr(multipartEncoded);
    console.log('multipartDecoded', multipartDecoded)
    expect(decoded).toBeInstanceOf(Bytes);
  });
});
