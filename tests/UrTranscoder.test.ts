import { RegistryItem } from "../src";
import { Ur } from "../src/classes/Ur";
import { InvalidTypeError } from "../src/errors";
import {createUrTranscoder} from "../src/ngraveTranscoder";

describe("UrEncoder", () => {
  const { encoder, decoder } = createUrTranscoder()

  test("should encode/decode a ur", () => {
    const registryItem = new RegistryItem("custom", 0, { name: "Pieter"});
    const encodedUr = encoder.encodeUr(registryItem);

    const decodedItem = decoder.decodeUr(encodedUr);

    expect(decodedItem.data).toEqual(registryItem.data);
  });
  test("should throw invalid type error for invalid ur type", () => {
    const registryItem = new RegistryItem("è", 0, { name: "Pieter"});
    const encodedUr = encoder.encodeUr(registryItem);

    expect(() => decoder.decodeUr(encodedUr)).toThrow(InvalidTypeError);
  });
});




