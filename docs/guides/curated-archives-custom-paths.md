# Guide: curated object lists and custom paths in the archive

CLI examples and quick starts often use **one S3 prefix** because it is easy to copy. You can instead:

1. **Choose exactly which objects to include** — any list your application builds (API, database, batch job, static manifest).
2. **Choose how each object appears inside the ZIP or tar** — entry paths do not have to match S3 keys.

The library exposes hooks for both. **Which keys may be read** is always your application’s responsibility.

## When “list a prefix” is not enough

- **Globs and `filters.predicate`** still see everything the list step returns from a prefix; they only skip objects **after** enumeration. If you must not even consider certain keys, build the object set **before** the pump (NDJSON index or custom `StorageProvider`).
- Resolve allowed keys however you want, then drive the archive from that result alone.

## How to feed a curated list

| Approach | When to use | Listing during pump |
| --- | --- | --- |
| **`preparedIndexNdjson`** | You already have rows (`key`, `size`, optional `etag` / `lastModified`) as NDJSON. | No `ListObjectsV2` for that run ([prepared index](prepared-index.md)). |
| **Custom `StorageProvider`** | You implement `listObjects` / `getObjectStream` (for example wrapping `S3Client`, multiple buckets, or other backends). | Whatever your adapter implements ([storage providers](storage-providers.md)). |

See also [IAM & selective exports](iam-selective-exports.md) for IAM alignment.

**`source` URI:** You still pass a `s3://bucket/prefix/`-shaped `source` for URI parsing and default naming. Prepared-index keys must start with that prefix ([validation in the pump](../../src/ndjson-prepared-index.ts)).

## Custom paths inside the ZIP (or tar)

S3 object keys and archive entry names are **decoupled**:

- **`mapEntryName`** — `(meta: ObjectMeta) => string`: map each object to a **POSIX-style path** inside the archive.
- **`entryMappings`** — optional exact overrides from full object key (or `s3://bucket/key`) → archive path.

Unsafe paths (`..`, absolute segments) are rejected (`assertSafeArchivePath`). See **`CreateFolderArchiveStreamOptions`** in the published **`dist/*.d.ts`**.

## Example: prepared index + `mapEntryName`

Runnable script in the repo: [`examples/prepared-index-custom-entry-paths.ts`](../../examples/prepared-index-custom-entry-paths.ts).

```ts
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { S3Client } from "@aws-sdk/client-s3";
import { pumpArchiveToWritable } from "s3prefix-archive";

const source = "s3://my-bucket/reports/";
const preparedIndexNdjson = Readable.from(
  Buffer.from(
    [
      '{"key":"reports/2024/q1/summary.pdf","size":2048}',
      '{"key":"reports/2024/q1/figures.png","size":50000}',
      "",
    ].join("\n"),
    "utf8",
  ),
);

await pumpArchiveToWritable(createWriteStream("out.zip"), {
  source,
  format: "zip",
  concurrency: 1,
  client: new S3Client({}),
  preparedIndexNdjson,
  mapEntryName: (meta) =>
    meta.key.startsWith("reports/2024/q1/")
      ? `Deliverables/2024-Q1/${meta.key.slice("reports/2024/q1/".length)}`
      : meta.key.replace(/^reports\//, ""),
});
```

More patterns: [`examples/explicit-keys-prepared-index.ts`](../../examples/explicit-keys-prepared-index.ts) (index only), [`examples/filters-explain-memory-provider.ts`](../../examples/filters-explain-memory-provider.ts) (injected `MemoryStorageProvider`).

Root README: [Curated object lists and custom paths in the ZIP](../../README.md#curated-object-lists-and-custom-paths-in-the-zip).
