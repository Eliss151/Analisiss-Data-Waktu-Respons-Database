window.CONFIG = {
  // ---------- Identitas ----------
  judul: "Analisis Data Waktu Respons Query MySQL, PostgreSQL, dan MongoDB",
  mataKuliah: "Tugas Statistika",
  breadcrumb: "DATALAB / Waktu Respons Database",
  penulis: [
    " Muhammad Farisi Rasyidi ( 250602043 )
    " Elisa Indah R ( 250602061 )
  ],

  // ---------- Label dan satuan (dipakai di grafik dan tabel) ----------
  satuan: "ms",                 // satuan nilai
  labelNilai: "Waktu respons",  // judul sumbu y / kolom nilai
  labelKategori: "Skenario query", // isi kolom "kategori" pada DATA
  labelKelompok: "DBMS",           // isi kolom "kelompok" pada DATA
  skalaLog: true,               // true = sumbu y logaritmik (pakai bila ada nilai jauh lebih besar)
  catatanSkalaLog: "Skala logaritmik dipakai karena INSERT jauh melampaui skenario lain.",

  // ---------- Ringkasan temuan (poin-poin di bagian atas) ----------
  temuan: [
    "PostgreSQL tercepat di 5 dari 6 skenario, dengan total waktu respons 2.559 ms.",
    "INSERT paling lambat pada MongoDB (24.562 ms) dan MySQL (18.159 ms); pada PostgreSQL hanya 401 ms.",
    "MongoDB unggul hanya pada SELECT (1.214 ms).",
    "Mean jauh di atas median pada ketiga DBMS karena satu nilai besar (INSERT) menarik rata-rata ke atas."
  ],

  // ---------- Kesimpulan ----------
  kesimpulan: [
    "INSERT paling lambat di MongoDB (24.562 ms) dan MySQL (18.159 ms); PostgreSQL hanya 401 ms.",
    "PostgreSQL tercepat di 5 dari 6 skenario dengan total 2.559 ms; MongoDB unggul hanya pada SELECT (1.214 ms).",
    "Sebaran terlebar pada MongoDB (s = 9.844,44) dan tersempit pada PostgreSQL (s = 592,90).",
    "Tidak ada modus karena keenam nilai tiap DBMS berbeda.",
    "Data terbatas (n = 6 per DBMS), sehingga desil dan persentil bersifat ilustratif."
  ],

  // ---------- Sumber data ----------
  sumber: {
    judul: "Perbandingan Performa Respon Waktu Kueri MySQL, PostgreSQL, dan MongoDB",
    penulis: "Putra, Y. Y., Purwaningrum, O., & Winata, R. H. (2022)",
    jurnal: "Jurnal Sistem Informasi dan Bisnis Cerdas (SIBC), Vol. 15 No. 1, 2022 (SINTA 5)",
    tabel: "Tabel 12 – Hasil Pengujian Total Keseluruhan Response Time",
    link: "",   // tempel URL artikel (DOI / halaman jurnal) di sini, mis. "https://doi.org/..."
    deskripsi:
      "Dataset catur 20.058 baris diuji pada 6 skenario query (SELECT, INSERT, UPDATE, DELETE, SUM(), COUNT()). " +
      "SELECT, INSERT, UPDATE, dan DELETE diuji pada 5 batas data (250 sampai 20.000) lalu dijumlahkan. " +
      "Lingkungan uji: Windows 10, Intel Core i5-10400F, RAM 16 GB, SSD NVMe 512 GB; XAMPP PHP 7.4.2, PostgreSQL 9.6, MongoDB 4.4.",
    catatan: [
      "Total SELECT PostgreSQL di Tabel 12 (1.609 ms) berbeda dari penjumlahan Tabel 8 (1.690 ms); dipakai angka Tabel 12.",
      "Narasi kesimpulan artikel menukar total MySQL dan MongoDB; dipakai angka tabel.",
      "Setiap DBMS hanya n = 6, sehingga desil dan persentil bersifat ilustratif."
    ]
  }
};

/* ---------------------------------------------------------------------
   DATA: satu baris = satu angka.
   kategori = baris pada tabel sumber (mis. skenario), kelompok = kolom (mis. DBMS).
   Untuk memakai data lain, ganti baris-baris di bawah ini (boleh lebih/kurang).
   --------------------------------------------------------------------- */
window.DATA = [
  { kategori: "SELECT", kelompok: "MySQL",      nilai: 1616 },
  { kategori: "INSERT", kelompok: "MySQL",      nilai: 18159 },
  { kategori: "UPDATE", kelompok: "MySQL",      nilai: 1456 },
  { kategori: "DELETE", kelompok: "MySQL",      nilai: 284 },
  { kategori: "SUM()",  kelompok: "MySQL",      nilai: 76 },
  { kategori: "COUNT()",kelompok: "MySQL",      nilai: 71 },

  { kategori: "SELECT", kelompok: "MongoDB",    nilai: 1214 },
  { kategori: "INSERT", kelompok: "MongoDB",    nilai: 24562 },
  { kategori: "UPDATE", kelompok: "MongoDB",    nilai: 543 },
  { kategori: "DELETE", kelompok: "MongoDB",    nilai: 329 },
  { kategori: "SUM()",  kelompok: "MongoDB",    nilai: 107 },
  { kategori: "COUNT()",kelompok: "MongoDB",    nilai: 149 },

  { kategori: "SELECT", kelompok: "PostgreSQL", nilai: 1609 },
  { kategori: "INSERT", kelompok: "PostgreSQL", nilai: 401 },
  { kategori: "UPDATE", kelompok: "PostgreSQL", nilai: 231 },
  { kategori: "DELETE", kelompok: "PostgreSQL", nilai: 196 },
  { kategori: "SUM()",  kelompok: "PostgreSQL", nilai: 52 },
  { kategori: "COUNT()",kelompok: "PostgreSQL", nilai: 70 }
];
