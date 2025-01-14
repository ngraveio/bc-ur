# BC-UR

This repository is an implementation of the BC-UR encoding, following the [C++ implementation](https://github.com/BlockchainCommons/bc-ur) and trying to provide a similar API for Javascript/Typescript usage.

## Installing

To install, run:
```bash
yarn add @ngraveio/bc-ur
```

# What is UR?
**U**niform **R**esource (UR) is a structre for encoding binary data in a form that can be used in a URI and with types. It takes advantage of QR Codes *"alphanumeric"* mode to transfer binary data because the native binary encoding mode of QR codes is not consistently supported by [readers](https://stackoverflow.com/questions/37996101/storing-binary-data-in-qr-codes).

More Details in: https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md

## UR Format
A single-part UR has the following form:

```
ur:<type>/<message (bytewords)>
```

For example:

```
ur:seed/oyadhdeynteelblrcygldwvarflojtcywyjytpdkfwprylienshnjnpluypmamtkmybsjkspvseesawmrltdlnlgkplfbkqzzoglfeoyaegslobemohs
```

A multi-part UR has the following form:

```
ur:<type>/<seq>/<fragment (bytewords)>
```

For example:

```
ur:seed/1-3/lpadaxcsencylobemohsgmoyadhdeynteelblrcygldwvarflojtcywyjydmylgdsa
```


# Quick Start

### Single UR
Maybe add registry item directly
#### Encoding:
Lets encode basic object:
```ts
import {UR, UREncoder} from '@ngraveio/bc-ur'

const testPayload = {
  "id": "123",
  "name": "John Doe"
}

const userUr = Ur.fromData({type: "user", payload: testPayload});
userUr.toString();
// ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

**Decoding:**
```ts
const ur = Ur.fromString('ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl');
const decoded = ur.decode();
// {"id": 123, "name": "John Doe"}
```

### Multi-Part UR (MUR)

**Encoding:**
Lets encode basic object:
```ts
const testPayload = {
  "id": "123",
  "name": "John Doe"
}

const userUr = Ur.fromData({type: "user", payload: testPayload});
// Now we are going to create a fountain encoder which can generate indefinite number of parts.
// Because fountain encoder has a state, we need to create a new decoder for each new UR object
const encoder = new UrFountainEncoder(userUr, 5); //  maxFragmentLength: 5
// Get all fragments at once
const fragments = encoder.getAllPartsUr(2); // Ratio of fountain parts compared to original parts

// [
//   ur:user/1-2/lpadaobbcyjldnbwrlgeoeidiniecskgiejthsjnykwlbbst
//   ur:user/2-2/lpaoaobbcyjldnbwrlgeihisgejlisjtcxfyjlihfmtnlaqz
//   ur:user/3-2/lpaxaobbcyjldnbwrlgeihisgejlisjtcxfyjlihwletaewp
//   ur:user/4-2/lpaaaobbcyjldnbwrlgeoeidiniecskgiejthsjnsbianlki
// ]

// For QR:

// Keep generating new parts, until a condition is met; for example the user exits the page, or clicks "DONE"
while(!stop) {
  // get the next part in the sequence
  let part = encoder.nextPart().toString();

  // Get the UR string part that contains data from original UR data
  // the part looks like this:
  // ur:user/3-2/lpaxaobbcyjldnbwrlgeihisgejlisjtcxfyjlihwletaewp

  displayPart(part)
}
```


#### Decoding:
If you have all the parts you can decode them into the original UR object at once:
```ts
// If we have all the fragments we can decode them into the original UR object
const decoder = new UrFountainDecoder(fragments);
const resultUr = decoder.resultUr;
// 'ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl'
const decoded = resultUr.decode();
// {"id":123,"name":"John Doe"}
```
**FOR QR:**
For continuous decoding:

```ts
import { UrFountainDecoder } from '@ngraveio/bc-ur'

// Create the decoder object
const decoder = new UrFountainDecoder()

do {
  // Scan the part from a QRCode
  // the part should look like this:
  // ur:user/3-2/lpaxaobbcyjldnbwrlgeihisgejlisjtcxfyjlihwletaewp
  const part = scanQRCode()

  // Read the part and set expected type and fragment count
  decoder.receivePartUr(part)

  // check if all the necessary parts have been received to successfully decode the message
} while (!decoder.isComplete())

// If no error has been found
if (decoder.isSuccessful()) {
  // Get the UR representation of the original single part UR
  const ur = decoder.resultUR;
  // 'ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl'

  // Decode ur into the original data
  const decoded = decoder.getDecodedData();
  // {"id":123,"name":"John Doe"}

  // Reset decoder state so we can start reading a new UR
  decoder.reset();
}
else {
  // log and handle the error
  console.log('Error found while decoding', decoder.error)
  handleError(decoder.error)
}
```


# Registry Item
Registry Item is special class that knows how to encode and decode data to CBOR and UR, based on its [CDDL: Concise Data Definition Language](https://datatracker.ietf.org/doc/html/rfc8610).


You need to extend the `registryItemFactory` function and pass the following parameters:
- `tag`: CBOR Tag that will be used to encode and decode the data **CBOR TAG**
- `URType`: The name that will be used in UR encoded data **Ngrave Registry**
- `CDDL`: The CDDL that defines the structure of the data
- `keyMap`: Optional, if you want to map the keys string names into integer keys for decreasing the size of the encoded data
- `allowKeysNotInMap`: Optional, if you want to allow keys that are not in the map to be encoded and decoded
### Example

```ts
import {registryItemFactory} from '@ngraveio/bc-ur'

// This takes any data as input and encodes it as a simple CBOR map
class AnyItem extends registryItemFactory({
  tag: 999,
  URType: "simple",
  CDDL: ``,
}) {};

// TODO: add type automatically to UR registry
// IMPORTANT: Register our item to the UR registry
globalUrRegistry.addItem(AnyItem);

const anyItem = new AnyItem({id: 123, name: "John Doe"});

// By default you can access following properties
anyItem.type.tag; // 999
anyItem.type.URType; // simple
anyItem.type.CDDL; // ''
anyItem.data; // {id: 123, name: 'John Doe'}

// And you can encode it as a UR
const anyItemUr = anyItem.toUr();
const anyItemUrString = anyItemUr.toString(); // 'ur:simple/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl'

// You can different encoding of the data from UR;
anyItemUr.getPayloadCbor(); // [162, 98, 105, 100, 24, 123, 100, 110, 97, 109, 101, 104, 74, 111, 104, 110, 32, 68, 111, 101]
// Diagnostic CBOR notation:
// A2                     # map(2)
//    62                  # text(2)
//       6964             # "id"
//    18 7B               # unsigned(123)
//    64                  # text(4)
//       6E616D65         # "name"
//    68                  # text(8)
//       4A6F686E20446F65 # "John Doe"
anyItemUr.getPayloadHex(); // a2626964187b646e616d65684a6f686e20446f65
anyItemUr.getPayloadBytewords(); // oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl

// Decoding for simple URs
const decoded = Ur.fromString(anyItemUrString).decode(); // {id: 123, name: 'John Doe'}

// For simple and Multipart URs you can use the fountain decoder
const myDecoder = new UrFountainDecoder();
// Receive the first and only part
myDecoder.receivePartUr(anyItemUrString);
// Check if the decoding is successful
if(myDecoder.isSuccessful()) {
  // Get the decoded data
  const decodedUr = myDecoder.resultUr; // ur:simple/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
  const decodedData = myDecoder.getDecodedData(); // {id: 123, name: 'John Doe'}
}
else {
  console.log("Decoding failed", myDecoder.getError());
}
```

### Advanced Example
```ts
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

          id=0
          name=1
          email=2
          phone=3
          address=4
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

  // Verify the input data both on first creating the user item and when decoding it from CBOR
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
```



# UR Data Pipeline
### Encoding
For encoding data in UR it goes through the following steps:
1. **[CBOR Encoding](https://cbor.io/)**: The data is encoded in CBOR format and converted binary representation.
2. **Hex Encoding**: The binary data is converted to a hexadecimal string.
3. **[Bytewords Encoding](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-012-bytewords.md)**: The hexadecimal string is converted to a bytewords string and crc32 checksum is added.
4. **[UR Encoding](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md)**: The bytewords string is wrapped in a UR string.

### Pipeline Example:


1. **CBOR:**
```ts
const cborEncoded_ = defaultEncoders.cbor.encode(testPayload);
// or
const cborEncoded = Ur.pipeline.encode(testPayload, {until:EncodingMethodName.hex});

```
**Result:**
```
new Uint8Array([162, 98, 105, 100, 24, 123, 100, 110, 97, 109, 101, 104, 74, 111, 104, 110, 32, 68, 111, 101])
```

**Cbor Commented:**
```
A2                     # map(2)
   62                  # text(2)
      6964             # "id"
   18 7B               # unsigned(123)
   64                  # text(4)
      6E616D65         # "name"
   68                  # text(8)
      4A6F686E20446F65 # "John Doe"
```

2. **Hex encoded**:
```ts
const hexEncoded_ = defaultEncoders.hex.encode(cborEncoded_);
// or
const hexEncoded = Ur.pipeline.encode(testPayload, {until:EncodingMethodName.bytewords});
```
```
a2626964187b646e616d65684a6f686e20446f65
```

3. **Bytewords encoded**:
```ts
const bytewordsEncoded_ = defaultEncoders.bytewords.encode(hexEncoded_);
// or
const bytewordsEncoded = Ur.pipeline.encode(testPayload);
```
```
oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

4. **UR Encoded**:
```ts
const userUR = Ur.fromBytewords({type: "user", payload: bytewordsEncoded});
userUR.toString();
```
```
ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```
----

### UR Decoding
When decoding it will follow the reverse order in the pipeline.

1. UR Decoding
2. Bytewords Decoding
3. Hex Decoding
4. CBOR Decoding
  
#### Example
1. **UR Decoding**:

This will first check if the string is a valid UR string and then extract the type and the payload.

```ts
const ur = Ur.fromString('ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl'
);
```
  Getting bytewords from UR is easy

```ts
// Get payload in bytewords
const bytewords  = ur.payload;
// or
const bytewords = ur.getPayloadBytewords();
```

```
oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

2. **Bytewords Decoding**:
```ts
const hexString_ = defaultEncoders.bytewords.decode(ur.payload);
// Decocde until cbor so we have hex string
const hexString = Ur.pipeline.decode(bytewords, {until:EncodingMethodName.hex});
```
```
a2626964187b646e616d65684a6f686e20446f65
```


3. **Hex Decoding**:
```ts
const cborBuffer = defaultEncoders.hex.decode(hexString);
const cborBuffer_ = Ur.pipeline.decode(bytewords, {until:EncodingMethodName.cbor});
```

```
Uint8Array([162, 98, 105, 100, 24, 123, 100, 110, 97, 109, 101, 104, 74, 111, 104, 110, 32, 68, 111, 101])
```

4. **CBOR Decoding**:
```ts
const decoded_ = defaultEncoders.cbor.decode(cborBuffer);
const decoded__ = Ur.pipeline.decode(bytewords);
const decoded = ur.decode();
```

Would give us:
```json
{"id": 123, "name": "John Doe"}
```

## Fountain Encoder And Decoder & Multipart UR (MUR)
https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2024-001-multipart-ur.md

### What is Fountain Code:

Fountain codes are a class of erasure codes used in network communications. They were first introduced by Michael Luby in 1998. The basic idea is to generate an infinite number of encoded symbols from a given source symbol, such that any subset of the encoded symbols can be used to reconstruct the source symbol. This is useful in situations where the source symbol is too large to be transmitted in a single message, or where the transmission medium is lossy and some of the encoded symbols may be lost in transit.

## Technical Choices

### Dual Packaging

This library is distributed in two formats: **ESM (ECMAScript Module)** and **CommonJS (CJS)**. The default version is ESM, which is utilized in the examples provided above.

```
dist
├── esm
│   ├── index.js
│   ├── package.json
├── commonjs
│   ├── index.js
│   ├── package.json
└── package.json
```


Each `package.json` file within the subdirectories specifies the corresponding `type` property: `"module"` for ESM and `"commonjs"` for CJS. This enables Node.js to correctly interpret the file type based on the `.js` extension.

The **CommonJS** format is included for backward compatibility with older versions of Node.js. However, it is **not recommended** for use in browser environments.

Due to the library’s reliance on the **ESM-only** [CBOR2](https://github.com/hildjj/cbor2) library, the CommonJS version is created using **Rollup**. This process bundles the CBOR2 library into a single file and converts it to the CommonJS format.

To mitigate the [Dual Package Hazard](https://nodejs.org/docs/latest-v18.x/api/packages.html#dual-package-hazard), the ESM version of this library also uses a bundled version of the CBOR2 library. This ensures consistency by maintaining a single source of truth for CBOR tag definitions.

**Important Note:**
> Adding CBOR types via the CBOR2 library will not affect the BC-UR library, as the BC-UR library uses the bundled version of CBOR2.


More details about CBOR2 and dual packaging here: https://github.com/hildjj/cbor2/pull/57

## Notes:

You can change `findNominalFragmentLength` function.