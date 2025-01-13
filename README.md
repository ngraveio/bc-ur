# BC-UR

This repository is an implementation of the BC-UR encoding, following the [C++ implementation](https://github.com/BlockchainCommons/bc-ur) and trying to provide a similar API for Javascript/Typescript usage.

## Installing

To install, run:
```bash
yarn add @ngraveio/bc-ur
```

# Quick Start

## Encode a message

```js
import {UR, UREncoder} from '@ngraveio/bc-ur'

const message = {any: 'property'}
const messageBuffer = Buffer.from(JSON.stringify(message))

// First step is to create a UR object from a Buffer
const ur = UR.fromBuffer(messageBuffer)

// Then, create the UREncoder object

// The maximum amount of fragments to be generated in total
const maxFragmentLength = 150

// The index of the fragment that will be the first to be generated
// If it's more than the "maxFragmentLength", then all the subsequent fragments will only be
// fountain parts
const firstSeqNum = 0

// Create the encoder object
const encoder = new UREncoder(ur, maxFragmentLength, firstSeqNum)

// Keep generating new parts, until a condition is met; for example the user exits the page, or clicks "DONE"
while(!stop) {
  // get the next part in the sequence
  let part = encoder.nextPart()

  // get the part as a string containing the cbor payload and display it with whatever way
  // the part looks like this:
  // ur:bytes/1-9/lpadascfadaxcywenbpljkhdcahkadaemejtswhhylkepmykhhtsytsnoyoyaxaedsuttydmmhhpktpmsrjtdkgslpgh

  displayPart(part)
}
```

## Decode a message

```js
import {URDecoder} from '@ngraveio/bc-ur'

// Create the decoder object
const decoder = new URDecoder()

do {
  // Scan the part from a QRCode
  // the part should look like this:
  // ur:bytes/1-9/lpadascfadaxcywenbpljkhdcahkadaemejtswhhylkepmykhhtsytsnoyoyaxaedsuttydmmhhpktpmsrjtdkgslpgh
  const part = scanQRCode()

  // register the new part with the decoder
  decoder.receivePart(part)

  // check if all the necessary parts have been received to successfully decode the message
} while (!decoder.isComplete())

// If no error has been found
if (decoder.isSuccess()) {
  // Get the UR representation of the message
  const ur = decoder.resultUR()

  // Decode the CBOR message to a Buffer
  const decoded = ur.decodeCBOR()

  // get the original message, assuming it was a JSON object
  const originalMessage = JSON.parse(decoded.toString())
}
else {
  // log and handle the error
  const error = decoder.resultError()
  console.log('Error found while decoding', error)
  handleError(error)
}

```

# Quick Start

### Single UR

#### Encoding:
Lets encode basic object:
```ts



const testPayload = {
  "id": "123",
  "name": "John Doe"
}

const userUr = Ur.fromData({type: "user", payload: testPayload});
userUr.toString();
```
```
ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

**Decoding:**
```ts
const ur = Ur.fromString('ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl');
const decoded = ur.decode();
```

Would give us:
```json
{"id": 123, "name": "John Doe"}
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
// Now we are going to create a fountain encoder which can generate indefined number of parts.
// Because of that we need to create a new encoder for every item.
const encoder = new UrFountainEncoder(userUr, 5); //  maxFragmentLength: 5
const fragments = encoder.getAllPartsUr(2); // Ratio of fountain parts compared to original parts
```
We will get all results in an array of UR strings.
```
[
  ur:user/1-2/lpadaobbcyjldnbwrlgeoeidiniecskgiejthsjnykwlbbst
  ur:user/2-2/lpaoaobbcyjldnbwrlgeihisgejlisjtcxfyjlihfmtnlaqz
  ur:user/3-2/lpaxaobbcyjldnbwrlgeihisgejlisjtcxfyjlihwletaewp
  ur:user/4-2/lpaaaobbcyjldnbwrlgeoeidiniecskgiejthsjnsbianlki
]
```
**For QR:**
```ts
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
import {URDecoder} from '@ngraveio/bc-ur'

// Create the decoder object
const decoder = new URDecoder()

do {
  // Scan the part from a QRCode
  // the part should look like this:
  // ur:user/3-2/lpaxaobbcyjldnbwrlgeihisgejlisjtcxfyjlihwletaewp
  const part = scanQRCode()

  // Read the part and set expected type and element count
  decoder.receivePartUr(part)

  // check if all the necessary parts have been received to successfully decode the message
} while (!decoder.isComplete())

// If no error has been found
if (decoder.isSuccessful()) {
  // Get the UR representation of the original single part UR
  const ur = decoder.resultUR;

  // Decode ur into the original data
  const decoded = decoder.getDecodedData();
}
else {
  // log and handle the error
  console.log('Error found while decoding', decoder.error)
  handleError(decoder.error)
}
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

### Quick Example:
**Encoding:**
Lets encode basic object:
```ts
const testPayload = {
  "id": "123",
  "name": "John Doe"
}

const userUr = Ur.fromData({type: "user", payload: testPayload});
userUr.toString();
```
```
ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl
```

**Decoding:**
```ts
const ur = Ur.fromString('ur:user/oeidiniecskgiejthsjnihisgejlisjtcxfyjlihjldnbwrl');
const decoded = ur.decode();
```

Would give us:
```json
{"id": 123, "name": "John Doe"}
```




# UR Data Pipeline
### Encoding
For encoding data in UR it goes through the following steps:
1. **[CBOR Encoding](https://cbor.io/)**: The data is encoded in CBOR format and converted binary representation.
2. **Hex Encoding**: The binary data is converted to a hexadecimal string.
3. **[Bytewords Encoding](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-012-bytewords.md)**: The hexadecimal string is converted to a bytewords string and crc32 checksum is added.
4. **[UR Encoding](https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md)**: The bytewords string is encoded in UR format.

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