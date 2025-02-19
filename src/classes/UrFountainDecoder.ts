import { RegistryItem } from "../classes/RegistryItem.js";
import { EncodingMethodName } from "../enums/EncodingMethodName.js";
import { FountainDecoder, MultipartPayload, validateDecodedMultipart } from "./FountainDecoder.js";
import { UR } from "./UR.js";

export class UrFountainDecoder extends FountainDecoder {
  public expectedType: string;
  public resultUr: UR;
  public decodedData: RegistryItem | any;

  constructor(parts: UR[] | string[] = []) {
    super();
    parts.forEach((part) => {
      this.receivePartUr(part);
    });
  }

  public reset(): void {
    super.reset();
    this.resultUr = undefined;
    this.expectedType = undefined;
  }

  setExpectedValuesUr(part: UR, decodedPart: MultipartPayload): void {
    this.expectedType = part.type;
    this.expectedPartCount = part.seqLength;
    super.setExpectedValues(decodedPart);
  }

  protected validateUr(part: UR, decodedPart: MultipartPayload): boolean {
    // Check if UR is a fragment
    if (!part.isFragment) {
      return false;
    }

    // Check the type of the UR
    if (part.type !== this.expectedType) {
      return false;
    }

    // Expect metadata ur seqNum to be equal to the decoded part seqNum
    if (part.seqNum !== decodedPart.seqNum) {
      return false;
    }

    // Expect metadata ur seqLength to be equal to the decoded part seqLength
    if (part.seqLength !== decodedPart.seqLength) {
      return false;
    }

    // Validate decoded paylad
    return super.validatePart(decodedPart);
  }

  receivePartUr(part: UR | string): boolean {
    // If we already have a result, we're done
    if (this.done) {
      return false;
    }

    // Convert string into UR
    if (typeof part === "string") {
      part = UR.fromString(part);
    }

    // If what we received is not a multupart UR, then we're done
    if (!part.isFragment) {
      // If this is not a fragment and we have not received any fragments yet then its the whole UR
      if (!this.started) {
        this.resultUr = part;
        this.started = true;
        this.done = true;

        try {
          this.decodedData = this.resultUr.decode();
        } catch (error) {
          this.error = error;
        }

        // Finish here
        return true;
      }
      // If we have received fragments before then this is an error
      else {
        return false;
      }
    }

    let parsed: MultipartPayload;
    try {
      const decoded = part.decode();
      parsed = validateDecodedMultipart(decoded);
    } catch (e) {
      console.error(e);
      return false;
    }

    // If this is the first part we've seen then set expected values
    if (!this.started) this.setExpectedValuesUr(part, parsed);

    // If this is a fragment validate UR
    if (!this.validateUr(part, parsed)) {
      return false;
    }

    return super.receivePart(parsed);
  }

  // Assemble data and generate single result UR
  public finalize(): void {
    super.finalize();

    if (this.error) {
      return;
    }

    if (this.resultRaw !== undefined) {
      // Result data is already in CBOR
      // Just convert it to bytewords instead of encoding it again
      const payload = UR.pipeline.encode(this.resultRaw, { from: EncodingMethodName.hex });
      this.resultUr = new UR({
        type: this.expectedType,
        payload: payload,
      });

      // Now Try to decode the result UR
      try {
        this.decodedData = this.resultUr.decode();
      } catch (error) {
        this.error = error;
      }
    }
  }

  getDecodedData(): RegistryItem | any {
    if (!this.isSuccessful()) {
      console.log("Fountain decoding was not successful");
      return undefined;
    }
    return this.decodedData;
  }
}
