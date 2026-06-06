# Referensi API Core (E-Sign & E-Seal Massal)

API Teken Heula menggunakan arsitektur RESTful dengan format pertukaran data JSON. Karena dirancang untuk kebutuhan **massal (bulk)**, proses penandatanganan dan penyegelan berjalan secara *asynchronous* menggunakan sistem antrean (*queue*) di *backend*.

## 🌍 Konfigurasi Global

### Base URL
Semua endpoint API diakses melalui root URL berikut:

```http
https://tekenheula.upi.edu/api (production)
http://localhost:8000/api (development)
```

## Authentication & Authorization

- Semua endpoint menggunakan middleware `auth:sanctum`.
- Semua endpoint membutuhkan token valid (Bearer Token).
- Setiap endpoint juga dilindungi permission policy:
    - `POST /sign-language-certs` -> `can:ApiCreate:DocLanguageCert`
    - `PUT /sign-language-certs/{documentId}` -> `can:ApiUpdate:DocLanguageCert`
    - `GET /sign-language-certs/{documentId}` -> `can:ApiView:DocLanguageCert`
    - `GET /sign-language-certs/{documentId}/file` -> `can:ApiView:DocLanguageCert`
## Struktur Data

### Objek `doc`

- `certificate_number` (string, wajib, max 255)
- `participant_name` (string, wajib, max 255)
- `institution` (string, wajib, max 255)
- `file_base64` (string, wajib, PDF base64 valid)

### Objek `eseal`

- `nip` (string, wajib)

`nip` pegawai harus terdaftar di sistem Sinergi UPI.

### Array `esign`

- Wajib berupa array dengan jumlah minimal 1 dan maksimal 1 item.
- Setiap item memiliki:
    - `nip` (string, wajib, tidak boleh duplikat) nip penandatangan harus terdaftar di sistem Sinergi UPI.
    - `order` (integer, wajib, min 1, distinct) urutan tanda tangan jika ada lebih dari 1 penandatangan.
    - `signature_properties` (object, wajib)
        - `tag` (string, wajib, tidak boleh duplikat)
        - `imageBase64` (string, wajib, PNG/JPG/JPEG base64 valid)
        - `width` (numeric, wajib, min 1)
        - `height` (numeric, wajib, min 1)
        - `reason` (string, opsional)
        - `location` (string, opsional)

### Catatan Base64

- Untuk dokumen, konten harus PDF valid (`%PDF-`).
- Untuk tanda tangan, konten harus gambar PNG/JPEG valid.

## Endpoint

## 1) Create Certificate

### Request

- Method: `POST`
- URL: `/api/sign-language-certs`

Body JSON:

```json
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
                "reason": "Sebagai persetujuan bahwa peserta telah memenuhi syarat untuk mendapatkan sertifikat",
                "location": "Bandung"
            }
        }
    ]
}
```

### Catatan

- Jika field `document_id` dikirim saat create, nilainya akan diabaikan.
- API selalu membuat dokumen baru.

### Response Sukses

Status: `200 OK`

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
            "name": "Nama Eseal"
        },
        "esign": [
            {
                "nip": "198900000002",
                "name": "Nama Esign",
                "order": 1,
                "signature_properties": {
                    "tag": "SIGN_TAG_1",
                    "imageBase64": "iVBORw0KGgo...",
                    "width": 180,
                    "height": 90,
                    "reason": "Persetujuan dokumen",
                    "location": "Bandung"
                }
            }
        ],
        "latest_timeline_status": [
            {
                "level": 1,
                "status": "Document successfully submitted",
                "is_completed": true,
                "completed_at": "2026-04-16 12:00:00"
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

## 2) Update Certificate

### Request

- Method: `PUT`
- URL: `/api/sign-language-certs/{documentId}`
- Path param:
    - `documentId` (UUID dokumen)

Body JSON sama seperti endpoint create.

### Catatan Perilaku Update

- Dokumen dicari berdasarkan `id_document` (UUID).
- Jika `doc.file_base64` berubah:
    - `eseal_status` di-reset menjadi `not_yet_sealed`
    - `eseal_ip`, `eseal_datetime`, `file_path` di-null-kan
    - timeline level 1-3 di-reset
- Data `esign` akan dihapus dan dibuat ulang jika:
    - dokumen berubah (`file_base64` berubah), atau
    - komposisi esign berbeda dari data lama.

### Response Sukses

Status: `200 OK`

```json
{
    "message": "Sign language certificate updated successfully.",
    "data": {
        "doc": {
            "document_id": "3a8d5c62-3f8f-4fc9-b6bc-079f2a174090",
            "certificate_number": "CERT-2026-001-REV",
            "participant_name": "Budi Santoso",
            "institution": "Dinas Pendidikan",
            "eseal_status": "not_yet_sealed"
        },
        "eseal": {
            "nip": "198900000001",
            "name": "Nama Eseal"
        },
        "esign": [
            {
                "nip": "198900000002",
                "name": "Nama Esign",
                "order": 1,
                "signature_properties": {
                    "tag": "SIGN_TAG_1",
                    "imageBase64": "iVBORw0KGgo...",
                    "width": 180,
                    "height": 90,
                    "reason": "Persetujuan dokumen",
                    "location": "Bandung"
                }
            }
        ],
        "latest_timeline_status": [
            {
                "level": 1,
                "status": "Document successfully submitted",
                "is_completed": true,
                "completed_at": "2026-04-16 12:00:00"
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

## 3) Get Certificate Detail

### Request

- Method: `GET`
- URL: `/api/sign-language-certs/{documentId}`
- Path param:
    - `documentId` (UUID dokumen)

### Response Sukses

Status: `200 OK`

```json
{
    "message": "Sign language certificate retrieved successfully.",
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
            "name": "Nama Eseal"
        },
        "esign": [
            {
                "nip": "198900000002",
                "name": "Nama Esign",
                "order": 1,
                "signature_properties": {
                    "tag": "SIGN_TAG_1",
                    "imageBase64": "iVBORw0KGgo...",
                    "width": 180,
                    "height": 90,
                    "reason": "Persetujuan dokumen",
                    "location": "Bandung"
                }
            }
        ],
        "latest_timeline_status": [
            {
                "level": 1,
                "status": "Document successfully submitted",
                "is_completed": true,
                "completed_at": "2026-04-16 12:00:00"
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

### Response Not Found

Status: `404 Not Found`

```json
{
    "message": "Sign language certificate not found."
}
```

## 4) Download Certificate PDF (Raw)

### Request

- Method: `GET`
- URL: `/api/sign-language-certs/{documentId}/file`
- Path param:
    - `documentId` (UUID dokumen)


### Response Sukses

Status: `200 OK`
Content-Type: `application/pdf`
*(Berupa file binary PDF stream, bukan base64)*

### Response Belum Siap

Status: `400 Bad Request`

```json
{
    "message": "Dokumen masih dalam antrean proses atau file belum tersedia."
}
```

## Error Response Umum

## `401 Unauthorized`

Token tidak valid atau tidak dikirim.

## `403 Forbidden`

User tidak memiliki permission untuk endpoint terkait.

## `422 Unprocessable Entity`

Validasi gagal, contoh:

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "doc.file_base64": [
            "doc.file_base64 harus berupa file PDF base64 yang valid."
        ],
        "eseal.nip": ["eseal.nip belum terdaftar sebagai pengguna e-seal."],
        "esign.0.nip": ["esign.0.nip belum terdaftar sebagai pengguna e-sign."]
    }
}
```

## Contoh cURL

## Create

```bash
curl -X POST "https://your-domain.com/api/sign-language-certs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doc": {
      "certificate_number": "CERT-2026-001",
      "participant_name": "Budi Santoso",
      "institution": "Dinas Pendidikan",
      "file_base64": "base64,JVBERi0xLjc..."
    },
    "eseal": { "nip": "198900000001" },
    "esign": [
      {
        "nip": "198900000002",
        "order": 1,
        "signature_properties": {
          "tag": "SIGN_TAG_1",
          "imageBase64": "iVBORw0KGgo...",
          "width": 180,
          "height": 90,
          "reason": "Persetujuan dokumen",
          "location": "Bandung"
        }
      }
    ]
  }'
```

## Update

```bash
curl -X PUT "https://your-domain.com/api/sign-language-certs/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ...payload sama seperti create... }'
```

## Get Detail

```bash
curl -X GET "https://your-domain.com/api/sign-language-certs/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Download File

```bash
curl -X GET "https://your-domain.com/api/sign-language-certs/3a8d5c62-3f8f-4fc9-b6bc-079f2a174090/file" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output downloaded_certificate.pdf
```
