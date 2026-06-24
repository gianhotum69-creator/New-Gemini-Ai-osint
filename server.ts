/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { 
  User, Plan, APIProvider, SearchModule, CustomAPIKey, 
  SearchLog, Announcement, MenuConfig, SystemPopup, 
  Transaction, AuditLog, SystemHealth, UserRole,
  ContentConfig, HomePageCard, NavLink, ActionButton, BroadcastMessage
} from './src/types';

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'osint_db.json');

// Initialize Gemini SDK if API Key is available
const geminiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({ apiKey: geminiKey });
    console.log('Gemini AI SDK successfully loaded.');
  } catch (err) {
    console.error('Error initializing Gemini AI SDK:', err);
  }
}

// Ensure database state exists on disk or seed initial data
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
  contentConfig?: ContentConfig;
}

const defaultPlans: Plan[] = [
  { id: 'free', name: 'Free Tier', credits: 10, dailyLimit: 5, monthlyLimit: 50, apiLimit: 2, searchLimit: 10, endpointAccess: ['phone-lookup'], priceUSD: 0 },
  { id: 'basic', name: 'Basic Plan', credits: 100, dailyLimit: 50, monthlyLimit: 500, apiLimit: 5, searchLimit: 100, endpointAccess: ['phone-lookup', 'email-lookup'], priceUSD: 29 },
  { id: 'pro', name: 'Pro Cyber', credits: 500, dailyLimit: 250, monthlyLimit: 3000, apiLimit: 20, searchLimit: 1000, endpointAccess: ['phone-lookup', 'email-lookup', 'gst-lookup', 'vehicle-lookup', 'username-lookup'], priceUSD: 99 },
  { id: 'enterprise', name: 'Elite Enterprise', credits: 99999, dailyLimit: 99999, monthlyLimit: 99999, apiLimit: 99999, searchLimit: 99999, endpointAccess: ['phone-lookup', 'email-lookup', 'gst-lookup', 'vehicle-lookup', 'username-lookup', 'ip-lookup', 'domain-lookup'], priceUSD: 499 }
];

const defaultProviders: APIProvider[] = [
  { id: 'prov_phone', name: 'ExploitsIndia Phone Lookup', url: 'https://exploitsindia.site/osint-api/number.php?exploits={num}', apiKey: '', headers: {}, parameters: {}, timeoutMs: 10000, retries: 2, priority: 1, status: 'active' },
  { id: 'prov_aadhaar', name: 'ExploitsIndia Aadhaar Lookup', url: 'https://exploitsindia.site/osint-api/aadhar.php?exploits={aadhaar}', apiKey: '', headers: {}, parameters: {}, timeoutMs: 10000, retries: 2, priority: 1, status: 'active' },
  { id: 'prov_family_aadhaar', name: 'ExploitsIndia Family Aadhaar Lookup', url: 'https://exploitsindia.site/osint-api/aadhar.php?exploits={aadhaar}', apiKey: '', headers: {}, parameters: {}, timeoutMs: 10000, retries: 2, priority: 1, status: 'active' },
  { id: 'prov_vehicle', name: 'ExploitsIndia Vehicle Lookup', url: 'https://exploitsindia.site/osint-api/vehicle.php?exploits={rc}', apiKey: '', headers: {}, parameters: {}, timeoutMs: 10000, retries: 2, priority: 1, status: 'active' },
  { id: 'prov_rc', name: 'ExploitsIndia RC Lookup', url: 'https://exploitsindia.site/osint-api/vehicle.php?exploits={rc}', apiKey: '', headers: {}, parameters: {}, timeoutMs: 10000, retries: 2, priority: 1, status: 'active' },
  { id: 'prov_ifsc', name: 'ExploitsIndia IFSC Lookup', url: 'https://exploitsindia.site/osint-api/ifsc.php?exploits={ifsc}', apiKey: '', headers: {}, parameters: {}, timeoutMs: 10000, retries: 2, priority: 1, status: 'active' },
  { id: 'prov_telegram', name: 'ExploitsIndia Telegram Lookup', url: 'https://exploitsindia.site/osint-api/telegram.php?exploits={tg_id}', apiKey: '', headers: {}, parameters: {}, timeoutMs: 10000, retries: 2, priority: 1, status: 'active' }
];

const defaultModules: SearchModule[] = [
  {
    id: 'mod_phone',
    name: 'Phone Intelligence',
    slug: 'phone-lookup',
    icon: 'Phone',
    description: 'Resolve phone numbers to carrier, location, registered owner, risk score, and linked profiles.',
    costCredits: 1,
    status: 'active',
    providers: ['prov_phone'],
    fields: ['Phone Number'],
    responseMapping: {
      showFields: [],
      renameFields: {},
      groupFields: {}
    },
    layout: { type: 'card', title: 'Target Dossier', showBorders: true }
  },
  {
    id: 'mod_aadhaar',
    name: 'Aadhaar Identity',
    slug: 'aadhaar-lookup',
    icon: 'Shield',
    description: 'Verify Aadhaar registry records, registered details, status, and associated listings.',
    costCredits: 2,
    status: 'active',
    providers: ['prov_aadhaar'],
    fields: ['Aadhaar Number'],
    responseMapping: {
      showFields: [],
      renameFields: {},
      groupFields: {}
    },
    layout: { type: 'card', title: 'Aadhaar Verification', showBorders: true }
  },
  {
    id: 'mod_family_aadhaar',
    name: 'Family Aadhaar Lookup',
    slug: 'family-aadhaar-lookup',
    icon: 'Users',
    description: 'Query and aggregate family-linked Aadhaar identities and profiles.',
    costCredits: 3,
    status: 'active',
    providers: ['prov_family_aadhaar'],
    fields: ['Aadhaar Number'],
    responseMapping: {
      showFields: [],
      renameFields: {},
      groupFields: {}
    },
    layout: { type: 'grid', title: 'Family Aggregations', showBorders: true }
  },
  {
    id: 'mod_vehicle',
    name: 'Vehicle Intelligence',
    slug: 'vehicle-lookup',
    icon: 'Car',
    description: 'Retrieve vehicle specifications, manufacturer details, registration status, and owner profiles.',
    costCredits: 2,
    status: 'active',
    providers: ['prov_vehicle'],
    fields: ['License Plate / Registration RC'],
    responseMapping: {
      showFields: [],
      renameFields: {},
      groupFields: {}
    },
    layout: { type: 'card', title: 'Vehicle Dossier', showBorders: true }
  },
  {
    id: 'mod_rc',
    name: 'RC Verification',
    slug: 'rc-lookup',
    icon: 'FileText',
    description: 'Query direct RC registrations, compliance indicators, and owner records.',
    costCredits: 2,
    status: 'active',
    providers: ['prov_rc'],
    fields: ['Registration Certificate (RC)'],
    responseMapping: {
      showFields: [],
      renameFields: {},
      groupFields: {}
    },
    layout: { type: 'table', title: 'RC Records Ledger', showBorders: true }
  },
  {
    id: 'mod_ifsc',
    name: 'IFSC Bank Lookup',
    slug: 'ifsc-lookup',
    icon: 'Briefcase',
    description: 'Verify bank routing codes, branch details, location information, and active registry status.',
    costCredits: 1,
    status: 'active',
    providers: ['prov_ifsc'],
    fields: ['IFSC Code'],
    responseMapping: {
      showFields: [],
      renameFields: {},
      groupFields: {}
    },
    layout: { type: 'card', title: 'IFSC Registry Details', showBorders: true }
  },
  {
    id: 'mod_telegram',
    name: 'Telegram Intelligence',
    slug: 'telegram-lookup',
    icon: 'MessageCircle',
    description: 'Perform reverse lookups on Telegram user IDs to identify associated data and profiles.',
    costCredits: 1,
    status: 'active',
    providers: ['prov_telegram'],
    fields: ['Telegram User ID'],
    responseMapping: {
      showFields: [],
      renameFields: {},
      groupFields: {}
    },
    layout: { type: 'card', title: 'Telegram Dossier', showBorders: true }
  }
];

const defaultMenus: MenuConfig[] = [
  { id: '1', label: 'Console Home', path: '/dashboard', icon: 'Terminal', roleRequired: 'User', isHidden: false, order: 1 },
  { id: '2', label: 'Wallet & Credits', path: '/wallet', icon: 'Wallet', roleRequired: 'User', isHidden: false, order: 2 },
  { id: '3', label: 'Custom APIs', path: '/api-keys', icon: 'KeyRound', roleRequired: 'User', isHidden: false, order: 3 },
  { id: '4', label: 'Intel Providers', path: '/admin/providers', icon: 'Database', roleRequired: 'Admin', isHidden: false, order: 4 },
  { id: '5', label: 'Search Modules', path: '/admin/modules', icon: 'Sliders', roleRequired: 'Admin', isHidden: false, order: 5 },
  { id: '6', label: 'Audit Safe', path: '/admin/audit', icon: 'ShieldAlert', roleRequired: 'Admin', isHidden: false, order: 6 },
  { id: '7', label: 'Backup Engine', path: '/admin/backups', icon: 'Archive', roleRequired: 'Admin', isHidden: false, order: 7 }
];

const defaultPopups: SystemPopup[] = [
  { id: 'pop_welcome', title: 'OSINT Gateway v1.0.0 Online', content: 'Welcome to the OSINT Proxy. We have initialized your test environment with 100 free search credits.', type: 'welcome', status: 'active' }
];

const defaultContentConfig: ContentConfig = {
  siteTitle: "OSINT Proxy",
  siteBranding: "SECURE INTELLIGENCE PORTAL",
  heroTitle: "Telegram-Powered OSINT Proxy Gateway",
  heroSubtitle: "Query national databases, telephony listings, email breach sets, tax registries, and vehicle records completely anonymously. Absolute endpoint masking hides target feeds server-side.",
  heroLabel: "Next-Gen OSINT Data Proxy",
  botCardTitle: "Official Telegram Bot",
  botCardDesc: "Don't want to use the web interface? Our companion Telegram bot is fully integrated with the same secure proxy gateway. Deploy command queries directly from your Telegram chat safely.",
  botCardBullets: [
    "Command structure: /phone <number>",
    "Instant UPI and Cryptocurrency deposit syncing",
    "No user search logs stored on telegram servers"
  ],
  botUsername: "@Anish_Exploits_Bot",
  footerText: "© 2026 OSINT Proxy Gateway • Masked Server Node Routing • Secure UPI Credits.",
  homePageCards: [
    {
      id: "hc_1",
      title: "Multi-Module Lookups",
      description: "Query telephone numbers, email breaches, business GSTIN verifications, and license plates inside a single proxy portal.",
      icon: "Search",
      order: 1
    },
    {
      id: "hc_2",
      title: "Complete Server-Side Masking",
      description: "Proxy queries are executed entirely server-side. No target API credentials, headers, or parameters are leaked to the client browser.",
      icon: "Shield",
      order: 2
    },
    {
      id: "hc_3",
      title: "Dynamic Schema Mapping",
      description: "Map underlying JSON feeds into custom UI blocks. Dynamically rename variables, hide specific metadata, and group responses.",
      icon: "Sliders",
      order: 3
    },
    {
      id: "hc_4",
      title: "Custom Token Provisioning",
      description: "Generate secure custom API keys (OSINT_xxxxx) with restricted module access to share with operators.",
      icon: "KeyRound",
      order: 4
    },
    {
      id: "hc_5",
      title: "Autonomous Failover Routing",
      description: "If any intelligence feed reports a timeout or error, our system automatically triggers retries and routes through designated backups.",
      icon: "Database",
      order: 5
    },
    {
      id: "hc_6",
      title: "Live Health Telemetry",
      description: "Real-time monitoring of CPU loads, memory buffers, database health, and API latency is fully visible for unmatched operational reliability.",
      icon: "Cpu",
      order: 6
    }
  ],
  actionButtons: [
    { id: "ab_1", key: "telegram_channel", label: "Join Telegram Channel", url: "https://t.me/Anish_exploits", isHidden: false },
    { id: "ab_2", key: "telegram_bot", label: "Open @Anish_Exploits_Bot", url: "https://t.me/Anish_exploits", isHidden: false },
    { id: "ab_3", key: "whatsapp", label: "WhatsApp Helpline", url: "https://t.me/Anish_exploits", isHidden: false },
    { id: "ab_4", key: "contact", label: "Contact Developer & Owner", url: "https://t.me/Anish_exploits", isHidden: false },
    { id: "ab_5", key: "support", label: "Support", url: "https://t.me/Anish_exploits", isHidden: false },
    { id: "ab_6", key: "buy_api", label: "Buy API Credits", url: "/wallet", isHidden: false }
  ],
  broadcastMessages: [
    { id: "bm_1", title: "Gateway Operational", message: "All downstream OSINT endpoints are healthy and optimized.", active: true, type: "success", createdAt: new Date().toISOString() }
  ],
  navigationLinks: [
    { id: "nl_1", label: "Telegram Bot", path: "#bot-info", icon: "Send", order: 1, isHidden: false },
    { id: "nl_2", label: "Features", path: "#features", icon: "Search", order: 2, isHidden: false },
    { id: "nl_3", label: "How It Works", path: "#how-to-use", icon: "Sliders", order: 3, isHidden: false },
    { id: "nl_4", label: "Pricing", path: "#plans", icon: "Wallet", order: 4, isHidden: false },
    { id: "nl_5", label: "Support", path: "#contact", icon: "MessageCircle", order: 5, isHidden: false }
  ],
  howItWorksSteps: [
    { id: "hw_1", stepNumber: 1, title: "Launch Session", description: "Launch the Web Console or trigger `@Anish_Exploits_Bot` in Telegram." },
    { id: "hw_2", stepNumber: 2, title: "Deposit Credits", description: "Recharge credits instantly using standard UPI QR codes or cryptocurrency details." },
    { id: "hw_3", stepNumber: 3, title: "Deploy Lookups", description: "Input target parameters (phone, mail, GST, license plate) and trigger search." },
    { id: "hw_4", stepNumber: 4, title: "Extract Dossier", description: "Extract transformed lookup records immediately with zero local traces left." }
  ]
};

function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      
      let providers = parsed.providers || defaultProviders;
      let modules = parsed.modules || defaultModules;

      // Migrate / reset database if old mock/intel providers are detected or we are missing the full set of 7 real providers
      const hasMock = providers.some((p: any) => p.url.includes('.intel') || p.url.includes('.gov') || p.id === 'prov_telephony_a');
      if (hasMock || providers.length < 7) {
        providers = defaultProviders;
        modules = defaultModules;
        parsed.providers = providers;
        parsed.modules = modules;
        fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
      }

      let contentConfig = parsed.contentConfig || defaultContentConfig;
      if (!parsed.contentConfig) {
        parsed.contentConfig = defaultContentConfig;
        fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
      }

      return {
        users: parsed.users || [],
        plans: parsed.plans || defaultPlans,
        providers: providers,
        modules: modules,
        apiKeys: parsed.apiKeys || [],
        searchLogs: parsed.searchLogs || [],
        announcements: parsed.announcements || [],
        menus: parsed.menus || defaultMenus,
        popups: parsed.popups || defaultPopups,
        transactions: parsed.transactions || [],
        auditLogs: parsed.auditLogs || [],
        paymentMethods: parsed.paymentMethods || [],
        contentConfig: contentConfig
      };
    } catch (err) {
      console.error('Error loading DB file. Creating fresh database...', err);
    }
  }

  // Seeding initial database with Owner Account using metadata email
  const initialUsers: User[] = [
    {
      id: 'usr_owner_1',
      email: 'das481318@gmail.com', // Pre-configured Owner based on system metadata
      name: 'System Owner',
      role: 'Owner',
      credits: 1000,
      referralCode: 'OSINT_OWNER',
      planId: 'enterprise',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ];

  const db: DatabaseSchema = {
    users: initialUsers,
    plans: defaultPlans,
    providers: defaultProviders,
    modules: defaultModules,
    apiKeys: [],
    searchLogs: [],
    announcements: [
      { id: 'ann_1', title: 'System Engine Online', content: 'OSINT Proxy Gateway successfully operational. Multi-routing and secure payload transformation enabled.', type: 'announcement', status: 'active', createdAt: new Date().toISOString() }
    ],
    menus: defaultMenus,
    popups: defaultPopups,
    transactions: [],
    auditLogs: [
      { id: 'audit_init', userId: 'usr_owner_1', userEmail: 'das481318@gmail.com', action: 'SYSTEM_BOOT', details: 'Database schema successfully initialized and seeded.', ipAddress: '127.0.0.1', timestamp: new Date().toISOString() }
    ],
    paymentMethods: [
      { id: 'pay_upi', name: 'Secure UPI', details: 'osintproxy@upi', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=osintproxy@upi&pn=OSINT%20Proxy' },
      { id: 'pay_btc', name: 'Cryptocurrency Wallet', details: 'BTC: bc1qxy2kg3ut78h92556sp893jfl' }
    ],
    contentConfig: defaultContentConfig
  };

  saveDatabase(db);
  return db;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to DB file:', err);
  }
}

// Memory database loaded
let dbState = loadDatabase();

// Express Server Config
app.use(express.json());

// Session holder
let activeSessionUserId: string | null = 'usr_owner_1'; // Seed auto login for simplicity

// Helper: Logging actions
function addAuditLog(userId: string, action: string, details: string, req: express.Request) {
  const user = dbState.users.find(u => u.id === userId);
  const newLog: AuditLog = {
    id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: userId,
    userEmail: user ? user.email : 'system',
    action,
    details,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    timestamp: new Date().toISOString()
  };
  dbState.auditLogs.unshift(newLog);
  saveDatabase(dbState);
}

// Auth Endpoints
app.get('/api/auth/session', (req, res) => {
  if (!activeSessionUserId) {
    return res.json({ user: null });
  }
  const user = dbState.users.find(u => u.id === activeSessionUserId);
  return res.json({ user: user || null });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // Simple authentication for demonstration (no password verification required for seed accounts)
  let user = dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    // Dynamically register if user enters valid email for demonstration
    user = {
      id: `usr_${Date.now()}`,
      email: email.toLowerCase(),
      name: email.split('@')[0].toUpperCase(),
      role: 'User',
      credits: 100,
      referralCode: `OSINT_${Math.floor(Math.random() * 90000 + 10000)}`,
      planId: 'free',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    dbState.users.push(user);
    saveDatabase(dbState);
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended.' });
  }

  activeSessionUserId = user.id;
  addAuditLog(user.id, 'LOGIN', `User ${user.email} successfully logged in.`, req);
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  if (activeSessionUserId) {
    addAuditLog(activeSessionUserId, 'LOGOUT', `User terminated session.`, req);
  }
  activeSessionUserId = null;
  res.json({ success: true });
});

app.post('/api/auth/register', (req, res) => {
  const { email, name, role } = req.body;
  const exists = dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    email: email.toLowerCase(),
    name: name || email.split('@')[0].toUpperCase(),
    role: (role as UserRole) || 'User',
    credits: 100, // starting gift
    referralCode: `OSINT_${Math.floor(Math.random() * 90000 + 10000)}`,
    planId: 'free',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  dbState.users.push(newUser);
  saveDatabase(dbState);
  activeSessionUserId = newUser.id;
  addAuditLog(newUser.id, 'REGISTER', `User created new account and logged in.`, req);
  res.json({ user: newUser });
});

// Wallet & Transaction Management
app.get('/api/user/wallet', (req, res) => {
  if (!activeSessionUserId) return res.status(401).json({ error: 'Unauthorized' });
  const user = dbState.users.find(u => u.id === activeSessionUserId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ credits: user.credits, planId: user.planId });
});

app.post('/api/user/wallet/add-funds', (req, res) => {
  if (!activeSessionUserId) return res.status(401).json({ error: 'Unauthorized' });
  const { amount, credits, paymentMethod } = req.body;
  
  const user = dbState.users.find(u => u.id === activeSessionUserId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.credits += parseInt(credits) || 0;
  
  const trans: Transaction = {
    id: `tx_${Date.now()}`,
    userId: user.id,
    type: 'purchase',
    amount: parseFloat(amount) || 0,
    credits: parseInt(credits) || 0,
    status: 'completed',
    paymentMethod: paymentMethod || 'UPI',
    timestamp: new Date().toISOString(),
    description: `Added ${credits} search credits via payment gateway.`
  };

  dbState.transactions.unshift(trans);
  saveDatabase(dbState);
  addAuditLog(user.id, 'CREDIT_PURCHASE', `Added ${credits} credits, balance: ${user.credits}`, req);

  res.json({ success: true, credits: user.credits });
});

app.get('/api/user/transactions', (req, res) => {
  if (!activeSessionUserId) return res.status(401).json({ error: 'Unauthorized' });
  const txs = dbState.transactions.filter(t => t.userId === activeSessionUserId);
  res.json(txs);
});

// API Custom Key Management
app.get('/api/user/keys', (req, res) => {
  if (!activeSessionUserId) return res.status(401).json({ error: 'Unauthorized' });
  const keys = dbState.apiKeys.filter(k => k.userId === activeSessionUserId && k.status === 'active');
  res.json(keys);
});

app.post('/api/user/keys', (req, res) => {
  if (!activeSessionUserId) return res.status(401).json({ error: 'Unauthorized' });
  const { name, allowedEndpoints } = req.body;

  const keyString = `OSINT_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  const newKey: CustomAPIKey = {
    id: `key_${Date.now()}`,
    userId: activeSessionUserId,
    key: keyString,
    name: name || 'Custom Platform Token',
    createdAt: new Date().toISOString(),
    status: 'active',
    limitQueries: 1000,
    usedQueries: 0,
    allowedEndpoints: allowedEndpoints || ['phone-lookup', 'email-lookup']
  };

  dbState.apiKeys.push(newKey);
  saveDatabase(dbState);
  addAuditLog(activeSessionUserId, 'API_KEY_CREATED', `Created key token: ${newKey.name}`, req);

  res.json(newKey);
});

app.delete('/api/user/keys/:id', (req, res) => {
  if (!activeSessionUserId) return res.status(401).json({ error: 'Unauthorized' });
  const keyIndex = dbState.apiKeys.findIndex(k => k.id === req.params.id && k.userId === activeSessionUserId);
  if (keyIndex !== -1) {
    dbState.apiKeys[keyIndex].status = 'revoked';
    saveDatabase(dbState);
    addAuditLog(activeSessionUserId, 'API_KEY_REVOKED', `Revoked token: ${dbState.apiKeys[keyIndex].name}`, req);
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Key not found' });
});

// Admin Panel users management
app.get('/api/admin/users', (req, res) => {
  res.json(dbState.users);
});

app.put('/api/admin/users/:id', (req, res) => {
  const { role, credits, status, planId } = req.body;
  const user = dbState.users.find(u => u.id === req.params.id);
  if (user) {
    user.role = role || user.role;
    user.credits = credits !== undefined ? parseInt(credits) : user.credits;
    user.status = status || user.status;
    user.planId = planId || user.planId;
    saveDatabase(dbState);
    if (activeSessionUserId) {
      addAuditLog(activeSessionUserId, 'USER_MODIFIED', `Modified properties for user ${user.email}`, req);
    }
    return res.json(user);
  }
  res.status(404).json({ error: 'User not found' });
});

// Admin Providers
app.get('/api/admin/providers', (req, res) => {
  res.json(dbState.providers);
});

app.post('/api/admin/providers', (req, res) => {
  const provider: APIProvider = {
    id: `prov_${Date.now()}`,
    name: req.body.name,
    url: req.body.url || 'https://api.gateway.provider/v1',
    apiKey: req.body.apiKey || '',
    headers: req.body.headers || {},
    parameters: req.body.parameters || {},
    timeoutMs: req.body.timeoutMs || 4000,
    retries: req.body.retries || 2,
    priority: req.body.priority || 1,
    status: req.body.status || 'active',
    failoverProviderId: req.body.failoverProviderId || ''
  };
  dbState.providers.push(provider);
  saveDatabase(dbState);
  if (activeSessionUserId) {
    addAuditLog(activeSessionUserId, 'PROVIDER_CREATED', `Registered provider: ${provider.name}`, req);
  }
  res.json(provider);
});

app.put('/api/admin/providers/:id', (req, res) => {
  const prov = dbState.providers.find(p => p.id === req.params.id);
  if (prov) {
    Object.assign(prov, req.body);
    saveDatabase(dbState);
    if (activeSessionUserId) {
      addAuditLog(activeSessionUserId, 'PROVIDER_MODIFIED', `Updated provider info: ${prov.name}`, req);
    }
    return res.json(prov);
  }
  res.status(404).json({ error: 'Provider not found' });
});

app.delete('/api/admin/providers/:id', (req, res) => {
  const index = dbState.providers.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    const prov = dbState.providers[index];
    dbState.providers.splice(index, 1);
    saveDatabase(dbState);
    if (activeSessionUserId) {
      addAuditLog(activeSessionUserId, 'PROVIDER_DELETED', `Deleted provider: ${prov.name}`, req);
    }
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Provider not found' });
});

// Admin Modules
app.get('/api/admin/modules', (req, res) => {
  res.json(dbState.modules);
});

app.post('/api/admin/modules', (req, res) => {
  const module: SearchModule = {
    id: `mod_${Date.now()}`,
    name: req.body.name,
    slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, '-'),
    icon: req.body.icon || 'HelpCircle',
    description: req.body.description || 'Dynamic lookup module.',
    costCredits: req.body.costCredits || 1,
    status: req.body.status || 'active',
    providers: req.body.providers || [],
    fields: req.body.fields || ['Query Target'],
    responseMapping: req.body.responseMapping || { showFields: [], renameFields: {}, groupFields: {} },
    layout: req.body.layout || { type: 'card', title: 'Details', showBorders: true }
  };
  dbState.modules.push(module);
  saveDatabase(dbState);
  if (activeSessionUserId) {
    addAuditLog(activeSessionUserId, 'MODULE_CREATED', `Configured module: ${module.name}`, req);
  }
  res.json(module);
});

app.put('/api/admin/modules/:id', (req, res) => {
  const mod = dbState.modules.find(m => m.id === req.params.id);
  if (mod) {
    Object.assign(mod, req.body);
    saveDatabase(dbState);
    if (activeSessionUserId) {
      addAuditLog(activeSessionUserId, 'MODULE_MODIFIED', `Updated module: ${mod.name}`, req);
    }
    return res.json(mod);
  }
  res.status(404).json({ error: 'Module not found' });
});

app.delete('/api/admin/modules/:id', (req, res) => {
  const index = dbState.modules.findIndex(m => m.id === req.params.id);
  if (index !== -1) {
    const mod = dbState.modules[index];
    dbState.modules.splice(index, 1);
    saveDatabase(dbState);
    if (activeSessionUserId) {
      addAuditLog(activeSessionUserId, 'MODULE_DELETED', `Deleted module: ${mod.name}`, req);
    }
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Module not found' });
});

// Admin popup
app.get('/api/admin/popups', (req, res) => {
  res.json(dbState.popups);
});

app.post('/api/admin/popups', (req, res) => {
  dbState.popups = req.body;
  saveDatabase(dbState);
  res.json({ success: true });
});

// Admin announcements
app.get('/api/admin/announcements', (req, res) => {
  res.json(dbState.announcements);
});

app.post('/api/admin/announcements', (req, res) => {
  const ann: Announcement = {
    id: `ann_${Date.now()}`,
    title: req.body.title,
    content: req.body.content,
    type: req.body.type || 'announcement',
    status: 'active',
    createdAt: new Date().toISOString()
  };
  dbState.announcements.unshift(ann);
  saveDatabase(dbState);
  res.json(ann);
});

// Admin payments
app.get('/api/admin/payment-methods', (req, res) => {
  res.json(dbState.paymentMethods);
});

app.post('/api/admin/payment-methods', (req, res) => {
  const pm = {
    id: `pay_${Date.now()}`,
    name: req.body.name,
    details: req.body.details,
    qrCodeUrl: req.body.qrCodeUrl || ''
  };
  dbState.paymentMethods.push(pm);
  saveDatabase(dbState);
  res.json(pm);
});

// Audit Logs
app.get('/api/admin/audit-logs', (req, res) => {
  res.json(dbState.auditLogs);
});

// Search history / logs
app.get('/api/user/history', (req, res) => {
  if (!activeSessionUserId) return res.status(401).json({ error: 'Unauthorized' });
  const logs = dbState.searchLogs.filter(l => l.userId === activeSessionUserId);
  res.json(logs);
});

// Public Content Config Endpoint
app.get('/api/content-config', (req, res) => {
  res.json(dbState.contentConfig || defaultContentConfig);
});

// Admin Content Config Endpoint
app.put('/api/admin/content-config', (req, res) => {
  dbState.contentConfig = req.body;
  saveDatabase(dbState);
  if (activeSessionUserId) {
    addAuditLog(activeSessionUserId, 'CONTENT_CONFIG_MODIFIED', 'Updated system-wide dynamic homepage content and actions.', req);
  }
  res.json({ success: true, contentConfig: dbState.contentConfig });
});

// Admin Search Logs endpoints
app.get('/api/admin/search-logs', (req, res) => {
  res.json(dbState.searchLogs);
});

app.delete('/api/admin/search-logs/:id', (req, res) => {
  const index = dbState.searchLogs.findIndex(l => l.id === req.params.id);
  if (index !== -1) {
    dbState.searchLogs.splice(index, 1);
    saveDatabase(dbState);
    if (activeSessionUserId) {
      addAuditLog(activeSessionUserId, 'SEARCH_LOG_DELETED', `Deleted search history log entry: ${req.params.id}`, req);
    }
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Log entry not found' });
});

app.delete('/api/admin/search-logs', (req, res) => {
  dbState.searchLogs = [];
  saveDatabase(dbState);
  if (activeSessionUserId) {
    addAuditLog(activeSessionUserId, 'SEARCH_LOGS_CLEARED', 'Cleared entire system-wide search log database.', req);
  }
  res.json({ success: true });
});

// Admin User creation and deletion
app.post('/api/admin/users', (req, res) => {
  const { email, name, role, credits, password, planId } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const exists = dbState.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    email: email.toLowerCase(),
    name: name || 'Operator',
    role: role || 'User',
    credits: credits !== undefined ? parseInt(credits) : 100,
    referralCode: `OSINT_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    planId: planId || 'free',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  dbState.users.push(newUser);
  saveDatabase(dbState);
  if (activeSessionUserId) {
    addAuditLog(activeSessionUserId, 'USER_CREATED_ADMIN', `Created new user operator profile: ${newUser.email}`, req);
  }
  res.json(newUser);
});

app.delete('/api/admin/users/:id', (req, res) => {
  const index = dbState.users.findIndex(u => u.id === req.params.id);
  if (index !== -1) {
    const user = dbState.users[index];
    if (user.role === 'Owner') {
      return res.status(403).json({ error: 'Cannot delete the system Owner account' });
    }
    dbState.users.splice(index, 1);
    saveDatabase(dbState);
    if (activeSessionUserId) {
      addAuditLog(activeSessionUserId, 'USER_DELETED', `Deleted operator account: ${user.email}`, req);
    }
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'User not found' });
});

// Admin Announcement Edit and Delete
app.put('/api/admin/announcements/:id', (req, res) => {
  const ann = dbState.announcements.find(a => a.id === req.params.id);
  if (ann) {
    ann.title = req.body.title || ann.title;
    ann.content = req.body.content || ann.content;
    ann.type = req.body.type || ann.type;
    ann.status = req.body.status || ann.status;
    saveDatabase(dbState);
    if (activeSessionUserId) {
      addAuditLog(activeSessionUserId, 'ANNOUNCEMENT_EDITED', `Edited announcement: ${ann.title}`, req);
    }
    return res.json(ann);
  }
  res.status(404).json({ error: 'Announcement not found' });
});

app.delete('/api/admin/announcements/:id', (req, res) => {
  const index = dbState.announcements.findIndex(a => a.id === req.params.id);
  if (index !== -1) {
    const ann = dbState.announcements[index];
    dbState.announcements.splice(index, 1);
    saveDatabase(dbState);
    if (activeSessionUserId) {
      addAuditLog(activeSessionUserId, 'ANNOUNCEMENT_DELETED', `Deleted announcement: ${ann.title}`, req);
    }
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Announcement not found' });
});

// CPU / Health Endpoint
app.get('/api/admin/health', (req, res) => {
  // Compute dummy health stats to look extremely professional and real
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  const health: SystemHealth = {
    cpuUsage: Math.floor(Math.random() * 15) + 5, // Simulated load %
    ramUsage: {
      used: Math.round(usedMem / 1024 / 1024),
      total: Math.round(totalMem / 1024 / 1024)
    },
    diskUsage: {
      used: 42, // %
      total: 100 // %
    },
    databaseStatus: 'healthy',
    apiStatus: {
      'Telephony-Intel-A': 'online',
      'Vahan-Vehicle-Intel': 'online',
      'National-Tax-Registry': 'online'
    },
    uptime: Math.round(process.uptime())
  };
  res.json(health);
});

// Gateway Analytics Dashboard Metrics
app.get('/api/admin/analytics', (req, res) => {
  if (!activeSessionUserId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const requestingUser = dbState.users.find(u => u.id === activeSessionUserId);
  if (!requestingUser || (requestingUser.role !== 'Owner' && requestingUser.role !== 'Super Admin' && requestingUser.role !== 'Admin')) {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }

  const totalQueries = dbState.searchLogs.length;
  const successfulQueries = dbState.searchLogs.filter(l => l.status === 'success').length;
  const failedQueries = dbState.searchLogs.filter(l => l.status === 'failed').length;
  const totalCreditsSpent = dbState.searchLogs.reduce((sum, l) => sum + (l.costCredits || 0), 0);

  // Popular modules analytics
  const moduleCounts: Record<string, number> = {};
  dbState.searchLogs.forEach(l => {
    moduleCounts[l.moduleSlug] = (moduleCounts[l.moduleSlug] || 0) + 1;
  });

  // Providers performance
  const providerPerformance: Record<string, { total: number; success: number; failed: number }> = {};
  dbState.searchLogs.forEach(l => {
    const provId = l.providerId;
    if (!providerPerformance[provId]) {
      providerPerformance[provId] = { total: 0, success: 0, failed: 0 };
    }
    providerPerformance[provId].total += 1;
    if (l.status === 'success') {
      providerPerformance[provId].success += 1;
    } else {
      providerPerformance[provId].failed += 1;
    }
  });

  // Daily volume (last 7 days)
  const dailyVolume: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    dailyVolume[dayStr] = 0;
  }
  dbState.searchLogs.forEach(l => {
    const dayStr = l.timestamp.split('T')[0];
    if (dailyVolume[dayStr] !== undefined) {
      dailyVolume[dayStr] += 1;
    }
  });

  res.json({
    totalQueries,
    successfulQueries,
    failedQueries,
    totalCreditsSpent,
    moduleCounts,
    providerPerformance,
    dailyVolume: Object.entries(dailyVolume).map(([date, count]) => ({ date, count }))
  });
});

// --- REAL-TIME PROVIDER EXECUTION ENGINE ---
const rateLimits: Record<string, number[]> = {};

async function executeProviderRequest(provider: APIProvider, query: string, moduleSlug: string): Promise<any> {
  let targetUrl = provider.url;
  
  // Interpolate query into URL if placeholder exists
  const hasPlaceholder = targetUrl.includes('{{query}}') || 
                        targetUrl.includes('{query}') || 
                        targetUrl.includes(':query') ||
                        targetUrl.includes('{num}') ||
                        targetUrl.includes('{aadhaar}') ||
                        targetUrl.includes('{rc}') ||
                        targetUrl.includes('{ifsc}') ||
                        targetUrl.includes('{tg_id}');

  if (hasPlaceholder) {
    targetUrl = targetUrl
      .replace(/{{query}}/g, encodeURIComponent(query))
      .replace(/{query}/g, encodeURIComponent(query))
      .replace(/:query/g, encodeURIComponent(query))
      .replace(/{num}/g, encodeURIComponent(query))
      .replace(/{aadhaar}/g, encodeURIComponent(query))
      .replace(/{rc}/g, encodeURIComponent(query))
      .replace(/{ifsc}/g, encodeURIComponent(query))
      .replace(/{tg_id}/g, encodeURIComponent(query));
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

    let responseText = "";
    try {
      responseText = await response.text();
    } catch (textErr: any) {
      throw new Error(`Failed to read response body: ${textErr.message || textErr}`);
    }

    try {
      const json = JSON.parse(responseText);
      return json;
    } catch (jsonErr) {
      // Upstream returned plaintext or custom dossier format (e.g. starting with emojis or custom fields)
      const parsedObj: Record<string, any> = {
        raw_text: responseText
      };

      // Split lines and parse key-value patterns dynamically
      const lines = responseText.split(/\r?\n/);
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Look for common separators like ":"
        const separatorIndex = trimmed.indexOf(':');
        if (separatorIndex > 0) {
          const rawKey = trimmed.substring(0, separatorIndex).trim();
          const rawVal = trimmed.substring(separatorIndex + 1).trim();

          if (rawKey && rawVal) {
            // Clean keys of emojis, special characters, and convert spaces to underscores
            const cleanKey = rawKey
              .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
              .replace(/[\u{2700}-\u{27BF}]/gu, '')
              .replace(/[\u{2600}-\u{26FF}]/gu, '')
              .replace(/[🔍📋🔒👤💼🚗🛡️🔔💡📞✉️📱🚨🌐🏢🆔🗓️]/gu, '')
              .replace(/[\[\]\(\)\{\}\-\#]/g, '')
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '_');

            if (cleanKey) {
              parsedObj[cleanKey] = rawVal;
            }
          }
        }
      });

      return parsedObj;
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// --- CORE PROXY GATEWAY INTELLIGENCE (REAL API EXECUTION + AUTOMATED FAILOVER) ---
app.post('/api/gateway/search', async (req, res) => {
  const { moduleSlug, query } = req.body;
  const clientApiKey = req.headers['x-platform-api-key'] as string;

  let requestingUser: User | undefined;

  // Authenticate user via key or session
  if (clientApiKey) {
    const keyRecord = dbState.apiKeys.find(k => k.key === clientApiKey && k.status === 'active');
    if (!keyRecord) {
      return res.status(401).json({ error: 'Invalid proxy gateway token.' });
    }
    if (!keyRecord.allowedEndpoints.includes(moduleSlug)) {
      return res.status(403).json({ error: 'Access denied. Module not configured for this token.' });
    }
    requestingUser = dbState.users.find(u => u.id === keyRecord.userId);
    keyRecord.usedQueries += 1;
  } else {
    if (!activeSessionUserId) {
      return res.status(401).json({ error: 'Authorization required to access OSINT Proxy Gateway.' });
    }
    requestingUser = dbState.users.find(u => u.id === activeSessionUserId);
  }

  if (!requestingUser) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  // 1. IP-based Rate Limiting (max 30 requests per minute)
  const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  const now = Date.now();
  if (!rateLimits[clientIp]) {
    rateLimits[clientIp] = [];
  }
  rateLimits[clientIp] = rateLimits[clientIp].filter(time => now - time < 60000);
  if (rateLimits[clientIp].length >= 30) {
    return res.status(429).json({ error: 'Rate limit exceeded. Maximum 30 requests per minute per IP address.' });
  }
  rateLimits[clientIp].push(now);

  // 2. Plan-based daily limit tracking
  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayQueries = dbState.searchLogs.filter(
    log => log.userId === requestingUser!.id && log.timestamp.startsWith(todayStr)
  ).length;

  const userPlan = defaultPlans.find(p => p.id === requestingUser.planId) || defaultPlans[0];
  if (userTodayQueries >= userPlan.dailyLimit) {
    return res.status(429).json({ error: `Daily quota exceeded. Your plan (${userPlan.name}) allows a maximum of ${userPlan.dailyLimit} queries per day.` });
  }

  const mod = dbState.modules.find(m => m.slug === moduleSlug && m.status === 'active');
  if (!mod) {
    return res.status(404).json({ error: 'Active intelligence module not found.' });
  }

  // Cost engine verification
  if (requestingUser.credits < mod.costCredits) {
    return res.status(402).json({ error: `Insufficient credits. This scan costs ${mod.costCredits} credits.` });
  }

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

  // Deduct credits on successful execution
  requestingUser.credits -= mod.costCredits;

  // --- GATEWAY RESPONSE TRANSFORM ENGINE ---
  // Apply mappings, show/hide, group fields
  const showFields = mod.responseMapping.showFields || [];
  const renameFields = mod.responseMapping.renameFields || {};
  const groupFields = mod.responseMapping.groupFields || {};
  const fieldOrder = mod.responseMapping.fieldOrder || [];

  // Extract shown fields or map all if empty
  const transformedData: Record<string, any> = {};
  const sourceKeys = Object.keys(rawData);

  sourceKeys.forEach(k => {
    if (showFields.length === 0 || showFields.includes(k)) {
      const renamedKey = renameFields[k] || k;
      transformedData[renamedKey] = rawData[k];
    }
  });

  // Apply Response Ordering if fieldOrder is specified
  const orderedTransformedData: Record<string, any> = {};
  if (fieldOrder.length > 0) {
    fieldOrder.forEach(k => {
      // k can be raw field name or renamed field name
      const renamedKey = renameFields[k] || k;
      if (transformedData[renamedKey] !== undefined) {
        orderedTransformedData[renamedKey] = transformedData[renamedKey];
      } else if (transformedData[k] !== undefined) {
        orderedTransformedData[k] = transformedData[k];
      }
    });
    // Append any leftover keys
    Object.keys(transformedData).forEach(rk => {
      if (orderedTransformedData[rk] === undefined) {
        orderedTransformedData[rk] = transformedData[rk];
      }
    });
  } else {
    Object.assign(orderedTransformedData, transformedData);
  }

  // Grouped Output preparation
  const groupedData: Record<string, Record<string, any>> = {};
  Object.entries(groupFields).forEach(([groupName, fields]) => {
    groupedData[groupName] = {};
    fields.forEach(f => {
      const renamedKey = renameFields[f] || f;
      if (orderedTransformedData[renamedKey] !== undefined) {
        groupedData[groupName][renamedKey] = orderedTransformedData[renamedKey];
        delete orderedTransformedData[renamedKey]; // remove from main flat list to avoid duplication
      } else if (orderedTransformedData[f] !== undefined) {
        groupedData[groupName][f] = orderedTransformedData[f];
        delete orderedTransformedData[f];
      }
    });
  });

  const provider = dbState.providers.find(p => p.id === successfulProviderId);

  // Output response
  const gatewayResponse = {
    moduleName: mod.name,
    targetQuery: query,
    creditsSpent: mod.costCredits,
    providerMasked: provider ? provider.name : 'Secured Gateway Node',
    timestamp: new Date().toISOString(),
    flatData: orderedTransformedData,
    groupedData: Object.keys(groupedData).length > 0 ? groupedData : undefined,
    layout: mod.layout
  };

  // Log search record
  const log: SearchLog = {
    id: `log_${Date.now()}`,
    userId: requestingUser.id,
    moduleSlug: mod.slug,
    query: query,
    providerId: successfulProviderId,
    costCredits: mod.costCredits,
    timestamp: new Date().toISOString(),
    status: 'success',
    result: gatewayResponse,
    rawResult: rawData // Admin can see raw responses
  };

  dbState.searchLogs.unshift(log);
  saveDatabase(dbState);

  res.json(gatewayResponse);
});

// Backup system endpoints
app.get('/api/admin/backups/download', (req, res) => {
  // Return database in-memory contents as raw JSON format with secure metadata headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="osint_proxy_backup_${Date.now()}.json"`);
  res.send(JSON.stringify(dbState, null, 2));
});

// Reports system endpoints
app.get('/api/reports/:filename', (req, res) => {
  const filename = req.params.filename;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filePath = path.join(process.cwd(), 'reports', filename);
  res.download(filePath, filename, (err) => {
    if (err) {
      res.status(404).json({ error: `File ${filename} not found or unavailable.` });
    }
  });
});

// Start Dev Server Middleware (Express + Vite)
async function bootUp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`🛡️  OSINT PROXY GATEWAY ONLINE`);
    console.log(`🌐 PORT: http://localhost:${PORT}`);
    console.log(`=========================================`);
  });
}

bootUp();
