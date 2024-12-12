import { registryItemFactory } from "../src/classes/RegistryItem";
import { CborEncoding } from "../src/encodingMethods/CborEncoding";

const cbor = new CborEncoding();

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

  class CoinInfoIgnoreKeys extends registryItemFactory({
    tag: 66666,
    URType: "coin-info-ignore-keys",
    allowKeysNotInMap: false,
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

  beforeEach(() => {
    // Add to registry
    cbor.registry.addItem(CoinInfo);
    cbor.registry.addItem(CoinInfoIgnoreKeys);
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
    expect(encoded.toString("hex")).toEqual(
      "d99d71a30105020367616e61687461726664656e656d65"
    );
  });

  it("should decode to instance if enforced type is given. decoding keys that are not defined in the keyMap", () => {
    // { type: 5, network: 3, anahtar: "deneme" }
    cbor.registry.removeItem(CoinInfo);
    const encoded = Buffer.from(
      "d99d71a30105020367616e61687461726664656e656d65",
      "hex"
    );

    const decoded = cbor.decode(encoded, CoinInfo);

    expect(decoded).toBeInstanceOf(CoinInfo);
    expect(decoded.data).toEqual({ type: 5, network: 3, anahtar: "deneme" });
  });

  it("should decode to instance if enforced type is given. Ignoring keys that are not defined in the keyMap", () => {
    // Make the CoinInfoIgnoreKeys to not allow keys that are not in the map
    CoinInfo.allowKeysNotInMap = false;
    // { type: 5, network: 3, anahtar: "deneme" }
    const encoded = Buffer.from(
      "d99d71a30105020367616e61687461726664656e656d65",
      "hex"
    );

    const decoded = cbor.decode(encoded, CoinInfo);

    expect(decoded).toBeInstanceOf(CoinInfo);
    expect(decoded.data).toEqual({ type: 5, network: 3 });
    // reset the value
    CoinInfo.allowKeysNotInMap = true;
  });

  it("should only encode fields that are defined in the keyMap if allowKeysNotInMap is false", () => {
    const coininfoClean = new CoinInfoIgnoreKeys({ type: 5, network: 3 });
    const encodedCleanAsHex = cbor.encode(coininfoClean).toString("hex");

    const coininfo = new CoinInfoIgnoreKeys({
      type: 5,
      network: 3,
      anahtar: "deneme",
    });
    const encoded = cbor.encode(coininfo);
    expect(encoded.toString("hex")).toEqual(encodedCleanAsHex);
  });

  it("should encode and decode with same the same data, ignore the keys not in the map", () => {
    const coininfo = new CoinInfoIgnoreKeys({
      type: 5,
      network: 3,
      anahtar: "deneme",
    });
    const encoded = cbor.encode(coininfo);
    const decoded = cbor.decode(encoded);
    expect(decoded).toEqual(new CoinInfoIgnoreKeys({ type: 5, network: 3 }));
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

    constructor(data: { string: string; number: number; multiplier: number }) {
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
      const number = this.data.number * this.multiplier;
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
