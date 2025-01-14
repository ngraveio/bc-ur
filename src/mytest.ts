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
    const result = newDecoder.getDecodedData();
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


// const userUr = Ur.fromData({type: "user", payload: testPayload});
// const encoder = new UrFountainEncoder(userUr, 10); //  maxFragmentLength: 5 min fragment length: 1
// const fragments = encoder.getAllPartsUr(1); // Ratio of fountain parts compared to original parts


// // const decoder = new UrFountainDecoder(fragments);
// // const resultUr = decoder.resultUr;
// // const decoded = resultUr.decode();

// const decoder = new UrFountainDecoder();

// // TODO: Convert to UR first inside
// decoder.receivePartUr(part)

// decoder.isSuccessful()


// export class User extends registryItemFactory({
//   tag: 111,
//   URType: "user",
//   CDDL: `
//           user = #6.111({
//               id: uint,
//               name: text,
//               ? email: text,
//               ? phone: text,
//               ? address: text
//           })
//         `,

//   keyMap: {
//     id: 0,
//     name: 1,
//     email: 2,
//     phone: 3,
//     address: 4,
//   },
// }) {
//   verifyInput(input: any) {
//     let reasons: Error[] = [];

//     if (!input.id) {
//       reasons.push(new Error("ID is required"));
//     } else {
//       if (typeof input.id !== "number") {
//         reasons.push(new Error("ID should be a number"));
//       }
//     }

//     if (!input.name) {
//       reasons.push(new Error("Name is required"));
//     } else {
//       if (typeof input.name !== "string") {
//         reasons.push(new Error("Name should be a string"));
//       }
//     }

//     const valid = reasons.length === 0;
//     return { valid, reasons };
//   }  
// }

// const user = new User({
//   id: 123,
//   name: "John Doe",
//   email: "naber",
// });



// // This takes any data as input and encodes it as a simple CBOR map
// class AnyItem extends registryItemFactory({
//   tag: 999,
//   URType: "simple",
//   CDDL: ``,
// }) {};

// // IMPORTANT: Register our user item to the global registry
// globalUrRegistry.addItem(AnyItem);

// const anyItem = new AnyItem({id: 123, name: "John Doe"});

// // By default you can access following properties
// anyItem.type.tag; // 999
// anyItem.type.URType; // simple
// anyItem.type.CDDL; // ''
// anyItem.data; // {id: 123, name: 'John Doe'}

// // And you can encode it as a UR
// const anyItemUr = anyItem.toUr();
// const anyItemUrString = anyItemUr.toString(); // 'ur:simple/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl'

// // You can different encoding of the data from UR;
// anyItemUr.getPayloadCbor(); // [162, 98, 105, 100, 24, 123, 100, 110, 97, 109, 101, 104, 74, 111, 104, 110, 32, 68, 111, 101]
// // Diagnostic CBOR notation:
// // A2                     # map(2)
// //    62                  # text(2)
// //       6964             # "id"
// //    18 7B               # unsigned(123)
// //    64                  # text(4)
// //       6E616D65         # "name"
// //    68                  # text(8)
// //       4A6F686E20446F65 # "John Doe"
// anyItemUr.getPayloadHex(); // a2626964187b646e616d65684a6f686e20446f65
// anyItemUr.getPayloadBytewords(); // oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl

// // Decoding for simple URs
// const decoded = Ur.fromString(anyItemUrString).decode(); // {id: 123, name: 'John Doe'}

// // For simple and Multipart URs you can use the fountain decoder
// const myDecoder = new UrFountainDecoder();
// // Receive the first and only part
// myDecoder.receivePartUr(anyItemUrString);
// // Check if the decoding is successful
// if(myDecoder.isSuccessful()) {
//   // Get the decoded data
//   const decodedUr = myDecoder.resultUr; // ur:simple/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
//   const decodedData = myDecoder.getDecodedData(); // {id: 123, name: 'John Doe'}
// }
// else {
//   console.log("Decoding failed", myDecoder.getError());
// }


// Define a nested registry items
interface IUser {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}
export class User extends registryItemFactory({
  tag: 111,
  URType: "user",
  // Define the CDDL for the user item
  CDDL: `
          user = #6.111({
              id: uint,
              name: text,
              ? email: text,
              ? phone: text,
              ? address: text
          })

          id=1
          name=2
          email=3
          phone=4
          address=5
        `,

  // Define the key map for the user item
  keyMap: {
    id: 0,
    name: 1,
    email: 2,
    phone: 3,
    address: 4,
  },
  // Allow keys not in the map so we can add more keys to the user item
  allowKeysNotInMap: true,
}) {
  private user: IUser;

  // Constructor for the user item
  // It adds user data to `this.data` and `this.user`
  constructor(user: IUser) {
    super(user);
    this.user = user;
  }

  // Verify the input data both on first creating the user item 
  // and when decoding it from CBOR
  verifyInput(input: any) {
    let reasons: Error[] = [];

    if (!input.id) {
      reasons.push(new Error("ID is required"));
    } else {
      if (typeof input.id !== "number") {
        reasons.push(new Error("ID should be a number"));
      }
    }

    if (!input.name) {
      reasons.push(new Error("Name is required"));
    } else {
      if (typeof input.name !== "string") {
        reasons.push(new Error("Name should be a string"));
      }
    }

    const valid = reasons.length === 0;
    return { valid, reasons };
  }
}

// IMPORTANT: Register our user item to the global registry
globalUrRegistry.addItem(User);

// Create our user item
const user = new User({
  id: 123,
  name: "John Doe",
  email: "naber",
  extraKey: "extraValue",
});

// Encode the user item to a UR
const userUr = user.toUr();
// ur:user/oxaecskgadisgejlisjtcxfyjlihaoihjthsidihjpisihksjyjphsgrihkkimihksjyjphshfhsjzkpihamwpveey
// Get data in CBOR encoded
const userCbor = userUr.getPayloadCbor();
// As you can see the extra key is also included in the CBOR encoding
// And keys are replaced by their integer values
// CBOR Diagnostic notation:
// {0: 123, 1: "John Doe", 2: "naber", "extraKey": "extraValue"}
// CBOR in its hex representation:
// A4                         # map(4)
//    00                      # unsigned(0)
//    18 7B                   # unsigned(123)
//    01                      # unsigned(1)
//    68                      # text(8)
//       4A6F686E20446F65     # "John Doe"
//    02                      # unsigned(2)
//    65                      # text(5)
//       6E61626572           # "naber"
//    68                      # text(8)
//       65787472614B6579     # "extraKey"
//    6A                      # text(10)
//       657874726156616C7565 # "extraValue"

// Create UR from the string UR and decode it to Registry Item
const decoded = Ur.fromString(userUr.toString()).decode();
decoded.type.tag; // 111
decoded.type.URType; // user
decoded.data; // {id: 123, name: 'John Doe', email: 'naber', extraKey: 'extraValue'}

// Or decode it with the fountain decoder
const myDecoder = new UrFountainDecoder(decoded);
const decodedUser = myDecoder.getDecodedData();

console.log('fin');


