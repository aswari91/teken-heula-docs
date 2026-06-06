---
layout: doc
---

# Autentikasi & Keamanan API

> Sebelum dapat memanggil endpoint manapun, Anda membutuhkan sebuah **Token Akses**.
> Halaman ini menjelaskan apa itu token, cara mendapatkannya, dan cara
> menggunakannya dengan benar dan aman.

## Apa Itu Token dan Mengapa Dibutuhkan?

Bayangkan token seperti **kartu akses gedung kantor**. Setiap kali Anda masuk,
Anda menempelkan kartu ke sensor — sensor itu memverifikasi identitas Anda.
Token API bekerja persis sama: ia membuktikan kepada server bahwa Anda adalah
pengguna sah yang telah login.

Tanpa token, semua request akan ditolak dengan pesan `401 Unauthorized`.

Ada dua konsep yang perlu dipahami:

| Konsep          | Pertanyaan yang Dijawab                                     | Kode Error Jika Gagal |
| :-------------- | :---------------------------------------------------------- | :-------------------- |
| **Autentikasi** | _Siapa kamu?_ — Verifikasi identitas lewat token            | `401 Unauthorized`    |
| **Otorisasi**   | _Apa yang boleh kamu lakukan?_ — Cek hak akses (permission) | `403 Forbidden`       |

> [!NOTE]
> Token hanya membuktikan Anda sudah login. Tapi setiap endpoint juga
> membutuhkan **izin (permission)** khusus. Memiliki token tidak otomatis
> memberikan akses ke semua fitur — hubungi Admin jika Anda menerima `403`.

## Alur Mendapatkan Akses

```mermaid
flowchart TD
    A["Anda (Developer)"] --> B["Login ke Aplikasi\nTeken Heula"]
    B --> C["Buka Halaman Profil / API Token"]
    C --> D["Generate / Salin Token"]
    D --> E["Gunakan Token di Header\nAuthorization: Bearer ..."]
    E --> F{{"Akses API Berhasil ✅"}}
```

### Langkah 1 — Login ke Aplikasi

Buka aplikasi Teken Heula di browser Anda dan login menggunakan akun SSO UPI
atau akun yang telah diberikan oleh Administrator.

> [!IMPORTANT]
> Akun Anda harus sudah aktif dan memiliki izin akses API dari Administrator
> sebelum dapat melanjutkan. Jika belum, hubungi tim IT atau Admin sistem.

---

### Langkah 2 — Salin Token Akses Anda

Setelah login, ikuti langkah berikut:

1. Klik ikon profil Anda di pojok kanan atas.
2. Pilih menu **"Profil"** atau **"API Token"**.
3. Klik tombol **"Generate Token"** jika belum ada, atau **salin** token yang
   sudah ada.

> [!WARNING]
> **Jaga kerahasiaan token Anda.** Token bersifat seperti kata sandi.
> Jangan pernah meletakkannya di dalam kode yang di-_commit_ ke Git,
> atau membagikannya melalui chat / email.

---

### Langkah 3 — Gunakan Token di Setiap Request

Setelah mendapatkan token, sertakan di setiap request API pada bagian **Header**:

```http
Authorization: Bearer <TOKEN_ANDA_DI_SINI>
Content-Type: application/json
Accept: application/json
```

Contoh menggunakan `cURL`:

```bash
curl -X GET "https://tekenheula.upi.edu/api/sign-language-certs/abc-123" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

> [!TIP]
> Di aplikasi seperti **Postman** or **Insomnia**, Anda cukup isi bagian
> _Authorization_ dengan tipe **Bearer Token**, lalu tempelkan token Anda di
> kolom yang tersedia — tidak perlu menulis manual di Header.

## Kode Error Terkait Autentikasi

| Kode               | Arti                     | Penyebab Umum                                    | Yang Harus Dilakukan                   |
| :----------------- | :----------------------- | :----------------------------------------------- | :------------------------------------- |
| `401 Unauthorized` | Token tidak dikenali     | Token hilang, salah ketik, atau sudah kadaluarsa | Salin ulang token dari halaman profil  |
| `403 Forbidden`    | Tidak memiliki hak akses | Token valid, tapi permission tidak ada           | Hubungi Admin untuk meminta izin akses |

---

## Praktik Keamanan Terbaik

Ikuti panduan berikut untuk menjaga keamanan integrasi Anda:

- ❌ **Jangan** menyimpan token langsung di dalam kode (`hardcode`).
- ✅ Simpan token di **Environment Variable** (`.env`) dan baca dari sana.
- ✅ Rutin **perbarui (rotate) token** secara berkala, terutama jika ada
  anggota tim yang keluar.
- ✅ Gunakan token yang berbeda untuk setiap lingkungan (_Development_ vs
  _Production_).
- ❌ **Jangan** membagikan token melalui WhatsApp, Slack, atau media komunikasi
  yang tidak terenkripsi.

## Pertanyaan Umum (FAQ)

**❓ Berapa lama token berlaku sebelum kadaluarsa?**
Token berlaku selama sesi login aktif. Jika Anda logout atau token dicabut oleh
Admin, token tersebut tidak akan bisa digunakan lagi dan Anda perlu
mendapatkan token baru.

**❓ Apa yang harus saya lakukan jika token saya bocor atau diketahui orang lain?**
Segera hubungi Admin untuk mencabut (_revoke_) token tersebut, lalu generate
token baru dari halaman profil Anda.

**❓ Apakah satu token bisa digunakan untuk semua endpoint API?**
Token mengidentifikasi identitas Anda, namun akses ke endpoint tertentu tetap
bergantung pada **permission** yang diberikan Admin ke akun Anda. Satu token
bisa digunakan ke semua endpoint yang sudah diizinkan.

**❓ Kenapa saya mendapat error `403` padahal token saya benar?**
Artinya token Anda valid (identitas dikenali), tapi akun Anda belum memiliki
izin (_permission_) untuk endpoint tersebut. Hubungi Administrator untuk
meminta penambahan permission yang sesuai.
