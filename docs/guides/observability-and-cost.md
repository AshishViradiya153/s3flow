# Guide: observability & cost

## Logging

- **`debug: true`** — verbose structured logs (list pages, per-object lifecycle, retries). If **`logger`** is omitted, a stderr JSON logger at debug is used when **`debug`** is true.
- **`resolveArchiveLogger`** — align custom Pino loggers with library conventions.

## Explain mode

- **`explain: true`** — emits **`ArchiveExplainStep`** events; use **`onExplainStep`** for large prefixes to avoid buffering **`explainTrace`**.

## Prometheus

- **Archive runs:** pass **`prometheus: { register, prefix? }`** on **`CreateFolderArchiveStreamOptions`** / pump options. On success, **`observeArchiveCompletion`** updates counters/histograms (see [prometheus.ts](../../src/prometheus.ts) for metric names).
- **Prepared index listing:** **`PreparedIndexOptions`** accepts **`prometheus`**; each emitted NDJSON line can increment **`observePreparedIndexLine`** (used inside **`streamPrefixIndexNdjson`** / **`createPreparedIndexReadable`** / **`prepareFolderArchiveIndexToFile`**).

Example (archive completion): [examples/prometheus-memory-register.ts](../../examples/prometheus-memory-register.ts).

## Cost & strategy (advisory)

Linear **USD** helpers (request + egress + optional KMS) and **ZIP concurrency / backpressure hints** do **not** change runtime behavior automatically—they inform dashboards and human tuning:

- **`estimateArchiveRunS3Usd`**
- **`suggestArchiveRunStrategyHints`**
- **`summarizeArchiveRunClassifications`**

Example: [examples/cost-and-strategy-hints-memory.ts](../../examples/cost-and-strategy-hints-memory.ts).

## Telemetry bridge

**`createArchiveTelemetryBridge`** mirrors retry and slow-stream signals onto a Node **`EventEmitter`** for integration with existing observability stacks.
