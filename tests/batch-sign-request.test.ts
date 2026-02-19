import { BatchSignRequest, UR, UrRegistry } from "../src/index.js";

describe("BatchSignRequest", () => {
  it("should have correct static properties", () => {
    expect(BatchSignRequest.tag).toBe(41413);
    expect(BatchSignRequest.URType).toBe("batch-sign-request");
    expect(BatchSignRequest.CDDL).toBe("batch-sign-request = [+ sign-request]");
  });

  it("should create a batch sign request with array of requests", () => {
    const signRequests = [
      { txid: "tx1", data: "data1" },
      { txid: "tx2", data: "data2" },
      { txid: "tx3", data: "data3" },
    ];

    const batchRequest = new BatchSignRequest(signRequests);
    
    expect(batchRequest).toBeInstanceOf(BatchSignRequest);
    expect(batchRequest.signRequests).toEqual(signRequests);
    expect(batchRequest.count).toBe(3);
  });

  it("should throw error for empty array", () => {
    expect(() => new BatchSignRequest([])).toThrow("Batch must contain at least one sign request");
  });

  it("should throw error for non-array input", () => {
    expect(() => new BatchSignRequest("not an array" as any)).toThrow("Input must be an array of sign requests");
    expect(() => new BatchSignRequest({} as any)).toThrow("Input must be an array of sign requests");
    expect(() => new BatchSignRequest(123 as any)).toThrow("Input must be an array of sign requests");
  });

  it("should encode and decode via UR", () => {
    const signRequests = [
      { id: 1, request: "sign this 1" },
      { id: 2, request: "sign this 2" },
    ];

    const batchRequest = new BatchSignRequest(signRequests);
    const ur = batchRequest.toUr();
    
    expect(ur).toBeInstanceOf(UR);
    expect(ur.type).toBe("batch-sign-request");

    // Decode back
    const decoded = BatchSignRequest.fromUr(ur);
    expect(decoded).toBeInstanceOf(BatchSignRequest);
    expect((decoded as any).signRequests).toEqual(signRequests);
  });

  it("should encode and decode from hex", () => {
    const signRequests = [
      { tx: "0x123", value: 100 },
      { tx: "0x456", value: 200 },
    ];

    const batchRequest = new BatchSignRequest(signRequests);
    const hex = batchRequest.toHex();
    
    expect(typeof hex).toBe("string");

    // Decode back
    const decoded = BatchSignRequest.fromHex(hex);
    expect(decoded).toBeInstanceOf(BatchSignRequest);
    expect((decoded as any).signRequests).toEqual(signRequests);
  });

  it("should be registered in UrRegistry", () => {
    const registryItem = UrRegistry.queryByURType("batch-sign-request");
    expect(registryItem).toBe(BatchSignRequest);

    const registryItemByTag = UrRegistry.queryByTag(41413);
    expect(registryItemByTag).toBe(BatchSignRequest);
  });

  it("should handle fromCBORData", () => {
    const signRequests = [
      { request: "req1" },
      { request: "req2" },
    ];

    const instance = BatchSignRequest.fromCBORData(signRequests);
    expect(instance).toBeInstanceOf(BatchSignRequest);
    expect((instance as any).signRequests).toEqual(signRequests);
  });

  it("should convert to JSON", () => {
    const signRequests = [
      { id: "a", data: "x" },
      { id: "b", data: "y" },
    ];

    const batchRequest = new BatchSignRequest(signRequests);
    const json = batchRequest.toJSON();

    expect(json.type).toBe("batch-sign-request");
    expect(json.tag).toBe(41413);
    // The array data is spread into the JSON object
    expect(Array.isArray(json)).toBe(false);
  });

  it("should handle large batches", () => {
    const largeRequests = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      data: `request-${i}`,
    }));

    const batchRequest = new BatchSignRequest(largeRequests);
    expect(batchRequest.count).toBe(100);

    // Test encoding/decoding still works
    const ur = batchRequest.toUr();
    const decoded = BatchSignRequest.fromUr(ur);
    expect((decoded as any).count).toBe(100);
    expect((decoded as any).signRequests).toEqual(largeRequests);
  });
});