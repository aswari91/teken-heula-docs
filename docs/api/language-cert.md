---
layout: doc
---

# API Sertifikat Bahasa (Language Cert)

> **API ini digunakan untuk menerbitkan, memperbarui (merevisi), memantau status proses, dan mengunduh file PDF Sertifikat Bahasa yang telah ditandatangani secara elektronik.**

**Yang bisa Anda lakukan dengan API ini:**
- ✅ Mendaftarkan pengajuan sertifikat bahasa baru.
- ✅ Memperbarui data sertifikat (merevisi isi dokumen atau tanda tangan jika belum selesai diproses).
- ✅ Memantau status antrean sertifikat secara berkala (*real-time status check*).
- ✅ Mengunduh hasil akhir dokumen dalam format PDF yang telah disegel dan ditandatangani.

> [!NOTE]
> Proses penandatanganan dan pembubuhan segel digital berjalan secara *asynchronous*. Dokumen tidak langsung siap seketika setelah API dipanggil. Dokumen Anda akan masuk ke dalam antrean (*queue*) sistem untuk diproses secara berurutan di latar belakang guna menjaga performa server tetap optimal.

---

## Alur Kerja

Berikut adalah gambaran perjalanan dokumen sejak pertama kali dikirimkan hingga siap Anda unduh:

```mermaid
flowchart TD
    A["1. Kirim Request<br>(POST /api/sign-language-certs)"] --> B["2. Masuk Antrean<br>(status: not_yet_sealed)"]
    B --> C["3. Proses E-Seal<br>(Segel Digital BSrE)"]
    C --> D["4. Proses E-Sign<br>(Tanda Tangan Digital)"]
    D --> E["5. Selesai & Siap<br>(status: sealed)"]
    E --> F["6. Unduh PDF<br>(GET .../file)"]
```

---

## Sebelum Memulai

Pastikan sistem Anda telah menyiapkan data dan persyaratan berikut sebelum berinteraksi dengan API:

| Syarat | Keterangan |
| :--- | :--- |
| 🔑 **Bearer Token** | Kunci akses API Anda. Hubungi Admin atau dapatkan dari profil akun Anda. |
| 👤 **NIP E-Seal** | NIP penanggung jawab segel digital yang **wajib terdaftar** di sistem Sinergi UPI. |
| 👤 **NIP E-Sign** | NIP penandatangan dokumen yang **wajib terdaftar** di sistem Sinergi UPI. |
| 📄 **File PDF (Base64)** | Dokumen sertifikat asli berformat PDF yang telah dikonversi ke string Base64. |
| 🖼️ **Tanda Tangan (Base64)** | Gambar tanda tangan berformat PNG/JPG yang telah dikonversi ke string Base64. |

---

## Informasi Umum

### Base URL

Seluruh endpoint API dapat diakses menggunakan basis URL berikut sesuai dengan lingkungan (*environment*) kerja Anda:

| Lingkungan | URL |
| :--- | :--- |
| **Development** | `http://localhost:8000/api` |
| **Production** | `https://tekenheula.upi.edu/api` |

### Header Wajib

Sertakan selalu header berikut pada setiap permintaan (*request*) ke server:

```http
Authorization: Bearer <TOKEN_AKSES_ANDA>
Content-Type: application/json
Accept: application/json
```

---

## Keamanan (Authentication & Authorization)

> [!NOTE]
> Panduan lengkap mengenai cara mendapatkan token akses dan mematuhinya secara aman dapat dibaca di halaman [Autentikasi & Keamanan](./autentikasi.md).

Sistem Teken Heula menerapkan otorisasi ketat berbasis peran (*role-based permissions*) untuk memastikan hanya pihak yang berhak yang dapat memproses dokumen sertifikat.

### Lapisan 1 — Autentikasi (Siapa Anda?)
Setiap permintaan wajib menyertakan **Bearer Token** pada header HTTP `Authorization`. Token ini memverifikasi identitas pengguna Anda.

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Lapisan 2 — Otorisasi (Apa yang boleh Anda lakukan?)
Meskipun token Anda valid, tindakan Anda tetap dibatasi oleh izin (*permission*) khusus. Pastikan token Anda memiliki izin berikut:

| Jalur API | Aksi | Izin (Permission) yang Dibutuhkan |
| :--- | :--- | :--- |
| `POST /sign-language-certs` | Membuat sertifikat baru | `ApiCreate:DocLanguageCert` |
| `PUT /sign-language-certs/{documentId}` | Memperbarui data sertifikat | `ApiUpdate:DocLanguageCert` |
| `GET /sign-language-certs/{documentId}` | Melihat detail status sertifikat | `ApiView:DocLanguageCert` |
| `GET /sign-language-certs/{documentId}/file` | Mengunduh file PDF | `ApiView:DocLanguageCert` |

> [!WARNING]
> - **`401 Unauthorized`**: Terjadi jika token tidak disertakan, salah, atau telah kadaluarsa. Silakan periksa kembali penulisan token Anda.
> - **`403 Forbidden`**: Terjadi jika token valid tetapi akun Anda tidak memiliki hak akses (*permission*) untuk melakukan tindakan tersebut. Silakan hubungi Administrator sistem untuk penyesuaian hak akses.

---

## Struktur Data

### 1. Objek Utama `doc` (Informasi Sertifikat)

| Parameter | Tipe | Wajib | Batasan | Penjelasan |
| :--- | :--- | :--- | :--- | :--- |
| `certificate_number` | string | ✅ Ya | Max 255 karakter | Nomor unik sertifikat. Contoh: `"CERT-2026-001"` |
| `participant_name` | string | ✅ Ya | Max 255 karakter | Nama lengkap penerima sertifikat. |
| `institution` | string | ✅ Ya | Max 255 karakter | Nama instansi atau lembaga penerima. |
| `file_base64` | string | ✅ Ya | PDF Base64 valid | String dokumen PDF asli yang telah diubah ke format Base64. |

### 2. Objek `eseal` (Segel Digital Instansi)

| Parameter | Tipe | Wajib | Penjelasan |
| :--- | :--- | :--- | :--- |
| `nip` | string | ✅ Ya | NIP pemilik segel digital. Harus terdaftar di sistem Sinergi UPI. |

### 3. Array `esign` (Tanda Tangan Digital Pejabat)

> [!IMPORTANT]
> Untuk modul **Language Cert**, array `esign` wajib berisi **tepat 1 item** (minimal 1 dan maksimal 1 item).

Setiap item di dalam array `esign` harus memiliki properti berikut:

| Parameter | Tipe | Wajib | Penjelasan |
| :--- | :--- | :--- | :--- |
| `nip` | string | ✅ Ya | NIP penandatangan. Harus terdaftar di sistem Sinergi UPI. |
| `order` | integer | ✅ Ya | Nilai urutan tanda tangan (isi dengan `1`). |
| `signature_properties` | object | ✅ Ya | Detail properti visual tanda tangan pada halaman PDF. |

#### Sub-Objek `signature_properties`

| Parameter | Tipe | Wajib | Batasan | Penjelasan |
| :--- | :--- | :--- | :--- | :--- |
| `tag` | string | ✅ Ya | Unik | Label penanda posisi tanda tangan pada template PDF (misal: `#`). |
| `imageBase64` | string | ✅ Ya | Gambar Base64 | File gambar tanda tangan tangan (PNG/JPG) dalam format Base64. |
| `width` | numeric | ✅ Ya | Min 1 | Lebar tampilan tanda tangan digital pada dokumen (pixel). |
| `height` | numeric | ✅ Ya | Min 1 | Tinggi tampilan tanda tangan digital pada dokumen (pixel). |
| `reason` | string | Opsional | - | Alasan penandatanganan dokumen. |
| `location` | string | Opsional | - | Lokasi fisik saat penandatanganan dilakukan. |

> [!TIP]
> **Cara Mengonversi File ke Base64 via Terminal:**
> - **macOS/Linux:**
>   ```bash
>   base64 -i nama_file.pdf | tr -d '\n'
>   ```
> - **Windows (PowerShell):**
>   ```powershell
>   [Convert]::ToBase64String([IO.File]::ReadAllBytes("nama_file.pdf"))
>   ```

---

## Daftar Endpoint

### 1. Create Certificate

> **Digunakan untuk mengajukan dokumen sertifikat bahasa baru ke dalam antrean sistem untuk disegel dan ditandatangani.**

**Informasi Teknis**

| Detail | Nilai |
| :--- | :--- |
| **Method** | `POST` |
| **URL** | `/api/sign-language-certs` |
| **Keamanan** | 🔒 Bearer Token wajib disertakan |

**Contoh Permintaan (Request)**

```http
POST /api/sign-language-certs HTTP/1.1
Host: tekenheula.upi.edu
Authorization: Bearer TOKEN_ANDA
Content-Type: application/json

{
  "doc": {
    "certificate_number": "CERT-2026-001",
    "participant_name": "Budi Santoso",
    "institution": "Dinas Pendidikan",
    "file_base64": "JVBERi0xLjc..."
  },
  "eseal": {
    "nip": "198900000001"
  },
  "esign": [
    {
      "nip": "198900000002",
      "order": 1,
      "signature_properties": {
        "tag": "#",
        "imageBase64": "iVBORw0KGgo...",
        "width": 75,
        "height": 75,
        "reason": "Sebagai persetujuan kelayakan sertifikat",
        "location": "Bandung"
      }
    }
  ]
}
```

> [!NOTE]
> Jika Anda mengirimkan parameter `document_id` di dalam JSON request saat pembuatan, sistem akan mengabaikannya secara otomatis karena ID dokumen baru selalu dibuat oleh server.

**Response Jika Berhasil (`200 OK`)**

```json
{
  "message": "Sign language certificate created successfully.",
  "data": {
    "doc": {
      "document_id": "3a8d5c62-3f8f-4fc9-b6bc-079f2a174090",
      "certificate_number": "CERT-2026-001",
      "participant_name": "Budi Santoso",
      "institution": "Dinas Pendidikan",
      "eseal_status": "not_yet_sealed"
    },
    "eseal": {
      "nip": "198900000001",
      "name": "Nama Pemilik Eseal"
    },
    "esign": [
      {
        "nip": "198900000002",
        "name": "Nama Penandatangan",
        "order": 1,
        "signature_properties": {
          "tag": "#",
          "imageBase64": "iVBORw0KGgo...",
          "width": 75,
          "height": 75,
          "reason": "Sebagai persetujuan kelayakan sertifikat",
          "location": "Bandung"
        }
      }
    ],
    "latest_timeline_status": [
      {
        "level": 1,
        "status": "Document successfully submitted",
        "is_completed": true,
        "completed_at": "2026-06-06 20:00:00"
      },
      {
        "level": 2,
        "status": "Document sealing in progress",
        "is_completed": false,
        "completed_at": null
      },
      {
        "level": 3,
        "status": "Document e-signing in progress",
        "is_completed": false,
        "completed_at": null
      }
    ]
  }
}
```

**Response Jika Validasi Gagal (`422 Unprocessable Entity`)**

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "doc.file_base64": [
      "doc.file_base64 harus berupa file PDF base64 yang valid."
    ],
    "eseal.nip": [
      "eseal.nip belum terdaftar sebagai pengguna e-seal."
    ]
  }
}
```

---

### 2. Update Certificate

> **Digunakan untuk mengubah atau merevisi data sertifikat yang telah didaftarkan sebelumnya.**
> 
> *Catatan Perilaku:* API ini berguna jika terjadi kesalahan input atau revisi dokumen sebelum proses penandatanganan selesai. Jika file PDF (`file_base64`) diubah, maka status verifikasi sebelumnya (`eseal_status`) akan di-reset kembali ke awal (`not_yet_sealed`) dan seluruh antrean pengerjaan dokumen ini akan diproses ulang demi menjaga validitas integritas data.

**Informasi Teknis**

| Detail | Nilai |
| :--- | :--- |
| **Method** | `PUT` |
| **URL** | `/api/sign-language-certs/{documentId}` |
| **Keamanan** | 🔒 Bearer Token wajib disertakan |

**Parameter Path (URL)**

| Parameter | Tipe | Wajib | Penjelasan |
| :--- | :--- | :--- | :--- |
| `documentId` | string (UUID) | ✅ Ya | ID dokumen unik yang diperoleh pada saat pembuatan pertama kali. |

**Contoh Permintaan (Request)**

```http
PUT /api/sign-language-certs/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090 HTTP/1.1
Host: tekenheula.upi.edu
Authorization: Bearer TOKEN_ANDA
Content-Type: application/json

{
  "doc": {
    "certificate_number": "CERT-2026-001-REV",
    "participant_name": "Budi Santoso",
    "institution": "Dinas Pendidikan Provinsi",
    "file_base64": "JVBERi0xLjc..."
  },
  "eseal": {
    "nip": "198900000001"
  },
  "esign": [
    {
      "nip": "198900000002",
      "order": 1,
      "signature_properties": {
        "tag": "#",
        "imageBase64": "iVBORw0KGgo...",
        "width": 75,
        "height": 75,
        "reason": "Sebagai persetujuan kelayakan sertifikat (Revisi)",
        "location": "Bandung"
      }
    }
  ]
}
```

**Response Jika Berhasil (`200 OK`)**

```json
{
  "message": "Sign language certificate updated successfully.",
  "data": {
    "doc": {
      "document_id": "3a8d5c62-3f8f-4fc9-b6bc-079f2a174090",
      "certificate_number": "CERT-2026-001-REV",
      "participant_name": "Budi Santoso",
      "institution": "Dinas Pendidikan Provinsi",
      "eseal_status": "not_yet_sealed"
    },
    "eseal": {
      "nip": "198900000001",
      "name": "Nama Pemilik Eseal"
    },
    "esign": [
      {
        "nip": "198900000002",
        "name": "Nama Penandatangan",
        "order": 1,
        "signature_properties": {
          "tag": "#",
          "imageBase64": "iVBORw0KGgo...",
          "width": 75,
          "height": 75,
          "reason": "Sebagai persetujuan kelayakan sertifikat (Revisi)",
          "location": "Bandung"
        }
      }
    ],
    "latest_timeline_status": [
      {
        "level": 1,
        "status": "Document successfully submitted",
        "is_completed": true,
        "completed_at": "2026-06-06 20:15:00"
      },
      {
        "level": 2,
        "status": "Document sealing in progress",
        "is_completed": false,
        "completed_at": null
      },
      {
        "level": 3,
        "status": "Document e-signing in progress",
        "is_completed": false,
        "completed_at": null
      }
    ]
  }
}
```

---

### 3. Get Certificate Detail

> **Digunakan untuk memantau status pengerjaan sertifikat serta melacak alur *timeline* proses segel digital dan tanda tangan.**

**Informasi Teknis**

| Detail | Nilai |
| :--- | :--- |
| **Method** | `GET` |
| **URL** | `/api/sign-language-certs/{documentId}` |
| **Keamanan** | 🔒 Bearer Token wajib disertakan |

**Parameter Path (URL)**

| Parameter | Tipe | Wajib | Penjelasan |
| :--- | :--- | :--- | :--- |
| `documentId` | string (UUID) | ✅ Ya | ID dokumen unik yang akan diperiksa statusnya. |

**Contoh Permintaan (Request)**

```http
GET /api/sign-language-certs/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090 HTTP/1.1
Host: tekenheula.upi.edu
Authorization: Bearer TOKEN_ANDA
```

**Response Jika Berhasil (`200 OK`)**

```json
{
  "message": "Sign language certificate retrieved successfully.",
  "data": {
    "doc": {
      "document_id": "3a8d5c62-3f8f-4fc9-b6bc-079f2a174090",
      "certificate_number": "CERT-2026-001-REV",
      "participant_name": "Budi Santoso",
      "institution": "Dinas Pendidikan Provinsi",
      "eseal_status": "sealed"
    },
    "eseal": {
      "nip": "198900000001",
      "name": "Nama Pemilik Eseal"
    },
    "esign": [
      {
        "nip": "198900000002",
        "name": "Nama Penandatangan",
        "order": 1,
        "signature_properties": {
          "tag": "#",
          "imageBase64": "iVBORw0KGgo...",
          "width": 75,
          "height": 75,
          "reason": "Sebagai persetujuan kelayakan sertifikat (Revisi)",
          "location": "Bandung"
        }
      }
    ],
    "latest_timeline_status": [
      {
        "level": 1,
        "status": "Document successfully submitted",
        "is_completed": true,
        "completed_at": "2026-06-06 20:15:00"
      },
      {
        "level": 2,
        "status": "Document sealed",
        "is_completed": true,
        "completed_at": "2026-06-06 20:16:02"
      },
      {
        "level": 3,
        "status": "Document e-signed",
        "is_completed": true,
        "completed_at": "2026-06-06 20:16:45"
      }
    ]
  }
}
```

**Response Jika Dokumen Tidak Ditemukan (`404 Not Found`)**

```json
{
  "message": "Sign language certificate not found."
}
```

---

### 4. Download Certificate PDF

> **Mengunduh file PDF hasil penandatanganan digital secara langsung dalam bentuk binary stream.**

**Informasi Teknis**

| Detail | Nilai |
| :--- | :--- |
| **Method** | `GET` |
| **URL** | `/api/sign-language-certs/{documentId}/file` |
| **Keamanan** | 🔒 Bearer Token wajib disertakan |

**Parameter Path (URL)**

| Parameter | Tipe | Wajib | Penjelasan |
| :--- | :--- | :--- | :--- |
| `documentId` | string (UUID) | ✅ Ya | ID dokumen unik sertifikat yang ingin diunduh. |

**Contoh Permintaan (Request)**

```http
GET /api/sign-language-certs/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090/file HTTP/1.1
Host: tekenheula.upi.edu
Authorization: Bearer TOKEN_ANDA
```

**Response Jika Berhasil (`200 OK`)**
- **Content-Type:** `application/pdf`
- **Body:** Data binary file PDF (Dapat disimpan langsung menjadi file fisik `.pdf`).

**Response Jika Dokumen Belum Selesai Diproses (`400 Bad Request`)**

```json
{
  "message": "Dokumen masih dalam antrean proses atau file belum tersedia."
}
```

---

## Kode Error & Cara Mengatasinya

Berikut adalah daftar kode status HTTP yang mungkin Anda terima dari API serta solusi penanganannya:

| Kode Status | Keterangan | Arti / Penyebab | Solusi Penanganan |
| :--- | :--- | :--- | :--- |
| `200` | OK | Permintaan Anda berhasil dieksekusi. | Dokumen berhasil dibuat/diambil. |
| `400` | Bad Request | Terjadi kesalahan logika (misal: mengunduh file yang masih antre). | Periksa status dokumen terlebih dahulu sebelum mengunduh. |
| `401` | Unauthorized | Token autentikasi hilang atau kadaluarsa. | Perbarui token akses Anda di bagian Header. |
| `403` | Forbidden | Anda tidak memiliki hak akses (`permissions`) yang tepat. | Mintalah administrator untuk menambahkan permission yang sesuai. |
| `404` | Not Found | UUID dokumen tidak ditemukan di database. | Pastikan `documentId` yang Anda kirimkan sudah benar. |
| `422` | Unprocessable Entity | Parameter data yang dikirim tidak lolos validasi. | Baca objek `errors` untuk melihat parameter yang salah. |
| `500` | Internal Server Error | Terjadi kegagalan sistem pada server. | Laporkan ke tim developer Teken Heula dengan menyertakan log request. |

---

## Contoh Integrasi Lengkap

Skenario integrasi dari awal pendaftaran dokumen hingga berhasil diunduh ke komputer Anda menggunakan perintah `cURL`:

### Langkah 1: Daftarkan Dokumen Baru
Kirim dokumen sertifikat asli untuk memulai proses antrean penandatanganan.

```bash
curl -X POST "https://tekenheula.upi.edu/api/sign-language-certs" \
  -H "Authorization: Bearer PROSES_TOKEN_RAHASIA" \
  -H "Content-Type: application/json" \
  -d '{
    "doc": {
      "certificate_number": "CERT-2026-001",
      "participant_name": "Budi Santoso",
      "institution": "Dinas Pendidikan",
      "file_base64": "JVBERi0xLjc..."
    },
    "eseal": { "nip": "198900000001" },
    "esign": [
      {
        "nip": "198900000002",
        "order": 1,
        "signature_properties": {
          "tag": "#",
          "imageBase64": "iVBORw0KGgo...",
          "width": 75,
          "height": 75,
          "reason": "Sebagai persetujuan kelayakan sertifikat",
          "location": "Bandung"
        }
      }
    ]
  }'
```
*Catatan: Simpan string UUID `document_id` dari data response yang dikembalikan.*

### Langkah 2: Pantau Perkembangan Status
Karena proses berjalan secara latar belakang (*asynchronous*), lakukan pengecekan status secara berkala (misal tiap 5 detik).

```bash
curl -X GET "https://tekenheula.upi.edu/api/sign-language-certs/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090" \
  -H "Authorization: Bearer PROSES_TOKEN_RAHASIA"
```
*Tunggu hingga parameter `eseal_status` berubah dari `"not_yet_sealed"` menjadi `"sealed"` dan status timeline level 3 bernilai `is_completed: true`.*

### Langkah 3: Unduh PDF yang Sudah Ditandatangani
Jika status pengecekan sudah selesai (`sealed`), unduh berkas PDF fisik Anda.

```bash
curl -X GET "https://tekenheula.upi.edu/api/sign-language-certs/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090/file" \
  -H "Authorization: Bearer PROSES_TOKEN_RAHASIA" \
  --output sertifikat_budi_santoso.pdf
```

---

## Pertanyaan Umum (FAQ)

**❓ Berapa lama waktu rata-rata proses penandatanganan dokumen selesai?**
Waktu pengerjaan bergantung pada beban antrean server UPI. Normalnya proses pembubuhan segel digital (e-seal) dan tanda tangan (e-sign) selesai dalam waktu 5 hingga 30 detik sejak dokumen diajukan.

**❓ Apakah saya bisa melakukan revisi data jika status dokumen masih dalam proses antrean?**
Bisa. Gunakan endpoint **PUT (Update)**. Proses pengerjaan dokumen yang lama akan dibatalkan, lalu dokumen versi baru akan dimasukkan kembali dari awal antrean.

**❓ Mengapa file PDF hasil download tidak dapat dibuka atau korup?**
Masalah ini biasanya disebabkan string `file_base64` yang dikirimkan saat Create/Update tidak lengkap atau format konversinya tidak valid. Pastikan string Base64 yang Anda kirimkan murni tanpa prefix format URL (seperti `data:application/pdf;base64,`).
