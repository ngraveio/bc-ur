import * as cbor from "cbor";

export const cborEncode = (data: any): Buffer => {
  return cbor.encode(data);
};

export const cborDecode = (data: string | Buffer): any => {
  return cbor.decode(
    Buffer.isBuffer(data) ? data : Buffer.from(data as string, "hex")
  );
};

export default cbor;
