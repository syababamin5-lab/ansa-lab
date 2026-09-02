// Helper to convert numbers to Indonesian words (Terbilang Rupiah)

export function terbilang(n: number): string {
  if (isNaN(n) || n === 0) return 'Nol Rupiah';

  const unit = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function convertGroup(val: number): string {
    let result = '';

    if (val < 12) {
      result = unit[val];
    } else if (val < 20) {
      result = convertGroup(val - 10) + ' Belas';
    } else if (val < 100) {
      result = convertGroup(Math.floor(val / 10)) + ' Puluh ' + convertGroup(val % 10);
    } else if (val < 200) {
      result = 'Seratus ' + convertGroup(val - 100);
    } else if (val < 1000) {
      result = convertGroup(Math.floor(val / 100)) + ' Ratus ' + convertGroup(val % 100);
    } else if (val < 2000) {
      result = 'Seribu ' + convertGroup(val - 1000);
    } else if (val < 1000000) {
      result = convertGroup(Math.floor(val / 1000)) + ' Ribu ' + convertGroup(val % 1000);
    } else if (val < 1000000000) {
      result = convertGroup(Math.floor(val / 1000000)) + ' Juta ' + convertGroup(val % 1000000);
    } else if (val < 1000000000000) {
      result = convertGroup(Math.floor(val / 1000000000)) + ' Milyar ' + convertGroup(val % 1000000000);
    } else {
      result = convertGroup(Math.floor(val / 1000000000000)) + ' Triliun ' + convertGroup(val % 1000000000000);
    }

    return result.trim();
  }

  const rounded = Math.round(n);
  const words = convertGroup(rounded);
  return (words + ' Rupiah').replace(/\s+/g, ' ');
}
