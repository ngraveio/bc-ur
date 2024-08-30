import { Ur } from "../src/classes/Ur";
import { InvalidTypeError } from "../src/errors";
import {createUrTranscoder} from "../src/ngraveTranscoder";

describe("UrEncoder", () => {
  const { encoder, decoder } = createUrTranscoder()

  test("should encode/decode a ur", () => {
    const ur = new Ur({ name: "Pieter"}, { type: "custom" });
    const encodedUr = encoder.encodeUr(ur);

    const decodedFragment = decoder.decodeUr(encodedUr);

    expect(decodedFragment.payload).toEqual(ur.payload);
  });
  test("should throw invalid type error for invalid ur type", () => {
    const ur = new Ur({ name: "Pieter" }, { type: "custom" });
    ur.registryType.type = "è";
    const encodedUr = encoder.encodeUr(ur);

    expect(() => decoder.decodeUr(encodedUr)).toThrow(InvalidTypeError);
  });
});




