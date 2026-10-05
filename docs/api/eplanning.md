---
layout: doc
---

# API Dokumen e-Planning (RKAT)

> **API ini digunakan untuk mendaftarkan, memperbarui (merevisi), memantau status proses, dan mengunduh file PDF Dokumen RKAT yang telah ditandatangani secara elektronik.**

Modul ini melayani integrasi dari aplikasi **e-Planning** untuk penandatanganan elektronik dokumen **RKAT** (Rencana Kerja dan Anggaran Tahunan). Alur, struktur data, dan aturan validasinya identik dengan modul [SAKIP](./sakip.md) — yang berbeda hanya jalur endpoint (`/api/sign-eplanning`) dan izin aksesnya (`*:DocEplanning`).

**Yang bisa Anda lakukan dengan API ini:**

- ✅ Mendaftarkan pengajuan dokumen RKAT baru.
- ✅ Memperbarui data dokumen (merevisi isi dokumen atau tanda tangan jika belum selesai diproses).
- ✅ Memantau status antrean dokumen secara berkala (_real-time status check_).
- ✅ Mengunduh hasil akhir dokumen dalam format PDF yang telah ditandatangani.

> [!NOTE]
> Proses penandatanganan digital berjalan secara _asynchronous_. Dokumen tidak langsung siap seketika setelah API dipanggil. Dokumen Anda akan masuk ke dalam antrean (_queue_) sistem untuk diproses secara berurutan di latar belakang guna menjaga performa server tetap optimal.

> [!IMPORTANT]
> Modul e-Planning **tidak memiliki tahap E-Seal**. Dokumen langsung masuk ke tahap E-Sign begitu diajukan — begitu API dipanggil, penandatangan pertama (`order: 1`) langsung berstatus siap ditandatangani di panel admin miliknya.

## Alur Kerja

Berikut adalah gambaran perjalanan dokumen sejak pertama kali dikirimkan hingga siap Anda unduh. Jika Anda mengirimkan lebih dari satu penandatangan, setiap penandatangan berikutnya baru "aktif" (siap ditandatangani) setelah penandatangan dengan `order` sebelumnya menyelesaikan tanda tangannya — proses berjenjang, bukan serentak.

```mermaid
flowchart TD
    A["1. Kirim Request<br>(POST /api/sign-eplanning)"] --> B["2. Penandatangan #1 Siap<br>(status: not_yet_signed)"]
    B --> C["3. Penandatangan #1 Menandatangani"]
    C --> D{"Ada penandatangan<br>berikutnya?"}
    D -- Ya --> E["Penandatangan #2 Siap<br>(status: not_yet_signed)"]
    E --> C
    D -- Tidak --> F["4. Selesai & Siap<br>(status: finished_signing)"]
    F --> G["5. Unduh PDF<br>(GET .../file)"]
```

## Sebelum Memulai

Pastikan sistem Anda telah menyiapkan data dan persyaratan berikut sebelum berinteraksi dengan API:

| Syarat                       | Keterangan                                                                    |
| :--------------------------- | :----------------------------------------------------------------------------- |
| 🔑 **Bearer Token**          | Kunci akses API Anda. Hubungi Admin atau dapatkan dari profil akun Anda.        |
| 👤 **NIP E-Sign**            | NIP setiap penandatangan dokumen yang **wajib terdaftar** di sistem Sinergi UPI. |
| 📄 **File PDF (Base64)**     | Dokumen RKAT asli berformat PDF yang telah dikonversi ke string Base64.        |
| 🖼️ **Tanda Tangan (Base64)** | Gambar tanda tangan berformat PNG/JPG yang telah dikonversi ke string Base64.   |

## Informasi Umum

### Base URL

Seluruh endpoint API dapat diakses menggunakan basis URL berikut sesuai dengan lingkungan (_environment_) kerja Anda:

| Lingkungan      | URL                              |
| :-------------- | :-------------------------------- |
| **Development** | `http://localhost:8000/api`      |
| **Production**  | `https://teken.upi.edu/api` |

### Header Wajib

Sertakan selalu header berikut pada setiap permintaan (_request_) ke server:

```http
Authorization: Bearer <TOKEN_AKSES_ANDA>
Content-Type: application/json
Accept: application/json
```

## Keamanan (Authentication & Authorization)

> [!NOTE]
> Panduan lengkap mengenai cara mendapatkan token akses dan mematuhinya secara aman dapat dibaca di halaman [Autentikasi & Keamanan](./autentikasi.md).

Sistem Teken Heula menerapkan otorisasi ketat berbasis peran (_role-based permissions_) untuk memastikan hanya pihak yang berhak yang dapat memproses dokumen.

### Lapisan 1 — Autentikasi (Siapa Anda?)

Setiap permintaan wajib menyertakan **Bearer Token** pada header HTTP `Authorization`. Token ini memverifikasi identitas pengguna Anda.

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Lapisan 2 — Otorisasi (Apa yang boleh Anda lakukan?)

Meskipun token Anda valid, tindakan Anda tetap dibatasi oleh izin (_permission_) khusus. Pastikan token Anda memiliki izin berikut:

| Jalur API                           | Aksi                          | Izin (Permission) yang Dibutuhkan |
| :----------------------------------- | :----------------------------- | :--------------------------------- |
| `POST /sign-eplanning`                   | Membuat dokumen RKAT baru     | `ApiCreate:DocEplanning`               |
| `PUT /sign-eplanning/{documentId}`       | Memperbarui data dokumen       | `ApiUpdate:DocEplanning`               |
| `GET /sign-eplanning/{documentId}`       | Melihat detail status dokumen  | `ApiView:DocEplanning`                 |
| `GET /sign-eplanning/{documentId}/file`  | Mengunduh file PDF             | `ApiView:DocEplanning`                 |

> [!WARNING]
>
> - **`401 Unauthorized`**: Terjadi jika token tidak disertakan, salah, atau telah kadaluarsa. Silakan periksa kembali penulisan token Anda.
> - **`403 Forbidden`**: Terjadi jika token valid tetapi akun Anda tidak memiliki hak akses (_permission_) untuk melakukan tindakan tersebut. Silakan hubungi Administrator sistem untuk penyesuaian hak akses.

## Struktur Data

### 1. Objek Utama `doc` (Informasi Dokumen)

| Parameter         | Tipe   | Wajib     | Batasan          | Penjelasan                                                                                   |
| :---------------- | :----- | :-------- | :---------------- | :--------------------------------------------------------------------------------------------- |
| `doc_number`      | string | Opsional | Max 255 karakter | Nomor referensi dokumen (jika ada). **Tidak wajib unik** — dokumen RKAT dapat diajukan sebelum mendapat nomor resmi. |
| `doc_information` | string | ✅ Ya     | Max 255 karakter | Informasi atau perihal tentang isi dokumen RKAT (contoh: "RKAT Tahun Anggaran 2027 Fakultas X").      |
| `file_base64`     | string | ✅ Ya     | PDF Base64 valid | String dokumen PDF asli yang telah diubah ke format Base64.                                  |

> [!TIP]
> Berbeda dengan modul lain, `doc_number` di sini **boleh dikosongkan dan boleh duplikat**. Identitas unik dokumen tetap dijamin oleh `document_id` (UUID) yang dikembalikan server, bukan oleh `doc_number`.

### 2. Array `esign` (Tanda Tangan Digital Pejabat)

> [!IMPORTANT]
> Untuk modul **e-Planning (RKAT)**, array `esign` wajib berisi **minimal 1 item**, dan mendukung **penandatanganan berjenjang** (lebih dari satu orang, diproses berurutan sesuai `order`) — misalnya dari penyusun, lalu kepala unit, lalu kepala balai.

Setiap item di dalam array `esign` harus memiliki properti berikut:

| Parameter              | Tipe    | Wajib | Penjelasan                                                 |
| :--------------------- | :------ | :---- | :----------------------------------------------------------- |
| `nip`                  | string  | ✅ Ya | NIP penandatangan. Harus terdaftar di sistem Sinergi UPI.    |
| `order`                | integer | ✅ Ya | Nilai urutan tanda tangan (harus unik untuk setiap orang).   |
| `signature_properties` | object  | ✅ Ya | Detail properti visual tanda tangan pada halaman PDF.        |

#### Sub-Objek `signature_properties`

| Parameter     | Tipe    | Wajib    | Batasan       | Penjelasan                                                        |
| :------------ | :------ | :------- | :------------ | :---------------------------------------------------------------- |
| `tag`         | string  | ✅ Ya    | Unik          | Label penanda posisi tanda tangan pada template PDF (misal: `#`). |
| `imageBase64` | string  | ✅ Ya    | Gambar Base64 | File gambar tanda tangan tangan (PNG/JPG) dalam format Base64.    |
| `width`       | numeric | ✅ Ya    | Min 1         | Lebar tampilan tanda tangan digital pada dokumen (pixel).         |
| `height`      | numeric | ✅ Ya    | Min 1         | Tinggi tampilan tanda tangan digital pada dokumen (pixel).        |
| `reason`      | string  | Opsional | -             | Alasan penandatanganan dokumen.                                   |
| `location`    | string  | Opsional | -             | Lokasi fisik saat penandatanganan dilakukan.                      |

> [!TIP]
> **Cara Mengonversi File ke Base64 via Terminal:**
>
> - **macOS/Linux:**
>   ```bash
>   base64 -i nama_file.pdf | tr -d '\n'
>   ```
> - **Windows (PowerShell):**
>   ```powershell
>   [Convert]::ToBase64String([IO.File]::ReadAllBytes("nama_file.pdf"))
>   ```

## Daftar Endpoint

### 1. Create RKAT Document

> **Digunakan untuk mengajukan dokumen RKAT baru ke dalam antrean sistem untuk ditandatangani.**

**Informasi Teknis**

| Detail       | Nilai                            |
| :----------- | :--------------------------------- |
| **Method**   | `POST`                            |
| **URL**      | `/api/sign-eplanning`                |
| **Keamanan** | 🔒 Bearer Token wajib disertakan |

**Contoh Permintaan (Request)**

```http
POST /api/sign-eplanning HTTP/1.1
Host: teken.upi.edu
Authorization: Bearer TOKEN_ANDA
Content-Type: application/json

{
  "doc": {
    "doc_number": "RKAT-2027-001",
    "doc_information": "RKAT Tahun Anggaran 2027",
    "file_base64": "JVBERi0xLjc..."
  },
  "esign": [
    {
      "nip": "197709152006041003",
      "order": 1,
      "signature_properties": {
        "tag": "#",
        "imageBase64": "iVBORw0KGgo...",
        "width": 75,
        "height": 75,
        "reason": "Menyusun dokumen",
        "location": "Bandung"
      }
    },
    {
      "nip": "199004292015042002",
      "order": 2,
      "signature_properties": {
        "tag": "$",
        "imageBase64": "iVBORw0KGgo...",
        "width": 75,
        "height": 75,
        "reason": "Menyetujui dokumen",
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
  "message": "Sign RKAT document created successfully.",
  "data": {
    "doc": {
      "document_id": "3a8d5c62-3f8f-4fc9-b6bc-079f2a174090",
      "doc_number": "RKAT-2027-001",
      "doc_information": "RKAT Tahun Anggaran 2027"
    },
    "esign": [
      {
        "nip": "197709152006041003",
        "name": "Nama Penandatangan Pertama",
        "order": 1,
        "status": {
          "id": 1,
          "value": "not_yet_signed",
          "label": "Belum Ditandatangani"
        },
        "signature_properties": {
          "tag": "#",
          "imageBase64": true,
          "width": 75,
          "height": 75,
          "reason": "Menyusun dokumen",
          "location": "Bandung"
        }
      },
      {
        "nip": "199004292015042002",
        "name": "Nama Penandatangan Kedua",
        "order": 2,
        "status": null,
        "signature_properties": {
          "tag": "$",
          "imageBase64": true,
          "width": 75,
          "height": 75,
          "reason": "Menyetujui dokumen",
          "location": "Bandung"
        }
      }
    ],
    "latest_timeline_status": [
      {
        "level": 1,
        "status": "Dokumen berhasil diajukan",
        "is_completed": true,
        "completed_at": "2026-08-13 20:00:00"
      },
      {
        "level": 2,
        "status": "Proses e-sign",
        "is_completed": false,
        "completed_at": null
      }
    ]
  }
}
```

> [!TIP]
> Perhatikan `status: null` pada penandatangan kedua (`order: 2`) — ini normal. Penandatangan berikutnya baru mendapat status `not_yet_signed` (dan baru muncul di panel admin miliknya) setelah penandatangan sebelumnya (`order: 1`) selesai menandatangani.

**Response Jika Validasi Gagal (`422 Unprocessable Entity`)**

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "doc.doc_information": [
      "Informasi dokumen wajib diisi."
    ],
    "doc.file_base64": [
      "doc.file_base64 harus berupa file PDF base64 yang valid."
    ]
  }
}
```

### 2. Update RKAT Document

> **Digunakan untuk mengubah atau merevisi data dokumen yang telah didaftarkan sebelumnya.**
>
> _Catatan Perilaku:_ API ini berguna jika terjadi kesalahan input atau revisi dokumen sebelum proses penandatanganan selesai. Mengirimkan array `esign` akan **mengganti seluruh daftar penandatangan** dokumen tersebut (bukan menambah) — urutan tanda tangan akan dimulai kembali dari `order: 1`.

**Informasi Teknis**

| Detail       | Nilai                                 |
| :----------- | :--------------------------------------- |
| **Method**   | `PUT`                                    |
| **URL**      | `/api/sign-eplanning/{documentId}`          |
| **Keamanan** | 🔒 Bearer Token wajib disertakan         |

**Parameter Path (URL)**

| Parameter    | Tipe          | Wajib | Penjelasan                                                       |
| :----------- | :------------ | :---- | :----------------------------------------------------------------- |
| `documentId` | string (UUID) | ✅ Ya | ID dokumen unik yang diperoleh pada saat pembuatan pertama kali. |

**Contoh Permintaan (Request)**

```http
PUT /api/sign-eplanning/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090 HTTP/1.1
Host: teken.upi.edu
Authorization: Bearer TOKEN_ANDA
Content-Type: application/json

{
  "doc": {
    "doc_number": "RKAT-2027-001",
    "doc_information": "RKAT Tahun Anggaran 2027 (Revisi)",
    "file_base64": "JVBERi0xLjc..."
  },
  "esign": [
    {
      "nip": "197709152006041003",
      "order": 1,
      "signature_properties": {
        "tag": "#",
        "imageBase64": "iVBORw0KGgo...",
        "width": 75,
        "height": 75,
        "reason": "Menyetujui dokumen revisi",
        "location": "Bandung"
      }
    }
  ]
}
```

**Response Jika Berhasil (`200 OK`)**

```json
{
  "message": "Sign RKAT document updated successfully.",
  "data": {
    "doc": {
      "document_id": "3a8d5c62-3f8f-4fc9-b6bc-079f2a174090",
      "doc_number": "RKAT-2027-001",
      "doc_information": "RKAT Tahun Anggaran 2027 (Revisi)"
    },
    "esign": [
      {
        "nip": "197709152006041003",
        "name": "Nama Penandatangan Pertama",
        "order": 1,
        "status": {
          "id": 1,
          "value": "not_yet_signed",
          "label": "Belum Ditandatangani"
        },
        "signature_properties": {
          "tag": "#",
          "imageBase64": true,
          "width": 75,
          "height": 75,
          "reason": "Menyetujui dokumen revisi",
          "location": "Bandung"
        }
      }
    ],
    "latest_timeline_status": [
      {
        "level": 1,
        "status": "Dokumen berhasil diajukan",
        "is_completed": true,
        "completed_at": "2026-08-13 20:15:00"
      },
      {
        "level": 2,
        "status": "Proses e-sign",
        "is_completed": false,
        "completed_at": null
      }
    ]
  }
}
```

### 3. Get Document Detail

> **Digunakan untuk memantau status pengerjaan dokumen serta melacak alur _timeline_ proses tanda tangan.**

**Informasi Teknis**

| Detail       | Nilai                                 |
| :----------- | ---------------------------------------- |
| **Method**   | `GET`                                    |
| **URL**      | `/api/sign-eplanning/{documentId}`          |
| **Keamanan** | 🔒 Bearer Token wajib disertakan         |

**Parameter Path (URL)**

| Parameter    | Tipe          | Wajib | Penjelasan                                     |
| :----------- | :------------ | :---- | :-------------------------------------------- |
| `documentId` | string (UUID) | ✅ Ya | ID dokumen unik yang akan diperiksa statusnya. |

**Contoh Permintaan (Request)**

```http
GET /api/sign-eplanning/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090 HTTP/1.1
Host: teken.upi.edu
Authorization: Bearer TOKEN_ANDA
```

**Response Jika Berhasil (`200 OK`)**

```json
{
  "message": "Sign RKAT document retrieved successfully.",
  "data": {
    "doc": {
      "document_id": "3a8d5c62-3f8f-4fc9-b6bc-079f2a174090",
      "doc_number": "RKAT-2027-001",
      "doc_information": "RKAT Tahun Anggaran 2027 (Revisi)"
    },
    "esign": [
      {
        "nip": "197709152006041003",
        "name": "Nama Penandatangan Pertama",
        "order": 1,
        "status": {
          "id": 4,
          "value": "finished_signing",
          "label": "Selesai"
        },
        "signature_properties": {
          "tag": "#",
          "imageBase64": true,
          "width": 75,
          "height": 75,
          "reason": "Menyetujui dokumen revisi",
          "location": "Bandung"
        }
      }
    ],
    "latest_timeline_status": [
      {
        "level": 1,
        "status": "Dokumen berhasil diajukan",
        "is_completed": true,
        "completed_at": "2026-08-13 20:15:00"
      },
      {
        "level": 2,
        "status": "Proses e-sign",
        "is_completed": true,
        "completed_at": "2026-08-13 20:16:45"
      }
    ]
  }
}
```

**Response Jika Dokumen Tidak Ditemukan (`404 Not Found`)**

```json
{
  "message": "Sign RKAT document not found."
}
```

### 4. Download Document PDF

> **Mengunduh file PDF hasil penandatanganan digital secara langsung dalam bentuk binary stream.**

**Informasi Teknis**

| Detail       | Nilai                                      |
| :----------- | ---------------------------------------------- |
| **Method**   | `GET`                                          |
| **URL**      | `/api/sign-eplanning/{documentId}/file`           |
| **Keamanan** | 🔒 Bearer Token wajib disertakan               |

**Parameter Path (URL)**

| Parameter    | Tipe          | Wajib | Penjelasan                                  |
| :----------- | :------------ | :---- | :-------------------------------------------- |
| `documentId` | string (UUID) | ✅ Ya | ID dokumen unik RKAT yang ingin diunduh.   |

**Contoh Permintaan (Request)**

```http
GET /api/sign-eplanning/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090/file HTTP/1.1
Host: teken.upi.edu
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

## Kode Error & Cara Mengatasinya

Berikut adalah daftar kode status HTTP yang mungkin Anda terima dari API serta solusi penanganannya:

| Kode Status | Keterangan            | Arti / Penyebab                                                    | Solusi Penanganan                                                     |
| :---------- | :--------------------- | :------------------------------------------------------------------- | :------------------------------------------------------------------- |
| `200`       | OK                     | Permintaan Anda berhasil dieksekusi.                                  | Dokumen berhasil dibuat/diambil.                                      |
| `400`       | Bad Request            | Terjadi kesalahan logika (misal: mengunduh file yang masih antre).    | Periksa status dokumen terlebih dahulu sebelum mengunduh.             |
| `401`       | Unauthorized           | Token autentikasi hilang atau kadaluarsa.                             | Perbarui token akses Anda di bagian Header.                           |
| `403`       | Forbidden              | Anda tidak memiliki hak akses (`permissions`) yang tepat.             | Mintalah administrator untuk menambahkan permission yang sesuai.      |
| `404`       | Not Found              | UUID dokumen tidak ditemukan di database.                             | Pastikan `documentId` yang Anda kirimkan sudah benar.                 |
| `422`       | Unprocessable Entity   | Parameter data yang dikirim tidak lolos validasi.                     | Baca objek `errors` untuk melihat parameter yang salah.               |
| `500`       | Internal Server Error  | Terjadi kegagalan sistem pada server.                                 | Laporkan ke tim developer Teken Heula dengan menyertakan log request. |

## Contoh Integrasi Lengkap

Skenario integrasi dari awal pendaftaran dokumen berjenjang (dua penandatangan) hingga berhasil diunduh ke komputer Anda menggunakan perintah `cURL`:

### Langkah 1: Daftarkan Dokumen Baru

Kirim dokumen asli untuk memulai proses antrean penandatanganan berjenjang.

```bash
curl -X POST "https://teken.upi.edu/api/sign-eplanning" \
  -H "Authorization: Bearer PROSES_TOKEN_RAHASIA" \
  -H "Content-Type: application/json" \
  -d '{
    "doc": {
      "doc_number": "RKAT-2027-001",
      "doc_information": "RKAT Tahun Anggaran 2027",
      "file_base64": "JVBERi0xLjc..."
    },
    "esign": [
      {
        "nip": "197709152006041003",
        "order": 1,
        "signature_properties": {
          "tag": "#",
          "imageBase64": "iVBORw0KGgo...",
          "width": 75,
          "height": 75,
          "reason": "Menyusun dokumen",
          "location": "Bandung"
        }
      },
      {
        "nip": "199004292015042002",
        "order": 2,
        "signature_properties": {
          "tag": "$",
          "imageBase64": "iVBORw0KGgo...",
          "width": 75,
          "height": 75,
          "reason": "Menyetujui dokumen",
          "location": "Bandung"
        }
      }
    ]
  }'
```

_Catatan: Simpan string UUID `document_id` dari data response yang dikembalikan._

### Langkah 2: Pantau Perkembangan Status

Karena proses berjalan secara latar belakang (_asynchronous_) dan berjenjang, lakukan pengecekan status secara berkala (misal tiap 5 detik) hingga seluruh penandatangan menyelesaikan tugasnya.

```bash
curl -X GET "https://teken.upi.edu/api/sign-eplanning/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090" \
  -H "Authorization: Bearer PROSES_TOKEN_RAHASIA"
```

_Tunggu hingga timeline proses e-sign bernilai `is_completed: true` — ini berarti **semua** penandatangan, bukan hanya penandatangan pertama, telah selesai._

### Langkah 3: Unduh PDF yang Sudah Ditandatangani

Jika status pengecekan sudah selesai (`finished_signing` pada seluruh penandatangan), unduh berkas PDF fisik Anda.

```bash
curl -X GET "https://teken.upi.edu/api/sign-eplanning/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090/file" \
  -H "Authorization: Bearer PROSES_TOKEN_RAHASIA" \
  --output rkat_2027.pdf
```

## Pertanyaan Umum (FAQ)

**❓ Apakah modul e-Planning memerlukan tahap E-Seal seperti Language Cert?**
Tidak. Dokumen RKAT langsung menuju tahap E-Sign tanpa tahap segel elektronik institusional.

**❓ Berapa maksimal jumlah penandatangan yang bisa didaftarkan?**
Tidak ada batas maksimal — sesuaikan dengan jumlah pihak yang perlu menandatangani secara berjenjang (misal: penyusun → kepala unit → kepala balai).

**❓ Apakah `doc_number` wajib unik?**
Tidak. Berbeda dari modul lain, `doc_number` pada e-Planning boleh dikosongkan dan boleh sama antar dokumen — identitas unik tetap dijamin oleh `document_id` (UUID) yang dihasilkan server.

**❓ Apakah saya bisa melakukan revisi data jika status dokumen masih dalam proses antrean?**
Bisa. Gunakan endpoint **PUT (Update)**. Seluruh daftar penandatangan akan diganti dengan data baru dan urutan tanda tangan dimulai kembali dari `order: 1`.

**❓ Mengapa file PDF hasil download tidak dapat dibuka atau korup?**
Masalah ini biasanya disebabkan string `file_base64` yang dikirimkan saat Create/Update tidak lengkap atau format konversinya tidak valid. Pastikan string Base64 yang Anda kirimkan murni tanpa prefix format URL (seperti `data:application/pdf;base64,`).
