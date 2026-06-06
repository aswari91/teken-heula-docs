# Pengantar Teken Heula API

Selamat datang di Dokumentasi Resmi **Teken Heula API**! 

Teken Heula merupakan sistem sentralisasi layanan **Tanda Tangan Elektronik (E-Sign)** dan **Segel Elektronik (E-Seal)** yang dikembangkan khusus untuk lingkungan Universitas Pendidikan Indonesia (UPI).

## Mengapa Teken Heula?

Seiring dengan meningkatnya kebutuhan digitalisasi dokumen di lingkungan akademik dan administrasi, UPI membutuhkan sistem penandatanganan elektronik yang tidak hanya sah secara hukum (tersertifikasi oleh Badan Siber dan Sandi Negara / BSrE), tetapi juga mampu menangani beban pemrosesan secara **massal (bulk processing)** dengan performa tinggi.

API ini dibangun untuk memberikan "jalan tol" bagi seluruh sistem dan aplikasi (*Frontend* maupun *Backend*) yang ada di lingkungan UPI agar dapat dengan mudah menyematkan fitur E-Sign dan E-Seal ke dalam dokumen PDF yang mereka hasilkan.

## Fitur Unggulan

1. **Pemrosesan Massal Cepat**: Mampu memproses ribuan dokumen secara asinkron menggunakan sistem *queue* di latar belakang.
2. **Sinergi Terpusat**: Otomatis tersinkronisasi (*Just-In-Time Provisioning*) dengan data pegawai (Sinergi UPI).
3. **Optimasi Stream**: Mengunduh langsung file akhir (*raw PDF stream*) tanpa terbebani konversi *base64* yang boros memori.
4. **Proteksi Tinggi**: Menggunakan skema keamanan `Laravel Sanctum` berbasis *Bearer Token*.

---

Mari mulai mengintegrasikan sistem Anda dengan API kami. Silakan menuju ke halaman [Referensi API Core](/api/language-cert).
