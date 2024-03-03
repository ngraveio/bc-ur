// TODO: Update this cbor-node, cbor-redux
const cbor = require("cbor-sync");

export const cborEncode = (data: any): Buffer => {
  return cbor.encode(data);
};

// TODO: What this returns?
export const cborDecode = (data: string | Buffer): any => {
  return cbor.decode(Buffer.isBuffer(data) ? data : Buffer.from(data as string, 'hex'));
}
// ur:1-5/data => 4
// ur:2-5/datadatadatadata => 16

// 1000 lenght
// max size= 200
// min = 10

// maxFregment count = 100
