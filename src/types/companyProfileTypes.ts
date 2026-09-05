// =====================================================================
// TIMES® ANSA LIMS — Company Profile & Official Letterhead (Kop Surat) Types
// =====================================================================

export interface CompanyProfile {
  companyName: string;
  companyShortName: string;
  labName: string;
  labNameEn: string;
  taglineEn: string;
  logoUrl: string;       // URL / Data-URI Logo Utama Perusahaan
  stampUrl: string;      // URL / Data-URI Cap Stempel Resmi (Terpisah dari Logo)
  labAddress: string;
  officeAddress: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  waConfirmationNo: string;
  taxNote: string;
  directorName: string;
  directorTitle: string;
  headOfLabName: string;
  headOfLabTitle: string;
  notesLHU1Indo: string;
  notesLHU1En: string;
  notesLHU2Indo: string;
  notesLHU2En: string;
  notesLHU3Indo: string;
  notesLHU3En: string;
  updatedAt?: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'PT. TERRAFORMA GEOTEKNIK INDONESIA',
  companyShortName: 'PT. TGI',
  labName: 'LABORATORIUM MEKANIKA TANAH',
  labNameEn: 'Soil Mechanics Laboratory',
  taglineEn: 'LABORATORY TEST REPORT',
  logoUrl: '/logo.png',
  stampUrl: '', // Kosong secara default agar pengguna dapat mengunggah cap stempel resmi tersendiri
  labAddress: 'Jl. Terusan Al Fathu Ruko Linggahara 2 No.2, Soreang, Kab. Bandung, Jawa Barat 40911',
  officeAddress: 'Jl. Terusan Jakarta No. 175, Antapani, Bandung — Jawa Barat',
  phone: '022-4572-5093',
  mobile: '0812-1491-4641',
  email: 'soil_test@terraforma.co.id',
  website: 'www.terraforma.co.id',
  bankName: 'Bank Mandiri',
  bankAccountNumber: '133 - 00 - 99 - 00 - 8823',
  bankAccountName: 'PT. TERRAFORMA GEOTEKNIK INDONESIA',
  waConfirmationNo: '0811-2183-223',
  taxNote: 'Bukti potong pajak pph 23 (2%) untuk dapat dikirim ke PT. Terraforma Geoteknik Indonesia',
  directorName: 'Ir. Hartawi Riskha, S.T',
  directorTitle: 'Interim Operations Director',
  headOfLabName: 'Yustiadji',
  headOfLabTitle: 'Kepala Laboratorium',
  notesLHU1Indo: 'Laporan Hasil Uji ini hanya berlaku untuk contoh yang diuji.',
  notesLHU1En: 'This test report applies only to the tested sample.',
  notesLHU2Indo: 'Dilarang memperbanyak laporan tanpa ijin tertulis dari Laboratorium Mekanika Tanah PT. TERRAFORMA GEOTEKNIK INDONESIA.',
  notesLHU2En: 'This report shall not be reproduced except in full without written approval from PT. TERRAFORMA GEOTEKNIK INDONESIA Soil Mechanics Laboratory.',
  notesLHU3Indo: 'Laboratorium tidak bertanggung jawab atas kegiatan pengambilan dan transportasi contoh yang dilakukan oleh pihak lain.',
  notesLHU3En: 'The laboratory is not responsible for sampling, handling and sample transportation conducted by others.'
};
