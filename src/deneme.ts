import { CborTest, CoinInfo, myText, User, UserCollection } from "./classes/SomeItems.js";
import { cborDecode2, cborEncode } from "./encodingMethods/cbor.js";

// Create our classes
const user = new User({ id: 1, name: "John Doe" });
const user2 = new User({ id: 2, name: "Jane Doe", 3: "asd@gmail.com" });

//@ts-ignore
// const userCollection = new UserCollection({ users: [user] });
const userCollection = new UserCollection({ name: "My Collection", users: [user, user2] });

// // Encode
const encoded = cborEncode(userCollection);
console.log(encoded.toString("hex"));

// // Decode
const decoded = cborDecode2(encoded);
console.log(decoded);


// const allTypes = new CborTest(
//   {
//     'bool': true,
//     'number': 123,
//     'string': 'hello',
//     'array': [1, 2, 3, ['a', 'b', 'c']],
//     'object': { 'key': 'value' },
//     'map': new Map([[1, 'one'], [2, 'two']]),
//     'set': new Set([1, 2, 3]),
//     'undefined': undefined,
//     'buffer': Buffer.from('hello'),
//     'date': new Date(),
//     'regexp': /hello/,
//     'url': new URL('https://example.com'),
//     'rest': {
//       'colledtion': userCollection,
//     }
//   }
// );

// const encode2 = cborEncode(allTypes);
// console.log(encode2.toString("hex"));

// const decode2 = cborDecode2(encode2);
// console.log(decode2);

// // @ts-ignore
// // const coininfo = new CoinInfo({type: 5, extraData: "my extra data"})

// // const encoded3 = cborEncode(coininfo);
// // console.log(encoded3.toString("hex"));
// // // decode
// // const decoded3 = cborDecode2(encoded3);
// // console.log(decoded3);

// const notTagged = Buffer.from("A20105696578747261446174616D6D792065787472612064617461", 'hex');
// const notTaggedDecoded = cborDecode2(notTagged, undefined, true, CoinInfo);
// // check instance
// if (notTaggedDecoded instanceof CoinInfo) {
//   console.log('CoinInfo instance');
// }
// else {
//   console.log('Not a CoinInfo instance');
// }
// console.log(notTaggedDecoded);




// const text = new myText("hello world");
// const encoded4 = cborEncode(text);
// console.log(encoded4.toString("hex"));
// // decode
// const decoded4 = cborDecode2(encoded4);
// console.log(decoded4);

// console.log('fin');
