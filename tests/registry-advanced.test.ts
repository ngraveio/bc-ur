import { uint8ArrayToHex } from "../src/helpers/uintArrayHelper";
import { registryItemFactory } from "../src/classes/RegistryItem";
import { CborEncoding } from "../src/encodingMethods/CborEncoding";
import { User, UserCollection } from "../src/test.utils";

const cbor = new CborEncoding();

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
      expect(uint8ArrayToHex(encoded)).toEqual(
        "d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75"
      );
    });

    it("should decode to correct instance", () => {
      const encoded = Buffer.from(
        "d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75",
        "hex"
      );
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
      const encoded = Buffer.from(
        "d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75",
        "hex"
      );
      // It will already decode to User instance and we will force it again
      const decoded = cbor.decode(encoded, {enforceType: User});
      expect(decoded).toBeInstanceOf(User);
      expect(decoded.data).toEqual({ id: 1, name: "İrfan Bilaloğlu" });
    });

    it("should decode to instance if enforced type is given even if top level is not a tag", () => {
      // {"id": 1, "name": "İrfan Bilaloğlu"}
      const encoded = Buffer.from(
        "a262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75",
        "hex"
      );
      const decoded = cbor.decode(encoded, {enforceType: User});

      expect(decoded).toBeInstanceOf(User);
      expect(decoded.data).toEqual({ id: 1, name: "İrfan Bilaloğlu" });
    });

    it("should throw error if enforced type does not match the tag", () => {
      const simple = new MyRegistryItem({ foo: "bar" });
      const encoded = cbor.encode(simple);
      expect(() => cbor.decode(encoded, {enforceType: User})).toThrow();
    });

    it("should throw error if validation for enforced type fails", () => {
      // 111({"id": "1", "name": 4})
      const encoded = Buffer.from("d86fa26269646131646e616d6504", "hex");
      expect(() => cbor.decode(encoded, {enforceType: User})).toThrow();
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
      expect(uint8ArrayToHex(encoded)).toEqual(
        "d870a2646e616d656d4d7920436f6c6c656374696f6e65757365727382d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75d86fa262696402646e616d6572506965746572205579747465727370726f74"
      );
    });

    it("should decode to correct instance", () => {
      // 112({"name": "My Collection", "users": [111({"id": 1, "name": "İrfan Bilaloğlu"}), 111({"id": 2, "name": "Pieter Uyttersprot"})]})
      const encoded = Buffer.from(
        "d870a2646e616d656d4d7920436f6c6c656374696f6e65757365727382d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75d86fa262696402646e616d6572506965746572205579747465727370726f74",
        "hex"
      );
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
    cbor.registry.removeItem(MyRegistryItem);
    cbor.registry.removeItem(User);
    cbor.registry.removeItem(UserCollection);
  });
});
