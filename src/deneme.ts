import { CborTest, CoinInfo, myText, User, UserCollection } from "./classes/SomeItems.js";
import { CborEncoding } from "./encodingMethods/CborEncoding.js";

const cbor = new CborEncoding();

// Create our classes
const user = new User({ id: 1, name: "John Doe" });
const user2 = new User({ id: 2, name: "Jane Doe", 3: "asd@gmail.com" });

//@ts-ignore
// const userCollection = new UserCollection({ users: [user] });
const userCollection = new UserCollection({ name: "My Collection", users: [user, user2] });

// // Encode
const encoded = cbor.encode(userCollection);
console.log(encoded.toString("hex"));

// // Decode
const decoded = cbor.decode(encoded);
console.log(decoded);


const allTypes = new CborTest(
  {
    'bool': true,
    'number': 123,
    'string': 'hello',
    'array': [1, 2, 3, ['a', 'b', 'c']],
    'object': { 'key': 'value' },
    'map': new Map([[1, 'one'], [2, 'two']]),
    'set': new Set([1, 2, 3]),
    'undefined': undefined,
    'buffer': Buffer.from('hello'),
    'date': new Date(),
    'regexp': /hello/,
    'url': new URL('https://example.com'),
    'rest': {
      'colledtion': userCollection,
    }
  }
);

const encode2 = cbor.encode(allTypes);
console.log(encode2.toString("hex"));

const decode2 = cbor.decode(encode2);
console.log(decode2);

// @ts-ignore
const coininfo = new CoinInfo({type: 5, extraData: "my extra data"})

const encoded3 = cbor.encode(coininfo);
console.log(encoded3.toString("hex"));
// decode
const decoded3 = cbor.decode(encoded3);
console.log(decoded3);

const notTagged = Buffer.from("A20105696578747261446174616D6D792065787472612064617461", 'hex');
const notTaggedDecoded = cbor.decode(notTagged, CoinInfo);
// check instance
if (notTaggedDecoded instanceof CoinInfo) {
  console.log('CoinInfo instance');
}
else {
  console.log('Not a CoinInfo instance');
}
console.log(notTaggedDecoded);




const text = new myText("hello world");
const encoded4 = cbor.encode(text);
console.log(encoded4.toString("hex"));
// decode
const decoded4 = cbor.decode(encoded4);
console.log(decoded4);

console.log('fin');
