import { BatchSignResponse, UR, UrRegistry } from "../src/index.js";

describe("BatchSignResponse", () => {
  it("should have correct static properties", () => {
    expect(BatchSignResponse.tag).toBe(41414);
    expect(BatchSignResponse.URType).toBe("batch-sign-response");
    expect(BatchSignResponse.CDDL).toBe("batch-sign-response = [+ sign-response]");
  });

  it("should create a batch sign response with array of responses", () => {
    const signResponses = [
      { txid: "tx1", signature: "sig1", status: "success" },
      { txid: "tx2", signature: "sig2", status: "success" },
      { txid: "tx3", signature: null, status: "failed", error: "Invalid transaction" },
    ];

    const batchResponse = new BatchSignResponse(signResponses);
    
    expect(batchResponse).toBeInstanceOf(BatchSignResponse);
    expect(batchResponse.signResponses).toEqual(signResponses);
    expect(batchResponse.count).toBe(3);
  });

  it("should throw error for empty array", () => {
    expect(() => new BatchSignResponse([])).toThrow("Batch must contain at least one sign response");
  });

  it("should throw error for non-array input", () => {
    expect(() => new BatchSignResponse("not an array" as any)).toThrow("Input must be an array of sign responses");
    expect(() => new BatchSignResponse({} as any)).toThrow("Input must be an array of sign responses");
    expect(() => new BatchSignResponse(null as any)).toThrow("Input must be an array of sign responses");
  });

  it("should encode and decode via UR", () => {
    const signResponses = [
      { id: 1, signature: "0xabc123", success: true },
      { id: 2, signature: "0xdef456", success: true },
    ];

    const batchResponse = new BatchSignResponse(signResponses);
    const ur = batchResponse.toUr();
    
    expect(ur).toBeInstanceOf(UR);
    expect(ur.type).toBe("batch-sign-response");

    // Decode back
    const decoded = BatchSignResponse.fromUr(ur) as BatchSignResponse;
    expect(decoded).toBeInstanceOf(BatchSignResponse);
    expect((decoded as any).signResponses).toEqual(signResponses);
  });

  it("should encode and decode from hex", () => {
    const signResponses = [
      { tx: "0x123", sig: "0xaaa", ok: true },
      { tx: "0x456", sig: "0xbbb", ok: true },
      { tx: "0x789", sig: null, ok: false, err: "Rejected" },
    ];

    const batchResponse = new BatchSignResponse(signResponses);
    const hex = batchResponse.toHex();
    
    expect(typeof hex).toBe("string");

    // Decode back
    const decoded = BatchSignResponse.fromHex(hex) as BatchSignResponse;
    expect(decoded).toBeInstanceOf(BatchSignResponse);
    expect((decoded as any).signResponses).toEqual(signResponses);
  });

  it("should be registered in UrRegistry", () => {
    const registryItem = UrRegistry.queryByURType("batch-sign-response");
    expect(registryItem).toBe(BatchSignResponse);

    const registryItemByTag = UrRegistry.queryByTag(41414);
    expect(registryItemByTag).toBe(BatchSignResponse);
  });

  it("should handle fromCBORData", () => {
    const signResponses = [
      { response: "resp1", signed: true },
      { response: "resp2", signed: false },
    ];

    const instance = BatchSignResponse.fromCBORData(signResponses) as BatchSignResponse;
    expect(instance).toBeInstanceOf(BatchSignResponse);
    expect((instance as any).signResponses).toEqual(signResponses);
  });

  it("should convert to JSON", () => {
    const signResponses = [
      { id: "a", sig: "sig-a" },
      { id: "b", sig: "sig-b" },
    ];

    const batchResponse = new BatchSignResponse(signResponses);
    const json = batchResponse.toJSON();

    expect(json.type).toBe("batch-sign-response");
    expect(json.tag).toBe(41414);
  });

  it("should handle mixed success/failure responses", () => {
    const mixedResponses = [
      { id: 1, success: true, signature: "0x11111" },
      { id: 2, success: false, error: "User rejected" },
      { id: 3, success: true, signature: "0x33333" },
      { id: 4, success: false, error: "Invalid nonce" },
      { id: 5, success: true, signature: "0x55555" },
    ];

    const batchResponse = new BatchSignResponse(mixedResponses);
    expect(batchResponse.count).toBe(5);

    // Count successes and failures
    const successes = mixedResponses.filter(r => r.success).length;
    const failures = mixedResponses.filter(r => !r.success).length;
    expect(successes).toBe(3);
    expect(failures).toBe(2);

    // Test encoding/decoding preserves all data
    const ur = batchResponse.toUr();
    const decoded = BatchSignResponse.fromUr(ur) as BatchSignResponse;
    expect((decoded as any).signResponses).toEqual(mixedResponses);
  });

  it("should handle large batches", () => {
    const largeResponses = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      signature: `sig-${i}`,
      success: i % 3 !== 0, // Every 3rd one fails
      error: i % 3 === 0 ? `Error for ${i}` : undefined,
    }));

    const batchResponse = new BatchSignResponse(largeResponses);
    expect(batchResponse.count).toBe(100);

    // Test encoding/decoding still works
    const hex = batchResponse.toHex();
    const decoded = BatchSignResponse.fromHex(hex) as BatchSignResponse;
    expect((decoded as any).count).toBe(100);
    expect((decoded as any).signResponses).toEqual(largeResponses);
  });
});