# Cozify Database & Offline-First Sync Architecture

This directory houses Cozify's client-side database, cache layers, outbox queue, and multi-device synchronization engine.

---

## 🏛️ Architecture Overview

Cozify uses a **3-Tier Storage Architecture** designed for zero-latency local interactions and reliable offline-first cloud synchronization:

```
┌────────────────────────────────────────────────────────┐
│                   UI & React Contexts                  │
│       (TimerContext, TodoContext, ThemeContext, etc.)   │
└───────────────────────────┬────────────────────────────┘
                            │ Read / Write
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Unified DB Facade                    │
│      (db.sessions, db.todos, db.customBackgrounds)      │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐   ┌────────────────────────┐
│     In-Memory Cache       │   │    Append-Only Outbox  │
│   (Synchronous Reads)     │   │      (Sync Queue)      │
└─────────────┬─────────────┘   └───────────┬────────────┘
              │ Write-Behind                │ Push / Pull
              ▼                             ▼
┌───────────────────────────┐   ┌────────────────────────┐
│      IndexedDB (Dexie)    │   │   Remote Sync Engine   │
│   (Persistent Storage)    │   │  (Supabase Provider)   │
└───────────────────────────┘   └────────────────────────┘
```

---

## 📁 File Structure & Responsibilities

| File | Purpose |
| :--- | :--- |
| [`types.ts`](file:///D:/Projects/repos/cozify/src/services/db/types.ts) | Domain schemas (`SessionRecord`, `TodoItem`, `DailyRollupRecord`), sync contracts, and provider interfaces. |
| [`indexed-db.ts`](file:///D:/Projects/repos/cozify/src/services/db/indexed-db.ts) | Dexie IndexedDB client, schema migrations (V1 to V5), and async persistence adapter. |
| [`cache-layer.ts`](file:///D:/Projects/repos/cozify/src/services/db/cache-layer.ts) | High-speed in-memory map cache, debounced write-behind batching to IDB, and client-wide data reset on logout. |
| [`repositories.ts`](file:///D:/Projects/repos/cozify/src/services/db/repositories.ts) | Domain repositories (`sessions`, `todos`, `customBackgrounds`, `customPlaylists`, etc.) with specialized query methods. |
| [`sync-engine.ts`](file:///D:/Projects/repos/cozify/src/services/db/sync-engine.ts) | 4-Phase Pull-Before-Push synchronization engine with Last-Write-Wins (LWW) conflict resolution and tombstone preservation. |
| [`index.ts`](file:///D:/Projects/repos/cozify/src/services/db/index.ts) | Main entry point re-exporting the `db` repository interface, `cacheManager`, `syncEngine`, and types. |

---

## 🔄 4-Phase Sync Protocol

When synchronizing with Supabase:

1. **Phase 1: Local Promotion & Flush**
   - Ensures any unqueued offline data is promoted into the `syncQueue` outbox and pending writes are flushed to IndexedDB.
2. **Phase 2: Delta Pull & Reconciliation**
   - Fetches remote updates where `updated_at > lastSyncedAt` (including tombstones `is_deleted = true`).
   - Reconciles with local records using **Last-Write-Wins (LWW)** based on timestamp metadata.
3. **Phase 3: Outbound Mutation Batch Push**
   - Batches local mutations (upserts or tombstones) and sends them to the remote provider.
4. **Phase 4: Outbox Eviction & UI Broadcast**
   - Removes acknowledged records from `syncQueue` and dispatches `cozify_remote_synced` to update all active React contexts.
