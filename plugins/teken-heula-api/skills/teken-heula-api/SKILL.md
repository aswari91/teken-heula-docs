---
name: teken-heula-api
description: Panduan integrasi API Teken Heula (layanan e-sign/e-seal BSrE Universitas Pendidikan Indonesia) — endpoint /api/sign-language-certs, /api/sign-mandala, /api/sign-sakip, /api/sign-eplanning. Gunakan saat menulis, men-debug, atau me-review kode yang mengirim dokumen PDF ke Teken Heula untuk ditandatangani/disegel, memantau statusnya, atau mengunduh PDF hasilnya (teken.upi.edu, Bearer token Sanctum, payload doc/eseal/esign, signature_properties, error 401/403/422/400).
---

# Integrasi API Teken Heula

Teken Heula adalah layanan tanda tangan elektronik (e-sign) dan segel elektronik (e-seal) UPI yang tersertifikasi BSrE. Sistem lain mengirim PDF (base64) via API, dokumen diproses **asynchronous** di antrean server, lalu PDF hasil diunduh.

## Pilih modul yang tepat

| Modul | Untuk dokumen | Endpoint dasar | E-seal? | Penandatangan | Detail |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Language Cert | Sertifikat bahasa (Balai Bahasa) | `/api/sign-language-certs` | ✅ Ya, sebelum e-sign | Tepat 1 | [references/language-cert.md](references/language-cert.md) |
| Mandala | Surat/dokumen resmi Mandala | `/api/sign-mandala` | ❌ | ≥ 1 | [references/mandala.md](references/mandala.md) |
| SAKIP | Dokumen akuntabilitas kinerja (Renstra, RKT, PK, LKjIP) | `/api/sign-sakip` | ❌ | ≥ 1, berjenjang | [references/sakip.md](references/sakip.md) |
| e-Planning | RKAT dari aplikasi e-Planning | `/api/sign-eplanning` | ❌ | ≥ 1, berjenjang | [references/eplanning.md](references/eplanning.md) |

Baca file reference modul yang dipakai sebelum menulis payload — nama field `doc` berbeda per modul. Untuk penanganan error lengkap lihat [references/errors.md](references/errors.md); contoh client siap pakai (Laravel, Node.js, Python) ada di [references/client-examples.md](references/client-examples.md).

## Koneksi

| Lingkungan | Base URL |
| :-- | :-- |
| Production | `https://teken.upi.edu/api` |
| Development (lokal) | `http://localhost:8000/api` |

Header wajib di setiap request:

```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
Accept: application/json
```

- Token didapat dari halaman profil (menu API Token) di aplikasi Teken Heula. Simpan di environment variable (mis. `TEKEN_HEULA_TOKEN`, `TEKEN_HEULA_BASE_URL`) — **jangan pernah hardcode atau commit token**.
- Token saja tidak cukup: akun juga butuh permission per modul, `ApiCreate:<Doc>`, `ApiUpdate:<Doc>`, `ApiView:<Doc>` dengan `<Doc>` = `DocLanguageCert` / `DocMandala` / `DocSakip` / `DocEplanning`. Tanpa itu → `403`.
- Rate limit: **200 request/menit per token**. Lebih dari itu → `429`.
- Selalu kirim `Accept: application/json` supaya error validasi kembali sebagai JSON `422`, bukan redirect HTML.

## Empat endpoint (pola sama di semua modul)

| Aksi | Method & path | Hasil |
| :-- | :-- | :-- |
| Ajukan dokumen | `POST /sign-<modul>` | `200` + `data.doc.document_id` (UUID) |
| Revisi dokumen | `PUT /sign-<modul>/{documentId}` | `200` + data terbaru |
| Cek status | `GET /sign-<modul>/{documentId}` | `200` + `esign[].status` + `latest_timeline_status` |
| Unduh PDF | `GET /sign-<modul>/{documentId}/file` | `200` `application/pdf` (binary) |

`{documentId}` harus UUID; selain UUID → `404`.

## Alur integrasi yang benar

1. **POST** dokumen → simpan `data.doc.document_id` di database Anda, terhubung ke record lokal. Ini satu-satunya kunci untuk semua request berikutnya.
2. **Tunggu proses** (asynchronous). Penandatangan menandatangani lewat panel admin Teken Heula, jadi waktunya bisa menit sampai hari — bukan detik — terutama untuk modul berjenjang.
3. **Polling GET** status dengan interval wajar (mis. tiap 1–5 menit via scheduler/queue job, bukan loop ketat di request user). Dokumen selesai jika **semua** item `latest_timeline_status` bernilai `is_completed: true` (untuk modul e-sign: semua `esign[].status.value == "finished_signing"`; Language Cert juga `doc.eseal_status == "sealed"`).
4. **GET .../file** → simpan binary PDF. Jika belum selesai server membalas `400` — perlakukan sebagai "belum siap", bukan kegagalan permanen.

## Aturan payload yang sering salah

- `file_base64` dan `imageBase64` adalah **base64 murni** — tanpa prefix `data:application/pdf;base64,` / `data:image/png;base64,`, tanpa baris baru. PDF harus PDF valid; gambar harus PNG/JPG valid.
- `esign` adalah **array**, walaupun hanya satu penandatangan.
- Dalam satu request: `order` harus unik (integer ≥ 1), `nip` tidak boleh duplikat, dan `signature_properties.tag` tidak boleh duplikat.
- `signature_properties.tag` adalah teks penanda (mis. `#`, `$`) yang **benar-benar ada di dalam PDF** pada posisi tanda tangan; BSrE menaruh tanda tangan di posisi tag tersebut. `width`/`height` numerik ≥ 1 (pixel). `reason`/`location` opsional.
- `nip` penandatangan/penyegel harus terdaftar di Sinergi (SDM UPI). NIP yang belum dikenal akan disinkronkan otomatis; jika gagal → `422` pada `esign.N.nip` / `eseal.nip`.
- Jangan kirim `document_id` saat POST — server selalu membuat UUID baru.
- `PUT` di Mandala/SAKIP/e-Planning adalah **penggantian penuh**: kirim ulang seluruh `doc` dan seluruh `esign`; daftar penandatangan diganti dan urutan dimulai lagi dari `order: 1`. Hanya Language Cert yang mendukung partial update (lihat reference-nya).
- Jika jaringan memblokir `PUT`, kirim `POST` ke path yang sama dengan header `X-HTTP-Method-Override: PUT`.

## Penanganan error ringkas

| Kode | Arti | Tindakan di kode |
| :-- | :-- | :-- |
| `400` | Download sebelum PDF siap | Coba lagi nanti (polling) |
| `401` | Token hilang/salah/dicabut | Jangan retry; minta token baru, alert ke admin integrasi |
| `403` | Permission modul tidak ada | Jangan retry; minta admin Teken Heula menambah permission |
| `404` | `documentId` tidak ada / bukan UUID | Periksa ID yang tersimpan |
| `422` | Validasi gagal | Baca `errors` (key = path field, mis. `esign.0.nip`), perbaiki payload; jangan retry payload yang sama |
| `429` | Rate limit | Backoff lalu retry |
| `5xx` / timeout | Gangguan server | Retry dengan exponential backoff; POST hanya di-retry jika yakin request sebelumnya tidak tercatat (cek dulu, hindari dokumen ganda) |

Respons error berbentuk `{"message": "...", "errors": {"<field>": ["pesan"]}}` (field `errors` hanya untuk `422`). Pesan validasi berbahasa Indonesia.

## Saat menulis kode integrasi

- Bungkus API dalam satu client/service kecil (base URL + token dari config, timeout ~60 detik karena payload base64 besar), lalu pakai dari job/queue — bukan dari request HTTP user secara langsung.
- Simpan `document_id`, status terakhir, dan waktu cek terakhir di tabel lokal; jadikan proses polling + download idempoten.
- Jangan log isi `file_base64`, `imageBase64`, atau token. Log cukup `document_id`, kode status, dan `message`.
- Sesuaikan nama field `doc` dengan modul — contoh: Language Cert memakai `certificate_number`, Mandala memakai `mandala_doc_id`, SAKIP/e-Planning memakai `doc_number` + `doc_information`.
