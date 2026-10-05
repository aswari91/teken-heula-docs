# Error & Cara Menanganinya

Semua error berformat JSON:

```json
{ "message": "The given data was invalid.", "errors": { "esign.0.nip": ["..."] } }
```

`errors` hanya ada di `422`; key-nya adalah path field dengan indeks array (`doc.file_base64`, `esign.1.signature_properties.tag`).

| Kode | Penyebab | Retry? | Tindakan |
| :-- | :-- | :-- | :-- |
| `400` | `GET .../file` sebelum PDF selesai: `"Dokumen masih dalam antrean proses atau file belum tersedia."` | Ya, nanti | Lanjutkan polling status |
| `401` | Token tidak dikirim, salah, atau dicabut | Tidak | Perbarui token di konfigurasi; beri alert |
| `403` | Token valid tapi tidak punya permission `Api*:<Doc>` modul itu; atau jaringan memblokir `PUT` | Tidak | Minta admin Teken Heula menambah permission; jika karena `PUT` diblokir, pakai `POST` + `X-HTTP-Method-Override: PUT` |
| `404` | `documentId` tidak ditemukan / bukan UUID; atau `"File fisik dokumen tidak ditemukan di server."` saat download | Tidak | Cek ID yang tersimpan; kasus file fisik hilang → laporkan ke tim Teken Heula |
| `422` | Validasi gagal | Tidak (dengan payload sama) | Perbaiki field sesuai `errors` |
| `429` | Melebihi 200 request/menit per token | Ya | Backoff (hormati header `Retry-After` jika ada) |
| `500`/`502`/`503`/timeout | Gangguan server | Ya, terbatas | Exponential backoff; untuk `POST`, cegah dokumen ganda |

## Pesan `422` yang umum

| Field | Pesan | Penyebab |
| :-- | :-- | :-- |
| `doc.file_base64` | `doc.file_base64 harus berupa file PDF base64 yang valid.` | Bukan PDF, ada prefix `data:`, terpotong, atau ada baris baru |
| `esign.N.signature_properties.imageBase64` | `... harus berupa gambar PNG/JPG/JPEG base64 yang valid.` | Gambar bukan PNG/JPG atau base64 rusak |
| `esign.N.nip` | `esign.N.nip belum terdaftar sebagai pengguna e-sign dan gagal disinkronkan.` | NIP tidak ditemukan di Sinergi (SDM UPI) |
| `eseal.nip` | `eseal.nip belum terdaftar sebagai pengguna e-seal dan gagal disinkronkan dari Sinergi.` | (Language Cert) NIP bukan pemilik e-seal |
| `esign.N.nip` | `NIP duplikat pada data esign.` | NIP sama muncul dua kali |
| `esign.N.signature_properties.tag` | `Tag duplikat pada data esign.` | Dua penandatangan memakai tag sama |
| `esign.N.order` | `Urutan tanda tangan tidak boleh duplikat.` | `order` sama |
| `doc.mandala_doc_id` | `Mandala Doc ID sudah digunakan.` | (Mandala) ID referensi sudah dipakai dokumen lain |
| `document_id` | `document_id yang diberikan tidak ditemukan.` | PUT ke UUID yang tidak ada |
| `doc` | `Dokumen sedang dalam antrean proses e-seal/e-sign dan tidak dapat diubah ...` | (Language Cert) ganti file/eseal/esign saat `in_queue` |
| `doc` | `Minimal satu field (doc, eseal, atau esign) harus diisi untuk update.` | (Language Cert) PUT dengan body kosong |

## PDF hasil tidak bisa dibuka

Hampir selalu karena `file_base64` saat POST/PUT tidak valid (terpotong, ada prefix `data:...;base64,`, atau di-encode dua kali). Simpan response download sebagai **binary**, bukan string teks/JSON.
