import {
  createFountainUrTranscoder,
  createUrTranscoder,
} from "../src/classes/ngraveTranscoder";
import { UrRegistry } from "../src/registry";
import { User } from "../src/test.utils";

// Define a user
const userInput = { id: 1, name: "İrfan Bilaloğlu" };
const user = new User(userInput);

describe("NgraveTranscoder", () => {
  afterEach(() => {
    UrRegistry.removeItem(User);
  });
  test("Should encoder encode/decode a type", () => {
    // Add the RegistryItem to the registry
    UrRegistry.addItem(User);

    const { encoder, decoder } = createUrTranscoder();

    const encodedPayload = encoder.encodeUr(user);
    const decodedPayload = decoder.decodeUr(encodedPayload);

    expect(decodedPayload).toBeInstanceOf(User);
    expect(decodedPayload.data.id).toEqual(userInput.id);
  });
  test("Should add the input data to the 'contents' prop when item is not added to the registry", () => {
    // 'Forget' to add the RegistryItem to the registry

    const { encoder, decoder } = createUrTranscoder();

    const encodedPayload = encoder.encodeUr(user);
    const decodedPayload = decoder.decodeUr(encodedPayload);

    expect(decodedPayload).not.toBeInstanceOf(User);
  });
  test("encoder encode/decode a primitive value", () => {
    const input = "test";
    const { encoder, decoder } = createUrTranscoder();
    const encodedPayload = encoder.encode(input);
    const decodedPayload = decoder.decode(encodedPayload);
    expect(decodedPayload).toEqual(input);
  });
  test("Transcoder creates Fountain encoder", () => {
    const { fountainEncoderCreator } = createFountainUrTranscoder();
    expect(fountainEncoderCreator).toBeInstanceOf(Function);

    if (fountainEncoderCreator) {
      const fountainEncoder = fountainEncoderCreator(user);
      const part = fountainEncoder.nextPart();
      expect(part).toBeDefined();
    }
  });
});
