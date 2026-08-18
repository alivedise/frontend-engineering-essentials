---
id: 1900
title: "Application Architecture & Scaling Patterns Overview"
state: draft
overview: true
slug: application-architecture-overview
---

# [FEE-1900] Application Architecture & Scaling Patterns Overview

:::info
This category covers the decisions that shape a frontend application above the component tree: how source code is organized and which imports are legal (Feature-Sliced Design), how domain logic is isolated from frameworks (Clean & Hexagonal Architecture, Domain-Driven Design), how the API boundary is drawn (Backend-for-Frontend), and how the application is split across teams and deployments (Micro-Frontends, Server-Driven UI). The category sits at 1900-1999. Its sibling, [Component Architecture & Design Patterns](/500) (500s), answers a different question: how to design a component and its API. Here the unit of analysis is the module, the dependency direction, and the team boundary; there it is the component.
:::

## Context

Every frontend codebase answers two kinds of architectural questions. The first kind lives inside the component tree: how should this component expose its API, own its state, compose with its children? The 500s category covers those. The second kind is what this category exists for, and it only starts to hurt at scale: where does code live, who may import whom, where does the domain logic sit relative to the framework, where does the backend's responsibility end, and how do ten teams ship one product without stepping on each other. These questions have answers with names (FSD, hexagonal architecture, bounded contexts, BFF, micro-frontends, server-driven UI), trade-offs that repeat across companies, and tooling that can enforce them. Each article in this category takes one named answer, shows the mechanics, and names the point at which its overhead stops paying for itself, because every pattern here is a scaling pattern: adopted too early, each one is pure cost.

## Visual

| | Component Architecture (500s) | Application Architecture (1900s) |
|---|---|---|
| Question answered | How do I design this component and its API? | How do I organize, bound, and ship the whole application? |
| Unit of analysis | Component, props, state ownership | Module, layer, dependency direction, team/deploy boundary |
| Typical failure it prevents | Prop drilling, leaky abstractions, unusable APIs | Cross-import tangles, framework lock-in, team coupling, release trains |
| Enforcement | Types, code review, component tests | Architectural linters, module boundaries, contracts, ownership rules |

Category map, in suggested reading order:

| id | Article | The decision it covers |
|---|---|---|
| 1902 | [Feature-Sliced Design & Folder-Level Architecture](/feature-sliced-design) | Where code lives; which imports are legal |
| 1903 | [Clean & Hexagonal Architecture in the Frontend](/clean-hexagonal-frontend) | Keeping domain logic independent of framework and I/O |
| 1904 | [Domain-Driven Design for the Frontend](/frontend-ddd) | Carving the app along business domains; bounded contexts |
| 1905 | [Backend-for-Frontend & the API Boundary](/backend-for-frontend) | What the server owes each client; where tokens live |
| 1906 | [Server-Driven UI](/server-driven-ui) | Letting the server decide what the client renders |
| 1901 | [Micro-Frontend Architecture](/micro-frontend-architecture) | Splitting one product across independently deployed apps |

FSD, Clean/Hexagonal, and DDD form one arc (organizing a single codebase, from folders to dependencies to domains); BFF, SDUI, and micro-frontends form the second (distributing responsibility across services, servers, and teams).

## Design Thinking

The recurring trade in this category is **structure now versus speed now**. Every pattern here adds indirection: more folders, more interfaces, more services, more contracts. The payoff is always the same shape, too: changes stay local, teams stay decoupled, and the cost of the *next* feature stays flat instead of growing with the codebase. The articles therefore share a discipline: each names its adoption threshold (the team size, domain complexity, or organizational shape below which the pattern is overhead) and its enforcement mechanism, because an architecture that lives only in a wiki diagram erodes with every sprint. When the two categories point at each other, the direction is consistent: 1900s articles decide *where* a component lives and what it may touch; 500s articles decide how to build it well once it is there.

## Related Topics

- [Component Architecture & Design Patterns Overview](/500)
- [Monorepos & Workspaces](/805)
- [State Management Overview](/600)
- [Codebase Studies Overview](/codebase-studies-overview)

## References

- Martin Fowler, "Software Architecture Guide," martinfowler.com (maintained). https://martinfowler.com/architecture/
- Feature-Sliced Design team, "Welcome," feature-sliced.design (maintained). https://feature-sliced.design/
- Sam Newman, "Pattern: Backends For Frontends," samnewman.io (2015). https://samnewman.io/patterns/architectural/bff/
