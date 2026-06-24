# Upstream Feed & Provider Configuration Report

This document reports the live configurations governing routing intelligence, mappings, translation protocols, and failover pathways.

---

## 1. Provider Manager Configurations

The platform persists upstream hosts with priorities, retry configurations, timeouts, and authorization headers:

```json
[
  {
    "id": "prov_telephony_a",
    "name": "Telephony-Intell-A",
    "url": "https://api.telephony.intel/v1/lookup",
    "apiKey": "sec_tel_99x82j",
    "headers": { "X-Auth-Token": "prov-secret-token" },
    "parameters": { "format": "json" },
    "timeoutMs": 3000,
    "retries": 2,
    "priority": 1,
    "status": "active"
  },
  {
    "id": "prov_telephony_b",
    "name": "Telephony-Intell-B (Failover)",
    "url": "https://backup.telephony.intel/lookup",
    "apiKey": "sec_tel_backup_3",
    "headers": { "Authorization": "Bearer backup-secret" },
    "parameters": {},
    "timeoutMs": 5000,
    "retries": 3,
    "priority": 2,
    "status": "active"
  }
]
```

---

## 2. Endpoint Mappings & Argument Interpolation

The gateway translates queries via dual-routing mechanisms:
1. **Explicit Placeholder Interpolation:** Recognizes `{{query}}`, `{query}`, and `:query` inside feed URLs or configurations, rendering clean runtime URLs automatically.
2. **Implicit Fallback Query Injection:** If no placeholder tags are declared, the engine appends module-specific params (e.g., `?phone=...`, `?email=...`, `?gst=...`) dynamically.

---

## 3. Dynamic Response Mapper Configuration

Each lookup module governs its output layout using field filters and renaming dicts:

```json
"responseMapping": {
  "showFields": ["owner_name", "carrier_name", "city_location", "country", "risk_score", "compromised_leaks"],
  "renameFields": {
    "owner_name": "Registered Owner",
    "carrier_name": "Network Carrier",
    "city_location": "Identified Location",
    "risk_score": "Threat Index (0-100)"
  },
  "groupFields": {
    "Identity Data": ["owner_name", "carrier_name"],
    "Geographic Routing": ["city_location", "country"]
  }
}
```

---

## 4. Failover & Routing Cascade Architecture

When a search is initiated:
1. Providers linked to the active module are sorted based on their `priority` ascending.
2. The gateway initiates the primary feed execution with an configured `timeoutMs` AbortController.
3. If the host returns an error status (e.g., `5xx`, socket timeout, or HTTP offline status), a `GATEWAY_QUERY_FAILOVER` audit record is registered, and the loop falls back immediately to secondary priority endpoints or specified failover hosts.
