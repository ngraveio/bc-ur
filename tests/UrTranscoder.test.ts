import { registry, RegistryItem } from "../src";
import { InvalidTypeError } from "../src/errors";
import { createUrTranscoder } from "../src/ngraveTranscoder";

// Create a MockRegistryItem class
export class MockRegistryItem extends RegistryItem {
  constructor(dataRaw?: any) {
    super("custom", 0, dataRaw);
  }
}

// add it to the registry
registry["custom"] = new MockRegistryItem();

describe("UrEncoder", () => {
  const { encoder, decoder } = createUrTranscoder();

  test("should encode/decode a ur", () => {
    const registryItem = new MockRegistryItem({ name: "Pieter" });
    const encodedUr = encoder.encodeUr(registryItem);

    const decodedItem = decoder.decodeUr(encodedUr);

    expect(decodedItem.data).toEqual(registryItem.data);
  });
  test("should throw invalid type error for invalid ur type", () => {
    const registryItem = new RegistryItem("è", 0, { name: "Pieter" });
    const encodedUr = encoder.encodeUr(registryItem);

    expect(() => decoder.decodeUr(encodedUr)).toThrow(InvalidTypeError);
  });
});
