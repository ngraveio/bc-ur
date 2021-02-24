import Xoshiro from "./xoshiro";

(() => {

  const rng = new Xoshiro(Buffer.from('Wolf'))
  console.log(`🚀 ~ rng`, rng);

  rng.next();
  rng.next();
  rng.next();
  rng.next();
  rng.next();
  rng.next();
  rng.next();
  rng.next();
  rng.next();
  rng.next();
  rng.next();
  rng.next();
  rng.next();

})();