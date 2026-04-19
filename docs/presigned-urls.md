# Presigned GET URLs (browser-hybrid workflow)

Use **`signGetObjectDownloadUrl`** / **`signGetObjectDownloadUrls`** from the package root for direct browser `fetch()` to S3. This library’s archive pump remains the right path for **server-side** ZIP/TAR streaming.

- **Example (repo):** [examples/presigned-batch-sign.ts](../examples/presigned-batch-sign.ts) — batch signing + `recommendArchiveExecutionSurface` in one place.
- **Expiry:** balance security vs UX (often 300–3600 s).
- **Batching:** signing is \(O(n)\); cap batch sizes for large key sets.
- **Hybrid:** threshold large objects to presign; stream the rest through `createFolderArchiveStream`.

## Errors

Library and configuration failures use **`S3ArchiveError`**—see [errors.md](errors.md) for codes and `describeArchiveFailure` for user-facing text.

## See also

- [Documentation hub](README.md)
- [IAM & selective exports](guides/iam-selective-exports.md)
