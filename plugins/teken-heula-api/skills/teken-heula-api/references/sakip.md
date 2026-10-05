# Modul SAKIP

Endpoint dasar: `/api/sign-sakip` · Permission: `ApiCreate|ApiUpdate|ApiView:DocSakip`

Untuk dokumen akuntabilitas kinerja dari aplikasi SAKIP (Renstra, RKT, Perjanjian Kinerja, LKjIP, dll). Hanya e-sign, **penandatanganan berjenjang**. Struktur dan aturannya identik dengan [e-Planning](eplanning.md) — hanya path dan permission yang berbeda.

## Payload POST / PUT

```json
{
  "doc": {
    "doc_number": "RKT-2026-001",
    "doc_information": "Rencana Kerja Tahunan 2026",
    "file_base64": "JVBERi0xLjc..."
  },
  "esign": [
    {
      "nip": "197709152006041003",
      "order": 1,
      "signature_properties": { "tag": "#", "imageBase64": "iVBORw0KGgo...", "width": 75, "height": 75, "reason": "Menyusun dokumen", "location": "Bandung" }
    },
    {
      "nip": "199004292015042002",
      "order": 2,
      "signature_properties": { "tag": "$", "imageBase64": "iVBORw0KGgo...", "width": 75, "height": 75, "reason": "Menyetujui dokumen", "location": "Bandung" }
    }
  ]
}
```

| Field | Wajib | Aturan |
| :-- | :-- | :-- |
| `doc.doc_number` | – | string ≤ 255, **boleh kosong dan boleh duplikat** |
| `doc.doc_information` | ✅ | string ≤ 255 (perihal dokumen) |
| `doc.file_base64` | ✅ | PDF base64 valid |
| `esign` | ✅ | array ≥ 1 item; `order` unik, `nip` dan `tag` tidak boleh duplikat |

`signature_properties`: `tag` ✅, `imageBase64` ✅ (PNG/JPG base64), `width` ✅ ≥1, `height` ✅ ≥1, `reason`, `location` opsional. Setiap penandatangan biasanya memakai `tag` berbeda di PDF (`#`, `$`, ...).

Identitas dokumen adalah `document_id` (UUID dari server), bukan `doc_number`.

## Berjenjang

Hanya penandatangan `order: 1` yang langsung aktif (`status.value = "not_yet_signed"`). Penandatangan berikutnya berstatus `null` sampai penandatangan sebelumnya selesai — itu normal, bukan error. Jangan menganggap dokumen selesai hanya karena penandatangan pertama `finished_signing`.

## PUT

Body lengkap seperti POST (bukan partial). Seluruh daftar penandatangan diganti dan urutan dimulai lagi dari `order: 1`.

## Response

```json
{
  "message": "Sign SAKIP document created successfully.",
  "data": {
    "doc": { "document_id": "3a8d5c62-3f8f-4fc9-b6bc-079f2a174090", "doc_number": "RKT-2026-001", "doc_information": "Rencana Kerja Tahunan 2026" },
    "esign": [
      { "nip": "197709152006041003", "name": "Nama Penandatangan Pertama", "order": 1, "status": { "id": 1, "value": "not_yet_signed", "label": "Belum Ditandatangani" }, "signature_properties": { "tag": "#", "imageBase64": true, "width": 75, "height": 75 } },
      { "nip": "199004292015042002", "name": "Nama Penandatangan Kedua", "order": 2, "status": null, "signature_properties": { "tag": "$", "imageBase64": true, "width": 75, "height": 75 } }
    ],
    "latest_timeline_status": [
      { "level": 1, "status": "Dokumen berhasil diajukan", "is_completed": true, "completed_at": "2026-08-13 20:00:00" },
      { "level": 2, "status": "Proses e-sign", "is_completed": false, "completed_at": null }
    ]
  }
}
```

Pesan: `"Sign SAKIP document created|updated|retrieved successfully."`; tidak ditemukan → `404` `"Sign SAKIP document not found."`.

## Kapan selesai

**Semua** `esign[].status.value == "finished_signing"` dan timeline level 2 `is_completed: true`. Baru kemudian `GET .../file`.
