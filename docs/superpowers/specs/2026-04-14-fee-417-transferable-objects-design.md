---
name: FEE-417 Transferable Objects
description: New FEE article covering zero-copy ownership transfer via postMessage, the full catalogue of transferable types, and the three-way decision guide (clone vs. transfer vs. SharedArrayBuffer).
type: project
---

# FEE-417: Transferable Objects

## Goal

Add a standalone FEE article that gives Transferable Objects the first-class treatment they lack in the curriculum. The concept currently exists only as scattered subsections in FEE-405, FEE-407, FEE-709, and FEE-414. A dedicated article establishes the mental model, catalogues all transferable types (including newer WebCodecs and WebRTC entries), and provides the decision guide developers need when choosing between structured clone, transfer, and SharedArrayBuffer.

## Why This Topic Is Missing

Transferable Objects are a *cross-cutting primitive*: they apply to any `postMessage` boundary — dedicated workers, shared workers, service workers, `window.postMessage` across frames, `MessageChannel`, `BroadcastChannel`, WebRTC's `RTCDataChannel`, and WebTransport streams. Because every FEE article that touches them treats them as a satellite feature of its own topic, no article ever owns the concept holistically.

This is a recognizable curriculum gap pattern: **primitives that sit at the intersection of multiple APIs get documented as footnotes in each rather than as first-class topics**. The MDN page reinforces the problem by placing Transferable Objects under the Web Workers API namespace, implying "this is a Workers thing" when the mechanism applies wherever `postMessage` exists.

## Article Metadata

| Field | Value |
|-------|-------|
| `id` | 417 |
| `title` | Transferable Objects |
| `state` | draft |
| `level` | mid |
| Category | Browser APIs and Web Platform |
| Files | `docs/en/Browser APIs and Web Platform/417.md`, `docs/zh-tw/Browser APIs and Web Platform/417.md` |

## Article Structure

### Context

Explains the structured clone algorithm — the default serialization mechanism for `postMessage`. Structured clone performs a deep copy: for a 100 MB `ArrayBuffer`, this means allocating 100 MB of new memory, copying every byte, and creating GC pressure on both sides. For large binary payloads (video frames, audio buffers, image data, typed arrays), this overhead is measurable and often the bottleneck in worker-based pipelines.

Introduces the transfer mechanism: when a transferable object is listed in the transfer array (`postMessage(data, [transferList])`), ownership moves atomically from sender to receiver in O(1) time regardless of data size. The sender's reference is *neutered* — its `byteLength` becomes 0 and any attempt to read it throws a `TypeError`. No copy occurs. The receiver gets the live buffer.

### Scenario

A video processing pipeline: the main thread captures a `VideoFrame` from a `<video>` element using the WebCodecs API, transfers it to a dedicated worker for color grading, and the worker transfers back an `ImageBitmap` result. Without transfer, each frame crossing the thread boundary would clone megabytes of pixel data at 30–60 fps, saturating memory bandwidth. With transfer, each crossing is O(1).

This scenario is intentionally concrete and distinct from FEE-405's general Workers introduction.

### Design Thinking

**Three-way decision guide:**

| Strategy | Cost | Sender retains copy? | Synchronization needed? | When to use |
|----------|------|---------------------|------------------------|-------------|
| Structured clone | O(n) copy | Yes | No | Small data; sender needs its own copy after send |
| Transfer | O(1) ownership move | No (neutered) | No | Large binary data; sender is done with it |
| SharedArrayBuffer | O(1) no copy | Shared | Yes (Atomics) | Two threads must concurrently read/write the same memory |

**SharedArrayBuffer prerequisites:** requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` response headers. These headers isolate the browsing context and are required by browsers as a Spectre mitigation. Transferable `ArrayBuffer` has no such requirement — it is the default choice for large data; SharedArrayBuffer is reserved for genuine shared-memory concurrency (e.g., WebAssembly multi-threading).

**Transferable types catalogue** (grouped by API family):

*Core memory:*
- `ArrayBuffer` — the canonical transferable; all TypedArray `.buffer` properties are ArrayBuffers and transfer cleanly

*Messaging:*
- `MessagePort` — one end of a `MessageChannel`; transferring it routes a direct channel between two workers, avoiding relaying through the main thread

*Streams (Web Streams API):*
- `ReadableStream`, `WritableStream`, `TransformStream` — enables piping a stream directly into a worker without buffering

*Media and rendering:*
- `ImageBitmap` — decoded image pixels ready to paint; avoid re-decoding inside the worker
- `OffscreenCanvas` — transfers canvas rendering responsibility to a worker; see FEE-407

*WebCodecs:*
- `VideoFrame`, `AudioData`, `EncodedVideoChunk`, `EncodedAudioChunk` — high-throughput AV pipeline primitives; always transfer, never clone

*WebRTC:*
- `RTCDataChannel` — Chrome 111+ only; no Firefox or Safari support as of 2026. Feature-detect with `RTCDataChannel.prototype.transfer` before use. Enables handing off a data channel to a worker without closing and re-establishing the connection.

*WebTransport:*
- `WebTransportReceiveStream`, `WebTransportSendStream` — transfer stream endpoints to a dedicated worker for off-main-thread network I/O

### Best Practices

- **MUST** include the transfer list as the second argument to `postMessage`: `postMessage(data, [buffer])`. Omitting the transfer list causes structured clone of the entire payload regardless of type.
- **MUST NOT** read from a transferred object after sending. Modern browsers throw a `TypeError`; older browsers silently return empty data.
- **SHOULD** transfer `VideoFrame` and `AudioData` objects rather than clone them — these types are designed for high-throughput pipelines and cloning defeats the purpose.
- **SHOULD** feature-detect `RTCDataChannel` transfer support before relying on it: check `typeof RTCDataChannel.prototype.transfer === 'function'` and provide a fallback for Firefox/Safari.
- **AVOID** reaching for `SharedArrayBuffer` when transferable `ArrayBuffer` can accomplish the goal. SharedArrayBuffer requires COOP/COEP headers, introduces synchronization complexity, and is blocked in some deployment environments. Transfer is simpler and sufficient for the majority of large-data worker patterns.

### Visual

A side-by-side diagram comparing the structured clone path (sender → serialization → copy → deserialization → receiver, with O(n) annotation and GC arrows) against the transfer path (sender → ownership move → receiver, with O(1) annotation and neutered-reference annotation on sender). Makes the performance difference immediately visible.

### Example

Two code examples:

1. **ArrayBuffer transfer** — off-main-thread image processing: create a `Uint8ClampedArray`, do work on main thread, transfer the `.buffer` to a worker, confirm the original is neutered.

2. **RTCDataChannel transfer with feature detection** — show the `typeof` guard, the `.transfer()` call on Chrome, and a comment indicating the fallback path for non-supporting browsers.

### Related FEEs

| FEE | Relationship |
|-----|-------------|
| FEE-405 Web Workers & Concurrency | Primary consumer of Transferable Objects; FEE-417 extracts and deepens the subsection in FEE-405 |
| FEE-407 Canvas 2D & SVG | OffscreenCanvas is transferred via the mechanism described here |
| FEE-411 WebTransport | WebTransportReceiveStream/SendStream are transferable |
| FEE-306 Memory Management & GC | Neutering and zero-copy transfer directly interact with GC pressure |
| FEE-403 Fetch, Streams & Network | ReadableStream/WritableStream/TransformStream are transferable |

## Out of Scope

- `window.postMessage` cross-origin security model (origin validation, `targetOrigin`) — separate topic
- `BroadcastChannel` API — covered in FEE-414
- SharedArrayBuffer internals and Atomics API — warrant their own article if needed
