---
topic: esbuild — Parallelism Architecture
id: 1802
slug: esbuild-parallelism-architecture
studied_at: "esbuild v0.25.2 (2025-03-30)"
sources_reviewed: 7
claims: 16
---

# Findings: esbuild — Parallelism Architecture

**Proposed topic-specific section:** `## The Goroutine + Channel Fanout Model`.

## Claims

### Claim 1
- **Text:** Maximizing parallelism is an explicit design principle, instructing readers that almost all CPU time should be spent in fully parallelizable work, observable via Go's built-in tracing tool.
- **Target section:** Context
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/docs/architecture.md
- **Pulled quote:** "**Maximize parallelism**    Most of the time should be spent doing fully parallelizable work. This can be observed by taking a CPU trace using the `--trace=[file]` flag and viewing it using `go tool trace [file]`."

### Claim 2
- **Text:** The build pipeline has two phases (scan and compile), both implemented in `internal/bundler/bundler.go`; this is the architectural unit at which parallelism is organized.
- **Target section:** Context
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/docs/architecture.md
- **Pulled quote:** "The build pipeline has two main phases: scan and compile. These both reside in [bundler.go](../internal/bundler/bundler.go)."

### Claim 3
- **Text:** Scan is implemented as a parallel worklist where each file is parsed into an AST on its own goroutine, and goroutines append newly-discovered dependencies back into the worklist — a classic dynamic fan-out.
- **Target section:** The Goroutine + Channel Fanout Model
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/docs/architecture.md
- **Pulled quote:** "This is implemented in `bundler.ScanBundle()` as a parallel worklist algorithm. The worklist starts off being the list of entry points. Each file in the list is parsed into an AST on a separate goroutine and may add more files to the worklist if it has any dependencies (either ES6 `import` statements, ES6 `import()` expressions, or CommonJS `require()` expressions). Scanning continues until the worklist is empty."

### Claim 4
- **Text:** The fan-out/fan-in primitive in the scan phase is a single Go channel of `parseResult`. Each worker goroutine sends its parsed AST over `resultChannel`, and the scanner serializes them on a single consumer goroutine — the comment explicitly notes the slice is "only ever modified by a single thread."
- **Target section:** The Goroutine + Channel Fanout Model
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/internal/bundler/bundler.go
- **Pulled quote:** "// These are not guarded by a mutex because it's only ever modified by a single\n// thread. Note that not all results in the \"results\" array are necessarily\n// valid. Make sure to check the \"ok\" flag before using them.\nresults       []parseResult\nvisited       map[logger.Path]visitedFile\nresultChannel chan parseResult"

### Claim 5
- **Text:** Each new file discovered during scanning is dispatched as a fresh goroutine running `parseFile`, with the shared `resultChannel` passed in as the result sink — there is no fixed-size worker pool; concurrency is bounded only by the Go scheduler and downstream limits like the FD semaphore.
- **Target section:** The Goroutine + Channel Fanout Model
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/internal/bundler/bundler.go
- **Pulled quote:** "go parseFile(parseArgs{ ... results: s.resultChannel, ... })"

### Claim 6
- **Text:** The fan-in is a serial loop that drains the channel until `remaining` reaches zero, mutating the shared `results` slice on a single goroutine — this is what makes the per-source-index store mutex-free.
- **Target section:** The Goroutine + Channel Fanout Model
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/internal/bundler/bundler.go
- **Pulled quote:** "func (s *scanner) scanAllDependencies() { ... // Continue scanning until all dependencies have been discovered\nfor s.remaining > 0 { ... result := <-s.resultChannel\ns.remaining--"

### Claim 7
- **Text:** `parseFile` itself terminates by sending its parsed result over the channel, completing the fan-in handshake. This is the goroutine-per-file boundary: the function runs concurrently for every file in the bundle.
- **Target section:** Example
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/internal/bundler/bundler.go
- **Pulled quote:** "args.results <- result"

### Claim 8
- **Text:** The compile phase fans out again at chunk granularity — `generateChunkJS` and `generateChunkCSS` are launched as one goroutine per chunk and joined on a `sync.WaitGroup`.
- **Target section:** The Goroutine + Channel Fanout Model
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/internal/linker/linker.go
- **Pulled quote:** "generateWaitGroup := sync.WaitGroup{}\ngenerateWaitGroup.Add(len(c.chunks))\nfor chunkIndex := range c.chunks {\n  switch c.chunks[chunkIndex].chunkRepr.(type) {\n  case *chunkReprJS:\n    go c.generateChunkJS(chunkIndex, &generateWaitGroup)\n  case *chunkReprCSS:\n    go c.generateChunkCSS(chunkIndex, &generateWaitGroup)\n  }\n}"

### Claim 9
- **Text:** Per-chunk hashing uses a buffered channel as a one-shot future — the compute runs eagerly on a separate goroutine and the consumer blocks on the channel only if it actually needs the hash. Channels here serve as cross-goroutine memoization.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/internal/linker/linker.go
- **Pulled quote:** "func (c *linkerContext) generateIsolatedHashInParallel(chunk *chunkInfo) {\n  // Compute the hash in parallel. This is a speedup when it turns out the hash\n  // isn't needed (well, as long as there are threads to spare).\n  channel := make(chan []byte, 1)\n  chunk.waitForIsolatedHash = func() []byte {\n    data := <-channel\n    channel <- data\n    return data\n  }\n  go c.generateIsolatedHash(chunk, channel)\n}"

### Claim 10
- **Text:** Printing is parallel per file because each AST stores byte offsets into its source file and is printed independently — no merged AST, no shared mutable printer state.
- **Target section:** Deep Dive
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/docs/architecture.md
- **Pulled quote:** "Each file is printed independently from other files, so files can be printed in parallel. This extends to source map generation."

### Claim 11
- **Text:** Evan Wallace's published rationale names parallelism and Go's shared-memory threading model as core reasons esbuild is fast — and explicitly contrasts it with JavaScript's serialize-between-threads model.
- **Target section:** Context
- **Source URL:** https://esbuild.github.io/faq/#why-is-esbuild-fast
- **Pulled quote:** "Go is designed from the core for parallelism while JavaScript is not. Go has shared memory between threads while JavaScript has to serialize data between threads."

### Claim 12
- **Text:** The same FAQ states the design intent: parsing and code generation are parallelizable, linking is inherently serial, and the goal is full CPU saturation — directly matching the bundler.go phase split.
- **Target section:** Best Practices
- **Source URL:** https://esbuild.github.io/faq/#why-is-esbuild-fast
- **Pulled quote:** "Parallelism is used heavily. The algorithms inside esbuild are carefully designed to fully saturate all available CPU cores when possible. There are roughly three phases: parsing, linking, and code generation. Parsing and code generation are most of the work and are fully parallelizable (linking is an inherently serial task for the most part)."

### Claim 13
- **Text:** The "everything in memory, no per-pass disk buffering" decision is the FAQ's explanation for why parallelism translates into raw speed — passes are interleaved over a shared in-memory AST instead of being chained through string serialization between tools.
- **Target section:** Visual
- **Source URL:** https://esbuild.github.io/faq/#why-is-esbuild-fast
- **Pulled quote:** "Other bundlers do these steps in separate passes instead of interleaving them. They may also convert between data representations to glue multiple libraries together (e.g. string→TS→JS→string, then string→JS→older JS→string, then string→JS→minified JS→string) which uses more memory and slows things down."

### Claim 14
- **Text:** The plugin protocol is a deliberately separate concurrency boundary: a length-prefixed binary protocol over stdin/stdout between the JS host and the Go bundler. Process-boundary, not goroutine-boundary parallelism.
- **Target section:** The Goroutine + Channel Fanout Model
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/lib/shared/stdio_protocol.ts
- **Pulled quote:** "// The JavaScript API communicates with the Go child process over stdin/stdout\n// using this protocol. It's a very simple binary protocol that uses primitives\n// and nested arrays and maps."

### Claim 15
- **Text:** On the Go side, the stdio service multiplexes plugin RPCs onto a `chan []byte` — one writer goroutine drains all outgoing packets so they cannot interleave, while incoming plugin requests dispatch a fresh goroutine each. Plugins do run concurrently, but across a process boundary.
- **Target section:** The Goroutine + Channel Fanout Model
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/cmd/esbuild/service.go
- **Pulled quote:** "// Write packets on a single goroutine so they aren't interleaved\ngo func() {\n  for packet := range service.outgoingPackets {\n    if _, err := os.Stdout.Write(packet); err != nil {\n      os.Exit(1) // I/O error\n    }\n    service.keepAliveWaitGroup.Done()\n  }\n}()"

### Claim 16
- **Text:** Although `runtime.NumCPU()` is never called explicitly, esbuild does cap one OS-level resource: open file descriptors. A buffered channel of size 32 acts as a counting semaphore around every file open, preventing goroutine fan-out from blowing past `ulimit -n`.
- **Target section:** Best Practices
- **Source URL:** https://github.com/evanw/esbuild/blob/v0.25.2/internal/fs/fs.go
- **Pulled quote:** "// Limit the number of files open simultaneously to avoid ulimit issues\nvar fileOpenLimit = make(chan bool, 32)\n\nfunc BeforeFileOpen() {\n  // This will block if the number of open files is already at the limit\n  fileOpenLimit <- false\n}\n\nfunc AfterFileClose() {\n  <-fileOpenLimit\n}"

## Reference URLs

- https://github.com/evanw/esbuild/blob/v0.25.2/docs/architecture.md
- https://github.com/evanw/esbuild/blob/v0.25.2/internal/bundler/bundler.go
- https://github.com/evanw/esbuild/blob/v0.25.2/internal/linker/linker.go
- https://github.com/evanw/esbuild/blob/v0.25.2/lib/shared/stdio_protocol.ts
- https://github.com/evanw/esbuild/blob/v0.25.2/cmd/esbuild/service.go
- https://github.com/evanw/esbuild/blob/v0.25.2/internal/fs/fs.go
- https://github.com/evanw/esbuild/blob/v0.25.2/pkg/api/api_impl.go
- https://esbuild.github.io/faq/#why-is-esbuild-fast

## Research notes

- The transferable shape: parallel pipelines for CPU-bound work where in-memory data flows through fanout/fan-in stages on a small worker pool. Recognisable in: bundlers (esbuild, swc, oxc), code-mod tools, video transcoders, parallel test runners (Jest workers), parallel linters.
- "What to look for elsewhere" candidates: a worker pool sized to NumCPU/availableParallelism, channels (or queues, or futures) carrying intermediate results, an explicit "all in memory, no disk buffering" decision, separation between in-process worker parallelism and out-of-process plugin/extension parallelism (different concurrency boundaries).
- esbuild-specific twist worth highlighting: there is no fixed-size worker pool. esbuild dispatches one goroutine per file unconditionally and lets Go's M:N scheduler multiplex them onto OS threads (whose count defaults to `GOMAXPROCS = runtime.NumCPU()`). The only hard cap esbuild itself enforces is the FD semaphore (32) — the channel-as-semaphore idiom is a textbook Go pattern and a nice contrast to the goroutine-explosion fan-out.
- Asymmetry to name explicitly: in-process work fans out via cheap goroutines + Go channels (microseconds). Plugin extension fans out via a JSON-over-stdio binary protocol with a single multiplexer goroutine on the Go side that serializes all writes (Claim 15). Two completely different concurrency primitives, chosen deliberately because plugins need a process boundary while parsing does not.

## Author cautions

- The plan asserted `runtime.NumCPU()` is consulted explicitly; the subagent verified it is not. Accurate framing: "esbuild relies on Go's default `GOMAXPROCS`, which defaults to `runtime.NumCPU()`" — a one-step indirection.
- Quotes contain `\n` for newlines; restore as actual newlines when rendering in the article.
- Render Claim 5 as a code block with elision marks (`...`) since `parseArgs` has 17 fields; only `results: s.resultChannel` is load-bearing.
- Tag pin: `v0.25.2`, NOT `v0.25.0` — the plan's suggestion was the older release.

## Rejected sources

- `cmd/esbuild/main.go` — does not consult `runtime.NumCPU()`. Not citation-worthy.
- `pkg/api/serve_other.go` — implements the watch-mode HTTP server, not the parser worker pool.
- esbuild root `README.md` — does not contain the "Why is it fast?" content; that lives on the FAQ page.
