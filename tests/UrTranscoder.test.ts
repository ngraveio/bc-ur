import { globalUrRegistry } from "../src";
import { registryItemFactory } from "../src/classes/RegistryItem";
import { InvalidTypeError } from "../src/errors";
import { createUrTranscoder } from "../src/ngraveTranscoder";

export class MockRegistryItem extends registryItemFactory({
  tag: 998,
  URType: "custom1",
  CDDL: ``,
}) {}

export class InvalidRegistryItem extends registryItemFactory({
  tag: 0,
  URType: "è",
  CDDL: ``,
}) {}

describe("UrEncoder", () => {
  const { encoder, decoder } = createUrTranscoder();
  beforeAll(() => {
    // Add the MockRegistryItem to the registry
    globalUrRegistry.addItem(MockRegistryItem);
    globalUrRegistry.addItem(InvalidRegistryItem);
  });

  afterAll(() => {
    // Clear the registry
    globalUrRegistry.removeItem(MockRegistryItem);
    globalUrRegistry.removeItem(InvalidRegistryItem);
  });

  test("should encode/decode a ur", () => {
    const registryItem = new MockRegistryItem({ name: "Pieter" });
    const encodedUr = encoder.encodeUr(registryItem);
    // 'ur:custom1/taaxvaoyiejthsjnihiygdinihjyihjpdsfdylay'

    const decodedItem = decoder.decodeUr(encodedUr);

    expect(decodedItem.data).toEqual(registryItem.data);
  });
  test("should throw invalid type error for invalid ur type", () => {
    const registryItem = new InvalidRegistryItem({ name: "Pieter" });
    const encodedUr = encoder.encodeUr(registryItem);
    // ur:è/rtoyiejthsjnihiygdinihjyihjpkogsrlsr

    expect(() => decoder.decodeUr(encodedUr)).toThrow(InvalidTypeError);
  });
});
