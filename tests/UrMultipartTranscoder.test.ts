import { Ur } from "../src/classes/Ur";
import { createMultipartUrTranscoder } from "../src/ngraveTranscoder";

describe("MultipartUrTranscoder", () => {
    const { encoder, decoder } = createMultipartUrTranscoder()
    test("should create 3 fragments when payloadlength is 13 and min/max fragment size is 5", () => {
      const ur = new Ur({ name: "Pieter" }, { type: "custom" });
  
      const fragmentLength = 5;
      const payloadLength = encoder.cborEncode(ur.payload).length;
      const expectedFragmentLength = Math.ceil(payloadLength / fragmentLength);
  
      const fragments = encoder.encodeUr(ur, fragmentLength, fragmentLength);
  
      expect(fragments.length).toEqual(expectedFragmentLength);
    });
    test("should encode/decode multipart ur's", () => {
      const ur = new Ur({ name: "Pieter" }, { type: "custom" });
      const fragmentLength = 5;
      const fragments = encoder.encodeUr(ur, fragmentLength, fragmentLength);
  
      const decoded = decoder.decodeUr(fragments);
      expect(decoded.payload).toEqual(ur.payload);
    });
  });