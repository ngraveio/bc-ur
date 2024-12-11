async function importESModule(modulePath) {
  const importedModule = await import(modulePath);
  return importedModule.default || importedModule;
}

let decode, DecodeOptions, encode, EncodeOptions, registerEncoder, Tag;

// Dynamically import the ESM module
async function loadESM() {
  const cbor2 = await importESModule('cbor2');
  decode = cbor2.decode;
  DecodeOptions = cbor2.DecodeOptions;
  encode = cbor2.encode;
  EncodeOptions = cbor2.EncodeOptions;

  const encoderModule = await importESModule('cbor2/encoder');
  registerEncoder = encoderModule.registerEncoder;

  const tagModule = await importESModule('cbor2/tag');
  Tag = tagModule.Tag;
}

loadESM().catch((err) => {
  console.error('Failed to load ESM module:', err);
});

module.exports = {
  get decode() {
    return decode;
  },
  get DecodeOptions() {
    return DecodeOptions;
  },
  get encode() {
    return encode;
  },
  get EncodeOptions() {
    return EncodeOptions;
  },
  get registerEncoder() {
    return registerEncoder;
  },
  get Tag() {
    return Tag;
  },
};
