---
layout: doc
---

# Integrasi dengan AI

> Pakai asisten AI (Claude Code, Cursor, Copilot, ChatGPT, dll.) untuk membantu menulis kode integrasi Teken Heula. Kami menyediakan **skill** berisi seluruh aturan API, contoh payload, penanganan error, dan contoh client — sehingga AI tidak perlu menebak.

Isi skill selalu sama dengan dokumentasi di situs ini, dan diperbarui setiap kali ada modul atau perubahan API baru.

## Claude Code (disarankan)

Pasang sekali, lalu skill aktif otomatis setiap kali Anda meminta Claude mengerjakan integrasi Teken Heula.

```bash
# 1. Tambahkan marketplace Teken Heula
claude plugin marketplace add aswari91/teken-heula-docs

# 2. Pasang plugin
claude plugin install teken-heula-api@teken-heula
```

Perintah yang sama bisa dijalankan di dalam sesi Claude Code dengan awalan `/plugin`, misalnya `/plugin marketplace add aswari91/teken-heula-docs`.

**Memperbarui** ke versi terbaru:

```bash
claude plugin marketplace update teken-heula
```

Atau aktifkan pembaruan otomatis lewat `/plugin` → **Marketplaces** → `teken-heula` → **Enable auto-update**.

### Alternatif: tanpa plugin

Unduh skill langsung ke project Anda (bisa di-commit agar satu tim memakai versi yang sama):

```bash
mkdir -p .claude/skills/teken-heula-api/references
cd .claude/skills/teken-heula-api
BASE=https://teken.upi.edu/docs/skills/teken-heula-api
curl -fsSO $BASE/SKILL.md
for f in language-cert mandala sakip eplanning errors client-examples; do
  curl -fsS -o references/$f.md $BASE/references/$f.md
done
```

Ganti `.claude/skills` dengan `~/.claude/skills` jika ingin skill tersedia di semua project Anda.

## AI lain (Cursor, Copilot, ChatGPT, Gemini, dll.)

Seluruh isi skill juga tersedia dalam satu file teks:

```
https://teken.upi.edu/docs/llms.txt
```

Cara memakainya:

- **Cursor / Windsurf:** tambahkan URL di atas sebagai _Docs_ (`@Docs` → _Add new doc_), atau simpan isinya sebagai file rules project.
- **GitHub Copilot:** simpan isinya ke `.github/copilot-instructions.md` atau lampirkan sebagai konteks di chat.
- **ChatGPT / Gemini / Claude.ai:** unggah atau tempel isi `llms.txt` di awal percakapan.

## Contoh perintah ke AI

- _"Buatkan service Laravel untuk mengirim dokumen RKAT ke Teken Heula, simpan document_id-nya, dan job terjadwal untuk mengunduh PDF yang sudah selesai ditandatangani."_
- _"Kenapa request saya ke `/api/sign-sakip` dapat 422 `Tag duplikat pada data esign`?"_
- _"Review kode integrasi Teken Heula saya — apakah penanganan error dan polling-nya sudah benar?"_

> [!WARNING]
> Jangan pernah menempelkan **token API** asli ke chat AI. Simpan token di environment variable (`TEKEN_HEULA_TOKEN`) dan minta AI membaca dari sana.
