import { registryItemFactory } from "../src/classes/RegistryItem";
import { CborEncoding } from "../src/encodingMethods/CborEncoding.js";
import { NativeValues } from "./stubs.test";
const cbor = new CborEncoding();

interface ICborTest {
  bool?: boolean;
  number?: number;
  string?: string;
  array?: any[];
  object?: object;
  map?: Map<any, any>;
  set?: Set<any>;
  undefined?: undefined;
  buffer?: Buffer;
  date?: Date;
  regexp?: RegExp;
  url?: URL;
  rest?: any;
}

/** A registry item that can take any value */
class MyRegistryItem extends registryItemFactory({
  tag: 123,
  URType: "MyRegistryItem",
  CDDL: ``,
}) {}


describe("CBOR Encoder", () => {
  describe("Encode Decode Native Javascript types", () => {
    it("should encode a string", () => {
      const testString = "Hello World!";
      const encoded = cbor.encode(testString);
      const decoded = cbor.decode(encoded);
      expect(decoded).toBe(testString);
    });

    it("should encode a number", () => {
      const testNumber = 1234;
      const encoded = cbor.encode(testNumber);
      const decoded = cbor.decode(encoded);
      expect(decoded).toBe(testNumber);
    });

    it("should encode a boolean", () => {
      const testBoolean = true;
      const encoded = cbor.encode(testBoolean);
      const decoded = cbor.decode(encoded);
      expect(decoded).toBe(testBoolean);
    });

    it("should encode an array", () => {
      const testArray = [1, 2, 3, 4];
      const encoded = cbor.encode(testArray);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testArray);
    });

    it("should encode an object", () => {
      const testObject = { foo: "bar", baz: 1 };
      const encoded = cbor.encode(testObject);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testObject);
    });

    it("should encode a null value", () => {
      const testNull = null;
      const encoded = cbor.encode(testNull);
      const decoded = cbor.decode(encoded);
      expect(decoded).toBe(testNull);
    });

    it("should encode a undefined value", () => {
      const testUndefined = undefined;
      const encoded = cbor.encode(testUndefined);
      const decoded = cbor.decode(encoded);
      expect(decoded).toBe(testUndefined);
    });

    it("should encode a symbol value", () => {
      const testSymbol = Symbol("test");
      const encoded = cbor.encode(testSymbol);
      const decoded = cbor.decode(encoded);
      expect(decoded).toBe(testSymbol);
    });

    it("should encode a BigInt value", () => {
      const testBigInt = BigInt(1234);
      const encoded = cbor.encode(testBigInt);
      const decoded = cbor.decode(encoded);
      expect(decoded).toBe(testBigInt);
    });

    it("should encode a Map", () => {
      const testMap = new Map([
        [1, "one"],
        [2, "two"],
      ]);
      const encoded = cbor.encode(testMap);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testMap);
    });

    it("should encode a Set", () => {
      const testSet = new Set([1, 2, 3]);
      const encoded = cbor.encode(testSet);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testSet);
    });

    it("should encode a Buffer", () => {
      const testBuffer = Buffer.from("hello world");
      const encoded = cbor.encode(testBuffer);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testBuffer);
    });

    it("should encode a Date", () => {
      const testDate = new Date();
      const encoded = cbor.encode(testDate);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testDate);
    });

    it("should encode a RegExp", () => {
      const testRegExp = /hello/;
      const encoded = cbor.encode(testRegExp);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testRegExp);
    });

    it("should encode a URL", () => {
      const testUrl = new URL("https://example.com");
      const encoded = cbor.encode(testUrl);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testUrl);
    });
  });

  describe("Encode Decode Custom Registry Item Types", () => {

    it("should Encode and Decode to same Registry Item Class", () => {
      const testRegistryItem = new MyRegistryItem({});
      const encoded = cbor.encode(testRegistryItem);
      const decoded = cbor.decode(encoded);

      expect(decoded).toBeInstanceOf(MyRegistryItem);
    });

    it("should Encode and Decode to same Registry Item Class with data", () => {
      const testRegistryItem = new MyRegistryItem({ foo: "bar" });
      const encoded = cbor.encode(testRegistryItem);
      const decoded = cbor.decode(encoded);

      expect(decoded).toBeInstanceOf(MyRegistryItem);
      expect(decoded).toEqual(testRegistryItem);
    });

    it("should encode empty NativeValues", () => {
      const testNativeValues = new NativeValues({});
      const encoded = cbor.encode(testNativeValues);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testNativeValues);
    });

    it("should encode NativeValues with data", () => {
      const testNativeValues = new NativeValues({
        bool: true,
        number: 123,
        string: "hello",
        array: [1, 2, 3, ["a", "b", "c"]],
        object: { key: "value" },
        map: new Map([
          [1, "one"],
          [2, "two"],
        ]),
        set: new Set([1, 2, 3]),
        undefined: undefined,
        buffer: Buffer.from("hello"),
        date: new Date(),
        regexp: /hello/,
        url: new URL("https://example.com"),
      });
      const encoded = cbor.encode(testNativeValues);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testNativeValues);
    });

    it("should encode NativeValues with nested objects and types", () => {
      const testNativeValues = new NativeValues({
        rest: {
          parentObject: {
            number: 123,
            string: "hello",
            array: [1, 2, 3, ["a", "b", "c"]],
            childObject: {
              key: "value",
            },
          },
        },
      });

      const encoded = cbor.encode(testNativeValues);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testNativeValues);
    });
  });
});
