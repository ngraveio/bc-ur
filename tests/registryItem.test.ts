import { registryItemFactory } from "../src/classes/RegistryItem";

describe("Registry Item", () => {
  it("should define an registry item class that has static properties", () => {
    class testItem1 extends registryItemFactory({
      tag: 123,
      URType: "testItem1",
      CDDL: ``,
    }) {}

    expect(testItem1).toHaveProperty("tag");
    expect(testItem1).toHaveProperty("URType");
    expect(testItem1).toHaveProperty("CDDL");

    expect(testItem1.tag).toBe(123);
    expect(testItem1.URType).toBe("testItem1");
    expect(testItem1.CDDL).toBe("");

    expect(testItem1).toHaveProperty("postCBOR");
    expect(testItem1).toHaveProperty("fromCBORData");
  });

  it("should define an registry item instance and instance properties", () => {
    class testItem1 extends registryItemFactory({
      tag: 123,
      URType: "testItem1",
      CDDL: ``,
    }) {}

    const testItem = new testItem1();
    // Check instance type
    expect(testItem).toBeInstanceOf(testItem1);

    // Check intance properties
    expect(testItem).toHaveProperty("type");
    expect(testItem).toHaveProperty("keyMap");
    expect(testItem).toHaveProperty("data");

    expect(testItem.type).toHaveProperty("tag");
    expect(testItem.type).toHaveProperty("URType");
    expect(testItem.type).toHaveProperty("CDDL");
    
    expect(testItem.type.tag).toBe(123);
    expect(testItem.type.URType).toBe("testItem1");
    expect(testItem.type.CDDL).toBe("");

    // Check instance methods
    expect(testItem).toHaveProperty("preCBOR");
    expect(testItem).toHaveProperty("toCBOR");
    expect(testItem).toHaveProperty("verifyInput")
    expect(testItem).toHaveProperty("toString");
    expect(testItem).toHaveProperty("toJSON");
  });

  it("should be able to create an instance with fromCBORData", () => {
    class testItem1 extends registryItemFactory({
      tag: 123,
      URType: "testItem1",
      CDDL: ``,
    }) {}
    
    expect(() => testItem1.fromCBORData({})).not.toThrow();
    expect(testItem1.fromCBORData({})).toBeInstanceOf(testItem1);
  });

  it("should define an registry item instance with data", () => {
    class testItem1 extends registryItemFactory({
      tag: 123,
      URType: "testItem1",
      CDDL: ``,
    }) {}

    const testItem = new testItem1({ foo: "bar" });
    expect(testItem.data).toEqual({ foo: "bar" });
  });

  // Test instance with verifyInput
  it("should define an registry item instance with verifyInput method", () => {
    class testItem1 extends registryItemFactory({
      tag: 123,
      URType: "testItem1",
      CDDL: ``,
    })
    {
      constructor(data: {foo: string, bar?: number}) {
        super(data);
      }

      verifyInput(input: any) {
        let reasons: Error[] = [];

        if (!input.foo == undefined) {
          reasons.push(new Error("Foo is required"));
        }

        if (typeof input.foo !== "string") {
          reasons.push(new Error("Foo should be a string"));
        }

        if(input.bar) {
          if (typeof input.bar !== "number") {
            reasons.push(new Error("Bar should be a number"));
          }
        }

        const valid = reasons.length === 0;
        return { valid, reasons };
      }
    }

    // Test valid input
    expect(() => new testItem1({ foo: "bar" })).not.toThrow();
    expect(() => new testItem1({ foo: "bar", bar: 123 })).not.toThrow();

    // Test invalid input
    //@ts-ignore
    expect(() => new testItem1({})).toThrow();
    //@ts-ignore
    expect(() => new testItem1({ foo: 123 })).toThrow();
    //@ts-ignore
    expect(() => new testItem1({ foo: "bar", bar: "baz" })).toThrow();


    // Test fromCBORData
    expect(() => testItem1.fromCBORData({ foo: "bar" })).not.toThrow();

    // Test invalid input
    //@ts-ignore
    expect(() => testItem1.fromCBORData({})).toThrow();
    //@ts-ignore
    expect(() => testItem1.fromCBORData({ foo: 123 })).toThrow();
    //@ts-ignore
    expect(() => testItem1.fromCBORData({ foo: "bar", bar: "baz" })).toThrow();
  });

  // Test instance with keyMap
  it("should define an registry item instance with keyMap", () => {

    class testItem1 extends registryItemFactory({
      tag: 123,
      URType: "testItem1",
      CDDL: ``,
      keyMap: {
        foo: 1,
        bar: 2,
      }
    }) {}

    const input = { foo: "myString", bar: 123 };
    const testItem = new testItem1(input);
    expect(testItem.keyMap).toEqual({ foo: 1, bar: 2 });

    // Convert keys to integers
    const converted = testItem.preCBOR();
    expect(converted).toBeInstanceOf(Map);
    expect(converted.get(1)).toBe("myString");
    expect(converted.get(2)).toBe(123);

    // Convert back to original
    const convertedBack = testItem1.postCBOR(converted);
    expect(convertedBack).toEqual(input);


    // Test if keys not defined in keyMap are also included
    // TODO: add ability to ignore keys not in keyMap
    const input2 = { foo: "myString", bar: 123, baz: "extra" };
    const testItem2 = new testItem1(input2);
    expect(testItem2.data).toEqual(input2);

    // Convert keys to integers
    const converted2 = testItem2.preCBOR();
    expect(converted2).toBeInstanceOf(Map);
    expect(converted2.get(1)).toBe("myString");
    expect(converted2.get(2)).toBe(123);
    expect(converted2.get("baz")).toBe("extra");

    // Convert back to original
    const convertedBack2 = testItem1.postCBOR(converted2);
    expect(convertedBack2).toEqual(input2);


    // Test if postCBOR works with fromCBORData
    const newInstance = testItem1.fromCBORData(converted2);
    expect(newInstance.data).toEqual(input2);
  });
});