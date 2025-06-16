import { registryItemFactory } from "../classes/RegistryItem.js";

/**
 * Batch Sign Response
 * NBCR-2025-001: Batch Sign Response
 * 
 * A batch sign response contains multiple sign responses corresponding to
 * a batch sign request. Each response in the array corresponds to the 
 * sign request at the same index in the batch sign request.
 * 
 * CBOR Tag: 41414
 * UR Type: batch-sign-response
 */
export class BatchSignResponse extends registryItemFactory({
  tag: 41414,
  URType: "batch-sign-response",
  CDDL: `batch-sign-response = [+ sign-response]`,
}) {
  constructor(signResponses: any[]) {
    super(signResponses);
  }

  /**
   * Get the sign responses array
   */
  get signResponses(): any[] {
    return this.data;
  }

  /**
   * Get the number of sign responses in the batch
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
      reasons.push(new Error("Input must be an array of sign responses"));
    } else if (input.length === 0) {
      reasons.push(new Error("Batch must contain at least one sign response"));
    }

    return {
      valid: reasons.length === 0,
      reasons: reasons.length > 0 ? reasons : undefined,
    };
  }
}