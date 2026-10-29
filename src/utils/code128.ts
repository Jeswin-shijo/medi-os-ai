/** Code 128, code set B: the bar patterns for symbols 0 to 105, then the stop. Each is bar, space, bar, space... widths in modules. */
const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232'
];
const START_B = 104;
const STOP = '2331112';
/** The bar height in the returned path, in the same units as the module width (1). */
export const CODE128_HEIGHT = 40;

/** The symbol values for a text: start B, one per character (ASCII 32 to 126), the checksum. */
function symbols(text: string): number[] {
  const data = Array.from(text).map((c) => {
    const code = c.charCodeAt(0);
    if (code < 32 || code > 126) throw new Error(`Code 128 B cannot encode "${c}"`);
    return code - 32;
  });
  const sum = data.reduce((acc, v, i) => acc + v * (i + 1), START_B);
  return [START_B, ...data, sum % 103];
}

/** The width of the barcode in modules, including a 10-module quiet zone on each side. */
export const code128Width = (text: string): number => (symbols(text).length * 11 + 13) + 20;

/**
 * SVG path data for a Code 128 B barcode: start code B, the data, the checksum (mod 103) and the stop.
 * One module is 1 unit wide and the bars are `CODE128_HEIGHT` tall; the path starts after a 10-module quiet zone.
 */
export function code128(text: string): string {
  const widths = [...symbols(text).map((v) => PATTERNS[v]), STOP].join('');
  let x = 10;
  let path = '';
  for (let i = 0; i < widths.length; i++) {
    const w = Number(widths[i]);
    if (i % 2 === 0) path += `M${x} 0h${w}v${CODE128_HEIGHT}h-${w}z`;
    x += w;
  }
  return path;
}
