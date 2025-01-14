import { AssertionError } from "assert";
import { CborEncoding } from "../src/encodingMethods/CborEncoding";
import {
  createMultipartUrTranscoder,
  createUrTranscoder,
} from "../src/classes/ngraveTranscoder";
import { registryItemFactory } from "../src/classes/RegistryItem";
import { UrRegistry } from "../src/registry";
import { makeMessage } from "../src/helpers/utils";
import { hexToUint8Array } from "uint8array-extras";

export class MockRegistryItem extends registryItemFactory({
  tag: 998,
  URType: "custom1",
  CDDL: ``,
}) {}

export class Metadata extends registryItemFactory({
  tag: 999,
  URType: "metadata",
  CDDL: ``,
}) {}

describe("FountainTranscoder", () => {
  describe("MultipartUrTranscoder", () => {
    const { encoder, decoder } = createMultipartUrTranscoder();
    beforeAll(() => {
      // Add the MockRegistryItem to the registry
      UrRegistry.addItem(MockRegistryItem);
      UrRegistry.addItem(Metadata);
    });
    afterAll(() => {
      // Remove the MockRegistryItem from the registry
      UrRegistry.removeItem(MockRegistryItem);
      UrRegistry.removeItem(Metadata);
    });
    test("should create 3 fragments when payloadlength is 13 and min/max fragment size is 5", () => {
      const item = new MockRegistryItem("custom");
      const fragmentLength = 5;
      const payloadLength = new CborEncoding().encode(item).length;
      const expectedFragmentLength = Math.ceil(payloadLength / fragmentLength);

      const fragments = encoder.encodeUr(item, fragmentLength, fragmentLength);
      // [
      //   "ur:custom1/1-2/lpadaobkcymhnsbgehfetaaxvaiyiapetprelb",
      //   "ur:custom1/2-2/lpaoaobkcymhnsbgehfekpjkjyjljnskrfrolb",
      // ]      

      expect(fragments.length).toEqual(expectedFragmentLength);
    });
    test("should encode/decode multipart ur's", () => {
      const item = new MockRegistryItem(makeMessage(100));
      const fragmentLength = 5;
      const fragments = encoder.encodeUr(item, fragmentLength, fragmentLength);

      const decoded = decoder.decodeUr(fragments);
      expect(decoded.data).toEqual(item.data);
    });
    describe("validateMultipartPayload", () => {
      const item = new MockRegistryItem(makeMessage(100));
      const multipartFragments = encoder.encodeUr(item, 50, 10);
      // [
      //   "ur:custom1/1-3/lpadaxcsincyutkicwayhdcntaaxvahdiemejtswhhylkepmykhhtsytsnoyoyaxaedsuttydmmhhpktpmsrjtgwdpfnsbrtrthtpy",
      //   "ur:custom1/2-3/lpaoaxcsincyutkicwayhdcnoxgwlbaawzuefywkdplrsrjynbvygabwjldapfcsgmghhkhstlhelbknlkuejnbadmssfhvaktwkba",
      //   "ur:custom1/3-3/lpaxaxcsincyutkicwayhdcnfrdpsbiegecpasvssovlgeykssjykklronvsjksotkhemthydawydtaxneurlkosgwcekolrlgcmcl",
      // ]

      test("Should validate a correctly generated fragment", () => {
        const decodedFragment = decoder.decodeMultipartUr(
          multipartFragments[0]
        );
        const result = decoder.validateMultipartPayload(
          decodedFragment.payload
        );
        expect(result).toBeDefined();
      });
      test("Should throw an error when a multipart payload is not validated correctly", () => {
        const nonValidPayload = Buffer.from("foobar");
        expect(() =>
          decoder.validateMultipartPayload(nonValidPayload as any)
        ).toThrow(AssertionError);
      });
      test("Should be able to access the properties of the urtype after encoding/decoding", () => {
        const sync_id = hexToUint8Array("babe0000babe00112233445566778899");
        const metadata = new Metadata({
          syncId: sync_id,
          device: "my-device",
          languageCode: "en",
          firmwareVersion: "1.0.0",
        });

        const encodedPayload = encoder.encodeUr(metadata, 10, 5);
        // [
        //   "ur:metadata/1-9/lpadascsgucyghsoceqdgetaaxvdoxiyjkkkjtiagateadvacm",
        //   "ur:metadata/2-9/lpaoascsgucyghsoceqdgeiegdrdrnaeaerdrnaebyvlfnbegu",
        //   "ur:metadata/3-9/lpaxascsgucyghsoceqdgecpeofygoiyktlonliyieknvtwpfx",
        //   "ur:metadata/4-9/lpaaascsgucyghsoceqdgeihkoiniaihinjnkkdpietplghplt",
        //   "ur:metadata/5-9/lpahascsgucyghsoceqdgeihkoiniaihjzjzhsjtiontueemhn",
        //   "ur:metadata/6-9/lpamascsgucyghsoceqdgekphsioihfxjlieihidihryjssecy",
        //   "ur:metadata/7-9/lpatascsgucyghsoceqdgejtjliyinjpjnkthsjpihkbbywkpe",
        //   "ur:metadata/8-9/lpayascsgucyghsoceqdgehfihjpjkinjljtihehdmtyfdonoe",
        //   "ur:metadata/9-9/lpasascsgucyghsoceqdgedydmdyaeaeaeaeaeaeaefnuefeos",
        // ]        
        const decodedPayload = decoder.decodeUr(encodedPayload);
        expect(decodedPayload).toBeInstanceOf(Metadata);
        expect(decodedPayload.data.syncId).toEqual(metadata.data.syncId);
        expect(decodedPayload.data.device).toEqual(metadata.data.device);
        expect(decodedPayload.data.languageCode).toEqual(
          metadata.data.languageCode
        );
        expect(decodedPayload.data.firmwareVersion).toEqual(
          metadata.data.firmwareVersion
        );
        expect(decodedPayload.type.tag).toEqual(Metadata.tag);
      });
      test("Should be able to decode a single UR", () => {
        const { encoder: singleUrEncoder } = createUrTranscoder();
        const singleUr = singleUrEncoder.encodeUr(item);
        // "ur:custom1/taaxvahdiemejtswhhylkepmykhhtsytsnoyoyaxaedsuttydmmhhpktpmsrjtgwdpfnsboxgwlbaawzuefywkdplrsrjynbvygabwjldapfcsgmghhkhstlhelbknlkuejnbadmssfhfrdpsbiegecpasvssovlgeykssjykklronvsjksotkhemthydawydtaxneurlkosgwcekoutkicway"        
        const decodedPayload = decoder.decodeUr([singleUr]);
        expect(decodedPayload).toBeInstanceOf(MockRegistryItem);
        expect(decodedPayload.data).toEqual(item.data);
      });
    });
  });
});
