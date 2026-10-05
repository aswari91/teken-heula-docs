# Modul Mandala

Endpoint dasar: `/api/sign-mandala` · Permission: `ApiCreate|ApiUpdate|ApiView:DocMandala`

Hanya e-sign (tanpa e-seal). Boleh lebih dari satu penandatangan.

## Payload POST / PUT

```json
{
  "doc": {
    "mandala_doc_id": "MNDL-2026-001",
    "description": "Perjanjian Kerjasama Antar Lembaga",
    "file_base64": "JVBERi0xLjc..."
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
        "reason": "Menyetujui isi perjanjian",
        "location": "Bandung"
      }
    }
  ]
}
```

| Field | Wajib | Aturan |
| :-- | :-- | :-- |
| `doc.mandala_doc_id` | ✅ | string ≤ 255, **unik** — ID referensi dari sistem Anda. Duplikat → `422` `"Mandala Doc ID sudah digunakan."` |
| `doc.description` | ✅ | string ≤ 255 |
| `doc.file_base64` | ✅ | PDF base64 valid |
| `esign` | ✅ | array ≥ 1 item; `order` unik, `nip` dan `tag` tidak boleh duplikat |

`signature_properties`: `tag` ✅, `imageBase64` ✅ (PNG/JPG base64), `width` ✅ ≥1, `height` ✅ ≥1, `reason`, `location` opsional.

## PUT

Body sama lengkapnya dengan POST (bukan partial). Daftar penandatangan lama dihapus dan diganti; proses tanda tangan dimulai ulang dari `order: 1`. `mandala_doc_id` yang sama dengan dokumen ini sendiri boleh dipakai ulang.

## Response

```json
{
  "message": "Sign mandala document created successfully.",
  "data": {
    "doc": {
      "document_id": "3a8d5c62-3f8f-4fc9-b6bc-079f2a174090",
      "mandala_doc_id": "MNDL-2026-001",
      "description": "Perjanjian Kerjasama Antar Lembaga"
    },
    "esign": [
      {
        "nip": "198900000002",
        "name": "Nama Penandatangan",
        "order": 1,
        "status": { "id": 1, "value": "not_yet_signed", "label": "Belum Ditandatangani" },
        "signature_properties": { "tag": "#", "imageBase64": true, "width": 75, "height": 75, "reason": "Menyetujui isi perjanjian", "location": "Bandung" }
      }
    ],
    "latest_timeline_status": [
      { "level": 1, "status": "Dokumen berhasil diajukan", "is_completed": true, "completed_at": "2026-06-06 20:00:00" },
      { "level": 2, "status": "Proses e-sign", "is_completed": false, "completed_at": null }
    ]
  }
}
```

Di response, `imageBase64` hanya `true` (gambar tidak dikirim balik). Pesan: `created` / `updated` / `retrieved successfully.`; tidak ditemukan → `404` `"Sign mandala document not found."`.

## Kapan selesai

Semua `esign[].status.value == "finished_signing"` dan timeline level 2 `is_completed: true` (status `"Dokumen telah di e-sign"`).
