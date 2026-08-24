---
id: 1905
title: "Backend-for-Frontend (BFF) and the API Boundary"
state: draft
slug: backend-for-frontend
---

# [FEE-1905] Backend-for-Frontend (BFF) and the API Boundary

:::info
SoundCloud's official apps and third-party clients once shared a single public API, so every new endpoint took extra work to stay generic enough for all clients, and the resulting fine-grained endpoints forced clients to issue large numbers of HTTP requests to render even simple experiences. The team's response was to give each client team a back-end of its own, a design their web tech lead Nick Fisher named Backend-for-Frontend. By 2021 SoundCloud operated dozens of BFFs handling hundreds of millions of requests per hour, and its retrospective records both the payoff and two failure modes. Meituan, NetEase Cloud Music, and Xianyu hit the same boundary problem and shipped three further variants, so the practical question this article answers is: who owns the assembly-and-adaptation layer between clients and services, and where does it run? The pattern's costs (an extra network hop, one more service lifecycle per BFF, cross-BFF duplication, a larger attack surface) and its adoption record, including absorption by meta-frameworks and the GraphQL federation alternative, each get a dedicated section.
:::

## Context

The pattern originates in SoundCloud's reaction against its single public API. Phil Calçado's 2015 writeup records the pre-BFF pain: whenever the team added something new, they had to invest heavily in making sure the endpoint was not over-specialized for one app, and the fine-grained endpoints that resulted required many HTTP requests for even the simplest experiences. The original idea was different back-ends for different front-ends, with the client team owning its API so shipping required no cross-team coordination. SoundCloud's 2021 official retrospective confirms the pattern scaled, and also documents where it broke down. Between 2020 and 2023, three large Chinese teams published their own variants driven by the same boundary problem: Meituan chose a backend-owned BFF and sank GraphQL beneath it, NetEase Cloud Music let front-end engineers self-serve data interfaces through low-code GraphQL, and Xianyu had client-side engineers write the server layer directly as FaaS (Functions as a Service, a model where server code is deployed and run as individual functions on a managed platform). Sam Newman's pattern text supplies the adoption criteria this article's decision map builds on.

## Visual

The core mechanic is where the assembly-and-adaptation layer lives and which team writes it. Four named systems answered differently:

| System | Who writes the layer | Form it takes | Documented driver | Documented cost |
| --- | --- | --- | --- | --- |
| SoundCloud | Each client team | One BFF per experience (dozens total) | Single public API over-generalized endpoints and multiplied client requests | Feature-integration logic duplicated across BFFs with diverging implementations |
| Meituan | Backend engineers | Backend BFF with GraphQL sunk below it, driven by metadata (structured configuration describing display logic) | API count exploding with display scenarios; support effort linear in headcount | Raw GraphQL concepts imposed learning costs unrelated to the business, prompting the redesign |
| NetEase Cloud Music | Big-front-end engineers (web and native client engineers collectively), self-serve | Low-code GraphQL data-assembly platform | A single page-field change required server-side evaluation and scheduling | GraphQL is a new language for native client engineers |
| Xianyu | Client-side engineers | FaaS functions in Dart, unified with Android/iOS code | Campaign pages with lifecycles of days made the front-end-render, back-end-API workflow costly; mock data and joint debugging were low-value work | Requires org-level FaaS platform and a language shared across three ends |

## Example

SoundCloud's retrospective gives the concrete reason one shared API could not serve both of its main clients: mobile clients prefer larger responses with a high number of embedded entities to minimize the number of requests, while the web frontend prefers finer-grained responses with dynamic augmentation. That documented divergence is what per-experience BFFs encode in code. The handlers below are an invented illustration of that mechanic (SoundCloud has not published its BFF source); each BFF calls the same downstream services but shapes the response for its own client.

```js
// mobile-bff/routes/track-page.js
// One request; user and comments embedded, per the mobile preference
// for large responses with embedded entities.
app.get('/track-page/:id', async (req, res) => {
  const track = await tracks.get(req.params.id);
  const [user, comments] = await Promise.all([
    users.get(track.userId),
    comments.listFor(track.id, { limit: 20 }),
  ]);
  res.json({ track, user, comments });
});

// web-bff/routes/track-page.js
// Finer-grained response; the web client augments dynamically
// with follow-up calls only for the panels it renders.
app.get('/track-page/:id', async (req, res) => {
  const track = await tracks.get(req.params.id);
  res.json({
    track: { id: track.id, title: track.title, streamUrl: track.streamUrl },
    userId: track.userId,
    commentsUrl: `/tracks/${track.id}/comments`,
  });
});
```

The same route on the two BFFs produces different payloads:

```json
// GET mobile-bff/track-page/91 -> one round trip, everything embedded
{ "track": { "id": 91, "title": "…", "streamUrl": "…", "userId": 7 },
  "user": { "id": 7, "name": "…", "avatarUrl": "…" },
  "comments": [ { "id": 501, "body": "…" }, { "id": 502, "body": "…" } ] }

// GET web-bff/track-page/91 -> minimal payload plus URLs for augmentation
{ "track": { "id": 91, "title": "…", "streamUrl": "…" },
  "userId": 7,
  "commentsUrl": "/tracks/91/comments" }
```

Because each BFF is owned by the team building its client, changing either shape is a one-team decision, which is the coordination cost the pattern was invented to remove.

## Best Practices

- **MUST** decide who staffs the layer before choosing a variant. Meituan rejected the Node-layer frontend BFF because it required large front-end resources and mature front-end infrastructure it did not have, and chose a backend BFF instead; Xianyu could put client engineers on the layer only because Dart gave Android, iOS, and FaaS a single language.
- **MUST** pair one BFF with one experience, per Newman's "one experience, one BFF"; a single BFF for iOS and Android is easier to justify when the two experiences are very similar, and separate BFFs make more sense when they diverge greatly.
- **MUST NOT** promise client teams full autonomy. SoundCloud's own retrospective calls that idea an illusion: BFFs sit at the intersection of two worlds and still depend on downstream teams.
- **SHOULD** skip the pattern for an application with only a web UI unless a significant amount of aggregation is required, which is Newman's stated boundary for that case.
- **SHOULD** treat the pattern as essential rather than optional once the number of downstream services is large, because the need to aggregate multiple downstream calls per user feature increases drastically.
- **SHOULD** tolerate duplicated logic between BFFs until the third implementation, then extract it into a shared library or a new downstream service, following Newman's rule of thumb.
- **MAY** run GraphQL beneath the BFF rather than as its developer-facing surface. Meituan found raw GraphQL concepts imposed learning costs unrelated to the business domain, sank it below a metadata-driven layer, and reports over 50% display-logic reuse and more than doubled efficiency after the change.
- **MAY** offer the BFF as a low-code self-service platform. NetEase Cloud Music opened its platform to the big front end (web and native client engineers collectively), which produced 160+ data interfaces in roughly half a year, while the team notes GraphQL is a new language for the native client engineers among those users and budgets for that learning cost.

## Boundary: BFF or API Gateway?

Newman's pattern text defines the BFF against what it calls the general-purpose API backend, and records that layer's pathology: it takes on multiple responsibilities and therefore requires so much work that a team is created specifically to handle it, front-end teams then have to interface with a separate team to get changes made, and the layer ends up as middleware not focused on any particular business domain.

The test that separates a BFF from that layer has two clauses. Scope: a BFF serves one user experience and is tightly coupled to it. Ownership: a BFF is typically maintained by the same team as its user interface. A general-purpose gateway fails both clauses, since it serves every client and is owned by a team apart from any of them; whatever aggregation it performs, it is the general-purpose API backend the pattern was defined against. Newman's page never uses the term "API gateway"; the general-purpose API backend is his contrast case, and the two-clause test is how it applies to a gateway you already run.

## The Costs

The earlier sections develop the payoff; this section concentrates the price. Four costs, each with a named source.

- **Latency from an extra network hop.** Microsoft's Azure Architecture Center lists latency among the pattern's considerations: clients stop contacting services directly, and the new service introduces an extra network hop. Newman supplies the environmental context: BFFs are often used in microservice environments that are already very sensitive to latency because of the high number of network calls being made.
- **A full extra service lifecycle.** The same Microsoft document states that maintaining and deploying more services means increased operational overhead, because each service has its own life cycle, deployment and maintenance requirements, and security needs. Newman names his own reconsideration trigger: a high cost of deploying additional services would make him reconsider the pattern.
- **Cross-BFF duplication.** What SoundCloud recorded as lived experience (see Failure Modes), Microsoft generalizes into a property of the pattern: code duplication is a probable outcome, to be weighed against a better-tailored experience per client. Marmelab's François Zaninotto lists the same duplication risk across BFFs.
- **Attack surface and organizational cost.** Zaninotto notes that each new BFF increases the overall attack surface of the system, and names the settings where the overhead is not justified: single-frontend applications, CRUD-heavy apps, and small teams. The organizational cost is concrete in Meituan's selection record: a frontend-owned BFF demands large front-end resources and mature front-end infrastructure, which amounts to the front-end team operating a server tier of its own; Meituan rejected the variant on that cost and chose a backend BFF.

## Decision Map

Each row anchors to a named team's documented situation. The first row is the option of not building a BFF at all.

| Your situation | Call | Cost and limits | Anchor |
| --- | --- | --- | --- |
| Web-only application, no significant aggregation need | No BFF; the layer would add cost without the aggregation duty that justifies it | Assembly logic stays in the server you already run; one fewer service to deploy and operate | Newman's adoption boundary |
| Many downstream microservices behind each screen | Build BFFs; aggregation demand makes the pattern essential at that scale | One more service per experience to deploy, maintain, and monitor | Newman; SoundCloud runs dozens at hundreds of millions of requests per hour |
| iOS and Android experiences nearly identical | One shared mobile BFF | Holds only while the experiences stay similar; great divergence argues for separate BFFs | Newman's "one experience, one BFF" with its similar-experience allowance |
| Client experiences diverging in response shape | Separate BFFs per experience | Feature-integration logic duplicates across BFFs; requires the third-implementation extraction discipline | SoundCloud: mobile wants embedded entities, web wants fine-grained responses |
| API count exploding as display scenarios multiply, support effort scaling linearly with headcount, backend-staffed org, immature front-end infra | Backend-owned BFF; consider a metadata-driven layer over raw GraphQL | The assembly layer stays backend-owned, so front-end field changes still need coordination; Meituan built its metadata platform to lower that cost | Meituan |
| Front-end teams blocked on server scheduling for page-field changes | Self-serve GraphQL BFF platform for the big front end (web and native client engineers collectively); budget learning cost for the native side | The platform takes investment to build and maintain; GraphQL is a new language for the native client engineers it serves | NetEase Cloud Music |
| Client engineers can own server code and the org runs FaaS | Client-written FaaS layer with a language unified across ends | Holds only with all three ends in Dart; the 30% efficiency figure is Xianyu's own claim | Xianyu, which claims a further 30% efficiency gain on top of Flutter's two-end unification |
| Already on a meta-framework with built-in server routes (Next.js, Remix) | Host the BFF in the framework's route layer instead of deploying a separate service; both vendors document the capability under the BFF name | Next.js states its backend capabilities form an API layer and are not a full backend replacement; Remix documents both serving as the fullstack application and acting purely as a BFF in front of an existing backend | Next.js and Remix official guides |
| Already on GraphQL with frontend-specific resolvers | Re-evaluate a separate BFF; Microsoft's guidance says it may add no value in that setup | Federation keeps one unified API facade, and the graph becomes the artifact to govern; Netflix reports its graph grew so large no single human understands the entire surface | Microsoft's pattern guidance; Netflix's GraphQL federation |

## Failure Modes

SoundCloud's retrospective is the primary record of how the pattern fails at scale, and it names two modes.

First, cross-BFF duplication: feature-integration logic tends to end up inside the BFFs themselves, duplicated multiple times with diverging and inconsistent implementations. Newman's pattern text anticipates the tension and offers the working rule: accept duplication between BFFs, and create the abstraction when you are about to implement the same thing for the third time, extracting to a shared library or a new downstream service.

Second, the autonomy illusion: the pattern is sold as removing coordination, and SoundCloud's own conclusion after a decade is that full autonomy for client developers is just an illusion, because BFFs sit at the intersection of two worlds. Teams adopting any variant should plan for continued negotiation with downstream owners rather than expecting the boundary to end it.

The Chinese variants add a third mode: solving the boundary with the wrong interface. Meituan first exposed GraphQL directly at the BFF layer and found its concepts imposed learning costs unrelated to the business domain, which is why the team sank GraphQL beneath a metadata-driven layer. NetEase Cloud Music reports the same class of cost from the other direction: its GraphQL platform unblocked web front-end engineers but presented native client engineers with an entirely new language. Meituan's account records a fix; NetEase Cloud Music's records only the acknowledgment. When choosing a BFF's interface technology, confirm who bears the learning cost and whether a platform can absorb it, before scaling the layer.

## Adoption in the Wild

State of the evidence first: as of August 2026 there is no public quantitative survey of BFF adoption, and no named team has published a retrospective on retiring or consolidating its BFFs. This section therefore reads three kinds of indirect evidence qualitatively.

- **The Technology Radar stopped listing the pattern in 2016.** ThoughtWorks rated BFF as Trial in November 2015 and April 2016 and has not listed it since. The page's own archive note says entries from recent editions likely remain relevant, so the silence cannot be read directly as the pattern failing; what the record establishes is that the radar has not treated the technique as one to track for a decade.
- **Meta-frameworks absorbed the need.** Next.js documents the pattern under the title "Backend for Frontend," listing Route Handlers and proxying as the implementation tools, with a stated limit: these capabilities form an API layer and are not a full backend replacement. Remix positions the framework server as a BFF host scoped to serving the frontend web app and connecting it to the services it needs, and states that mature apps have no reason to migrate Ruby, Elixir, or PHP backends to server-side JavaScript; the Remix app serves as the backend for the frontend. On these frameworks a team writes a BFF layer without deploying a separate service called a BFF, so the pattern's usage never surfaces as a count of BFF services.
- **GraphQL is the documented alternative.** Microsoft's pattern document states that GraphQL's querying mechanism eliminates the need for a separate BFF layer because clients request the data they need without relying on predefined endpoints, and that organizations already using GraphQL with frontend-specific resolvers may find BFF services add no value. Netflix is the named case on this path: its API aggregation layer had become "the new monolith," and the team broke the implementation apart with GraphQL federation while preserving the facade of one unified API for all clients. The QCon talk by two Netflix API engineers never uses the term BFF; facing the same need for a layer between clients and many microservices, Netflix kept a single federated graph for every client and built no per-experience services.
- **Named reasons not to adopt.** Zaninotto calls the pattern overkill for applications with a single frontend, CRUD-heavy apps, and small teams, and marginal when the backend API already supports selecting fields and embedding related data. Microsoft states the pattern might not be suitable when interfaces make the same or similar requests to the backend, or when only one interface interacts with it. These conditions restate the decision map's first row from the outside: a product with one interface and no significant aggregation need sits outside the boundary the pattern's own authors drew.

The qualitative conclusion from the three kinds of evidence: the named public practice of BFF as a separately deployed service concentrates in large multi-client organizations with many downstream services, exactly the profile of this article's cases; elsewhere the need either does not arise (a single interface) or is absorbed as a built-in capability by meta-framework server routes and GraphQL. No quantitative adoption figure exists to cite, so neither "the industry has broadly adopted BFF" nor "the industry has abandoned BFF" has evidence behind it.

## Related Topics

- [Application Architecture Overview](/application-architecture-overview)
- [Domain-Driven Design for the Frontend](/frontend-ddd)
- [Micro-Frontend Architecture](/micro-frontend-architecture)
- [Server-Driven UI](/server-driven-ui)

## References

- Phil Calçado, "The Back-end for Front-end Pattern (BFF)," philcalcado.com (2015). https://philcalcado.com/2015/09/18/the_back_end_for_front_end_pattern_bff.html
- SoundCloud, "Service Architecture at SoundCloud — Part 1: Backends for Frontends," SoundCloud Backstage Blog (2021). https://developers.soundcloud.com/blog/service-architecture-1/
- 美團技術團隊, "GraphQL及元數據驅動架構在後端BFF中的實踐," 美團技術博客 (2021). https://tech.meituan.com/2021/05/06/BFF-GraphQL.html
- 網易雲音樂技術團隊, "基於 GraphQL 的雲音樂 BFF 建設實踐," SegmentFault (2023). https://segmentfault.com/a/1190000043184277
- 閒魚技術, "閒魚架構如何一招提效30%？Flutter+Serverless 研發實踐公開," 阿里雲開發者社區 (2020). https://developer.aliyun.com/article/740787
- 閒魚技術, "高效研發——閒魚在數據聚合上的探索與實踐," CSDN (2018). https://blog.csdn.net/weixin_38912070/article/details/93857103
- Sam Newman, "Backends For Frontends," samnewman.io. https://samnewman.io/patterns/architectural/bff/
- Microsoft Azure Architecture Center, "Backends for Frontends Pattern" (2025). https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends
- François Zaninotto, "Do you need a Backend For Frontend?," Marmelab blog (2025). https://marmelab.com/blog/2025/10/01/do-you-need-a-backend-for-frontend.html
- ThoughtWorks Technology Radar, "BFF - Backend for Frontends." https://www.thoughtworks.com/radar/techniques/bff-backend-for-frontends
- Next.js Docs, "How to use Next.js as a backend for your frontend." https://nextjs.org/docs/app/guides/backend-for-frontend
- Remix Docs, "Backend For Your Frontend." https://remix.run/docs/en/main/guides/bff
- Jennifer Shin and Stephen Spalding, "How Netflix Scales its API with GraphQL Federation," QCon Plus talk, InfoQ (2020). https://www.infoq.com/presentations/netflix-api-graphql-federation/
