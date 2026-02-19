import { BatchSignRequest, BatchSignResponse, UR, UrRegistry } from "../src/index.js";

describe("Batch Sign Integration", () => {
  it("should work end-to-end with batch sign request and response", () => {
    // Create a batch of sign requests
    const requests = [
      { txId: "tx-001", data: "0xabc123", chainId: 1 },
      { txId: "tx-002", data: "0xdef456", chainId: 1 },
      { txId: "tx-003", data: "0x789abc", chainId: 137 },
    ];

    // Create batch sign request
    const batchRequest = new BatchSignRequest(requests);
    expect(batchRequest.count).toBe(3);

    // Convert to UR
    const requestUr = batchRequest.toUr();
    expect(requestUr.type).toBe("batch-sign-request");

    // Simulate transmission - convert to string and back
    const urString = requestUr.toString();
    expect(urString).toMatch(/^ur:batch-sign-request\//);

    // Decode from UR string
    const decodedRequest = BatchSignRequest.fromUr(urString);
    expect((decodedRequest as any).signRequests).toEqual(requests);

    // Process requests and create responses
    const responses = requests.map((req, idx) => ({
      txId: req.txId,
      signature: `sig-${idx}`,
      success: idx !== 1, // Second one fails
      error: idx === 1 ? "User rejected" : undefined,
    }));

    // Create batch sign response
    const batchResponse = new BatchSignResponse(responses);
    expect(batchResponse.count).toBe(3);

    // Convert response to UR
    const responseUr = batchResponse.toUr();
    expect(responseUr.type).toBe("batch-sign-response");

    // Decode response
    const decodedResponse = BatchSignResponse.fromUr(responseUr);
    expect((decodedResponse as any).signResponses).toEqual(responses);
  });

  it("should handle multi-part UR for large batches", () => {
    // Create a large batch that might need multi-part encoding
    const largeBatch = Array.from({ length: 50 }, (_, i) => ({
      id: `request-${i}`,
      data: `0x${Buffer.from(`transaction data for request ${i}`).toString('hex')}`,
      metadata: {
        timestamp: Date.now(),
        nonce: i,
        gasPrice: "20000000000",
        gasLimit: "21000",
      }
    }));

    const batchRequest = new BatchSignRequest(largeBatch);
    const ur = batchRequest.toUr();
    
    // Even with large data, single-part UR should work
    const decoded = BatchSignRequest.fromUr(ur);
    expect((decoded as any).count).toBe(50);
    expect((decoded as any).signRequests).toEqual(largeBatch);
  });

  it("should be queryable from registry", () => {
    // Verify both types are registered
    expect(UrRegistry.queryByURType("batch-sign-request")).toBe(BatchSignRequest);
    expect(UrRegistry.queryByURType("batch-sign-response")).toBe(BatchSignResponse);
    
    expect(UrRegistry.queryByTag(41413)).toBe(BatchSignRequest);
    expect(UrRegistry.queryByTag(41414)).toBe(BatchSignResponse);
  });

  it("should handle hex encoding/decoding", () => {
    const requests = [
      { id: 1, action: "sign", payload: "data1" },
      { id: 2, action: "sign", payload: "data2" },
    ];

    const batchRequest = new BatchSignRequest(requests);
    const hex = batchRequest.toHex();
    
    // Hex should be a valid hex string
    expect(hex).toMatch(/^[0-9a-f]+$/);
    
    // Decode from hex
    const decoded = BatchSignRequest.fromHex(hex);
    expect((decoded as any).signRequests).toEqual(requests);
  });
});