# System Architecture & Technical Documentation

## 1. System Overview

The **Real-time Data Aggregation Service** is a high-throughput middleware layer designed to bridge the gap between public Decentralized Exchange (DEX) APIs and frontend clients.

It solves the "N+1 Scalability Problem": instead of 10,000 clients hitting DexScreener individually (triggering rate limits), this service queries once and broadcasts the result to all 10,000 clients simultaneously.

---

## 2. Core Design Decisions

### A. The "Fan-In / Fan-Out" Aggregation Pattern
**Problem:** Public APIs like DexScreener have strict rate limits (~300 req/min). A direct client-to-API architecture scales poorly; as user count grows, API quotas are exhausted immediately.

**Solution:**
* **Fan-In (Aggregation):** The service ingests data from multiple upstream sources (DexScreener, GeckoTerminal) into a single normalization pipeline.
* **Fan-Out (Broadcasting):** The service pushes a single merged dataset to an unlimited number of connected WebSocket clients.
* **Impact:** The load on external APIs remains constant (approx. 6 requests/minute) regardless of whether the system has 1 active user or 100,000 active users.

### B. Recursive Polling vs. Interval
**Decision:** Implemented a **Recursive Polling** mechanism using `setTimeout` instead of standard `setInterval`.

* **Why not `setInterval`?** `setInterval` fires blindly. If an upstream API hangs for 25s but the interval is set to 20s, requests will pile up, leading to the "Thundering Herd" problem and potential self-DDoS.
* **The Recursive Fix:** The poller waits for the previous `fetchAndCache()` operation to complete (success or fail) *before* scheduling the next timer. This guarantees strictly sequential execution and automatic backpressure handling.

### C. Data Normalization & Merging Strategy
Data arrives in disparate shapes from different providers. We normalize everything into a unified `Token` interface.

**The Merging Algorithm (`Map<Address, Token>`):**
1.  **Primary Pass:** Iterate through DexScreener data. Map key = `token_address`.
2.  **Enrichment Pass:** Iterate through GeckoTerminal data.
    * **If Key Exists:** Merge the entry. We prioritize DexScreener for price data (higher granularity on Solana) but append GeckoTerminal as a data source.
    * **If Key Missing:** Add as a new unique entry.
* **Result:** A deduplicated list where tokens present on multiple DEXs are represented as single, rich objects.

### D. Application-Level Caching
**Decision:** Implemented a clean abstraction layer (`cache.ts`) for data persistence.
* **Current State:** Uses an In-Memory singleton object (Mock Mode) for the MVP.
* **Production Readiness:** The abstraction interface follows standard `get/set` patterns. Swapping the in-memory object for a real **Redis** client requires changing only 1 line of code. This ensures the application is horizontally scalable across multiple server instances.

---

## 3. API Specification

### REST API (`HTTP`)
Designed for the initial page load, search, and SEO-friendly data access.

**Endpoint:** `GET /tokens`

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `limit` | `number` | `20` | Limits the result set size. |
| `cursor` | `string` | `null` | The `token_address` to start after (O(1) pagination). |
| `sortBy` | `string` | - | `volume_sol` \| `price_1hr_change` |
| `sortOrder` | `string` | `desc` | `asc` \| `desc` |

### WebSocket API (`Socket.io`)
Designed for live, low-latency price updates.

* **Connection URL:** `ws://<your-domain>/`
* **Event:** `token_updates`
* **Payload:** JSON Array of `AggregatedToken` objects.
* **Frequency:** Pushed every 20 seconds (synchronized with the Poller).

---

## 4. Error Handling & Resilience

1.  **Partial Upstream Failures:** The aggregator uses `Promise.all` with individual error catching. If GeckoTerminal returns a `500 Error`, the system logs the warning but continues to serve DexScreener data transparently. The user experience is not degraded.
2.  **Circular Dependencies:** The architecture strictly separates the `Socket.io` server instance from the aggregation logic using dependency injection (`initAggregationService`). This prevents module loading loops common in Node.js.
3.  **Type Safety:** The codebase is written in strict TypeScript, ensuring that missing fields or malformed API responses are caught at compile time or gracefully handled during normalization.


### High-Level Architecture

graph TD
    DexS[DexScreener API]
    Gecko[GeckoTerminal API]
    Aggregator[Aggregation Service]
    Cache[(In-Memory Cache)]
    REST[REST API]
    WS[WebSocket Server]
    Frontend[Frontend App]

    DexS -- "HTTP GET (20s)" --> Aggregator
    Gecko -- "HTTP GET (20s)" --> Aggregator
    Aggregator -- "1. Normalize & Merge" --> Cache
    
    Cache -- "Read Data" --> REST
    Cache -- "Read Data" --> WS
    
    REST -- "Pull Data" --> Frontend
    WS -- "Push Data" --> Frontend