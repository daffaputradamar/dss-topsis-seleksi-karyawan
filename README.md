# Sistem Seleksi Karyawan

## Ikhtisar

Sistem Seleksi Karyawan adalah aplikasi web yang dirancang untuk mengevaluasi dan memberi peringkat kandidat berdasarkan berbagai kriteria menggunakan metode TOPSIS. Aplikasi ini mencakup fitur untuk mengunggah data kandidat, menghitung ulang skor, dan mengekspor hasil.

## Persyaratan

Untuk menjalankan aplikasi ini, pastikan Anda telah menginstal:

- **Node.js** (v18 atau lebih tinggi)

## Instalasi

1. Clone repositori:

   ```bash
   git clone https://github.com/daffaputradamar/dss-topsis-seleksi-karyawan
   cd dss-topsis-seleksi-karyawan
   ```

2. Instal dependensi:

   ```bash
   npm install
   ```

## Menjalankan Aplikasi

### Mode Pengembangan

Untuk menjalankan aplikasi dalam mode pengembangan:

```bash
npm run dev
```

Ini akan memulai server dan mengaktifkan hot-reloading untuk pengembangan.

### Mode Produksi

Untuk membangun dan memulai aplikasi dalam mode produksi:

```bash
npm run build
npm start
```

## Fitur

- **Unggah Data Kandidat**: Unggah file Excel yang berisi informasi kandidat.
- **Hitung Ulang Skor**: Sesuaikan bobot dan hitung ulang skor secara dinamis.
- **Ekspor Hasil**: Ekspor hasil evaluasi ke file Excel.

## Catatan

- Pastikan port `5000` tersedia karena aplikasi melayani API dan klien pada port ini.
