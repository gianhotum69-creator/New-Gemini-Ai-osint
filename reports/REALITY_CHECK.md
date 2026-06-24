# REALITY CHECK: SOURCE CODE AUDIT & VERIFICATION REPORT
**Date:** 2026-06-24
**Verification Level:** Strict Static & Logic Analysis

---

## 1. Occurrences of Keywords

Below is every exact occurrence of the keywords `generateMockResponse`, `containsMockProvider`, `mock`, `simulation`, and `fallback` across the active files in the workspace (excluding build artifacts and `node_modules`).

### In `/server.ts`

- **Line 894:**
  ```typescript
  // Iterate over providers with automatic failover fallback
  ```
- **Line 950:**
  ```typescript
  // Fallback to simulation ONLY if all providers fail AND we are querying a mock endpoint (or during demo/testing if specified)
  ```
- **Line 952:**
  ```typescript
  const containsMockProvider = moduleProviders.some(p => p.url.includes('.intel') || p.url.includes('.gov') || p.url.includes('localhost'));
  ```
- **Line 953:**
  ```typescript
  if (containsMockProvider && ai) {
  ```
- **Line 981:**
  ```typescript
  console.error('AI simulation failover failed:', geminiErr);
  ```
- **Line 1074:**
  ```typescript
  function generateMockResponse(slug: string, query: string): any {
  ```

### In `/src/App.tsx`

- **Line 247:**
  ```typescript
  // Fund simulation
  ```
- **Line 571:**
  ```typescript
  {/* Visual mockup card inside the bot info */}
  ```
- **Line 769:**
  ```typescript
  <p className="text-[10px] text-slate-500 italic">No real money required in AI Studio mock simulation.</p>
  ```

---

## 2. Core Source Code Blocks

### Block A: `/api/gateway/search` Router & Failover / Simulation Pipeline
File Path: `/server.ts` (Lines 880 - 1005)

```typescript
  let rawData: any = null;
  let successfulProviderId = '';
  const errors: string[] = [];

  // Get active providers for this module
  const moduleProviders = mod.providers
    .map(pId => dbState.providers.find(p => p.id === pId))
    .filter((p): p is APIProvider => !!p && p.status === 'active')
    .sort((a, b) => a.priority - b.priority); // order by priority

  if (moduleProviders.length === 0) {
    return res.status(503).json({ error: 'No active upstream providers are configured for this module.' });
  }

  // Iterate over providers with automatic failover fallback
  for (const provider of moduleProviders) {
    try {
      // Log attempt in audit ledger
      dbState.auditLogs.unshift({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        userId: requestingUser.id,
        userEmail: requestingUser.email,
        action: 'GATEWAY_QUERY_ATTEMPT',
        details: `Executing proxy query on provider: ${provider.name} (URL: ${provider.url}, Target: "${query}")`,
        ipAddress: clientIp,
        timestamp: new Date().toISOString()
      });

      // Try executing real request
      rawData = await executeProviderRequest(provider, query, mod.slug);
      successfulProviderId = provider.id;
      
      // Success audit log
      dbState.auditLogs.unshift({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        userId: requestingUser.id,
        userEmail: requestingUser.email,
        action: 'GATEWAY_QUERY_SUCCESS',
        details: `Successfully completed query via provider ${provider.name}`,
        ipAddress: clientIp,
        timestamp: new Date().toISOString()
      });

      break; // Stop iterating, we found a working provider!
    } catch (err: any) {
      const errMsg = err.message || String(err);
      console.warn(`Upstream provider ${provider.name} failed: ${errMsg}`);
      errors.push(`${provider.name}: ${errMsg}`);

      // Log failure in audit ledger
      dbState.auditLogs.unshift({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        userId: requestingUser.id,
        userEmail: requestingUser.email,
        action: 'GATEWAY_QUERY_FAILOVER',
        details: `Provider ${provider.name} failed (${errMsg}). Activating automatic failover routing...`,
        ipAddress: clientIp,
        timestamp: new Date().toISOString()
      });

      // If this provider has a configured failoverProviderId that is not in the current list, try adding it to the end of our retry list
      if (provider.failoverProviderId && !moduleProviders.some(p => p.id === provider.failoverProviderId)) {
        const failoverProv = dbState.providers.find(p => p.id === provider.failoverProviderId && p.status === 'active');
        if (failoverProv) {
          moduleProviders.push(failoverProv);
        }
      }
    }
  }

  // Fallback to simulation ONLY if all providers fail AND we are querying a mock endpoint (or during demo/testing if specified)
  if (!rawData) {
    const containsMockProvider = moduleProviders.some(p => p.url.includes('.intel') || p.url.includes('.gov') || p.url.includes('localhost'));
    if (containsMockProvider && ai) {
      try {
        dbState.auditLogs.unshift({
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          userId: requestingUser.id,
          userEmail: requestingUser.email,
          action: 'GATEWAY_AI_SIMULATION',
          details: `Unresolved upstream hosts detected. Engaging secure sandbox response proxy transformation.`,
          ipAddress: clientIp,
          timestamp: new Date().toISOString()
        });

        const prompt = `You are a high-fidelity OSINT intelligence provider API proxy gateway.
Generate a raw provider JSON response matching the OSINT lookup module "${mod.name}" (Slug: "${mod.slug}") for target query value: "${query}".
Output ONLY valid JSON representing the response of a top-tier cybersecurity provider API containing comprehensive realistic parameters such as name, location, address history, phone info, relative links, cyber security risks, spam ratings, linked account structures.
Ensure the JSON contains key properties: "owner_name", "carrier_name", "city_location", "country", "risk_score", "compromised_leaks", "full_name", "domain_age", "breaches_found", "spam_score", "trade_name", "legal_name", "vehicle_model", "insurance_status", etc.
Keep the JSON strictly conformant, realistic, and highly comprehensive.`;

        const geminiResult = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const responseText = geminiResult.text || '{}';
        const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        rawData = JSON.parse(cleanedJson);
        successfulProviderId = moduleProviders[0].id;
      } catch (geminiErr) {
        console.error('AI simulation failover failed:', geminiErr);
      }
    }
  }

  // If STILL no rawData, return 502 Bad Gateway
  if (!rawData) {
    dbState.auditLogs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: requestingUser.id,
      userEmail: requestingUser.email,
      action: 'GATEWAY_QUERY_FAILED_ALL',
      details: `All configured gateway providers failed for query "${query}". Errors: ${errors.join(' | ')}`,
      ipAddress: clientIp,
      timestamp: new Date().toISOString()
    });
    
    saveDatabase(dbState);

    return res.status(502).json({
      error: `All active upstream gateways returned operational errors. Failover list exhausted.`,
      details: errors,
      tip: `Ensure your active API providers have a valid, reachable URL configured in 'Admin -> Feeds'.`
    });
  }
```

---

### Block B: Upstream HTTP Request Execution Engine
File Path: `/server.ts` (Lines 723 - 816)

```typescript
async function executeProviderRequest(provider: APIProvider, query: string, moduleSlug: string): Promise<any> {
  let targetUrl = provider.url;
  
  // Interpolate query into URL if placeholder exists
  const hasPlaceholder = targetUrl.includes('{{query}}') || targetUrl.includes('{query}') || targetUrl.includes(':query');
  if (hasPlaceholder) {
    targetUrl = targetUrl
      .replace(/{{query}}/g, encodeURIComponent(query))
      .replace(/{query}/g, encodeURIComponent(query))
      .replace(/:query/g, encodeURIComponent(query));
  }

  // Construct request headers
  const reqHeaders: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'OSINT-Proxy-Gateway/1.0.0'
  };

  if (provider.headers) {
    Object.entries(provider.headers).forEach(([k, v]) => {
      reqHeaders[k] = v
        .replace(/{{query}}/g, query)
        .replace(/{query}/g, query);
    });
  }

  // Inject API key into headers if configured and not already set
  if (provider.apiKey) {
    const hasAuth = Object.keys(reqHeaders).some(k => k.toLowerCase() === 'authorization' || k.toLowerCase() === 'x-api-key');
    if (!hasAuth) {
      reqHeaders['X-API-Key'] = provider.apiKey;
    }
  }

  // Interpolate parameters
  const params: Record<string, string> = {};
  if (provider.parameters) {
    Object.entries(provider.parameters).forEach(([k, v]) => {
      params[k] = v
        .replace(/{{query}}/g, query)
        .replace(/{query}/g, query);
    });
  }

  // Parse targetUrl to build full URL with query parameters
  let finalUrlString = targetUrl;
  if (!finalUrlString.startsWith('http://') && !finalUrlString.startsWith('https://')) {
    finalUrlString = 'https://' + finalUrlString;
  }

  const urlObj = new URL(finalUrlString);
  Object.entries(params).forEach(([k, v]) => {
    urlObj.searchParams.set(k, v);
  });

  // If there wasn't a placeholder in the URL, automatically append a standard query parameter
  if (!hasPlaceholder) {
    if (moduleSlug === 'phone-lookup') {
      urlObj.searchParams.set('phone', query);
    } else if (moduleSlug === 'email-lookup') {
      urlObj.searchParams.set('email', query);
    } else if (moduleSlug === 'gst-lookup') {
      urlObj.searchParams.set('gst', query);
    } else if (moduleSlug === 'vehicle-lookup') {
      urlObj.searchParams.set('vehicle', query);
    } else {
      urlObj.searchParams.set('q', query);
    }
  }

  const timeout = provider.timeoutMs || 4000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(urlObj.toString(), {
      method: 'GET',
      headers: reqHeaders,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Upstream returned HTTP status ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return json;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}
```

---

### Block C: Standalone Mock Generator (Dangling Function)
File Path: `/server.ts` (Lines 1074 - 1118)

```typescript
function generateMockResponse(slug: string, query: string): any {
  if (slug === 'phone-lookup') {
    return {
      owner_name: 'Alexander Vostov',
      carrier_name: 'Global Telecom Corp',
      city_location: 'Munich',
      country: 'Germany',
      risk_score: 18,
      compromised_leaks: 'LinkedIn (2021 Breach), DarkWeb Leak #3202',
      original_raw_line: `TEL-ROUT-${query}-LIVE`
    };
  } else if (slug === 'email-lookup') {
    return {
      full_name: 'Samantha Wright',
      domain_age: '8 Years, 4 Months',
      breaches_found: 'Adobe (2013), Canva (2019), Dropbox (2016)',
      spam_score: 'Low (0.02 Rating)',
      social_links: 'GitHub, Twitter, LinkedIn'
    };
  } else if (slug === 'gst-lookup') {
    return {
      trade_name: 'KRONOS INTEL LABS',
      legal_name: 'KRONOS CONSULTANCY SERVICES PRIVATE LIMITED',
      registration_date: '14-Sep-2018',
      business_nature: 'Information Security Consulting Services',
      address_location: 'Cyber Gateway Tower B, Bangalore, India'
    };
  } else if (slug === 'vehicle-lookup') {
    return {
      vehicle_model: 'Audi R8 Coupe V10',
      owner_name: 'Marcus K. Vance',
      fuel_type: 'Petrol',
      engine_number: 'EP_V10_77390X',
      insurance_status: 'Active (HDFC ERGO Premium Paid)',
      road_tax_expiry: '31-Dec-2028'
    };
  } else {
    return {
      owner_name: 'Anonymous Target',
      risk_score: 50,
      details: 'Gateway mapped default output for dynamic registry lookup.',
      target_value: query
    };
  }
}
```

---

## 3. Can `/api/gateway/search` Return Simulated Data?

**Answer: Yes.**

### Verification Logic:
1. When a query is made, the route handler iterates over the configured `moduleProviders` for that module.
2. If **all real `fetch` calls fail** (e.g., throwing DNS resolution errors, offline connection states, or HTTP 4xx/5xx errors):
3. The server checks if `!rawData` is true, indicating no upstream provider succeeded.
4. It performs a checks on the failover array (Line 952):
   `const containsMockProvider = moduleProviders.some(p => p.url.includes('.intel') || p.url.includes('.gov') || p.url.includes('localhost'));`
5. If **any** provider URL is a mock host containing `.intel`, `.gov`, or `localhost` (which is true for all 4 default-seeded providers) **AND** the Gemini API environment key is loaded (`process.env.GEMINI_API_KEY` is present), the gateway invokes `ai.models.generateContent` with `gemini-2.5-flash` using a high-fidelity structuring prompt.
6. This generated JSON response is parsed into `rawData` and mapped dynamically through the schema filters, returning simulated data to the client rather than an error payload.

---

## 4. Are Provider URLs Real Production Endpoints?

**Answer: No.**

### Verification Logic:
The four default-seeded upstream feed URLs in the system database configuration are:
1. `https://api.telephony.intel/v1/lookup` (Unregistered TLD `.intel`)
2. `https://backup.telephony.intel/lookup` (Unregistered TLD `.intel`)
3. `https://api.gst.registry.gov/taxpayers` (Fictional path on government domain space)
4. `https://api.vahan.intel/vehicles` (Unregistered TLD `.intel`)

These do not resolve via normal public DNS nameservers and do not point to commercial, operational, live third-party intelligence provider endpoints. They act as trigger/mock nodes designed to automatically trigger the secure sandbox simulation fallback.

---

## 5. Hardcoded URL Mappings in Code

Below is the list of all hardcoded external host addresses specified in the source files:

- **`/server.ts` (Line 58):** `https://api.telephony.intel/v1/lookup`
- **`/server.ts` (Line 59):** `https://backup.telephony.intel/lookup`
- **`/server.ts` (Line 60):** `https://api.gst.registry.gov/taxpayers`
- **`/server.ts` (Line 61):** `https://api.vahan.intel/vehicles`
- **`/server.ts` (Line 240):** `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=osintproxy@upi&pn=OSINT%20Proxy`
- **`/server.ts` (Line 473):** `https://api.gateway.provider/v1` (Default creation URL placeholder)
- **`/src/App.tsx` (QR Code render):** `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=osintproxy@upi&pn=OSINT%20Proxy`

---

## 6. List of `fetch()` Calls in the Codebase

### In Backend (`/server.ts`)

- **Line 798:**
  ```typescript
  const response = await fetch(urlObj.toString(), {
    method: 'GET',
    headers: reqHeaders,
    signal: controller.signal
  });
  ```

### In Frontend (`/src/App.tsx`)

- **Line 82:** `fetch(`/api/reports/${selectedReportFile}`)`
- **Line 129:** `fetch('/api/auth/session')`
- **Line 142:** `fetch('/api/user/keys')`
- **Line 145:** `fetch('/api/user/history')`
- **Line 148:** `fetch('/api/user/transactions')`
- **Line 151:** `fetch('/api/admin/announcements')`
- **Line 154:** `fetch('/api/admin/payment-methods')`
- **Line 157:** `fetch('/api/admin/popups')`
- **Line 170:** `fetch('/api/admin/providers')`
- **Line 173:** `fetch('/api/admin/modules')`
- **Line 176:** `fetch('/api/admin/audit-logs')`
- **Line 179:** `fetch('/api/admin/health')`
- **Line 187:** `fetch('/api/admin/health')`
- **Line 197:** `fetch('/api/auth/login', { ... })`
- **Line 220:** `fetch('/api/auth/register', { ... })`
- **Line 240:** `fetch('/api/auth/logout', { method: 'POST' })`
- **Line 251:** `fetch('/api/user/wallet/add-funds', { ... })`
- **Line 271:** `fetch('/api/user/keys', { ... })`
- **Line 287:** `fetch(`/api/user/keys/${id}`, { method: 'DELETE' })`
- **Line 304:** `fetch('/api/gateway/search', { ... })`
- **Line 312:** `fetch('/api/user/wallet')`
- **Line 331:** `fetch(`/api/admin/modules/${editingModule.id}`, { ... })`
- **Line 391:** `fetch(`/api/admin/providers/${editingProvider.id}`, { ... })`

---

## 7. Audit Conclusion & Declarations

```
REAL API ONLY = NO

MOCK RESPONSE POSSIBLE = YES
```
