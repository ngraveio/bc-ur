# BC-UR

This repository is an implementation of the BC-UR encoding, following the [C++ implementation](https://github.com/BlockchainCommons/bc-ur) and trying to provide a similar API for Javascript/Typescript usage.

## Installing

To install, run:
```bash
yarn add @ngraveio/bc-ur
```

## Quick Start

### Encode a message

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

### Decode a message

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