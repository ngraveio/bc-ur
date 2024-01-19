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
// For NGRAVE ZERO support please keep to a maximum fragment size of 200
const maxFragmentLength = 200

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
