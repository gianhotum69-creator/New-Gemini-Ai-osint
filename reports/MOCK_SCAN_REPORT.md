# Codebase Mock, Placeholder & Todo Scan Audit

This document reports all detected instances of testing, demonstration keywords, placeholders, and mock fallbacks scanned across active project source files.

---

## Detected Occurrences

### 1. In File: `/src/App.tsx`

- **Line 544:** Visual mock-up card inside bot info configuration block.
- **Line 742:** UI disclaimer indicating scan-to-pay is a wallet recharge simulation:
  `No real money required in AI Studio mock simulation.`
- **Line 907:** User search criteria placeholder:
  `placeholder="telephone (+91), email address, license plate, or identifier..."`
- **Line 1147:** API Key naming input placeholder:
  `placeholder="e.g. Node-Terminal or Backup-API"`
- **Line 1306:** Admin provider API Key status placeholder:
  `placeholder="Secret masked on the server side"`
- **Line 1432:** Form control mapping parameter:
  `placeholder="Default label"`
- **Line 1447:** Form mapper field key name placeholder:
  `placeholder="e.g. carrier_name or risk_score"`
- **Line 1648:** Authentication modal email placeholder:
  `placeholder="name@example.com"`
- **Line 1661:** Authentication name placeholder:
  `placeholder="e.g. Node Operator"`
- **Line 1676:** Password placeholder layout:
  `placeholder="••••••••"`

---

### 2. In File: `/server.ts`

- **Line 293:** Simple dev credentials authentication note:
  `// Simple authentication for demonstration (no password verification required for seed accounts)`
- **Line 297:** Simple registration demonstration check:
  `// Dynamically register if user enters valid email for demonstration`
- **Line 726 - 728:** URL mapping dynamic parameters check:
  `// Interpolate query into URL if placeholder exists`
  `const hasPlaceholder = targetUrl.includes('{{query}}') || ...`
- **Line 778 - 779:** Native routing query injection:
  `// If there wasn't a placeholder in the URL, automatically append...`
- **Line 950 - 953:** Proxy failover validation fallback:
  `// Fallback to simulation ONLY if all providers fail AND we are querying a mock endpoint...`
  `const containsMockProvider = moduleProviders.some(p => p.url.includes('.intel') || ...)`
- **Line 1074:** Dynamic fallback generator function declaration:
  `function generateMockResponse(slug: string, query: string): any`
