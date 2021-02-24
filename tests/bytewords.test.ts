import { AssertionError } from 'assert';
import bytewords from '../src/bytewords';

describe('Bytewords', () => {
  const hexInput = 'd9012ca20150c7098580125e2ab0981253468b2dbc5202d8641947da';
  const bufferInput = Buffer.from([
    245, 215, 20, 198, 241, 235, 69, 59, 209, 205,
    165, 18, 150, 158, 116, 135, 229, 212, 19, 159,
    17, 37, 239, 240, 253, 11, 109, 191, 37, 242,
    38, 120, 223, 41, 156, 189, 242, 254, 147, 204,
    66, 163, 216, 175, 191, 72, 169, 54, 32, 60,
    144, 230, 210, 137, 184, 197, 33, 113, 88, 14,
    157, 31, 177, 46, 1, 115, 205, 69, 225, 150,
    65, 235, 58, 144, 65, 240, 133, 69, 113, 247,
    63, 53, 242, 165, 160, 144, 26, 13, 79, 237,
    133, 71, 82, 69, 254, 165, 138, 41, 85, 24
  ]);

  describe('Encoding to Bytewords', () => {
    test('Standard', () => {
      expect(bytewords.encode(hexInput, bytewords.STYLES.STANDARD))
        .toBe('tuna acid draw oboe acid good slot axis limp lava brag holy door puff monk brag guru frog luau drop roof grim also trip idle chef fuel twin tied draw grim ramp');
      expect(bytewords.encode(bufferInput.toString('hex'), bytewords.STYLES.STANDARD))
        .toBe('yank toys bulb skew when warm free fair tent swan open brag mint noon jury list view tiny brew note body data webs what zinc bald join runs data whiz days keys user diet news ruby whiz zone menu surf flew omit trip pose runs fund part even crux fern math visa tied loud redo silk curl jugs hard beta next cost puma drum acid junk swan free very mint flap warm fact math flap what limp free jugs yell fish epic whiz open numb math city belt glow wave limp fuel grim free zone open love diet gyro cats fizz holy city puff');
    });
    test('URI', () => {
      expect(bytewords.encode(hexInput, bytewords.STYLES.URI))
        .toBe('tuna-acid-draw-oboe-acid-good-slot-axis-limp-lava-brag-holy-door-puff-monk-brag-guru-frog-luau-drop-roof-grim-also-trip-idle-chef-fuel-twin-tied-draw-grim-ramp');
      expect(bytewords.encode(bufferInput.toString('hex'), bytewords.STYLES.URI))
        .toBe('yank-toys-bulb-skew-when-warm-free-fair-tent-swan-open-brag-mint-noon-jury-list-view-tiny-brew-note-body-data-webs-what-zinc-bald-join-runs-data-whiz-days-keys-user-diet-news-ruby-whiz-zone-menu-surf-flew-omit-trip-pose-runs-fund-part-even-crux-fern-math-visa-tied-loud-redo-silk-curl-jugs-hard-beta-next-cost-puma-drum-acid-junk-swan-free-very-mint-flap-warm-fact-math-flap-what-limp-free-jugs-yell-fish-epic-whiz-open-numb-math-city-belt-glow-wave-limp-fuel-grim-free-zone-open-love-diet-gyro-cats-fizz-holy-city-puff');

    });
    test('Minimal', () => {
      expect(bytewords.encode(hexInput, bytewords.STYLES.MINIMAL))
        .toBe('taaddwoeadgdstaslplabghydrpfmkbggufgludprfgmaotpiecffltntddwgmrp');
      expect(bytewords.encode(bufferInput.toString('hex'), bytewords.STYLES.MINIMAL))
        .toBe('yktsbbswwnwmfefrttsnonbgmtnnjyltvwtybwnebydawswtzcbdjnrsdawzdsksurdtnsrywzzemusffwottppersfdptencxfnmhvatdldroskcljshdbantctpadmadjksnfevymtfpwmftmhfpwtlpfejsylfhecwzonnbmhcybtgwwelpflgmfezeonledtgocsfzhycypf');
    });

  });

  describe('Decoding from Bytewords', () => {
    test('Standard', () => {
      expect(bytewords.decode(
        'tuna acid draw oboe acid good slot axis limp lava brag holy door puff monk brag guru frog luau drop roof grim also trip idle chef fuel twin tied draw grim ramp',
        bytewords.STYLES.STANDARD
      ))
        .toBe(hexInput);
      expect(bytewords.decode(
        'yank toys bulb skew when warm free fair tent swan open brag mint noon jury list view tiny brew note body data webs what zinc bald join runs data whiz days keys user diet news ruby whiz zone menu surf flew omit trip pose runs fund part even crux fern math visa tied loud redo silk curl jugs hard beta next cost puma drum acid junk swan free very mint flap warm fact math flap what limp free jugs yell fish epic whiz open numb math city belt glow wave limp fuel grim free zone open love diet gyro cats fizz holy city puff',
        bytewords.STYLES.STANDARD
      ))
        .toBe(bufferInput.toString('hex'));
    });
    test('URI', () => {
      expect(bytewords.decode(
        'tuna-acid-draw-oboe-acid-good-slot-axis-limp-lava-brag-holy-door-puff-monk-brag-guru-frog-luau-drop-roof-grim-also-trip-idle-chef-fuel-twin-tied-draw-grim-ramp',
        bytewords.STYLES.URI
      ))
        .toBe(hexInput);
      expect(bytewords.decode(
        'yank-toys-bulb-skew-when-warm-free-fair-tent-swan-open-brag-mint-noon-jury-list-view-tiny-brew-note-body-data-webs-what-zinc-bald-join-runs-data-whiz-days-keys-user-diet-news-ruby-whiz-zone-menu-surf-flew-omit-trip-pose-runs-fund-part-even-crux-fern-math-visa-tied-loud-redo-silk-curl-jugs-hard-beta-next-cost-puma-drum-acid-junk-swan-free-very-mint-flap-warm-fact-math-flap-what-limp-free-jugs-yell-fish-epic-whiz-open-numb-math-city-belt-glow-wave-limp-fuel-grim-free-zone-open-love-diet-gyro-cats-fizz-holy-city-puff',
        bytewords.STYLES.URI
      ))
        .toBe(bufferInput.toString('hex'));
    });
    test('Minimal', () => {
      expect(bytewords.decode(
        'taaddwoeadgdstaslplabghydrpfmkbggufgludprfgmaotpiecffltntddwgmrp',
        bytewords.STYLES.MINIMAL
      ))
        .toBe(hexInput);
      expect(bytewords.decode(
        'yktsbbswwnwmfefrttsnonbgmtnnjyltvwtybwnebydawswtzcbdjnrsdawzdsksurdtnsrywzzemusffwottppersfdptencxfnmhvatdldroskcljshdbantctpadmadjksnfevymtfpwmftmhfpwtlpfejsylfhecwzonnbmhcybtgwwelpflgmfezeonledtgocsfzhycypf',
        bytewords.STYLES.MINIMAL
      ))
        .toBe(bufferInput.toString('hex'));
    });

    test('Invalid checksums', () => {
      expect.assertions(3);

      expect(() => bytewords.decode('able acid also lava zero jade need echo wolf', bytewords.STYLES.STANDARD))
        .toThrow(AssertionError);

      expect(() => bytewords.decode('able-acid-also-lava-zero-jade-need-echo-wolf', bytewords.STYLES.URI))
        .toThrow(AssertionError);

      expect(() => bytewords.decode('aeadaolazojendeowf', bytewords.STYLES.MINIMAL))
        .toThrow(AssertionError);
    })

    test('Too short', () => {
      expect.assertions(2);

      expect(() => bytewords.decode('wolf'))
        .toThrow(AssertionError);

      expect(() => bytewords.decode(''))
        .toThrow(AssertionError);
    })
  });
});