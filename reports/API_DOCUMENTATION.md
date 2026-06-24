# OSINT Proxy Gateway API Documentation
**Proxy Gateway URL:** `https://ais-dev-wd5i442myaatzhmtdwlp5e-970685987293.asia-east1.run.app/api/gateway/search`

---

## 1. Authentication Method
The OSINT Proxy Gateway supports two authorization methods:

### Method A: Session-based Auth (For Browser App Users)
- **Header:** Sent automatically via HTTP cookies containing the active session information.

### Method B: Token-based Auth (For External Developer Integrations)
- **Header:** `X-Platform-API-Key`
- **Format:** `op_live_xxxxxxxxxxxxxxxx` (Can be generated via the **Developer Keys** tab in the Dashboard).

---

## 2. API Endpoints Reference

### 2.1 Search Intelligence Query (Proxy Gateway)
- **Method:** `POST`
- **Route:** `/api/gateway/search`
- **Authentication:** Token-based or active browser session.
- **Description:** Central ingress endpoint that accepts query criteria, checks daily quotas, matches active upstream feed providers, executes requests with automatic failover, and dynamically maps responses before outputting.

#### Request Payload Example:
```json
{
  "moduleSlug": "phone-lookup",
  "query": "+919876543210"
}
```

#### Successful Output Example:
```json
{
  "moduleName": "Phone Intelligence",
  "moduleSlug": "phone-lookup",
  "query": "+919876543210",
  "creditsDeducted": 1,
  "executionTimeMs": 285,
  "providerUsed": "Telephony-Intell-A",
  "data": {
    "Identity Data": {
      "Registered Owner": "Nikhil Sharma",
      "Network Carrier": "Reliance Jio"
    },
    "Geographic Routing": {
      "Identified Location": "Mumbai, Maharashtra",
      "Country": "India"
    },
    "Cyber Threat Intel": {
      "Threat Index (0-100)": 14,
      "Associated Data Leaks": "None detected in latest breaches."
    }
  }
}
```

---

### 2.2 Developer Keys Configuration
- **Method:** `POST`
- **Route:** `/api/user/keys`
- **Payload:** `{"name": "My Production Server"}`
- **Response:**
```json
{
  "id": "key_2u87cx",
  "name": "My Production Server",
  "key": "op_live_ab81c72x9900f892",
  "status": "active",
  "createdAt": "2026-06-24T09:12:00.000Z",
  "usedQueries": 0,
  "limitQueries": 1000
}
```

---

### 2.3 Wallet & Funds System
- **Method:** `POST`
- **Route:** `/api/user/wallet/add-funds`
- **Payload:** `{"amount": 100}`
- **Response:**
```json
{
  "success": true,
  "newBalance": 110,
  "transaction": {
    "id": "tx_1719220000000",
    "amountUSD": 10,
    "creditsAdded": 100,
    "type": "recharge",
    "timestamp": "2026-06-24T09:15:00.000Z"
  }
}
```
