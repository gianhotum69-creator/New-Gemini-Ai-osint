# Code Audit Report
**Date:** 2026-06-24
**Auditor:** AI Platform Security & Quality Audit Engine

This document provides a highly detailed, evidence-based audit of all core backend and frontend features implemented within the OSINT Proxy Gateway.

---

## 1. Database Schema
The server relies on a structured, file-persisted JSON schema (`DatabaseSchema`) managed in memory and synced to `/osint_db.json`.

```typescript
// Located in /server.ts
interface DatabaseSchema {
  users: User[];
  plans: Plan[];
  providers: APIProvider[];
  modules: SearchModule[];
  apiKeys: CustomAPIKey[];
  searchLogs: SearchLog[];
  announcements: Announcement[];
  menus: MenuConfig[];
  popups: SystemPopup[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  paymentMethods: any[];
}
```

---

## 2. Feature Implementation Details

### Feature A: Provider Manager
- **File Path:** `/server.ts` & `/src/App.tsx`
- **Functions:**
  - Server-side persistence via `saveDatabase(dbState)`
  - Endpoint mappings and status mutations inside `/api/admin/providers` endpoint group.
- **Routes:**
  - `GET /api/admin/providers` - Retrieves all configured feeds.
  - `POST /api/admin/providers` - Registers a new upstream provider.
  - `PUT /api/admin/providers/:id` - Modifies provider parameters, URLs, API keys, and priority.
  - `DELETE /api/admin/providers/:id` - Deletes a provider from the database.

### Feature B: Dynamic Response Mapper
- **File Path:** `/server.ts` (lines 780 - 810)
- **Functions:** Custom transformation logic within `/api/gateway/search` that reads the module's `responseMapping` (`showFields`, `renameFields`, `groupFields`) and transforms raw JSON output into categorized data groups.
- **Routes:**
  - `POST /api/gateway/search`

### Feature C: Credit System & Plan Quotas
- **File Path:** `/server.ts`
- **Functions:** Checks credit cost per lookup module and subtracts from the user's wallet. Validates daily limits based on user plan subscription level.
- **Routes:**
  - `GET /api/user/wallet` - Reads active user wallet balance.
  - `POST /api/user/wallet/add-funds` - Simulates payment to recharge balance.
  - `POST /api/gateway/search` - Deducts credits on successful execution and validates daily limits.

### Feature D: Audit Logs
- **File Path:** `/server.ts`
- **Functions:** Automatic logger that appends security and runtime events (e.g., `GATEWAY_QUERY_ATTEMPT`, `GATEWAY_QUERY_SUCCESS`, `GATEWAY_QUERY_FAILOVER`, `GATEWAY_QUERY_FAILED_ALL`) into the audit log ledger with user context and timestamps.
- **Routes:**
  - `GET /api/admin/audit-logs` - Fetches log history for administrators.

### Feature E: Admin Panel & User Management
- **File Path:** `/server.ts` & `/src/App.tsx` (Admin dashboard module)
- **Functions:** Admin middleware validation, list and edit users, switch roles, change user active credit balance, and modify active OSINT search modules.
- **Routes:**
  - `GET /api/admin/users` - Fetch user profiles.
  - `PUT /api/admin/users/:id` - Modify user role/credits/plan.
  - `GET /api/admin/health` - Check physical memory, disk, and database integrity.

### Feature F: Custom API Token Manager
- **File Path:** `/server.ts`
- **Functions:** Generate cryptographic-like unique custom developer tokens (`op_live_...`) authorizing users to trigger proxy gateways externally.
- **Routes:**
  - `GET /api/user/keys` - Fetches the developer's keys.
  - `POST /api/user/keys` - Generates a new API token.
  - `DELETE /api/user/keys/:id` - Revokes and deletes a key.

### Feature G: Gateway Analytics Engine
- **File Path:** `/server.ts`
- **Functions:** Compute aggregate totals of queries, success/failure counts, daily query volumes, popular modules, and individual provider success rates.
- **Routes:**
  - `GET /api/admin/analytics` - Retrieves computed statistics for the Admin Dashboard.

### Feature H: Backup System
- **File Path:** `/server.ts` (lines 830 - 850)
- **Functions:** Packs and serializes the entire JSON state archive and sends it as an attachment payload for safe administration downloads.
- **Routes:**
  - `GET /api/admin/backups/download` - Downloads the backup.

### Feature I: Rate Limiting
- **File Path:** `/server.ts`
- **Functions:** Dynamic in-memory IP tracker rejecting requests exceeding 30 requests per minute from a single source address, alongside daily plan-based execution checks.
- **Routes:**
  - Checked natively inside `POST /api/gateway/search`

### Feature J: Provider Failover & Real API Execution
- **File Path:** `/server.ts`
- **Functions:**
  - `executeProviderRequest(provider, query, moduleSlug)`: Formulates dynamic HTTP calls with headers, tokens, query parameters, and timeout abort controllers.
  - Failover Loop: Cycles through active providers registered under the active module, catching failures and activating alternative routing automatically.
- **Routes:**
  - Checked natively inside `POST /api/gateway/search`
