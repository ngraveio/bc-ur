import * as cbor from "cbor";
import { DecoderOptions } from "cbor/types/lib/decoder";
import { allDecoders } from "../registry";

export const cborEncode = (data: any): Buffer => {
  return cbor.encode(data);
};

export const cborDecode = (
  data: string | Buffer,
  options: DecoderOptions
): any => {
  // get all items from the registry and add them to the decoder
  const tags = allDecoders();

  return cbor.decode(
    Buffer.isBuffer(data) ? data : Buffer.from(data as string, "hex"),
    { ...options, tags }
  );
};

export const cborDecode2 = (
  data: string | Buffer,
  options?: DecoderOptions
): any => {
  // get all items from the registry and add them to the decoder
  const decoders = allDecoders();

  return cbor.decodeAllSync(
    Buffer.isBuffer(data) ? data : Buffer.from(data as string, "hex"),
    { ...options, tags: {...decoders} }
  );
}
