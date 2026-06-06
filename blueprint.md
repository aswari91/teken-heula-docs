# 📐 Blueprint: Panduan Penulisan Dokumentasi API

Dokumen ini adalah panduan standar untuk menulis dokumentasi API Teken Heula yang baik, konsisten, dan mudah dipahami oleh pengguna. Gunakan struktur ini setiap kali Anda menambahkan halaman dokumentasi baru.

---

## 🎯 Prinsip Utama

Sebelum menulis, pegang teguh tiga prinsip ini:

1. **Tulis untuk manusia, bukan mesin.** Pembaca Anda adalah developer dari tim lain, bukan robot. Gunakan bahasa yang ramah, berikan konteks, dan hindari jargon teknis tanpa penjelasan.
2. **Satu halaman, satu topik.** Setiap halaman dokumentasi fokus pada satu kelompok API (misalnya: Sertifikat Bahasa, Penandatangan, dsb). Jangan campur aduk.
3. **Contoh lebih baik dari seribu kata.** Selalu sertakan contoh *request* dan *response* yang nyata dan bisa langsung dicopy-paste.

---

## 📋 Urutan Struktur Halaman

Ikuti urutan ini untuk setiap halaman dokumentasi API:

```
1. Judul & Ringkasan
2. Alur Proses (Flow Diagram)
3. Prasyarat (Prerequisites)
4. Informasi Umum (Base URL & Headers)
5. Autentikasi & Otorisasi
6. Definisi Objek Data (Data Model)
7. Daftar Endpoint
   ↳ Untuk setiap endpoint:
       a. Ringkasan singkat
       b. Method & URL
       c. Contoh Request
       d. Contoh Response Sukses
       e. Contoh Response Gagal
8. Kode Error & Artinya
9. Contoh Integrasi Lengkap (cURL / SDK)
10. Pertanyaan Umum (FAQ)
```

---

## 📝 Template Setiap Bagian

### 1. Judul & Ringkasan

```markdown
# Nama Fitur API

> **Satu kalimat tujuan.** Contoh: "API ini digunakan untuk menerbitkan, 
> memperbarui, dan mengunduh Sertifikat Bahasa yang telah ditandatangani 
> secara elektronik."

**Yang bisa Anda lakukan dengan API ini:**
- ✅ Membuat sertifikat baru
- ✅ Memperbarui data sertifikat
- ✅ Mengunduh file PDF hasil penandatanganan

> [!NOTE]
> Proses penandatanganan berjalan secara *asynchronous*. Dokumen tidak 
> langsung siap setelah API dipanggil—ia akan diproses melalui antrean 
> (*queue*) di latar belakang.
```

---

### 2. Alur Proses (Flow Diagram)

Tambahkan diagram mermaid yang menjelaskan alur kerja secara visual. Ini adalah bagian yang paling sering dilewatkan namun paling membantu pengguna.

```markdown
## Alur Kerja

Berikut adalah gambaran alur dokumen dari pengiriman hingga siap diunduh:

\`\`\`mermaid
flowchart LR
    A["Kirim Request\n(POST /api/...)"] --> B["Dokumen Masuk\nAntrean"]
    B --> C["Proses E-Seal\n(Segel Digital BSrE)"]
    C --> D["Proses E-Sign\n(Tanda Tangan Digital)"]
    D --> E["Dokumen Siap\n(Status: selesai)"]
    E --> F["Unduh PDF\n(GET .../file)"]
\`\`\`
```

---

### 3. Prasyarat

```markdown
## Sebelum Memulai

Pastikan Anda sudah memiliki:

| Syarat | Keterangan |
|--------|------------|
| 🔑 Bearer Token | Dapatkan dari halaman profil aplikasi atau dari Admin |
| 👤 NIP Penandatangan | NIP wajib sudah terdaftar di Sinergi UPI |
| 📄 File Dokumen | Format PDF, dikonversi ke Base64 |
| 🖼️ Gambar Tanda Tangan | Format PNG/JPG, dikonversi ke Base64 |
```

---

### 4. Informasi Umum

```markdown
## Informasi Umum

### Base URL

| Lingkungan | URL |
|------------|-----|
| Development | `http://localhost:8000/api` |
| Production | `https://tekenheula.upi.edu/api` |

### Header Wajib

Sertakan header berikut di **setiap** permintaan:

\`\`\`http
Authorization: Bearer <TOKEN_ANDA>
Content-Type: application/json
Accept: application/json
\`\`\`
```

---

### 5. Autentikasi & Otorisasi

```markdown
## Keamanan (Authentication & Authorization)

API ini menggunakan sistem keamanan berlapis:

### Lapisan 1 — Autentikasi (Siapa kamu?)
Setiap permintaan wajib menyertakan **Bearer Token** di *Header*.
Token ini membuktikan bahwa Anda adalah pengguna sah yang sudah *login*.

\`\`\`http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
\`\`\`

### Lapisan 2 — Otorisasi (Apa yang boleh kamu lakukan?)
Meski Token valid, setiap tindakan memerlukan **izin (permission)** khusus:

| Aksi | Permission yang Dibutuhkan |
|------|---------------------------|
| Membuat dokumen | `ApiCreate:NamaModel` |
| Memperbarui dokumen | `ApiUpdate:NamaModel` |
| Melihat & Mengunduh | `ApiView:NamaModel` |

> [!WARNING]
> - **401 Unauthorized** → Token tidak ada, salah, atau kadaluarsa.
> - **403 Forbidden** → Token valid, tapi Anda tidak punya izin untuk tindakan ini.
> Hubungi Admin untuk mendapatkan izin akses yang sesuai.
```

---

### 6. Definisi Objek Data (Data Model)

Jelaskan setiap field dengan bahasa yang mudah dipahami, bukan sekadar tipe data.

```markdown
## Struktur Data

### Objek `doc` — Informasi Dokumen Utama

| Field | Tipe | Wajib | Penjelasan |
|-------|------|-------|------------|
| `certificate_number` | string | ✅ Ya | Nomor unik sertifikat. Contoh: `"CERT-2026-001"` |
| `participant_name` | string | ✅ Ya | Nama lengkap peserta |
| `institution` | string | ✅ Ya | Nama instansi/lembaga peserta |
| `file_base64` | string | ✅ Ya | File PDF yang dikodekan dalam format Base64 |

> [!TIP]
> **Cara mengkonversi PDF ke Base64 di Terminal:**
> \`\`\`bash
> base64 -i dokumen.pdf | tr -d '\n'
> \`\`\`
```

---

### 7. Endpoint — Template Per-Endpoint

Setiap endpoint harus memiliki struktur yang konsisten:

```markdown
### [NOMOR]. [Nama Aksi]

> **Apa yang dilakukan endpoint ini?** Jelaskan dalam 1-2 kalimat singkat.

---

**Informasi Teknis**

| Detail | Nilai |
|--------|-------|
| Method | `POST` / `GET` / `PUT` / `DELETE` |
| URL | `/api/nama-endpoint` |
| Auth | 🔒 Bearer Token wajib |

---

**Contoh Request**

\`\`\`http
POST /api/sign-language-certs HTTP/1.1
Host: tekenheula.upi.edu
Authorization: Bearer TOKEN_ANDA
Content-Type: application/json

{
  "field": "nilai contoh yang realistis"
}
\`\`\`

---

**✅ Response Jika Berhasil** (`200 OK`)

\`\`\`json
{
  "message": "Pesan sukses yang jelas",
  "data": { ... }
}
\`\`\`

---

**❌ Response Jika Gagal**

| Status | Penyebab Umum |
|--------|---------------|
| `400 Bad Request` | ... |
| `404 Not Found` | ... |
| `422 Unprocessable Entity` | Validasi data gagal |
```

---

### 8. Kode Error & Artinya

```markdown
## Kode Error & Cara Mengatasinya

| Kode | Nama | Penyebab | Yang Harus Dilakukan |
|------|------|----------|----------------------|
| `200` | OK | Permintaan berhasil | — |
| `400` | Bad Request | Data tidak valid atau dokumen belum siap | Periksa isi *request* dan status dokumen |
| `401` | Unauthorized | Token tidak ada / kadaluarsa | Perbarui Token Anda |
| `403` | Forbidden | Tidak memiliki izin | Hubungi Admin untuk menambah izin |
| `404` | Not Found | ID dokumen tidak ditemukan | Periksa kembali `documentId` |
| `422` | Unprocessable Entity | Validasi field gagal | Baca pesan `errors` di *response* |
| `500` | Internal Server Error | Kesalahan di sisi server | Hubungi tim developer |
```

---

### 9. Contoh Integrasi Lengkap

```markdown
## Contoh Integrasi

Berikut adalah contoh lengkap dari awal hingga akhir untuk membuat dan mengunduh sertifikat:

### Langkah 1 — Buat Sertifikat

\`\`\`bash
curl -X POST "https://tekenheula.upi.edu/api/sign-language-certs" \
  -H "Authorization: Bearer TOKEN_ANDA" \
  -H "Content-Type: application/json" \
  -d '{ ... payload lengkap ... }'
\`\`\`

Simpan nilai `document_id` dari *response*.

### Langkah 2 — Tunggu Proses Selesai

Karena penandatanganan berjalan di latar belakang, pantau status dokumen:

\`\`\`bash
curl -X GET "https://tekenheula.upi.edu/api/sign-language-certs/{documentId}" \
  -H "Authorization: Bearer TOKEN_ANDA"
\`\`\`

Dokumen siap diunduh jika `eseal_status` bernilai `"sealed"`.

### Langkah 3 — Unduh File PDF

\`\`\`bash
curl -X GET "https://tekenheula.upi.edu/api/sign-language-certs/{documentId}/file" \
  -H "Authorization: Bearer TOKEN_ANDA" \
  --output sertifikat.pdf
\`\`\`
```

---

### 10. FAQ (Opsional, sangat dianjurkan)

```markdown
## Pertanyaan Umum (FAQ)

**❓ Berapa lama proses penandatanganan berlangsung?**
Biasanya dalam hitungan detik hingga beberapa menit, tergantung antrean server saat itu.

**❓ Apa yang terjadi jika saya mengupdate dokumen yang sedang diproses?**
Data akan direset dan dokumen akan diproses ulang dari awal.

**❓ Bisakah satu dokumen ditandatangani oleh lebih dari satu orang?**
Bisa, tambahkan lebih dari satu objek di dalam array `esign` dengan `order` yang berbeda.
```


---

## 🔐 Template Halaman Khusus: Autentikasi & Keamanan API

Halaman ini berbeda dari halaman referensi API biasa. Tujuannya adalah menjawab satu pertanyaan mendasar: **"Bagaimana cara saya mendapatkan akses ke API ini?"**

Halaman ini harus ditulis seperti panduan *onboarding* — ramah untuk developer baru yang baru pertama kali menggunakan sistem. Hindari asumsi bahwa pembaca sudah tahu apa itu Bearer Token atau permission.

### Urutan Struktur Halaman Autentikasi

```
1. Judul & Tujuan Halaman
2. Penjelasan Konsep (Apa itu Token & Permission?)
3. Alur Proses Mendapatkan Akses (Flow Diagram)
4. Panduan Langkah-demi-Langkah: Mendapatkan Token
5. Cara Menggunakan Token di API Request
6. Daftar Kode Error & Arti
7. Praktik Keamanan Terbaik
8. Pertanyaan Umum (FAQ)
```

---

### Template Lengkap

```markdown
# Autentikasi & Keamanan API

> Sebelum dapat memanggil endpoint manapun, Anda membutuhkan sebuah **Token Akses**.
> Halaman ini menjelaskan apa itu token, cara mendapatkannya, dan cara
> menggunakannya dengan benar dan aman.

---

## Apa Itu Token dan Mengapa Dibutuhkan?

Bayangkan token seperti **kartu akses gedung kantor**. Setiap kali Anda masuk,
Anda menempelkan kartu ke sensor — sensor itu memverifikasi identitas Anda.
Token API bekerja persis sama: ia membuktikan kepada server bahwa Anda adalah
pengguna sah yang telah login.

Tanpa token, semua request akan ditolak dengan pesan `401 Unauthorized`.

Ada dua konsep yang perlu dipahami:

| Konsep | Pertanyaan yang Dijawab | Kode Error Jika Gagal |
| :--- | :--- | :--- |
| **Autentikasi** | *Siapa kamu?* — Verifikasi identitas lewat token | `401 Unauthorized` |
| **Otorisasi** | *Apa yang boleh kamu lakukan?* — Cek hak akses (permission) | `403 Forbidden` |

> [!NOTE]
> Token hanya membuktikan Anda sudah login. Tapi setiap endpoint juga
> membutuhkan **izin (permission)** khusus. Memiliki token tidak otomatis
> memberikan akses ke semua fitur — hubungi Admin jika Anda menerima `403`.

---

## Alur Mendapatkan Akses

\`\`\`mermaid
flowchart TD
    A["Anda (Developer)"] --> B["Login ke Aplikasi\nTeken Heula"]
    B --> C["Buka Halaman Profil / API Token"]
    C --> D["Generate / Salin Token"]
    D --> E["Gunakan Token di Header\nAuthorization: Bearer ..."]
    E --> F{{"Akses API Berhasil ✅"}}
\`\`\`

---

## Langkah 1 — Login ke Aplikasi

Buka aplikasi Teken Heula di browser Anda dan login menggunakan akun SSO UPI
atau akun yang telah diberikan oleh Administrator.

> [!IMPORTANT]
> Akun Anda harus sudah aktif dan memiliki izin akses API dari Administrator
> sebelum dapat melanjutkan. Jika belum, hubungi tim IT atau Admin sistem.

---

## Langkah 2 — Salin Token Akses Anda

Setelah login, ikuti langkah berikut:

1. Klik ikon profil Anda di pojok kanan atas.
2. Pilih menu **"Profil"** atau **"API Token"**.
3. Klik tombol **"Generate Token"** jika belum ada, atau **salin** token yang
   sudah ada.

> [!WARNING]
> **Jaga kerahasiaan token Anda.** Token bersifat seperti kata sandi.
> Jangan pernah meletakkannya di dalam kode yang di-*commit* ke Git,
> atau membagikannya melalui chat / email.

---

## Langkah 3 — Gunakan Token di Setiap Request

Setelah mendapatkan token, sertakan di setiap request API pada bagian **Header**:

\`\`\`http
Authorization: Bearer <TOKEN_ANDA_DI_SINI>
Content-Type: application/json
Accept: application/json
\`\`\`

Contoh menggunakan `cURL`:

\`\`\`bash
curl -X GET "https://tekenheula.upi.edu/api/sign-language-certs/abc-123" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
\`\`\`

> [!TIP]
> Di aplikasi seperti **Postman** atau **Insomnia**, Anda cukup isi bagian
> *Authorization* dengan tipe **Bearer Token**, lalu tempelkan token Anda di
> kolom yang tersedia — tidak perlu menulis manual di Header.

---

## Kode Error Terkait Autentikasi

| Kode | Arti | Penyebab Umum | Yang Harus Dilakukan |
| :--- | :--- | :--- | :--- |
| `401 Unauthorized` | Token tidak dikenali | Token hilang, salah ketik, atau sudah kadaluarsa | Salin ulang token dari halaman profil |
| `403 Forbidden` | Tidak memiliki hak akses | Token valid, tapi permission tidak ada | Hubungi Admin untuk meminta izin akses |

---

## Praktik Keamanan Terbaik

Ikuti panduan berikut untuk menjaga keamanan integrasi Anda:

- ❌ **Jangan** menyimpan token langsung di dalam kode (`hardcode`).
- ✅ Simpan token di **Environment Variable** (`.env`) dan baca dari sana.
- ✅ Rutin **perbarui (rotate) token** secara berkala, terutama jika ada
  anggota tim yang keluar.
- ✅ Gunakan token yang berbeda untuk setiap lingkungan (*Development* vs
  *Production*).
- ❌ **Jangan** membagikan token melalui WhatsApp, Slack, atau media komunikasi
  yang tidak terenkripsi.

---

## Pertanyaan Umum (FAQ)

**❓ Berapa lama token berlaku sebelum kadaluarsa?**
Token berlaku selama sesi login aktif. Jika Anda logout atau token dicabut oleh
Admin, token tersebut tidak akan bisa digunakan lagi dan Anda perlu
mendapatkan token baru.

**❓ Apa yang harus saya lakukan jika token saya bocor atau diketahui orang lain?**
Segera hubungi Admin untuk mencabut (*revoke*) token tersebut, lalu generate
token baru dari halaman profil Anda.

**❓ Apakah satu token bisa digunakan untuk semua endpoint API?**
Token mengidentifikasi identitas Anda, namun akses ke endpoint tertentu tetap
bergantung pada **permission** yang diberikan Admin ke akun Anda. Satu token
bisa digunakan ke semua endpoint yang sudah diizinkan.

**❓ Kenapa saya mendapat error `403` padahal token saya benar?**
Artinya token Anda valid (identitas dikenali), tapi akun Anda belum memiliki
izin (*permission*) untuk endpoint tersebut. Hubungi Administrator untuk
meminta penambahan permission yang sesuai.
```

---

### ✅ Checklist Khusus Halaman Autentikasi

Sebelum mempublikasikan halaman autentikasi, pastikan:

- [ ] Penjelasan konsep token ditulis dengan analogi yang mudah dipahami
- [ ] Terdapat flow diagram visual alur mendapatkan token
- [ ] Panduan langkah-demi-langkah ditulis sejelas mungkin (asumsikan pembaca pemula)
- [ ] Ada peringatan (`WARNING`) tentang kerahasiaan token
- [ ] Perbedaan `401` dan `403` dijelaskan dengan jelas
- [ ] Terdapat section "Praktik Keamanan Terbaik"
- [ ] FAQ mencakup minimal: kadaluarsa token, token bocor, dan perbedaan 401 vs 403

---

## ✅ Checklist Sebelum Publish

Sebelum halaman dokumentasi baru dipublikasikan, pastikan semua item ini sudah terpenuhi:

- [ ] Judul dan ringkasan jelas dalam 1-2 kalimat
- [ ] Terdapat diagram alur proses (*flow diagram*)
- [ ] Semua prasyarat disebutkan
- [ ] Contoh *request* bisa langsung di-*copy-paste* dan dijalankan
- [ ] Semua kode *response* menggunakan data yang realistis (bukan *Lorem Ipsum*)
- [ ] Semua kemungkinan *response* error tercantum
- [ ] Tidak ada kalimat teknis yang dibiarkan tanpa penjelasan
- [ ] Sudah diuji baca oleh orang yang tidak mengenal sistem ini
