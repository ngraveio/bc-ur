import { stringToUint8Array, uint8ArrayToHex } from "uint8array-extras";
import { RegistryItemBase, registryItemFactory } from "../src/classes/RegistryItem";
import { CborEncoding } from "../src/encodingMethods/CborEncoding";
import { User, UserCollection } from "../src/test.utils";

const cbor = new CborEncoding();

describe("CBOR Encoder", () => {
  describe("Native Javascript types", () => {
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

    it.skip("should encode a BigInt value", () => {
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

    it("should encode a Buffer (only in nodejs)", () => {
      const testBuffer = Buffer.from([1, 2, 3, 4]);
      const encoded = cbor.encode(testBuffer);
      const decoded = cbor.decode(encoded);
      //@ts-ignore
      expect(uint8ArrayToHex(decoded)).toEqual(testBuffer.toString("hex"));
      // uInt8Array is converted to buffer after decoding
      expect(decoded).toEqual(Uint8Array.from(testBuffer));
    });

    it("should encode a UInt8Array but decode as Buffer ( only in nodejs )", () => {
      const testBuffer = new Uint8Array([1, 2, 3, 4]);
      const encoded = cbor.encode(testBuffer);
      const decoded = cbor.decode(encoded);
      // Note by default Buffer is subclass of Uint8Array, so here NODE JS assumes it as Buffer
      // We cannot decode into Buffer and Uint8Array at the same time but
      // Since buffer is subclass of Uint8Array every function that can be used with Uint8Array can be used with Buffer
      // So we can always assume its Uint8Array
      // @ts-ignore
      expect(Uint8Array.from(decoded)).toEqual(testBuffer);
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

  describe("Basic Registry Items", () => {
    // TODO: put these under before all
    /** A registry item that can take any value */
    const MyRegistryItem = class extends registryItemFactory({
      tag: 123,
      URType: "MyRegistryItem",
      CDDL: ``,
    }) {};

    interface ICborTest {
      bool?: boolean;
      number?: number;
      string?: string;
      array?: any[];
      object?: object;
      map?: Map<any, any>;
      set?: Set<any>;
      undefined?: undefined;
      buffer?: Uint8Array;
      date?: Date;
      regexp?: RegExp;
      url?: URL;
      rest?: any;
    }

    /** A registry item that takes javascript native types */
    const NativeValues = class extends registryItemFactory({
      tag: 666,
      URType: "NativeValues",
      CDDL: ``,
    }) {
      constructor(data: ICborTest) {
        super(data);
      }
    };

    beforeAll(() => {
      // Add to registry
      cbor.registry.addItem(MyRegistryItem);
      cbor.registry.addItem(NativeValues);
    });

    it("should Encode and Decode to same Registry Item Class", () => {
      const testRegistryItem = new MyRegistryItem({});
      const encoded = cbor.encode(testRegistryItem);
      const decoded = cbor.decode(encoded);

      expect(decoded).toBeInstanceOf(MyRegistryItem);
    });

    it("should encode into correct CBOR", () => {
      const testRegistryItem = new MyRegistryItem({ foo: "bar" });
      const encoded = cbor.encode(testRegistryItem);

      // 123({"foo": "bar"})
      expect(uint8ArrayToHex(encoded)).toEqual("d87ba163666f6f63626172");
    });

    it("should decode to correct instace from CBOR", () => {
      const encoded = Buffer.from("d87ba163666f6f63626172", "hex");
      const decoded = cbor.decode(encoded);

      expect(decoded).toBeInstanceOf(MyRegistryItem);
      expect(decoded.data).toEqual({ foo: "bar" });
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
        buffer: stringToUint8Array("hello"),
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

    afterAll(() => {
      // Remove items from registry
      cbor.registry.removeItem(MyRegistryItem);
      cbor.registry.removeItem(NativeValues);
    });
  });

  describe("Features for UR", () => {
    describe("Ignore Top Level Tag with ignoreTopLevelTag flag", () => {
      // Define a user
      const user1 = new User({ id: 1, name: "İrfan Bilaloğlu" });
      const user2 = new User({ id: 2, name: "Pieter Uyttersprot" });

      const userCollection = new UserCollection({
        name: "My Collection",
        users: [user1, user2],
      });

      beforeAll(() => {
        cbor.registry.addItem(User);
        cbor.registry.addItem(UserCollection);
      });

      afterAll(() => {
        cbor.registry.removeItem(User);
        cbor.registry.removeItem(UserCollection);
      });

      it("should not tag top level", () => {
        const encoded = cbor.encode(user1, { ignoreTopLevelTag: true });

        // 111({"id": 1, "name": "İrfan Bilaloğlu"}) => ({"id": 1, "name": "İrfan Bilaloğlu"})
        expect(uint8ArrayToHex(encoded)).toEqual("a262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75");
      });

      it("should only remove top level tag in Nested Registry item ", () => {
        const encoded = cbor.encode(userCollection, { ignoreTopLevelTag: true });
        // 112({"name": "My Collection", "users": [111({"id": 1, "name": "İrfan Bilaloğlu"}), 111({"id": 2, "name": "Pieter Uyttersprot"})]})
        // to
        // {"name": "My Collection", "users": [111({"id": 1, "name": "İrfan Bilaloğlu"}), 111({"id": 2, "name": "Pieter Uyttersprot"})]}
        expect(uint8ArrayToHex(encoded)).toEqual(
          "a2646e616d656d4d7920436f6c6c656374696f6e65757365727382d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75d86fa262696402646e616d6572506965746572205579747465727370726f74"
        );
      });
    });

    describe("Unknown Tag", () => {
      it("should decode to UnknownTag item when tag is not in registry", () => {
        // 111({"id": 1, "name": "İrfan Bilaloğlu"})
        const user = "d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75";

        const decoded = cbor.decode(Buffer.from(user, "hex"));

        expect(decoded).toBeInstanceOf(RegistryItemBase);
        expect(decoded.type.tag).toBe(111);
        expect(decoded.type.URType).toBe("unknown-tag");
      });

      it("should decode all nested items to UnknownTag item when tags is not in registry", () => {
        // 112({"name": "My Collection", "users": [111({"id": 1, "name": "İrfan Bilaloğlu"}), 111({"id": 2, "name": "Pieter Uyttersprot"})]})
        const userCollection =
          "d870a2646e616d656d4d7920436f6c6c656374696f6e65757365727382d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75d86fa262696402646e616d6572506965746572205579747465727370726f74";

        const decoded = cbor.decode(Buffer.from(userCollection, "hex"));

        expect(decoded).toBeInstanceOf(RegistryItemBase);
        expect(decoded.type.tag).toBe(112);
        expect(decoded.type.URType).toBe("unknown-tag");
        expect(decoded.data.users[0]).toBeInstanceOf(RegistryItemBase);
        expect(decoded.data.users[1]).toBeInstanceOf(RegistryItemBase);
        expect(decoded.data.users[0].type.tag).toBe(111);
        expect(decoded.data.users[1].type.tag).toBe(111);
        expect(decoded.data.users[0].type.URType).toBe("unknown-tag");
        expect(decoded.data.users[1].type.URType).toBe("unknown-tag");
      });
    });
  });
});
