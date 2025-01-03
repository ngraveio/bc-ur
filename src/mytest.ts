import { makeMessage } from "./utils.js";

import { registryItemFactory } from "./classes/RegistryItem.js";
import { globalUrRegistry } from "./registry.js";

import { UrFountainEncoder } from "./new_classes/UrFountainEncoder.js";
import { UrFountainDecoder } from "./new_classes/UrFountainDecoder.js";
import { Ur } from "./new_classes/Ur.js";

import { performance } from "node:perf_hooks";

import { createFountainUrTranscoder, createMultipartUrTranscoder, createUrTranscoder } from "./ngraveTranscoder.js";
import { MultipartUr } from "./classes/MultipartUr.js";
import exp from "node:constants";

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
    const result = newDecoder.getResultRegistryItem();
    // console.log(index);
  };

  const oldResult = benchmark(oldTest, 100);
  const newResult = benchmark(newTest, 100);
};


/// Run the benchmarks
console.profile()
iki();
console.profileEnd();

console.log("Benchmarking done");

globalUrRegistry.removeItem(MockRegistryItem);
