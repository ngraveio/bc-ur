import * as cbor from "cbor";
import { DecoderOptions } from "cbor/types/lib/decoder";
import { getRegistryTags } from "../registry";

export default (data: any): Buffer => {
  return cbor.encode(data);
};

export const cborDecode = (
  data: string | Buffer,
  options: DecoderOptions
): any => {
  // get all items from the registry and add them to the decoder
  const tags = getRegistryTags();

  return cbor.decode(
    Buffer.isBuffer(data) ? data : Buffer.from(data as string, "hex"),
    { ...options, tags }
  );
};
