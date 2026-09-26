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
│      (db.sessions, db.todos, db.customBackgrounds,     │
│       db.customPlaylists, db.dailyRollups, etc.)      │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐   ┌────────────────────────┐
│     In-Memory Cache       │   │    Append-Only Outbox  │
│   (Synchronous Reads)     │   │  (Sync Queue / Outbox) │
└─────────────┬─────────────┘   └───────────┬────────────┘
              │ Write-Behind                │ Pull / Push
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
| [`types.ts`](file:///D:/Projects/repos/cozify/src/services/db/types.ts) | Domain schemas (`SessionRecord`, `TodoItem`, `ThemeBackground`, `Playlist`, `DailyRollupRecord`, `AllTimeStatsRecord`), sync contracts, and provider interfaces. |
| [`indexed-db.ts`](file:///D:/Projects/repos/cozify/src/services/db/indexed-db.ts) | Dexie IndexedDB client, schema version migrations (V1 to V5), and async persistence adapter. |
| [`cache-layer.ts`](file:///D:/Projects/repos/cozify/src/services/db/cache-layer.ts) | High-speed in-memory map cache, asynchronous store initialization, debounced write-behind batching to IDB, and client-wide data reset on logout. |
| [`repositories.ts`](file:///D:/Projects/repos/cozify/src/services/db/repositories.ts) | Domain repositories for syncable entities and local analytics stores with specialized query methods. |
| [`sync-engine.ts`](file:///D:/Projects/repos/cozify/src/services/db/sync-engine.ts) | 4-Phase Pull-Before-Push synchronization engine with Last-Write-Wins (LWW) conflict resolution, outbox queue sanitization, and tombstone preservation. |
| [`index.ts`](file:///D:/Projects/repos/cozify/src/services/db/index.ts) | Main entry point re-exporting the `db` repository interface, `cacheManager`, `syncEngine`, and types. |

---

## 📦 Store Types: Syncable Entities vs. Local Derived Projections

To maintain clean data replication and avoid database lockups, stores are categorized into two types:

1. **Syncable Domain Entities** (`SyncableStoreName`):
   - `sessions`, `todos`, `customBackgrounds`, `customPlaylists`
   - Replicated bidirectionally with Supabase remote tables.
   - Operations generate append-only outbox mutations in `syncQueue`.
   - All rows include user scoping (`user_id`), logical clocks (`updatedAt`), and soft-deletion flags (`isDeleted`).

2. **Local Derived Projections**:
   - `dailyRollups`, `statsSummary`
   - Pre-aggregated client-side statistics generated on demand by `statsRollupEngine`.
   - Never queued for remote sync; instead, re-computed locally whenever sessions or tasks are updated.

---

## 🔄 4-Phase Pull-Before-Push Sync Protocol

When synchronizing with Supabase (automatically every 60 seconds, on reconnect, or via manual trigger):

1. **Phase 1: Inbound Delta Pull & Reconciliation**
   - Fetches remote updates where `updated_at > lastSyncedAt` (scoped by authenticated `user_id`, including tombstones `is_deleted = true`).
   - Reconciles with local records using **Last-Write-Wins (LWW)** based on timestamp metadata.
   - Updates in-memory caches and persists changes to IndexedDB.

2. **Phase 2: Local Promotion & Flush**
   - Promotes any unqueued offline data into the `syncQueue` outbox.
   - Flushes pending in-memory writes to IndexedDB.
   - Sanitizes outbox to purge invalid or legacy queue entries.

3. **Phase 3: Outbound Mutation Batch Push**
   - Batches outbound mutations (upserts or soft-delete tombstones) in chunks of 50.
   - Attaches `user_id` to each payload to satisfy Postgres Row Level Security (RLS).
   - Executes upserts against remote Supabase tables (`sessions`, `todos`, `custom_backgrounds`, `custom_playlists`).

4. **Phase 4: Outbox Eviction & UI Broadcast**
   - Removes acknowledged records from `syncQueue`.
   - Dispatches custom browser events (`cozify_remote_synced`, `cozify_stats_updated`) to notify all active React contexts and trigger UI re-renders.

---

## 🔔 Synchronization Events

| Event | Purpose |
| :--- | :--- |
| `cozify_sync_start` | Broadcast when a sync cycle begins (updates spinner/indicators in UI). |
| `cozify_remote_synced` | Broadcast when remote changes have been merged into local stores. |
| `cozify_stats_updated` | Broadcast when analytical rollups and achievements need re-calculation. |
| `cozify_sync_end` | Broadcast when the sync cycle finishes. |
