# Contoh Client

Contoh di bawah memakai modul e-Planning; ganti path (`sign-eplanning`) dan field `doc` untuk modul lain. Base URL dan token selalu dari environment variable.

```dotenv
TEKEN_HEULA_BASE_URL=https://teken.upi.edu/api
TEKEN_HEULA_TOKEN=isi-token-dari-halaman-profil
```

## Laravel (PHP)

```php
// config/services.php
'teken_heula' => [
    'base_url' => env('TEKEN_HEULA_BASE_URL', 'https://teken.upi.edu/api'),
    'token' => env('TEKEN_HEULA_TOKEN'),
],
```

```php
namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class TekenHeulaClient
{
    private function http(): PendingRequest
    {
        return Http::baseUrl(config('services.teken_heula.base_url'))
            ->withToken(config('services.teken_heula.token'))
            ->acceptJson()
            ->asJson()
            ->timeout(60);
    }

    /**
     * @param  array{doc_number?: string, doc_information: string, file_base64: string}  $doc
     * @param  list<array{nip: string, order: int, signature_properties: array<string, mixed>}>  $esign
     */
    public function submit(array $doc, array $esign): string
    {
        return $this->http()
            ->post('/sign-eplanning', ['doc' => $doc, 'esign' => $esign])
            ->throw()
            ->json('data.doc.document_id');
    }

    public function status(string $documentId): array
    {
        return $this->http()->get("/sign-eplanning/{$documentId}")->throw()->json('data');
    }

    public function isFinished(array $data): bool
    {
        return collect($data['latest_timeline_status'])->every(fn (array $step): bool => $step['is_completed']);
    }

    /** Returns null while the PDF is not ready yet (HTTP 400). */
    public function downloadPdf(string $documentId): ?string
    {
        $response = $this->http()->accept('application/pdf')->get("/sign-eplanning/{$documentId}/file");

        if ($response->status() === 400) {
            return null;
        }

        return $response->throw()->body();
    }
}
```

Pemakaian: kirim dari queue job, simpan `document_id`, lalu jadwalkan job polling (mis. `Schedule::job(...)->everyFiveMinutes()`) yang memanggil `status()` → jika `isFinished()` panggil `downloadPdf()` dan `Storage::put(...)`.

Membuat payload dari file:

```php
$doc = [
    'doc_number' => 'RKAT-2027-001',
    'doc_information' => 'RKAT Tahun Anggaran 2027',
    'file_base64' => base64_encode(Storage::get('rkat/2027.pdf')),
];

$esign = [[
    'nip' => '197709152006041003',
    'order' => 1,
    'signature_properties' => [
        'tag' => '#',
        'imageBase64' => base64_encode(Storage::get('ttd/197709152006041003.png')),
        'width' => 75,
        'height' => 75,
    ],
]];
```

`base64_encode()` sudah menghasilkan base64 murni tanpa prefix dan tanpa baris baru.

## Node.js (fetch, Node 18+)

```js
const BASE_URL = process.env.TEKEN_HEULA_BASE_URL ?? "https://teken.upi.edu/api";
const headers = {
  Authorization: `Bearer ${process.env.TEKEN_HEULA_TOKEN}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

async function submit(doc, esign) {
  const res = await fetch(`${BASE_URL}/sign-eplanning`, {
    method: "POST",
    headers,
    body: JSON.stringify({ doc, esign }),
  });
  const body = await res.json();
  if (!res.ok) throw Object.assign(new Error(body.message), { status: res.status, errors: body.errors });
  return body.data.doc.document_id;
}

async function downloadPdf(documentId) {
  const res = await fetch(`${BASE_URL}/sign-eplanning/${documentId}/file`, { headers });
  if (res.status === 400) return null; // belum siap
  if (!res.ok) throw new Error(`Download gagal: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// base64 dari file: fs.readFileSync("rkat.pdf").toString("base64")
```

## Python (requests)

```python
import os, requests

BASE_URL = os.environ.get("TEKEN_HEULA_BASE_URL", "https://teken.upi.edu/api")
session = requests.Session()
session.headers.update({
    "Authorization": f"Bearer {os.environ['TEKEN_HEULA_TOKEN']}",
    "Accept": "application/json",
})

def submit(doc: dict, esign: list) -> str:
    res = session.post(f"{BASE_URL}/sign-eplanning", json={"doc": doc, "esign": esign}, timeout=60)
    res.raise_for_status()
    return res.json()["data"]["doc"]["document_id"]

def download_pdf(document_id: str) -> bytes | None:
    res = session.get(f"{BASE_URL}/sign-eplanning/{document_id}/file", timeout=60)
    if res.status_code == 400:
        return None  # belum siap
    res.raise_for_status()
    return res.content

# base64: base64.b64encode(open("rkat.pdf", "rb").read()).decode()
```
