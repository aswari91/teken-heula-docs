# Modul Language Cert (Sertifikat Bahasa)

Endpoint dasar: `/api/sign-language-certs` · Permission: `ApiCreate|ApiUpdate|ApiView:DocLanguageCert`

Satu-satunya modul dengan **e-seal**: dokumen disegel institusi dulu, baru ditandatangani satu pejabat.

## Payload POST

```json
{
  "doc": {
    "certificate_number": "CERT-2026-001",
    "certificate_sequence_number": "045/UN40.X/2026",
    "service_type": "Uji Kemahiran Berbahasa Indonesia",
    "participant_name": "Budi Santoso",
    "institution": "Dinas Pendidikan Provinsi",
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
}
```

| Field | Wajib (POST) | Aturan |
| :-- | :-- | :-- |
| `doc.certificate_number` | ✅ | string ≤ 255 |
| `doc.certificate_sequence_number` | – | string ≤ 255, null jika tidak dikirim |
| `doc.service_type` | – | string ≤ 255, null jika tidak dikirim |
| `doc.participant_name` | ✅ | string ≤ 255 |
| `doc.institution` | ✅ | string ≤ 255 |
| `doc.file_base64` | ✅ | PDF base64 valid |
| `eseal.nip` | ✅ | NIP pemilik segel; harus pengguna e-seal terdaftar |
| `esign` | ✅ | **tepat 1 item** (min 1, max 1), `order: 1` |

`signature_properties`: `tag` ✅, `imageBase64` ✅ (PNG/JPG base64), `width` ✅ ≥1, `height` ✅ ≥1, `reason`, `location` opsional.

## PUT — partial update

- Semua field opsional; kirim hanya yang diubah. Body kosong `{}` → `422` (`"Minimal satu field (doc, eseal, atau esign) harus diisi untuk update."`).
- Jika objek `eseal` atau `esign` dikirim, sub-field wajibnya harus lengkap.
- Status proses **direset ke awal** (`not_yet_sealed`, penandatangan diganti) hanya jika request berisi `doc.file_base64`, `eseal`, atau `esign`. Mengubah metadata lain (nama, instansi, nomor) tidak mengganggu proses yang berjalan atau sudah selesai.
- Saat dokumen berstatus antrean (`in_queue`), mengirim `doc.file_base64`/`eseal`/`esign` → `422`; metadata lain tetap boleh diubah.

```json
{ "doc": { "participant_name": "Budi Santoso Wijaya" } }
```

## Response (POST/PUT/GET)

```json
{
  "message": "Sign language certificate created successfully.",
  "data": {
    "doc": {
      "document_id": "3a8d5c62-3f8f-4fc9-b6bc-079f2a174090",
      "certificate_number": "CERT-2026-001",
      "certificate_sequence_number": "045/UN40.X/2026",
      "service_type": "Uji Kemahiran Berbahasa Indonesia",
      "participant_name": "Budi Santoso",
      "institution": "Dinas Pendidikan Provinsi",
      "eseal_status": "not_yet_sealed"
    },
    "eseal": { "nip": "198900000001", "name": "Nama Pemilik Eseal" },
    "esign": [ { "nip": "198900000002", "name": "Nama Penandatangan", "order": 1, "signature_properties": { "tag": "#", "width": 75, "height": 75 } } ],
    "latest_timeline_status": [
      { "level": 1, "status": "Document successfully submitted", "is_completed": true, "completed_at": "2026-06-06 20:00:00" },
      { "level": 2, "status": "Document sealing in progress", "is_completed": false, "completed_at": null },
      { "level": 3, "status": "Document e-signing in progress", "is_completed": false, "completed_at": null }
    ]
  }
}
```

Pesan: `created` / `updated` / `retrieved successfully.`; tidak ditemukan → `404` `"Sign language certificate not found."`.

## Kapan selesai

`doc.eseal_status == "sealed"` **dan** timeline level 3 `is_completed: true` (status menjadi `"Document e-signed"`). Setelah itu `GET .../file` mengembalikan PDF.
