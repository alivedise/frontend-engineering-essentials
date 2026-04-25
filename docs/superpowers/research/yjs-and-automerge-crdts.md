---
topic: CRDT Collaborative State with Yjs and Automerge
id: 615
slug: yjs-and-automerge-crdts
sources_reviewed: 15
claims: 15
---

# Findings: CRDT Collaborative State with Yjs and Automerge

**Proposed topic-specific section:** `## Merge Semantics Comparison`.

## Claims

### Claim 1
- **Text:** A CRDT's merge function is associative, commutative, idempotent — concurrent replicas converge without coordination.
- **Target section:** Context
- **Source URL:** https://inria.hal.science/inria-00555588/document
- **Pulled quote:** "The least upper bound ⊔v is commutative (x ⊔v y = y ⊔v x), idempotent (x ⊔v x = x) and associative ((x ⊔v y) ⊔v z = x ⊔v (y ⊔v z))."

### Claim 2
- **Text:** Yjs is a high-performance CRDT whose shared types behave like ordinary collections but auto-merge across peers regardless of arrival order or transport.
- **Target section:** Context
- **Source URL:** https://docs.yjs.dev/
- **Pulled quote:** "Shared types... can be manipulated, fire events when changes happen, and automatically merge without merge conflicts." Yjs is "network agnostic" — "as long as all changes eventually arrive, documents will sync regardless of update order or network technology used."

### Claim 3
- **Text:** Yjs shipped types: `Y.Map`, `Y.Array`, `Y.Text`, `Y.XmlFragment`, `Y.XmlElement`, `Y.XmlText`. Each has typed methods.
- **Target section:** Best Practices
- **Source URL:** https://github.com/yjs/yjs
- **Pulled quote:** "Y.Array: A shareable Array-like type that supports efficient insert/delete of elements at any position. Y.Text: A shareable type that is optimized for shared editing on text."

### Claim 4
- **Text:** Yjs subdocuments embed a Y.Doc inside a parent shared type with lazy loading.
- **Target section:** Deep Dive
- **Source URL:** https://docs.yjs.dev/api/subdocuments
- **Pulled quote:** "Yjs documents can be embedded into shared types. This allows you to manage vast amounts of Yjs documents as part of a root document." "By default, subdocuments are empty until they are explicitly loaded."

### Claim 5
- **Text:** Yjs awareness is a separate, ephemeral CRDT for cursors/selections/user identity that is intentionally NOT stored in the document.
- **Target section:** Merge Semantics Comparison
- **Source URL:** https://docs.yjs.dev/getting-started/adding-awareness
- **Pulled quote:** "Awareness information isn't stored in the Yjs document, as it doesn't need to be persisted across sessions." Uses "a tiny state-based Awareness CRDT that propagates JSON objects to all users."

### Claim 6
- **Text:** Awareness state has 30-second timeout that drops silent peers — doubles as online/offline signal.
- **Target section:** Merge Semantics Comparison
- **Source URL:** https://docs.yjs.dev/api/about-awareness
- **Pulled quote:** "If a client doesn't receive updates from a remote peer for 30 seconds, it marks the remote client as offline." "manages user status (who is online?) and propagate awareness information like cursor location, username, or email address."

### Claim 7
- **Text:** Yjs separates transport from storage via providers: `y-websocket` (relayed), `y-webrtc` (P2P), `y-indexeddb` (local persistence). Apps typically compose several.
- **Target section:** Best Practices
- **Source URL:** https://github.com/yjs/yjs
- **Pulled quote:** "y-websocket: A module that contains a simple websocket backend and a websocket client that connects to that backend. y-webrtc: Propagates document updates peer-to-peer using WebRTC. y-indexeddb: Efficiently persists document updates to the browsers indexeddb database."

### Claim 8
- **Text:** Automerge presents itself as a JSON-like CRDT plus sync engine; explicit goal is to be a foundation for local-first apps.
- **Target section:** Context
- **Source URL:** https://github.com/automerge/automerge
- **Pulled quote:** "A JSON-like data structure (a CRDT) that can be modified concurrently by different users, and merged again automatically." "support local-first applications in the same way that relational databases support server applications."

### Claim 9
- **Text:** Automerge's sync protocol: each peer keeps `SyncState` per partner; `generateSyncMessage` produces updated state + optional `SyncMessage`; null message = both caught up.
- **Target section:** Example
- **Source URL:** https://automerge.org/automerge/api-docs/js/functions/generateSyncMessage.html
- **Pulled quote:** "[newSyncState, syncMessage | null]." "The returned newSyncState should replace the original state object, while syncMessage should be transmitted to the peer — unless it's null, which signals that both peers are already synchronized."

### Claim 10
- **Text:** Automerge sync protocol assumes reliable in-order channel between two peers; based on academic research from arxiv 2012.00472 (Kleppmann & Howard).
- **Target section:** Merge Semantics Comparison
- **Source URL:** https://automerge.org/automerge/automerge/sync/index.html
- **Pulled quote:** "The implementation relies on a reliable in-order stream between two peers and is based on academic research from https://arxiv.org/abs/2012.00472." Each peer "maintains a State for each peer they are synchronizing with."

### Claim 11
- **Text:** Local-first model: local replica is primary copy; server demoted to relay for secondary copies — architectural inversion that justifies CRDTs in the browser.
- **Target section:** Context
- **Source URL:** https://www.inkandswitch.com/essay/local-first/
- **Pulled quote:** "In local-first applications we swap these roles: we treat the copy of the data on your local device... as the primary copy. Servers still exist, but they hold secondary copies."

### Claim 12
- **Text:** CRDTs guarantee replicas converge to identical state but cannot enforce non-confluent invariants (e.g., "no more than 5 items", "no double-booked seat") without separate coordination.
- **Target section:** Best Practices
- **Source URL:** https://queue.acm.org/detail.cfm?id=3546931
- **Pulled quote:** "An invariant is confluent if two nodes can independently make updates that preserve the invariant... If all invariants are confluent, an application can be coordination-free, whereas nonconfluent invariants require coordination."

### Claim 13
- **Text:** Automerge sync round normally completes in one trip via Bloom filter summarising known commits in ~1.25 bytes each — document grows but sync wire stays small.
- **Target section:** Deep Dive
- **Source URL:** https://martin.kleppmann.com/2020/12/02/bloom-filter-hash-graph-sync.html
- **Pulled quote:** "In addition to sending the hashes of their heads, each node constructs a Bloom filter containing the hashes of the commits that it knows about." "Almost all reconciliations complete in one round trip."

### Claim 14
- **Text:** OT captures user intent at cost of centralized transformation server. CRDTs trade richer intent semantics for offline-tolerant peer-to-peer convergence.
- **Target section:** Merge Semantics Comparison
- **Source URL:** https://www.tiny.cloud/blog/real-time-collaboration-ot-vs-crdt/
- **Pulled quote:** "OT trades complexity for the ability to capture the intent; CRDT has less complexity but can only guarantee all clients end with the same data." "CRDT is capable of working peer-to-peer with end-to-end encryption... It even works if clients go offline."

### Claim 15
- **Text:** Yjs sits in the CRDT lineage descended from WOOT, with rich-text bolt-ons layered on top of an identifier-based object sequence.
- **Target section:** Design Thinking
- **Source URL:** https://arxiv.org/pdf/1905.01517
- **Pulled quote:** "A more recent tombstone-based CRDT solution, named Yjs, is noteworthy. Yjs is special in its extensions for supporting rich-text co-editing; but its core is based on WOOT with variations to reduce time and space complexity."

## Reference URLs

- https://docs.yjs.dev/
- https://docs.yjs.dev/getting-started/adding-awareness
- https://docs.yjs.dev/api/about-awareness
- https://docs.yjs.dev/api/subdocuments
- https://github.com/yjs/yjs
- https://automerge.org/
- https://github.com/automerge/automerge
- https://automerge.org/automerge/api-docs/js/functions/generateSyncMessage.html
- https://automerge.org/automerge/automerge/sync/index.html
- https://martin.kleppmann.com/2020/12/02/bloom-filter-hash-graph-sync.html
- https://www.inkandswitch.com/essay/local-first/
- https://inria.hal.science/inria-00555588/document
- https://arxiv.org/pdf/1905.01517
- https://www.tiny.cloud/blog/real-time-collaboration-ot-vs-crdt/
- https://queue.acm.org/detail.cfm?id=3546931

## Research notes

- Automerge merge framing: "JSON-like document whose maps, lists, and text each have their own per-type CRDT merge" — not a single recursive merge.
- Merge Semantics Comparison anchors claims 5, 6, 10, 14 — gives the article a clear differentiator from generic CRDT intro.
