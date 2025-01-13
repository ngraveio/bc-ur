import { makeMessage } from "./utils.js";

import { registryItemFactory } from "./classes/RegistryItem.js";
import { globalUrRegistry } from "./registry.js";

import { UrFountainEncoder } from "./new_classes/UrFountainEncoder.js";
import { UrFountainDecoder } from "./new_classes/UrFountainDecoder.js";
import { Ur } from "./new_classes/Ur.js";

import { performance } from "node:perf_hooks";

import { createFountainUrTranscoder, createMultipartUrTranscoder, createUrTranscoder } from "./ngraveTranscoder.js";
import { MultipartUr } from "./classes/MultipartUr.js";
import { EncodingMethodName } from "./enums/EncodingMethodName.js";
import { dataPipeline, defaultEncoders } from "./encodingMethods/index.js";

// Benchmarking logic
function benchmark(fn: Function, iterations = 1000) {
  const times: number[] = [];

  console.log(`Executing ${iterations} iterations`);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  // Calculate statistics
  const total = times.reduce((a, b) => a + b, 0);
  const average = total / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  const result = { total, average, min, max, iterations };

  console.log(`Executed ${result.iterations} iterations`);
  console.log(`Total time: ${result.total.toFixed(2)}ms`);
  console.log(`Average time: ${result.average.toFixed(2)}ms`);
  console.log(`Min time: ${result.min.toFixed(2)}ms`);
  console.log(`Max time: ${result.max.toFixed(2)}ms`);

  return result;
}

export class MockRegistryItem extends registryItemFactory({
  tag: 998,
  URType: "custom1",
  CDDL: ``,
}) {}

export class MockRegistryItem2 extends registryItemFactory({
  tag: 999,
  URType: "custom2",
  CDDL: ``,
}) {}

globalUrRegistry.addItem(MockRegistryItem);
const { fountainEncoderCreator, fountainDecoderCreator } = createFountainUrTranscoder();

const bir = () => {
  const message = makeMessage(3276);
  const registryItem = new MockRegistryItem(message);

  const oldTest = () => {
    // Check the speed of the old fountain encoder
    const fountainEncoder = fountainEncoderCreator(registryItem, 50, 5);
    const fountainFragments = fountainEncoder.encodeUr(registryItem, 5);
  };

  const newTest = () => {
    const encoder = new UrFountainEncoder(registryItem, 50, 5);
    const fragments = encoder.getAllPartsUr(5);
  };

  const oldResult = benchmark(oldTest, 100);
  const newResult = benchmark(newTest, 100);
};

const iki = () => {
  const message = makeMessage(32760);
  const registryItem = new MockRegistryItem(message);

  // const urPartsOld = fountainEncoderCreator(registryItem, 50, 5).encodeUr(registryItem, 5).slice(-200);
  // const urPartsNew = new UrFountainEncoder(registryItem, 50, 5).getAllPartsUr(5).slice(-200);

  const oldTest = () => {
    const oldEncoder = fountainEncoderCreator(registryItem, 50, 5, 200);
    const oldDecoder = fountainDecoderCreator();
    let index = 0;
    while (!oldDecoder.isUrDecoderCompleteOrHasError()) {
      index++;
      const part = oldEncoder.nextPart();
      oldDecoder.receivePart(part);
    }
    const result = oldDecoder.getResultRegistryItem();
    // console.log(index);
  };

  const newTest = () => {
    const newEncoder = new UrFountainEncoder(registryItem, 50, 5, 200);
    const newDecoder = new UrFountainDecoder();
    let index = 0;
    while (!newDecoder.done) {
      index++;
      const part = newEncoder.nextPartUr();
      newDecoder.receivePartUr(part);
    }
    const result = newDecoder.getDecodedResult()();
    // console.log(index);
  };

  const oldResult = benchmark(oldTest, 100);
  const newResult = benchmark(newTest, 100);
};


// /// Run the benchmarks
// console.profile()
// iki();
// console.profileEnd();

// console.log("Benchmarking done");

// globalUrRegistry.removeItem(MockRegistryItem);

// Creating an example


class UserItem extends registryItemFactory({
  tag: 798,
  URType: "user",
  CDDL: `user = {id: int, name: tstr}`,
}) {}

const testPayload = {
  'id': 123,
  'name': 'John Doe',
};

// // encoding
// const cborEncoded_ = defaultEncoders.cbor.encode(testPayload);
// const cborEncoded = Ur.pipeline.encode(testPayload, {until:EncodingMethodName.hex});
// const hexEncoded_ = defaultEncoders.hex.encode(cborEncoded_);
// const hexEncoded = Ur.pipeline.encode(testPayload, {until:EncodingMethodName.bytewords});
// const bytewordsEncoded_ = defaultEncoders.bytewords.encode(hexEncoded_);
// const bytewordsEncoded = Ur.pipeline.encode(testPayload);

// const ur_ = Ur.fromBytewords({type: "user", payload: bytewordsEncoded});
// const urString  = ur_.toString();

// // Create UR
// const ur = Ur.fromString(urString);

// // Get payload in bytewords
// const bytewords  = ur.payload;

// const hexString_ = defaultEncoders.bytewords.decode(ur.payload);
// // Decocde until cbor so we have hex string
// const hexString = Ur.pipeline.decode(bytewords, {until:EncodingMethodName.hex});


// const cborBuffer = defaultEncoders.hex.decode(hexString);
// const cborBuffer_ = Ur.pipeline.decode(bytewords, {until:EncodingMethodName.cbor});

// const decoded_ = defaultEncoders.cbor.decode(cborBuffer);
// const decoded__ = Ur.pipeline.decode(bytewords);
// // or
// const decoded = ur.decode();

// console.log('decoded', decoded);


const userUr = Ur.fromData({type: "user", payload: testPayload});
const encoder = new UrFountainEncoder(userUr, 10); //  maxFragmentLength: 5 min fragment length: 1
const fragments = encoder.getAllPartsUr(1); // Ratio of fountain parts compared to original parts


// const decoder = new UrFountainDecoder(fragments);
// const resultUr = decoder.resultUr;
// const decoded = resultUr.decode();

const decoder = new UrFountainDecoder();

// TODO: Convert to UR first inside
decoder.receivePartUr(part)

decoder.isSuccessful()

console.log('fin');

