import { registryItemFactory, RegistryItem } from "../src/classes/RegistryItem";
import { CborEncoding } from "../src/encodingMethods/CborEncoding";
import { User, UserCollection } from "../src/test.utils";

const cbor = new CborEncoding();

// TODO: add types to registry

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
      expect(decoded.toString('hex')).toEqual(testBuffer.toString('hex'));
      expect(decoded).toEqual(testBuffer);
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
      buffer?: Buffer;
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
      expect(encoded.toString("hex")).toEqual("d87ba163666f6f63626172");
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

    afterAll(() => {
      // Remove items from registry
      cbor.registry.removeItem(MyRegistryItem);
      cbor.registry.removeItem(NativeValues);
    });
  });

  describe("Advanced Registry Items", () => {
    const MyRegistryItem = class extends registryItemFactory({
      tag: 123,
      URType: "MyRegistryItem",
      CDDL: ``,
    }) {};


    beforeAll(() => {
      // Add to registry
      cbor.registry.addItem(MyRegistryItem);
      cbor.registry.addItem(User);
      cbor.registry.addItem(UserCollection);
    });

    describe("Registry Item with validation", () => {
      // Define a user
      const userInput = { id: 1, name: "İrfan Bilaloğlu" };
      const user = new User(userInput);

      it("should encode to correct cbor", () => {
        const encoded = cbor.encode(user);
        // 111({"id": 1, "name": "İrfan Bilaloğlu"})
        expect(encoded.toString("hex")).toEqual("d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75");
      });

      it("should decode to correct instance", () => {
        const encoded = Buffer.from("d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75", "hex");
        const decoded = cbor.decode(encoded);
        expect(decoded).toBeInstanceOf(User);
        expect(decoded.data).toEqual(userInput);
      });

      it("should encode and decode to same instance", () => {
        const encoded = cbor.encode(user);
        const decoded = cbor.decode(encoded);
        expect(decoded).toEqual(user);
      });

      it("should throw error if required fields are missing", () => {
        //@ts-ignore
        expect(() => new User({})).toThrow();
      });

      it("should throw error if required fields are wrong type", () => {
        //@ts-ignore
        expect(() => new User({ id: "1", name: "İrfan Bilaloğlu" })).toThrow();
      });

      it("should throw error when decoding if fields are wrong type", () => {
        // 111({"id": "1", "name": 4})
        const encoded = Buffer.from("d86fa26269646131646e616d6504", "hex");
        expect(() => cbor.decode(encoded)).toThrow();
      });
    });

    describe("Decode with enforced type", () => {
      it("should not decode to Registrytem instance if top level is not a tag", () => {
        const encoded = cbor.encode({ 1: 5, extraData: "my extra data" });
        const decoded = cbor.decode(encoded);
        // TODO: type of registry item
        expect(decoded).not.toBeInstanceOf(User);
      });

      it("should decode to the correct RegistryItem when it's already that class and additionally the enforced type is given", () => {
        const encoded = Buffer.from("d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75", "hex");
        // It will already decode to User instance and we will force it again
        const decoded = cbor.decode(encoded, User);
        expect(decoded).toBeInstanceOf(User);
        expect(decoded.data).toEqual({"id": 1, "name": "İrfan Bilaloğlu"});
      });

      it('should decode to instance if enforced type is given even if top level is not a tag', () => {
        // {"id": 1, "name": "İrfan Bilaloğlu"}
        const encoded = Buffer.from("a262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75", 'hex');
        const decoded = cbor.decode(encoded, User);

        expect(decoded).toBeInstanceOf(User);
        expect(decoded.data).toEqual({ id: 1, name: "İrfan Bilaloğlu" });
      });

      it("should throw error if enforced type does not match the tag", () => {
        const simple = new MyRegistryItem({ foo: "bar" });
        const encoded = cbor.encode(simple);
        expect(() => cbor.decode(encoded, User)).toThrow();
      });

      it("should throw error if validation for enforced type fails", () => {
        // 111({"id": "1", "name": 4})
        const encoded = Buffer.from("d86fa26269646131646e616d6504", "hex");
        expect(() => cbor.decode(encoded, User)).toThrow();
      });
    });

    describe("Embedding Registry Items", () => {
      const user1 = new User({ id: 1, name: "İrfan Bilaloğlu" });
      const user2 = new User({ id: 2, name: "Pieter Uyttersprot" });

      const userCollection = new UserCollection({
        name: "My Collection",
        users: [user1, user2],
      });

      it("should encode to correct cbor", () => {
        const encoded = cbor.encode(userCollection);
        // 112({"name": "My Collection", "users": [111({"id": 1, "name": "İrfan Bilaloğlu"}), 111({"id": 2, "name": "Pieter Uyttersprot"})]})
        expect(encoded.toString("hex")).toEqual("d870a2646e616d656d4d7920436f6c6c656374696f6e65757365727382d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75d86fa262696402646e616d6572506965746572205579747465727370726f74");
      });

      it("should decode to correct instance", () => {
        // 112({"name": "My Collection", "users": [111({"id": 1, "name": "İrfan Bilaloğlu"}), 111({"id": 2, "name": "Pieter Uyttersprot"})]})
        const encoded = Buffer.from("d870a2646e616d656d4d7920436f6c6c656374696f6e65757365727382d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75d86fa262696402646e616d6572506965746572205579747465727370726f74", "hex");
        const decoded = cbor.decode(encoded);
        expect(decoded).toBeInstanceOf(UserCollection);
      });

      it("should have the correct class instances after decoding", () => {
        const encoded = cbor.encode(userCollection);
        const decoded = cbor.decode(encoded);

        expect(decoded).toBeInstanceOf(UserCollection);
        expect(decoded.data.users[0]).toBeInstanceOf(User);
        expect(decoded.data.users[1]).toBeInstanceOf(User);

        expect(decoded.data.users[0].data).toEqual(user1.data);
        expect(decoded.data.users[1].data).toEqual(user2.data);
      });
    });

    afterAll(() => {
      // Remove items from registry
      cbor.registry.addItem(MyRegistryItem);
      cbor.registry.removeItem(User);
      cbor.registry.removeItem(UserCollection);
    });
  });

  describe("Registry Items with KeyMap", () => {
    interface ICoinInfo {
      type?: number;
      network?: number;
      anahtar?: string;
    }

    class CoinInfo extends registryItemFactory({
      tag: 40305,
      URType: "coin-info",
      keyMap: {
        type: 1,
        network: 2,
      },
      CDDL: `
        coininfo = #6.40305({
            ? type: uint .default 1, ; values from [SLIP44](https://github.com/satoshilabs/slips/blob/master/slip-0044.md) with high bit turned off
            ? network: int .default 1 ; coin-specific identifier for testnet
            ? myKey: text .default "deneme"
        })
    
        type = 1
        network = 2
    `,
    }) {
      constructor(data: ICoinInfo) {
        super(data);
      }
    }

    beforeAll(() => {
      // Add to registry
      cbor.registry.addItem(CoinInfo);
    });

    it("should convert string keys into integers in cbor encoded data", () => {
      const coininfo = new CoinInfo({ type: 5, network: 3 });
      const encoded = cbor.encode(coininfo);
      // 40305({1: 5, 2: 3})
      expect(encoded.toString("hex")).toEqual("d99d71a201050203");
    });

    it("should not convert keys that are not defined in keymap", () => {
      const coininfo = new CoinInfo({ type: 5, network: 3, anahtar: "deneme" });
      const encoded = cbor.encode(coininfo);
      // 40305({1: 5, 2: 3, "anahtar": "deneme"})
      expect(encoded.toString("hex")).toEqual("d99d71a30105020367616e61687461726664656e656d65");
    });

    it("should encode and decode with same the same data, having the orginal keys", () => {
      const coininfo = new CoinInfo({ type: 5, network: 3, anahtar: "deneme" });
      const encoded = cbor.encode(coininfo);
      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(coininfo);
    });

    afterAll(() => {
      // Remove items from registry
      cbor.registry.removeItem(CoinInfo);
    });
  });

  describe("Registry items with post and pre processors", () => {
    const MyRegistryItem = class extends registryItemFactory({
      tag: 123,
      URType: "MyRegistryItem",
      keyMap: {
        string: 1,
        number: 2,
        multiplier: 3,
      },
      CDDL: ``,
    }) {
      public multiplier: number;

      constructor(data: {
        string: string;
        number: number;
        multiplier: number;
      }) {
        super(data);

        this.multiplier = data.multiplier || 1;
      }

      /**
       * Preprocess the data before encoding into CBOR Tagged instance
       */
      preCBOR() {
        // Converted to Map with keymap
        const data = super.preCBOR();

        // Multiply the numver
        const number = this.data.number * this.multiplier
        // Set the data on the converted map
        data.set(this.keyMap.number, number);

        return data;
      }

      /**
       * Static method to create an instance from CBOR data.
       * It processes the raw CBOR data if needed and returns a new instance of the class.
       */
      static fromCBORData(val: any, tagged?: any) {
        // Do some post processing data coming from the cbor decoder
        const data = this.postCBOR(val);

        // Convert the number back to original value
        const multiplier = data?.multiplier || 1;
        data.number = data.number / multiplier;

        // Return an instance of the generated class
        return new this(data);
      }
    };

    beforeAll(() => {
      // Add to registry
      cbor.registry.addItem(MyRegistryItem);
    });

    it("should run preprocessor before encoding", () => {
      const testItem = new MyRegistryItem({
        string: "hello",
        number: 6,
        multiplier: 2,
      });
      const encoded = cbor.encode(testItem);
      // 123({1: "hello", 2: 12, 3: 2})
      expect(encoded.toString("hex")).toEqual("d87ba3016568656c6c6f020c0302");
    });

    it("should run postprocessor after decoding", () => {
      // // 123({1: "hello", 2: 12, 3: 2})
      const encoded = Buffer.from("d87ba3016568656c6c6f020c0302", "hex");
      const decoded = cbor.decode(encoded);
      expect(decoded).toBeInstanceOf(MyRegistryItem);

      // Check if the number is divided
      expect(decoded.data.number).toBe(6);
    });

    it("should encode and decode with pre and post processors", () => {
      const testItem = new MyRegistryItem({
        string: "hello",
        number: 6,
        multiplier: 2,
      });
      const encoded = cbor.encode(testItem);

      const decoded = cbor.decode(encoded);
      expect(decoded).toEqual(testItem);
    });

    afterAll(() => {
      // Remove items from registry
      cbor.registry.removeItem(MyRegistryItem);
    });
  });
});
