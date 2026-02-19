import { registryItemFactory } from "../classes/RegistryItem.js";

/**
 * Batch Sign Request
 * NBCR-2025-001: Batch Sign Request
 * 
 * A batch sign request contains multiple sign requests that should be processed together.
 * This allows for efficient batch signing of multiple transactions.
 * 
 * CBOR Tag: 41413
 * UR Type: batch-sign-request
 */
export class BatchSignRequest extends registryItemFactory({
  tag: 41413,
  URType: "batch-sign-request",
  CDDL: `batch-sign-request = [+ sign-request]`,
}) {
  constructor(signRequests: any[]) {
    super(signRequests);
  }

  /**
   * Get the sign requests array
   */
  get signRequests(): any[] {
    return this.data;
  }

  /**
   * Get the number of sign requests in the batch
   */
  get count(): number {
    return this.data.length;
  }

  /**
   * Verify that the input is a non-empty array
   */
  verifyInput(input: any): { valid: boolean; reasons?: Error[] } {
    const reasons: Error[] = [];

    if (!Array.isArray(input)) {
      reasons.push(new Error("Input must be an array of sign requests"));
    } else if (input.length === 0) {
      reasons.push(new Error("Batch must contain at least one sign request"));
    }

    return {
      valid: reasons.length === 0,
      reasons: reasons.length > 0 ? reasons : undefined,
    };
  }
}