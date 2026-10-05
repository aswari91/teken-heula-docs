# Modul e-Planning (RKAT)

Endpoint dasar: `/api/sign-eplanning` · Permission: `ApiCreate|ApiUpdate|ApiView:DocEplanning`

Untuk dokumen RKAT (Rencana Kerja dan Anggaran Tahunan) dari aplikasi e-Planning. Hanya e-sign, **penandatanganan berjenjang**. Alur, struktur data, dan validasinya **identik dengan [SAKIP](sakip.md)** — bedanya hanya path, permission, dan teks `message`.

## Payload POST / PUT

```json
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
| `doc.doc_number` | – | string ≤ 255, boleh kosong dan boleh duplikat (RKAT bisa diajukan sebelum bernomor) |
| `doc.doc_information` | ✅ | string ≤ 255 |
| `doc.file_base64` | ✅ | PDF base64 valid |
| `esign` | ✅ | array ≥ 1 item; `order` unik, `nip` dan `tag` tidak boleh duplikat |

`signature_properties`: `tag` ✅, `imageBase64` ✅ (PNG/JPG base64), `width` ✅ ≥1, `height` ✅ ≥1, `reason`, `location` opsional.

## Berjenjang

Hanya `order: 1` yang langsung aktif (`not_yet_signed`); penandatangan berikutnya berstatus `null` sampai giliran mereka. Dokumen selesai jika **semua** `esign[].status.value == "finished_signing"` dan timeline level 2 `is_completed: true`.

## PUT

Body lengkap (bukan partial). Daftar penandatangan diganti seluruhnya; urutan mulai lagi dari `order: 1`.

## Response

Bentuk sama dengan SAKIP. Pesan: `"Sign RKAT document created|updated|retrieved successfully."`; tidak ditemukan → `404` `"Sign RKAT document not found."`.
