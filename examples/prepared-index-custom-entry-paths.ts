/**
 * **`preparedIndexNdjson`** (no live `ListObjectsV2`) plus **`mapEntryName`** so paths inside the
 * ZIP differ from raw S3 keys.
 *
 * Use when your app already decides which objects to include and how each should appear in the
 * archive—any workflow you build on top (catalog, job payload, your own storage layout).
 *
 * NDJSON lines: `{"key":"...","size":n}` (optional `etag`, `lastModified`). Keys must start with the
 * same prefix as **`source`**. Sizes should match `HeadObject` / listing if you use
 * **`maxInFlightReadBytes`**.
 */
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { S3Client } from "@aws-sdk/client-s3";
import { pumpArchiveToWritable } from "s3prefix-archive";

async function main(): Promise<void> {
  const source = process.env.SOURCE_URI ?? "s3://my-bucket/reports/";
  const outPath = process.env.OUT_PATH ?? "./custom-paths.zip";

  const ndjsonBody = [
    '{"key":"reports/2024/q1/summary.pdf","size":2048}',
    '{"key":"reports/2024/q1/figures.png","size":50000}',
  ].join("\n");

  const preparedIndexNdjson = Readable.from(
    Buffer.from(`${ndjsonBody}\n`, "utf8"),
  );

  await pumpArchiveToWritable(createWriteStream(outPath), {
    source,
    format: "zip",
    concurrency: 1,
    client: new S3Client({}),
    preparedIndexNdjson,
    mapEntryName: (meta) => {
      const k = meta.key;
      if (k.startsWith("reports/2024/q1/")) {
        return `Deliverables/2024-Q1/${k.slice("reports/2024/q1/".length)}`;
      }
      return k.replace(/^reports\//, "");
    },
  });

  console.log("wrote", outPath);
}

void main();
