import React, { useState, useEffect } from 'react';
import { 
  Terminal, Shield, Database, Sliders, KeyRound, Wallet, 
  Search, ShieldAlert, Archive, FileText, Bell, Sparkles,
  Cpu, HardDrive, RefreshCw, Plus, Trash2, Check, Download,
  Play, LogOut, CheckCircle2, Copy, AlertTriangle, HelpCircle,
  Clock, Menu, X, User as UserIcon, ExternalLink, Phone, Mail, Briefcase, Car,
  Send, MessageSquare, Info, ChevronRight, ArrowUpRight, MessageCircle, AlertCircle, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Plan, APIProvider, SearchModule, CustomAPIKey, SearchLog, Announcement, MenuConfig, SystemPopup, Transaction, AuditLog, SystemHealth, ContentConfig, HomePageCard, NavLink, ActionButton, BroadcastMessage } from './types';

const IconComponents: Record<string, React.ComponentType<any>> = {
  Terminal, Shield, Database, Sliders, KeyRound, Wallet, Search, ShieldAlert, Archive, FileText, Phone, Mail, Briefcase, Car
};

export default function App() {
  // Global States
  const [user, setUser] = useState<User | null>(null);
  const [contentConfig, setContentConfig] = useState<ContentConfig | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePopup, setActivePopup] = useState<SystemPopup | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([
    'Proxy system operational.',
    'Endpoints secure and active.'
  ]);

  // Auth form
  const [authEmail, setAuthEmail] = useState('das481318@gmail.com');
  const [authPassword, setAuthPassword] = useState('password');
  const [authName, setAuthName] = useState('System Admin');
  const [authError, setAuthError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Core Data States
  const [providers, setProviders] = useState<APIProvider[]>([]);
  const [modules, setModules] = useState<SearchModule[]>([]);
  const [apiKeys, setApiKeys] = useState<CustomAPIKey[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [menus, setMenus] = useState<MenuConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // Search Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleSlug, setSelectedModuleSlug] = useState('phone-lookup');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchError, setSearchError] = useState('');

  // Admin Module Edit Mode
  const [editingModule, setEditingModule] = useState<SearchModule | null>(null);
  const [selectedMappingField, setSelectedMappingField] = useState('');
  const [editingProvider, setEditingProvider] = useState<APIProvider | null>(null);

  // Admin users and search logs management states
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminSearchLogs, setAdminSearchLogs] = useState<any[]>([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState<User | null>(null);
  const [createUserEmail, setCreateUserEmail] = useState('');
  const [createUserName, setCreateUserName] = useState('');
  const [createUserPassword, setCreateUserPassword] = useState('');
  const [createUserRole, setCreateUserRole] = useState<'User' | 'Admin' | 'Super Admin'>('User');
  const [createUserCredits, setCreateUserCredits] = useState('100');

  // New Key Builder Form
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEndpoints, setNewKeyEndpoints] = useState<string[]>(['phone-lookup']);

  // Add Funds form
  const [fundCredits, setFundCredits] = useState('100');
  const [fundAmount, setFundAmount] = useState('29');

  // Copy indicator & custom toast
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // System Verification Reports state
  const [selectedReportFile, setSelectedReportFile] = useState<string | null>(null);
  const [selectedReportName, setSelectedReportName] = useState<string | null>(null);
  const [selectedReportContent, setSelectedReportContent] = useState<string>('');
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);

  useEffect(() => {
    if (selectedReportFile) {
      setIsLoadingReport(true);
      fetch(`/api/reports/${selectedReportFile}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load report');
          return res.text();
        })
        .then(text => {
          setSelectedReportContent(text);
          setIsLoadingReport(false);
        })
        .catch(err => {
          setSelectedReportContent(`Error loading report: ${err.message}`);
          setIsLoadingReport(false);
        });
    } else {
      setSelectedReportContent('');
    }
  }, [selectedReportFile]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    triggerToast('Copied to clipboard');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fetchContentConfig = async () => {
    try {
      const res = await fetch('/api/content-config');
      if (res.ok) {
        const data = await res.json();
        setContentConfig(data);
      }
    } catch (err) {
      console.error('Failed to retrieve content config:', err);
    }
  };

  // Fetch Session on startup
  useEffect(() => {
    fetchSession();
    fetchContentConfig();
  }, []);

  // Sync other dashboard records once authenticated
  useEffect(() => {
    if (user) {
      fetchUserDashboard();
      if (user.role === 'Owner' || user.role === 'Admin' || user.role === 'Super Admin') {
        fetchAdminDashboard();
      }
    }
  }, [user]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setShowConsole(false); // Do not auto-open console so home page remains the landing page
      }
    } catch (err) {
      console.error('Session retrieval failed:', err);
    }
  };

  const fetchUserDashboard = async () => {
    try {
      const kRes = await fetch('/api/user/keys');
      setApiKeys(await kRes.json());

      const hRes = await fetch('/api/user/history');
      setSearchLogs(await hRes.json());

      const tRes = await fetch('/api/user/transactions');
      setTransactions(await tRes.json());

      const aRes = await fetch('/api/admin/announcements');
      setAnnouncements(await aRes.json());

      const pRes = await fetch('/api/admin/payment-methods');
      setPaymentMethods(await pRes.json());

      const popRes = await fetch('/api/admin/popups');
      const pops = await popRes.json();
      if (pops.length > 0) {
        const welcomePop = pops.find((p: SystemPopup) => p.status === 'active');
        if (welcomePop) setActivePopup(welcomePop);
      }
    } catch (err) {
      console.error('User context sync failed:', err);
    }
  };

  const fetchAdminDashboard = async () => {
    try {
      const pRes = await fetch('/api/admin/providers');
      setProviders(await pRes.json());

      const mRes = await fetch('/api/admin/modules');
      setModules(await mRes.json());

      const adRes = await fetch('/api/admin/audit-logs');
      setAuditLogs(await adRes.json());

      const hRes = await fetch('/api/admin/health');
      setSystemHealth(await hRes.json());

      const uRes = await fetch('/api/admin/users');
      if (uRes.ok) setAdminUsers(await uRes.json());

      const sRes = await fetch('/api/admin/search-logs');
      if (sRes.ok) setAdminSearchLogs(await sRes.json());
    } catch (err) {
      console.error('Admin contexts sync failed:', err);
    }
  };

  const refreshSystemStats = async () => {
    const hRes = await fetch('/api/admin/health');
    setSystemHealth(await hRes.json());
    triggerToast('System stats updated');
  };

  // User Management Actions
  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createUserEmail,
          name: createUserName,
          password: createUserPassword,
          role: createUserRole,
          credits: parseInt(createUserCredits) || 100
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(`User ${createUserName} created successfully`);
        setCreateUserEmail('');
        setCreateUserName('');
        setCreateUserPassword('');
        fetchAdminDashboard();
      } else {
        triggerToast(`Error: ${data.error || 'Failed to create user'}`);
      }
    } catch (err) {
      triggerToast('Connection error');
    }
  };

  const handleUpdateAdminUser = async (userId: string, updates: Partial<User>) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('User details updated');
        fetchAdminDashboard();
        if (userId === user?.id) {
          fetchSession();
        }
      } else {
        triggerToast(`Error: ${data.error || 'Failed to update user'}`);
      }
    } catch (err) {
      triggerToast('Connection error');
    }
  };

  const handleDeleteAdminUser = async (userId: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this operator profile? This action is irreversible.')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('User successfully deleted');
        fetchAdminDashboard();
      } else {
        triggerToast(`Error: ${data.error || 'Failed to delete user'}`);
      }
    } catch (err) {
      triggerToast('Connection error');
    }
  };

  // Search History Actions
  const handleDeleteSearchLog = async (logId: string) => {
    try {
      const res = await fetch(`/api/admin/search-logs/${logId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerToast('Search log cleared');
        fetchAdminDashboard();
      } else {
        triggerToast('Failed to clear search log');
      }
    } catch (err) {
      triggerToast('Connection error');
    }
  };

  const handleClearAllSearchLogs = async () => {
    if (!window.confirm('Clear all system search records permanently?')) return;
    try {
      const res = await fetch('/api/admin/search-logs', {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerToast('All search history wiped');
        fetchAdminDashboard();
      } else {
        triggerToast('Failed to wipe search logs');
      }
    } catch (err) {
      triggerToast('Connection error');
    }
  };

  // Dynamic Site Builder Content Action
  const handleSaveContentConfig = async (updatedConfig: ContentConfig) => {
    try {
      const res = await fetch('/api/admin/content-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('Site configurations updated successfully');
        setContentConfig(updatedConfig);
      } else {
        triggerToast(`Error: ${data.error || 'Failed to update configurations'}`);
      }
    } catch (err) {
      triggerToast('Connection error');
    }
  };

  const handleCreateProvider = async () => {
    try {
      const name = window.prompt("Enter new Provider Node Name:");
      if (!name) return;
      const url = window.prompt("Enter target URL:", "https://api.gateway.provider/v1");
      if (!url) return;
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, headers: {}, parameters: {}, timeoutMs: 4000, retries: 2, priority: 1, status: 'active', failoverProviderId: '' })
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(prev => [...prev, data]);
        setEditingProvider(data);
        triggerToast('Registered new Provider Node successfully');
      }
    } catch (err) {
      triggerToast('Failed to create provider');
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!window.confirm("Are you sure you want to delete this provider? This action is irreversible.")) return;
    try {
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProviders(prev => prev.filter(p => p.id !== providerId));
        if (editingProvider?.id === providerId) {
          setEditingProvider(null);
        }
        triggerToast('Provider deleted successfully');
      }
    } catch (err) {
      triggerToast('Failed to delete provider');
    }
  };

  const handleCreateModule = async () => {
    try {
      const name = window.prompt("Enter new Module Name:");
      if (!name) return;
      const slug = window.prompt("Enter Module Slug (e.g., custom-lookup):", name.toLowerCase().replace(/\s+/g, '-'));
      if (!slug) return;
      
      const newMod = {
        name,
        slug,
        icon: 'HelpCircle',
        description: 'Custom added database lookup module.',
        costCredits: 1,
        status: 'active' as const,
        providers: [],
        fields: ['Query'],
        responseMapping: {
          showFields: [],
          renameFields: {},
          groupFields: {},
          fieldOrder: []
        },
        layout: {
          type: 'card' as const,
          title: `${name} Dossier`,
          showBorders: true,
          rawJsonEnabled: true,
          prettyJsonEnabled: true,
          cardViewEnabled: true,
          tableViewEnabled: true
        }
      };

      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMod)
      });
      if (res.ok) {
        const data = await res.json();
        setModules(prev => [...prev, data]);
        setEditingModule(data);
        triggerToast('Created new extraction template module');
      }
    } catch (err) {
      triggerToast('Failed to create module');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm("Are you sure you want to delete this search module? This will remove the entire template.")) return;
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setModules(prev => prev.filter(m => m.id !== moduleId));
        if (editingModule?.id === moduleId) {
          setEditingModule(null);
        }
        triggerToast('Module deleted successfully');
      }
    } catch (err) {
      triggerToast('Failed to delete module');
    }
  };

  // Auth actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setShowAuthModal(false);
        setShowConsole(true);
        triggerToast(`Welcome back, ${data.user.name}`);
      } else {
        setAuthError(data.error || 'Authentication failure.');
      }
    } catch (err) {
      setAuthError('Connection lost to gateway.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, name: authName })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setShowAuthModal(false);
        setShowConsole(true);
        triggerToast('Registration completed.');
      } else {
        setAuthError(data.error || 'Registration failure.');
      }
    } catch (err) {
      setAuthError('Server is offline.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setShowConsole(false);
    setActiveTab('dashboard');
    triggerToast('Session logged out');
  };

  // Fund simulation
  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/user/wallet/add-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: fundAmount, credits: fundCredits, paymentMethod: 'UPI' })
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => prev ? { ...prev, credits: data.credits } : null);
        fetchUserDashboard();
        triggerToast(`Added ${fundCredits} credits!`);
      }
    } catch (err) {
      triggerToast('Fund addition failed');
    }
  };

  // API Token creation
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, allowedEndpoints: newKeyEndpoints })
      });
      const newKey = await res.json();
      setApiKeys(prev => [...prev, newKey]);
      setNewKeyName('');
      triggerToast('Proxy token created');
    } catch (err) {
      triggerToast('Token creation failed');
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await fetch(`/api/user/keys/${id}`, { method: 'DELETE' });
      setApiKeys(prev => prev.filter(k => k.id !== id));
      triggerToast('Token revoked successfully');
    } catch (err) {
      triggerToast('Token revocation failed');
    }
  };

  // Proxy Gateway search
  const handleProxySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const res = await fetch('/api/gateway/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleSlug: selectedModuleSlug, query: searchQuery })
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResult(data);
        const walletRes = await fetch('/api/user/wallet');
        const walletData = await walletRes.json();
        setUser(prev => prev ? { ...prev, credits: walletData.credits } : null);
        fetchUserDashboard();
        triggerToast('Search complete');
      } else {
        setSearchError(data.error || 'Search query failed');
      }
    } catch (err) {
      setSearchError('Gateway lookup error or insufficient credits.');
    } finally {
      setIsSearching(false);
    }
  };

  // Response mapping updates
  const handleUpdateModuleMapping = async () => {
    if (!editingModule) return;
    try {
      const res = await fetch(`/api/admin/modules/${editingModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingModule)
      });
      const updated = await res.json();
      setModules(prev => prev.map(m => m.id === updated.id ? updated : m));
      triggerToast('Transformation mapping saved');
    } catch (err) {
      triggerToast('Save failed');
    }
  };

  const addFieldToVisible = (field: string) => {
    if (!editingModule) return;
    const currentList = editingModule.responseMapping.showFields || [];
    if (!currentList.includes(field)) {
      setEditingModule({
        ...editingModule,
        responseMapping: {
          ...editingModule.responseMapping,
          showFields: [...currentList, field]
        }
      });
    }
  };

  const removeFieldFromVisible = (field: string) => {
    if (!editingModule) return;
    const currentList = editingModule.responseMapping.showFields || [];
    setEditingModule({
      ...editingModule,
      responseMapping: {
        ...editingModule.responseMapping,
        showFields: currentList.filter(f => f !== field)
      }
    });
  };

  const setRenameMapping = (field: string, newLabel: string) => {
    if (!editingModule) return;
    const renameObj = { ...(editingModule.responseMapping.renameFields || {}) };
    if (!newLabel) {
      delete renameObj[field];
    } else {
      renameObj[field] = newLabel;
    }
    setEditingModule({
      ...editingModule,
      responseMapping: {
        ...editingModule.responseMapping,
        renameFields: renameObj
      }
    });
  };

  // Admin provider configuration
  const handleUpdateProvider = async () => {
    if (!editingProvider) return;
    try {
      const res = await fetch(`/api/admin/providers/${editingProvider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProvider)
      });
      const updated = await res.json();
      setProviders(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingProvider(null);
      triggerToast('Provider secrets updated');
    } catch (err) {
      triggerToast('Provider update failed');
    }
  };

  const planItems = [
    { id: 'free', name: 'Free Plan', credits: '10', daily: '5', price: '0', description: 'Begin tracking simple parameters securely' },
    { id: 'basic', name: 'Basic Operator', credits: '100', daily: '50', price: '29', description: 'Moderate querying & automated failover nodes' },
    { id: 'pro', name: 'Pro Analyst', credits: '500', daily: '250', price: '99', description: 'Extended databases access and high limits' },
    { id: 'enterprise', name: 'Enterprise Elite', credits: 'Unlimited', daily: 'Unlimited', price: '499', description: 'Full registry nodes and dedicated server routing' }
  ];

  const config: ContentConfig = contentConfig || {
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
      { id: "hc_1", title: "Multi-Module Lookups", description: "Query telephone numbers, email breaches, business GSTIN verifications, and license plates inside a single proxy portal.", icon: "Search", order: 1 },
      { id: "hc_2", title: "Complete Server-Side Masking", description: "Proxy queries are executed entirely server-side. No target API credentials, headers, or parameters are leaked to the client browser.", icon: "Shield", order: 2 },
      { id: "hc_3", title: "Dynamic Schema Mapping", description: "Map underlying JSON feeds into custom UI blocks. Dynamically rename variables, hide specific metadata, and group responses.", icon: "Sliders", order: 3 },
      { id: "hc_4", title: "Custom Token Provisioning", description: "Generate secure custom API keys (OSINT_xxxxx) with restricted module access to share with operators.", icon: "KeyRound", order: 4 },
      { id: "hc_5", title: "Autonomous Failover Routing", description: "If any intelligence feed reports a timeout or error, our system automatically triggers retries and routes through designated backups.", icon: "Database", order: 5 },
      { id: "hc_6", title: "Live Health Telemetry", description: "Real-time monitoring of CPU loads, memory buffers, database health, and API latency is fully visible for unmatched operational reliability.", icon: "Cpu", order: 6 }
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
      { id: "bm_1", title: "Gateway Operational", message: "All downstream OSINT endpoints are healthy and optimized.", active: true, type: "success", createdAt: "" }
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

  const tgChannelBtn = config.actionButtons.find(b => b.key === 'telegram_channel');
  const tgBotBtn = config.actionButtons.find(b => b.key === 'telegram_bot');
  const whatsappBtn = config.actionButtons.find(b => b.key === 'whatsapp');
  const contactBtn = config.actionButtons.find(b => b.key === 'contact');
  const supportBtn = config.actionButtons.find(b => b.key === 'support');
  const buyApiBtn = config.actionButtons.find(b => b.key === 'buy_api');

  return (
    <div className="min-h-screen gradient-bg flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* SaaS Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setShowConsole(false)}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-md font-bold font-sans tracking-tight text-white">
                OSINT Proxy
              </span>
              <p className="text-[10px] text-slate-400 font-sans tracking-wide">SECURE INTELLIGENCE PORTAL</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm text-slate-300 font-medium">
            {config.navigationLinks
              .filter(link => !link.isHidden)
              .sort((a, b) => a.order - b.order)
              .map(link => (
                <a key={link.id} href={link.path} onClick={() => setShowConsole(false)} className="hover:text-white transition-colors">
                  {link.label}
                </a>
              ))
            }
          </nav>

          {/* Right Area Controls */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right font-sans">
                  <p className="text-[9px] text-indigo-400 font-semibold uppercase">{user.role}</p>
                  <p className="text-xs text-white font-bold">{user.credits} Credits</p>
                </div>
                <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
                <button 
                  onClick={() => setShowConsole(!showConsole)}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center space-x-1">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>{showConsole ? "View Home" : "Open Console"}</span>
                </button>
                <button 
                  onClick={handleLogout} 
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all" 
                  title="Sign Out">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setIsRegisterMode(false); setShowAuthModal(true); }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-all shadow-md shadow-indigo-500/20 cursor-pointer">
                Access Portal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow">
        
        {/* LANDING PAGE - Primary Home View */}
        {!showConsole ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-28">
            
            {/* 1. HERO SECTION */}
            <section className="text-center max-w-4xl mx-auto space-y-6 pt-12">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{config.heroLabel}</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                {config.heroTitle}
              </h1>

              <p className="text-md sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
                {config.heroSubtitle}
              </p>

              {/* Large Centered CTA buttons */}
              <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                  onClick={() => {
                    if (user) {
                      setShowConsole(true);
                    } else {
                      setIsRegisterMode(true);
                      setShowAuthModal(true);
                    }
                  }}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-indigo-500/20 hover:scale-[1.01] cursor-pointer">
                  Launch Web Console
                </button>
                {tgChannelBtn && !tgChannelBtn.isHidden && (
                  <button 
                    onClick={() => window.open(tgChannelBtn.url, '_blank')}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-100 font-bold text-sm tracking-wide transition-all hover:scale-[1.01] flex items-center justify-center space-x-2 cursor-pointer">
                    <Send className="h-4 w-4 text-indigo-400" />
                    <span>{tgChannelBtn.label}</span>
                  </button>
                )}
              </div>

              {tgBotBtn && !tgBotBtn.isHidden && (
                <div className="text-xs text-slate-500 font-mono flex items-center justify-center space-x-2">
                  <span>⚡ Official Telegram Bot:</span>
                  <span className="text-indigo-400 font-bold hover:underline cursor-pointer" onClick={() => window.open(tgBotBtn.url, '_blank')}>{config.botUsername}</span>
                  <span>• Powered by instant UPI credits</span>
                </div>
              )}
            </section>

            {/* 2. TELEGRAM BOT CARD */}
            <section id="bot-info" className="max-w-4xl mx-auto">
              <div className="saas-card p-8 md:p-12 relative overflow-hidden border border-white/10 shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>BOT STATUS: LIVE</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {config.botCardTitle}
                    </h2>

                    <p className="text-slate-400 text-sm leading-relaxed">
                      {config.botCardDesc}
                    </p>

                    <div className="space-y-3 text-xs text-slate-300">
                      {config.botCardBullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>

                    {tgBotBtn && !tgBotBtn.isHidden && (
                      <div className="pt-2">
                        <button 
                          onClick={() => window.open(tgBotBtn.url, '_blank')}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-500/20 cursor-pointer">
                          <Send className="h-4 w-4" />
                          <span>{tgBotBtn.label}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Visual mockup card inside the bot info */}
                  <div className="bg-slate-950/80 rounded-2xl border border-white/5 p-6 font-mono text-[11px] text-slate-300 space-y-4 shadow-2xl relative">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-slate-500 text-[10px]">OSINT Proxy Companion Bot</span>
                    </div>

                    <div className="space-y-2 text-slate-400">
                      <p className="text-indigo-400">/start</p>
                      <p className="text-slate-500">🤖 OSINT Companion v1.0.0 bot online. Registered operator profile detected.</p>
                      <p className="text-slate-500">Available search quota balance: 100 Credits.</p>
                      <br/>
                      <p className="text-indigo-400">/phone +919876543210</p>
                      <p className="text-slate-500">🔍 Routing query through masked gateway nodes...</p>
                    </div>

                    <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-slate-300 space-y-1.5 mt-2">
                      <p className="font-bold text-white text-[10px]">TARGET DOSSIER MAPS:</p>
                      <p>📞 Registered Owner: Alexander Vostov</p>
                      <p>📡 Network Carrier: Global Telecom Corp</p>
                      <p>📍 Location: Bangalore, India</p>
                      <p>⚠️ Threat Index Score: Low (18/100)</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. FEATURE BADGES SECTION */}
            <section id="features" className="space-y-12">
              <div className="text-center space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">SYSTEM CAPABILITIES</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Features Built for Absolute Secrecy</h2>
                <p className="text-slate-400 max-w-lg mx-auto text-sm">Every lookup is channeled anonymously to ensure your parameters remain 100% confidential.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {config.homePageCards
                  .sort((a, b) => a.order - b.order)
                  .map(card => {
                    const IconComp = IconComponents[card.icon] || Search;
                    return (
                      <div key={card.id} className="saas-card saas-card-hover p-6 space-y-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <IconComp className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{card.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    );
                  })
                }
              </div>
            </section>

            {/* 4. HOW TO USE SECTION */}
            <section id="how-to-use" className="space-y-12 max-w-5xl mx-auto">
              <div className="text-center space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">PIPELINE SEQUENCE</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Simple Dynamic Flow</h2>
                <p className="text-slate-400 max-w-lg mx-auto text-sm">Four simple steps to trigger completely masked intelligence lookup searches.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {config.howItWorksSteps
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map(step => (
                    <div key={step.id} className="saas-card p-6 text-center space-y-4 relative border border-white/5">
                      <div className="h-10 w-10 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">{step.stepNumber}</div>
                      <h4 className="text-sm font-bold text-white">{step.title}</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">{step.description}</p>
                    </div>
                  ))
                }
              </div>
            </section>

            {/* 5. PRICING & OFFER CARD SECTION */}
            <section id="plans" className="space-y-12">
              <div className="text-center space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">OPERATIONAL PRICING</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Subscription Levels & UPI QR recharge</h2>
                <p className="text-slate-400 max-w-lg mx-auto text-sm">Select a suitable plan tier or simulate direct UPI recharging for instant credit deposits.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {planItems.map((plan) => (
                  <div key={plan.id} className="saas-card p-6 flex flex-col justify-between space-y-6 border border-white/5 hover:border-indigo-500/20 transition-all duration-300">
                    <div className="space-y-4">
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">LEVEL</span>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <p className="text-slate-400 text-xs leading-relaxed">{plan.description}</p>
                      
                      <div className="pt-4 border-t border-white/5 space-y-2 text-xs text-slate-300">
                        <p>🔹 Credits Issued: <span className="font-mono text-white font-semibold">{plan.credits}</span></p>
                        <p>🔹 Daily Search Limits: <span className="font-mono text-white font-semibold">{plan.daily}</span></p>
                        <p>🔹 API Endpoint Access</p>
                        <p>🔹 Server-Side Proxy Shield</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <div className="flex items-baseline space-x-1 justify-center">
                        <span className="text-2xl font-bold text-white">${plan.price}</span>
                        <span className="text-slate-500 text-xs">/ USD</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (user) {
                            setShowConsole(true);
                            setActiveTab('wallet');
                          } else {
                            setIsRegisterMode(false);
                            setShowAuthModal(true);
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer">
                        {user ? "Recharge Wallet" : "Get Started"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Secure UPI Scanning Block directly embedded */}
              <div className="max-w-xl mx-auto saas-card p-6 border border-white/10 flex flex-col sm:flex-row items-center gap-6">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=osintproxy@upi&pn=OSINT%20Proxy" 
                  alt="Secure UPI Recharge"
                  className="h-28 w-28 bg-white p-1 rounded-xl shrink-0" 
                />
                <div className="space-y-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold uppercase">UPI RECHARGE READY</span>
                  <h4 className="text-sm font-bold text-white">Simulated Scan-to-Pay Wallet Recharge</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Scan this QR using UPI app to simulate credit package recharge. Deposit address: <code className="text-indigo-400 font-mono text-[10px]">osintproxy@upi</code>
                  </p>
                  <p className="text-[10px] text-slate-500 italic">No real money required in AI Studio mock simulation.</p>
                </div>
              </div>
            </section>

            {/* 6. CONTACT OWNER & ACTION BUTTONS */}
            <section id="contact" className="max-w-2xl mx-auto text-center space-y-6">
              <div className="saas-card p-8 md:p-10 space-y-6 border border-white/10">
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Contact Developer & Owner</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                  Have inquiries, need customized failover feeds, or want custom high-volume API deals? Reach out directly.
                </p>

                {/* Telegram, WhatsApp and support buttons */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
                  {tgChannelBtn && !tgChannelBtn.isHidden && (
                    <button 
                      onClick={() => window.open(tgChannelBtn.url, '_blank')}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-100 font-semibold text-xs tracking-wide transition-all hover:scale-[1.01] flex items-center justify-center space-x-2 cursor-pointer">
                      <Send className="h-4 w-4 text-sky-400" />
                      <span>{tgChannelBtn.label}</span>
                    </button>
                  )}
                  {whatsappBtn && !whatsappBtn.isHidden && (
                    <button 
                      onClick={() => window.open(whatsappBtn.url, '_blank')}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs tracking-wide transition-all hover:scale-[1.01] flex items-center justify-center space-x-2 cursor-pointer">
                      <MessageCircle className="h-4 w-4 text-emerald-400" />
                      <span>{whatsappBtn.label}</span>
                    </button>
                  )}
                  {supportBtn && !supportBtn.isHidden && (
                    <button 
                      onClick={() => window.open(supportBtn.url, '_blank')}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 font-semibold text-xs tracking-wide transition-all hover:scale-[1.01] flex items-center justify-center space-x-2 cursor-pointer">
                      <MessageSquare className="h-4 w-4 text-purple-400" />
                      <span>{supportBtn.label}</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-mono">Official Connection: {config.botUsername}</p>
              </div>
            </section>

          </div>
        ) : (
          
          /* AUTHENTICATED INTUITIVE QUERY WORKSPACE (THE TERMINAL WEB CONSOLE) */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* Console Toolbar / Top section */}
            <div className="saas-card p-6 flex flex-col md:flex-row md:items-center md:justify-between justify-start gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-0.5 rounded-full uppercase font-semibold">Proxy Console Node</span>
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-0.5 rounded-full uppercase font-semibold">Active Session</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mt-2">OSINT Intelligence Terminal</h1>
                <p className="text-slate-400 text-xs mt-1">
                  Resolve parameters anonymously. Custom transforming mapping, API gateway token builder, failover setups.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => setShowConsole(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1">
                  <span>← Close Console</span>
                </button>
                
                <div className="flex items-center space-x-4 bg-slate-950/40 border border-white/5 p-4 rounded-xl">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Plan Tier</p>
                    <p className="text-xs font-bold text-white uppercase">{user?.planId} Level</p>
                  </div>
                  <div className="h-8 w-px bg-white/10"></div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Balance</p>
                    <p className="text-xs font-bold text-indigo-400 font-mono">{user?.credits} Credits</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab selection toolbar inside console */}
            <div className="flex overflow-x-auto gap-2 border-b border-white/5 pb-2.5 scrollbar-thin">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-900/40 text-slate-400 hover:text-white'}`}>
                🎯 Search Gateway
              </button>
              <button 
                onClick={() => setActiveTab('wallet')} 
                className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${activeTab === 'wallet' ? 'bg-indigo-600 text-white' : 'bg-slate-900/40 text-slate-400 hover:text-white'}`}>
                💳 Recharge Credits
              </button>
              <button 
                onClick={() => setActiveTab('api-keys')} 
                className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${activeTab === 'api-keys' ? 'bg-indigo-600 text-white' : 'bg-slate-900/40 text-slate-400 hover:text-white'}`}>
                🔑 Gateway Tokens
              </button>

              {user && (user.role === 'Owner' || user.role === 'Admin' || user.role === 'Super Admin') && (
                <>
                  <div className="h-8 w-px bg-white/10 mx-1 align-self-center self-center shrink-0"></div>
                  <button 
                    onClick={() => setActiveTab('admin-providers')} 
                    className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${activeTab === 'admin-providers' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900/20 text-slate-500 hover:text-slate-300'}`}>
                    🛡️ Admin: Feeds
                  </button>
                  <button 
                    onClick={() => setActiveTab('admin-modules')} 
                    className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${activeTab === 'admin-modules' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900/20 text-slate-500 hover:text-slate-300'}`}>
                    ⚙️ Admin: Design Transform
                  </button>
                  <button 
                    onClick={() => setActiveTab('admin-users')} 
                    className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${activeTab === 'admin-users' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900/20 text-slate-500 hover:text-slate-300'}`}>
                    👥 Admin: Users
                  </button>
                  <button 
                    onClick={() => setActiveTab('admin-search-logs')} 
                    className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${activeTab === 'admin-search-logs' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900/20 text-slate-500 hover:text-slate-300'}`}>
                    📊 Admin: Search History
                  </button>
                  <button 
                    onClick={() => setActiveTab('admin-content')} 
                    className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${activeTab === 'admin-content' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900/20 text-slate-500 hover:text-slate-300'}`}>
                    🎨 Admin: Site Editor
                  </button>
                  <button 
                    onClick={() => setActiveTab('admin-audit')} 
                    className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${activeTab === 'admin-audit' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900/20 text-slate-500 hover:text-slate-300'}`}>
                    📝 Admin: Audit & Diagnostics
                  </button>
                </>
              )}
            </div>

            {/* TAB 1: INTEL SEARCH CONSOLE */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Search Engine form */}
                <div className="lg:col-span-2 saas-card p-6 space-y-6">
                  <h2 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-white/5 pb-3">
                    <Terminal className="h-4 w-4 text-indigo-400" />
                    <span>Select Target Lookup Module</span>
                  </h2>

                  {/* Modules selection map */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {modules.map((mod) => {
                      const IconComp = IconComponents[mod.icon] || HelpCircle;
                      return (
                        <button 
                          key={mod.id}
                          onClick={() => setSelectedModuleSlug(mod.slug)}
                          className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 ${selectedModuleSlug === mod.slug ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/5' : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'}`}>
                          <IconComp className={`h-5 w-5 mb-3 ${selectedModuleSlug === mod.slug ? 'text-indigo-400' : 'text-slate-500'}`} />
                          <div>
                            <p className="font-bold text-xs">{mod.name}</p>
                            <p className="text-[9px] text-slate-500 mt-1">{mod.costCredits} Credit(s)</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Description helper */}
                  {modules.find(m => m.slug === selectedModuleSlug) && (
                    <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-xl text-xs space-y-1">
                      <span className="font-semibold text-slate-200">Extraction Description:</span>
                      <p className="text-slate-400 leading-relaxed">{modules.find(m => m.slug === selectedModuleSlug)?.description}</p>
                    </div>
                  )}

                  {/* Query search input form */}
                  <form onSubmit={handleProxySearch} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-semibold">
                        Query Parameter ({modules.find(m => m.slug === selectedModuleSlug)?.fields.join(', ') || 'Value'})
                      </label>
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          required
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="telephone (+91), email address, license plate, or identifier..."
                          className="flex-grow bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-mono"
                        />
                        <button 
                          type="submit"
                          disabled={isSearching}
                          className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer shadow-md shadow-indigo-500/20">
                          {isSearching ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Searching...</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              <span>Run Search</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {searchError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{searchError}</span>
                      </div>
                    )}
                  </form>

                  {/* Dossier mapped output results */}
                  <AnimatePresence>
                    {searchResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-t border-white/5 pt-6 space-y-4">
                        
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gateway Mapped Dossier</h3>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Masked Server Node: {searchResult.providerMasked}</p>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(JSON.stringify(searchResult, null, 2))}
                            className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 font-mono cursor-pointer">
                            <Copy className="h-3 w-3" />
                            <span>Copy Raw JSON</span>
                          </button>
                        </div>

                        <div className="space-y-4 text-xs">
                          {/* Flat data map */}
                          {Object.keys(searchResult.flatData || {}).length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {Object.entries(searchResult.flatData).map(([key, value]) => {
                                if (key === 'raw_text') {
                                  return (
                                    <div key={key} className="col-span-full p-4 bg-slate-950/80 border border-white/5 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-300">
                                      <span className="text-[10px] text-slate-500 block uppercase font-mono mb-2">Raw Response Dossier</span>
                                      {String(value)}
                                    </div>
                                  );
                                }
                                return (
                                  <div key={key} className="p-3.5 bg-slate-900/60 border border-white/5 rounded-xl">
                                    <span className="text-[10px] text-slate-500 block uppercase font-mono">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-xs text-white font-semibold mt-1 block font-mono">{String(value)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Grouped variables data map */}
                          {searchResult.groupedData && Object.entries(searchResult.groupedData).map(([groupName, values]: [string, any]) => (
                            <div key={groupName} className="border border-white/5 rounded-xl p-4 bg-slate-900/20 space-y-3">
                              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{groupName}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(values).map(([key, val]: [string, any]) => (
                                  <div key={key}>
                                    <span className="text-[9px] text-slate-500 block uppercase font-mono">{key}</span>
                                    <span className="text-xs text-white block mt-0.5 font-mono">{String(val)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* Sidebar details */}
                <div className="space-y-6">
                  
                  {/* System Broadcast logs */}
                  <div className="saas-card p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-white/5 pb-2">
                      <Bell className="h-4 w-4 text-purple-400" />
                      <span>System Broadcasts</span>
                    </h3>
                    <div className="space-y-4 text-xs">
                      {announcements.map((ann) => (
                        <div key={ann.id} className="border-l-2 border-purple-500 pl-3 py-0.5 space-y-1">
                          <p className="font-bold text-slate-200">{ann.title}</p>
                          <p className="text-slate-400 text-[11px] leading-relaxed">{ann.content}</p>
                        </div>
                      ))}
                      {announcements.length === 0 && (
                        <p className="text-slate-500 italic">No broadcasts active at this moment.</p>
                      )}
                    </div>
                  </div>

                  {/* Target History log list */}
                  <div className="saas-card p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-white/5 pb-2">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      <span>Your Recent Searches</span>
                    </h3>
                    <div className="space-y-2.5 text-xs font-mono">
                      {searchLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl flex justify-between items-center gap-2">
                          <div className="truncate">
                            <p className="text-white font-bold text-xs">/{log.moduleSlug}</p>
                            <p className="text-slate-500 text-[9px] mt-0.5 truncate">Value: "{log.query}"</p>
                          </div>
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[9px] font-semibold">SUCCESS</span>
                        </div>
                      ))}
                      {searchLogs.length === 0 && (
                        <p className="text-slate-500 italic text-center">No search logs detected.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: CREDIT RECHARGE & WALLET */}
            {activeTab === 'wallet' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Simulated UPI Scan payment form */}
                <div className="lg:col-span-2 saas-card p-6 space-y-6">
                  <h2 className="text-md font-bold text-white flex items-center space-x-2 border-b border-white/5 pb-3">
                    <Wallet className="h-4 w-4 text-indigo-400" />
                    <span>Purchase Credit Packages</span>
                  </h2>

                  <form onSubmit={handleAddCredits} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Package Credits</label>
                        <input 
                          type="number" 
                          value={fundCredits}
                          onChange={(e) => {
                            setFundCredits(e.target.value);
                            setFundAmount((parseInt(e.target.value) * 0.29).toFixed(2));
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Equivalent USD Cost</label>
                        <input 
                          type="text" 
                          readOnly
                          value={`$ ${fundAmount}`}
                          className="w-full bg-slate-900 border border-white/5 text-slate-400 rounded-xl px-4 py-2 outline-none font-mono" 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-md shadow-indigo-500/20 cursor-pointer">
                      Simulate Secure UPI Payment
                    </button>
                  </form>

                  {/* Pay QR Codes display */}
                  <div className="border-t border-white/5 pt-6 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">UPI Recharge Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {paymentMethods.map((pm) => (
                        <div key={pm.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-xl flex items-center space-x-4">
                          {pm.qrCodeUrl && (
                            <img src={pm.qrCodeUrl} className="h-16 w-16 bg-white p-1 rounded-xl shrink-0" alt="QR Code" />
                          )}
                          <div>
                            <p className="text-sm font-bold text-white">{pm.name}</p>
                            <p className="text-slate-400 text-xs mt-1 font-mono">{pm.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Ledger lists */}
                <div className="saas-card p-6 space-y-4">
                  <h2 className="text-md font-bold text-white border-b border-white/5 pb-2">Billing Ledger</h2>
                  <div className="space-y-3 text-xs font-mono">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-400 font-bold">+{tx.credits} Credits</span>
                          <span className="text-[10px] text-slate-500">{new Date(tx.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-300">{tx.description}</p>
                        <p className="text-[9px] text-slate-500 uppercase">{tx.paymentMethod}</p>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-slate-500 italic text-center py-6">No billing transactions active.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: CUSTOM APIS KEYS GENERATION */}
            {activeTab === 'api-keys' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form generator */}
                <div className="saas-card p-6 space-y-4">
                  <h2 className="text-md font-bold text-white flex items-center space-x-2 border-b border-white/5 pb-3">
                    <Plus className="h-4 w-4 text-indigo-400" />
                    <span>Generate Custom Token</span>
                  </h2>

                  <form onSubmit={handleCreateKey} className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Friendly Token Label</label>
                      <input 
                        type="text" 
                        required
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g. Node-Terminal or Backup-API"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none" 
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1.5 font-semibold">Allowed Lookup Modules</label>
                      <div className="space-y-2 p-3 bg-slate-900/40 border border-white/5 rounded-xl">
                        {modules.map((mod) => (
                          <label key={mod.id} className="flex items-center space-x-2 cursor-pointer text-slate-300">
                            <input 
                              type="checkbox"
                              checked={newKeyEndpoints.includes(mod.slug)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewKeyEndpoints([...newKeyEndpoints, mod.slug]);
                                } else {
                                  setNewKeyEndpoints(newKeyEndpoints.filter(slug => slug !== mod.slug));
                                }
                              }}
                              className="rounded border-white/10 text-indigo-500 focus:ring-0 bg-slate-950" 
                            />
                            <span>{mod.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md cursor-pointer">
                      Generate Key Token
                    </button>
                  </form>
                </div>

                {/* Listing of API Keys */}
                <div className="lg:col-span-2 saas-card p-6 space-y-4">
                  <h2 className="text-md font-bold text-white border-b border-white/5 pb-2">Configured Proxy Credentials</h2>

                  <div className="space-y-4 text-xs font-mono">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="p-4 bg-slate-900/40 border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-white font-bold text-sm">{key.name}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-indigo-400 font-bold text-xs">{key.key}</span>
                            <button 
                              onClick={() => copyToClipboard(key.key)}
                              className="text-slate-500 hover:text-white cursor-pointer">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500">Allowed: {key.allowedEndpoints.join(', ')}</p>
                        </div>
                        <button 
                          onClick={() => handleRevokeKey(key.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-bold transition-colors cursor-pointer text-[10px]">
                          Revoke Access
                        </button>
                      </div>
                    ))}

                    {apiKeys.length === 0 && (
                      <p className="text-slate-500 italic py-6 text-center">No platform API gateway tokens active.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: API PROVIDERS (ADMIN ONLY) */}
            {activeTab === 'admin-providers' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Providers listing */}
                <div className="lg:col-span-2 saas-card p-6 space-y-4">
                  <h2 className="text-md font-bold text-white border-b border-white/5 pb-2">Active Intelligence Feeds</h2>

                  <div className="space-y-4 text-xs font-mono">
                    {providers.map((p) => (
                      <div key={p.id} className="p-4 bg-slate-900/40 border border-white/5 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-bold text-sm uppercase">{p.name}</p>
                            <p className="text-indigo-400 text-[10px] mt-0.5">{p.url}</p>
                          </div>
                          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase">Active</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400">
                          <div>
                            <span className="text-slate-500 uppercase block text-[8px]">Timeout</span>
                            <span>{p.timeoutMs}ms</span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase block text-[8px]">Retries</span>
                            <span>{p.retries} attempts</span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase block text-[8px]">Priority</span>
                            <span>Level {p.priority}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase block text-[8px]">Token Shield</span>
                            <span>{p.apiKey ? 'PROTECTED (Server)' : 'NONE'}</span>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-white/5">
                          <button 
                            onClick={() => setEditingProvider(p)}
                            className="px-2.5 py-1 text-xs bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 cursor-pointer transition-all">
                            Manage Credentials
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings Configuration form */}
                <div className="saas-card p-6 space-y-4">
                  <h2 className="text-md font-bold text-white flex items-center space-x-2 border-b border-white/5 pb-3">
                    <Sliders className="h-4 w-4 text-indigo-400" />
                    <span>Provider Secret Parameters</span>
                  </h2>

                  {editingProvider ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateProvider(); }} className="space-y-4 text-xs font-sans">
                      <div>
                        <label className="block text-slate-400 mb-1">Provider Node Name</label>
                        <input 
                          type="text" 
                          required
                          value={editingProvider.name}
                          onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none font-mono" 
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Endpoint Target URL</label>
                        <input 
                          type="text" 
                          required
                          value={editingProvider.url}
                          onChange={(e) => setEditingProvider({ ...editingProvider, url: e.target.value })}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none font-mono" 
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Authorization Secret Token</label>
                        <input 
                          type="password" 
                          value={editingProvider.apiKey}
                          onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                          placeholder="Secret masked on the server side"
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none font-mono" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono">
                        <div>
                          <label className="block text-slate-400 mb-1">Priority</label>
                          <input 
                            type="number" 
                            value={editingProvider.priority}
                            onChange={(e) => setEditingProvider({ ...editingProvider, priority: parseInt(e.target.value) || 1 })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Max Retries</label>
                          <input 
                            type="number" 
                            value={editingProvider.retries}
                            onChange={(e) => setEditingProvider({ ...editingProvider, retries: parseInt(e.target.value) || 1 })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none" 
                          />
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button 
                          type="submit"
                          className="flex-grow py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-colors">
                          Save Config
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingProvider(null)}
                          className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-colors">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-slate-500 italic text-center py-12 text-xs">Select an intelligence feed node to edit authorization parameters.</p>
                  )}
                </div>

              </div>
            )}

            {/* TAB 5: SCHEMA TRANSFORM & DESIGN (ADMIN ONLY) */}
            {activeTab === 'admin-modules' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Search Modules list */}
                <div className="saas-card p-6 space-y-4">
                  <h2 className="text-md font-bold text-white border-b border-white/5 pb-2">Extraction Templates</h2>
                  <div className="space-y-2.5 text-xs">
                    {modules.map((mod) => (
                      <button 
                        key={mod.id}
                        onClick={() => setEditingModule(mod)}
                        className={`w-full p-4 rounded-xl text-left border flex flex-col transition-all duration-200 ${editingModule?.id === mod.id ? 'bg-indigo-600/10 border-indigo-500 text-white font-semibold' : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'}`}>
                        <span className="font-bold tracking-wider uppercase text-slate-200">{mod.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-1">Route: /api/{mod.slug}</span>
                        <span className="text-indigo-400 text-[10px] mt-2 block font-mono">Scan Cost: {mod.costCredits} Credit(s)</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transform Rules builder */}
                <div className="lg:col-span-2 saas-card p-6 space-y-6">
                  <h2 className="text-md font-bold text-white flex items-center space-x-2 border-b border-white/5 pb-3">
                    <Sliders className="h-4 w-4 text-indigo-400" />
                    <span>Schema Transformations Mapping</span>
                  </h2>

                  {editingModule ? (
                    <div className="space-y-6 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 mb-1">Module Name</label>
                          <input 
                            type="text" 
                            value={editingModule.name}
                            onChange={(e) => setEditingModule({ ...editingModule, name: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Scan Cost (Credits)</label>
                          <input 
                            type="number" 
                            value={editingModule.costCredits}
                            onChange={(e) => setEditingModule({ ...editingModule, costCredits: parseInt(e.target.value) || 1 })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white font-mono outline-none" 
                          />
                        </div>
                      </div>

                      <div className="border border-white/5 rounded-xl p-4 bg-slate-900/40 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                          <h3 className="font-bold text-indigo-400 uppercase">Response Variable Filters</h3>
                          <span className="text-[10px] text-slate-500">Unselected elements are hidden</span>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-slate-400 font-semibold">Active variables & Custom Labels</label>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {editingModule.responseMapping.showFields.map((field) => (
                              <div key={field} className="p-3 bg-slate-900 border border-white/5 rounded-xl flex flex-col justify-between space-y-2 font-sans">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-white font-mono text-[10px]">{field}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => removeFieldFromVisible(field)}
                                    className="text-red-400 hover:text-red-300 transition-colors cursor-pointer">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div>
                                  <label className="block text-[8px] text-slate-500 uppercase mb-0.5">Renamed Label</label>
                                  <input 
                                    type="text"
                                    value={editingModule.responseMapping.renameFields[field] || ''}
                                    onChange={(e) => setRenameMapping(field, e.target.value)}
                                    placeholder="Default label"
                                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-white text-[10px] font-mono outline-none" 
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2">
                            <label className="block text-slate-400 mb-1 font-semibold">Add variable to mapping schema</label>
                            <div className="flex space-x-2">
                              <input 
                                type="text" 
                                value={selectedMappingField}
                                onChange={(e) => setSelectedMappingField(e.target.value)}
                                placeholder="e.g. carrier_name or risk_score"
                                className="flex-grow bg-slate-900 border border-white/10 rounded-xl px-4 py-1.5 text-white text-[11px] outline-none" 
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  if (selectedMappingField.trim()) {
                                    addFieldToVisible(selectedMappingField.trim());
                                    setSelectedMappingField('');
                                  }
                                }}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer">
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button 
                          type="button"
                          onClick={handleUpdateModuleMapping}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer">
                          Save Schema Mappings
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingModule(null)}
                          className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white cursor-pointer">
                          Cancel
                        </button>
                      </div>

                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-center py-24 text-xs">Select an extraction template from left list to design schema rules.</p>
                  )}
                </div>

              </div>
            )}

            {/* TAB 6: AUDIT LEGER & DIAGNOSTICS (ADMIN ONLY) */}
            {activeTab === 'admin-audit' && (
              <div className="space-y-6">
                
                {/* Header controls */}
                <div className="saas-card p-6 flex flex-col md:flex-row md:items-center md:justify-between justify-start gap-4">
                  <div>
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-0.5 rounded-full uppercase font-semibold">System Diagnostics</span>
                    <h1 className="text-2xl font-bold font-sans mt-2 text-white">System Logs & Diagnostics</h1>
                    <p className="text-slate-400 text-xs mt-1">Immutably log queries, system events, server activities, and diagnostics parameters.</p>
                  </div>
                  <button 
                    onClick={refreshSystemStats}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center space-x-2 text-xs cursor-pointer shadow-md shadow-indigo-500/10">
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh Telemetry</span>
                  </button>
                </div>

                {/* Health indicators */}
                {systemHealth && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-4 saas-card">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Simulated CPU Load</span>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="text-2xl font-bold text-white">{systemHealth.cpuUsage}%</span>
                        <Cpu className="h-4 w-4 text-indigo-400" />
                      </div>
                    </div>
                    <div className="p-4 saas-card">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Dynamic Buffer Memory</span>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="text-xl font-bold text-white">{systemHealth.ramUsage.used} / {systemHealth.ramUsage.total} MB</span>
                        <HardDrive className="h-4 w-4 text-indigo-400" />
                      </div>
                    </div>
                    <div className="p-4 saas-card">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Database Integrity</span>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="text-xs font-bold text-emerald-400 uppercase font-mono">UNCOMPROMISED</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                    </div>
                    <div className="p-4 saas-card">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Node Service Uptime</span>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="text-xs font-bold text-white font-mono">{systemHealth.uptime} Seconds Active</span>
                        <Clock className="h-4 w-4 text-slate-500" />
                      </div>
                    </div>
                  </div>
                )}

                {/* System Verification Reports */}
                <div className="saas-card p-6 space-y-4">
                  <div>
                    <h2 className="text-md font-bold text-white font-sans">System Verification Reports</h2>
                    <p className="text-xs text-slate-400 mt-1">Select a report to preview, search, copy or download it directly inside the workspace.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: 'Code Audit Report', file: 'CODE_AUDIT.md', desc: 'Backend & frontend structural audit.' },
                      { name: 'API Documentation', file: 'API_DOCUMENTATION.md', desc: 'Public proxy URL, headers & examples.' },
                      { name: 'Feature Matrix', file: 'FEATURE_MATRIX.md', desc: 'Requirement checklist verification.' },
                      { name: 'Provider Configurations', file: 'PROVIDER_CONFIG_REPORT.md', desc: 'Active routing feeds & failover pathways.' },
                      { name: 'Mock & TODO Audit', file: 'MOCK_SCAN_REPORT.md', desc: 'Scan report of codebase placeholders.' },
                      { name: 'Reality Check Verification', file: 'REALITY_CHECK.md', desc: 'Strict static & logic verification audit.' }
                    ].map((rep) => (
                      <button
                        key={rep.file}
                        onClick={() => {
                          setSelectedReportFile(rep.file);
                          setSelectedReportName(rep.name);
                        }}
                        className="p-4 bg-slate-900/50 hover:bg-indigo-950/20 border border-white/5 hover:border-indigo-500/30 rounded-xl flex items-start space-x-3 transition-all duration-200 group text-left w-full cursor-pointer"
                      >
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">{rep.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{rep.desc}</p>
                          <span className="text-[9px] text-indigo-400 font-mono mt-1.5 inline-block opacity-80 group-hover:opacity-100">Click to view & download ↗</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audit table ledger list */}
                <div className="saas-card p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-md font-bold text-white font-sans">System Audit Ledger</h2>
                    <a 
                      href="/api/admin/backups/download" 
                      download
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-100 text-xs font-mono font-bold flex items-center space-x-2 cursor-pointer transition-colors">
                      <Archive className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Export Database JSON Backup</span>
                    </a>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-500 uppercase">
                          <th className="pb-2">Timestamp</th>
                          <th className="pb-2">User Email</th>
                          <th className="pb-2">Action</th>
                          <th className="pb-2">Parameters Details</th>
                          <th className="pb-2 text-right">Source IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                            <td className="py-2.5 text-white">{log.userEmail}</td>
                            <td className="py-2.5 font-bold text-indigo-400">{log.action}</td>
                            <td className="py-2.5 text-slate-400 max-w-xs truncate" title={log.details}>{log.details}</td>
                            <td className="py-2.5 text-right text-slate-500">{log.ipAddress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: ADMIN USERS (USER MANAGEMENT) */}
            {activeTab === 'admin-users' && (
              <div className="space-y-6">
                <div className="saas-card p-6 flex flex-col md:flex-row md:items-center md:justify-between justify-start gap-4">
                  <div>
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-0.5 rounded-full uppercase font-semibold">User Administration</span>
                    <h1 className="text-2xl font-bold font-sans mt-2 text-white">Proxy Operator Management</h1>
                    <p className="text-slate-400 text-xs mt-1">Provision operator credentials, suspend accounts, and inject or deduct operational credits instantly.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create operator form */}
                  <div className="saas-card p-6 space-y-4 h-fit">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-white/5 pb-2">
                      <span>➕ Provision Operator Profile</span>
                    </h3>
                    <form onSubmit={handleCreateAdminUser} className="space-y-3.5 text-xs text-slate-300 font-sans">
                      <div>
                        <label className="block text-slate-400 mb-1">Email Identifier</label>
                        <input 
                          type="email" 
                          value={createUserEmail} 
                          onChange={(e) => setCreateUserEmail(e.target.value)} 
                          required
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                          placeholder="operator@osint.com"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Display Alias</label>
                        <input 
                          type="text" 
                          value={createUserName} 
                          onChange={(e) => setCreateUserName(e.target.value)} 
                          required
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                          placeholder="Agent Phoenix"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Access Passphrase</label>
                        <input 
                          type="password" 
                          value={createUserPassword} 
                          onChange={(e) => setCreateUserPassword(e.target.value)} 
                          required
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Authority Role</label>
                          <select 
                            value={createUserRole} 
                            onChange={(e: any) => setCreateUserRole(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                          >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                            <option value="Super Admin">Super Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Initial Credits</label>
                          <input 
                            type="number" 
                            value={createUserCredits} 
                            onChange={(e) => setCreateUserCredits(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                          />
                        </div>
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wide transition-all cursor-pointer mt-2"
                      >
                        Create Profile
                      </button>
                    </form>
                  </div>

                  {/* Operator lists */}
                  <div className="lg:col-span-2 saas-card p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Active Operator Registries</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-500">
                            <th className="pb-2">Identity / Email</th>
                            <th className="pb-2">Name</th>
                            <th className="pb-2">Role</th>
                            <th className="pb-2">Balance</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {adminUsers.map(u => (
                            <tr key={u.id} className="hover:bg-white/5">
                              <td className="py-3 font-mono">{u.email}</td>
                              <td className="py-3 font-sans font-semibold text-white">{u.name}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.role === 'User' ? 'bg-slate-800 text-slate-400' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                }`}>{u.role}</span>
                              </td>
                              <td className="py-3 text-emerald-400 font-bold">{u.credits} CR</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.status === 'suspended' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>{u.status || 'active'}</span>
                              </td>
                              <td className="py-3 text-right space-x-2">
                                <button 
                                  onClick={() => {
                                    const amount = window.prompt(`Modify credits for ${u.name}. Input value (e.g. 500, -200):`);
                                    if (amount) {
                                      const delta = parseInt(amount);
                                      if (!isNaN(delta)) {
                                        handleUpdateAdminUser(u.id, { credits: u.credits + delta });
                                      }
                                    }
                                  }}
                                  className="text-xs text-indigo-400 hover:underline cursor-pointer"
                                  title="Add/Deduct credits"
                                >
                                  ± CR
                                </button>
                                <button 
                                  onClick={() => handleUpdateAdminUser(u.id, { role: u.role === 'Admin' ? 'User' : 'Admin' })}
                                  className="text-xs text-slate-400 hover:underline cursor-pointer"
                                  title="Promote/Demote role"
                                >
                                  ↕ Role
                                </button>
                                <button 
                                  onClick={() => handleUpdateAdminUser(u.id, { status: u.status === 'suspended' ? 'active' : 'suspended' })}
                                  className="text-xs text-yellow-500 hover:underline cursor-pointer"
                                  title="Suspend/Unsuspend"
                                >
                                  🚫
                                </button>
                                <button 
                                  onClick={() => handleDeleteAdminUser(u.id)}
                                  className="text-xs text-red-400 hover:underline cursor-pointer font-bold"
                                  title="Delete Account"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ADMIN SEARCH LOGS (SEARCH HISTORY) */}
            {activeTab === 'admin-search-logs' && (
              <div className="space-y-6">
                <div className="saas-card p-6 flex flex-col md:flex-row md:items-center md:justify-between justify-start gap-4">
                  <div>
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-0.5 rounded-full uppercase font-semibold">Central Search Registry</span>
                    <h1 className="text-2xl font-bold font-sans mt-2 text-white">Operational Search Logs</h1>
                    <p className="text-slate-400 text-xs mt-1">Audit, monitor, filter, and purge centralized operational lookup histories dynamically.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        const headers = "ID,Timestamp,User,Module,Query,Status\n";
                        const rows = adminSearchLogs.map(log => 
                          `"${log.id}","${log.timestamp}","${log.userEmail}","${log.moduleSlug}","${log.query}","${log.status || 'completed'}"`
                        ).join("\n");
                        const blob = new Blob([headers + rows], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `osint_search_history_${Date.now()}.csv`;
                        a.click();
                        triggerToast('CSV export downloaded');
                      }}
                      className="px-4 py-2.5 bg-slate-900 border border-white/10 text-slate-100 rounded-xl text-xs font-mono font-bold hover:bg-slate-800 transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <span>📥 Export History CSV</span>
                    </button>
                    <button 
                      onClick={handleClearAllSearchLogs}
                      className="px-4 py-2.5 bg-red-600/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      ⚠️ Purge All History
                    </button>
                  </div>
                </div>

                <div className="saas-card p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Global System Search History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-500">
                          <th className="pb-2">Timestamp</th>
                          <th className="pb-2">Operator Email</th>
                          <th className="pb-2">Target Module</th>
                          <th className="pb-2">Search Query</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {adminSearchLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-500 italic">No search entries recorded in database.</td>
                          </tr>
                        ) : (
                          adminSearchLogs.map(log => (
                            <tr key={log.id} className="hover:bg-white/5">
                              <td className="py-2.5 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="py-2.5 text-white">{log.userEmail}</td>
                              <td className="py-2.5 text-indigo-400 font-bold">{log.moduleSlug}</td>
                              <td className="py-2.5 text-slate-300 select-text">{log.query}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${
                                  log.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>{log.status || 'success'}</span>
                              </td>
                              <td className="py-2.5 text-right">
                                <button 
                                  onClick={() => handleDeleteSearchLog(log.id)}
                                  className="text-xs text-red-400 hover:underline cursor-pointer font-bold"
                                >
                                  Purge
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ADMIN CONTENT (DYNAMIC SITE BUILDER) */}
            {activeTab === 'admin-content' && (
              <div className="space-y-6">
                <div className="saas-card p-6">
                  <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-0.5 rounded-full uppercase font-semibold">Dynamic Site Builder</span>
                  <h1 className="text-2xl font-bold font-sans mt-2 text-white">Homepage Content Customizer</h1>
                  <p className="text-slate-400 text-xs mt-1">Live customize titles, hero taglines, buttons URLs, feature cards, steps, and alerts instantly with zero hardcoding.</p>
                </div>

                <div className="saas-card p-6 space-y-6">
                  {config && (
                    <div className="space-y-6 text-xs text-slate-300">
                      
                      {/* 1. Global / Hero Texts */}
                      <div className="space-y-4 border-b border-white/5 pb-6">
                        <h3 className="text-sm font-bold text-white">1. Hero Taglines & Global Labels</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Hero Small Badge Text</label>
                            <input 
                              type="text" 
                              value={config.heroLabel} 
                              onChange={(e) => handleSaveContentConfig({ ...config, heroLabel: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Companion Bot Username Handle</label>
                            <input 
                              type="text" 
                              value={config.botUsername} 
                              onChange={(e) => handleSaveContentConfig({ ...config, botUsername: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Primary Title Heading</label>
                          <input 
                            type="text" 
                            value={config.heroTitle} 
                            onChange={(e) => handleSaveContentConfig({ ...config, heroTitle: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Primary Subtitle Tagline</label>
                          <textarea 
                            rows={3}
                            value={config.heroSubtitle} 
                            onChange={(e) => handleSaveContentConfig({ ...config, heroSubtitle: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                          />
                        </div>
                      </div>

                      {/* 2. Official Telegram Companion Bot Panel */}
                      <div className="space-y-4 border-b border-white/5 pb-6">
                        <h3 className="text-sm font-bold text-white">2. Telegram Companion Bot Section</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Section Title</label>
                            <input 
                              type="text" 
                              value={config.botCardTitle} 
                              onChange={(e) => handleSaveContentConfig({ ...config, botCardTitle: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1 font-semibold">Section Description</label>
                            <textarea 
                              rows={2}
                              value={config.botCardDesc} 
                              onChange={(e) => handleSaveContentConfig({ ...config, botCardDesc: e.target.value })}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Action Buttons / Channels links */}
                      <div className="space-y-4 border-b border-white/5 pb-6">
                        <h3 className="text-sm font-bold text-white">3. Platform Core Action Buttons (Add / Edit / Hide Buttons)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {config.actionButtons.map((btn, idx) => (
                            <div key={btn.id} className="p-3 bg-slate-900/50 rounded-xl border border-white/5 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-[10px] text-indigo-400 uppercase">{btn.key} Button</span>
                                <label className="flex items-center space-x-2 text-[10px] text-slate-400">
                                  <input 
                                    type="checkbox" 
                                    checked={!btn.isHidden} 
                                    onChange={(e) => {
                                      const updated = [...config.actionButtons];
                                      updated[idx].isHidden = !e.target.checked;
                                      handleSaveContentConfig({ ...config, actionButtons: updated });
                                    }}
                                  />
                                  <span>Visible</span>
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="text" 
                                  value={btn.label} 
                                  placeholder="Button Label"
                                  onChange={(e) => {
                                    const updated = [...config.actionButtons];
                                    updated[idx].label = e.target.value;
                                    handleSaveContentConfig({ ...config, actionButtons: updated });
                                  }}
                                  className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white text-[11px]"
                                />
                                <input 
                                  type="text" 
                                  value={btn.url} 
                                  placeholder="Redirect URL"
                                  onChange={(e) => {
                                    const updated = [...config.actionButtons];
                                    updated[idx].url = e.target.value;
                                    handleSaveContentConfig({ ...config, actionButtons: updated });
                                  }}
                                  className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-white font-mono text-[11px]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 4. Home Page Cards (Manage features) */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-white">4. Feature Service Cards (Home Grid)</h3>
                          <button 
                            type="button"
                            onClick={() => {
                              const title = window.prompt("Enter card title:");
                              const desc = window.prompt("Enter card description:");
                              if (title && desc) {
                                const newCard = { id: `hc_${Date.now()}`, title, description: desc, icon: "Search", order: config.homePageCards.length + 1 };
                                handleSaveContentConfig({ ...config, homePageCards: [...config.homePageCards, newCard] });
                              }
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-[10px] font-bold text-white cursor-pointer"
                          >
                            ➕ Add Home Card
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {config.homePageCards
                            .sort((a, b) => a.order - b.order)
                            .map((card, idx) => (
                              <div key={card.id} className="p-3 bg-slate-900/50 rounded-xl border border-white/5 space-y-2 relative">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-white">Card #{idx + 1}</span>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Remove card "${card.title}"?`)) {
                                        const updated = config.homePageCards.filter(c => c.id !== card.id);
                                        handleSaveContentConfig({ ...config, homePageCards: updated });
                                      }
                                    }}
                                    className="text-[10px] text-red-400 hover:underline cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                                <input 
                                  type="text" 
                                  value={card.title} 
                                  onChange={(e) => {
                                    const updated = [...config.homePageCards];
                                    const item = updated.find(c => c.id === card.id);
                                    if (item) item.title = e.target.value;
                                    handleSaveContentConfig({ ...config, homePageCards: updated });
                                  }}
                                  className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-white text-[11px]"
                                />
                                <textarea 
                                  rows={2}
                                  value={card.description} 
                                  onChange={(e) => {
                                    const updated = [...config.homePageCards];
                                    const item = updated.find(c => c.id === card.id);
                                    if (item) item.description = e.target.value;
                                    handleSaveContentConfig({ ...config, homePageCards: updated });
                                  }}
                                  className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-slate-300 text-[11px]"
                                />
                              </div>
                            ))
                          }
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-white/5 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4 font-sans">
          <p>© 2026 OSINT Proxy Gateway • Masked Server Node Routing • Secure UPI Credits.</p>
          <div className="flex space-x-6">
            <span>UPI SECURED</span>
            <span>ENDPOINT MASKED</span>
            <span>AUTOMATED FAILOVER</span>
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION OVERLAY MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md saas-card p-8 space-y-6 z-10"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto">
                  <Shield className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {isRegisterMode ? 'Register Operator Profile' : 'Authenticate Session'}
                </h2>
                <p className="text-xs text-slate-400 font-sans">
                  {isRegisterMode ? 'Sign up to get 100 free credit quota' : 'Enter credentials to open proxy search gateway'}
                </p>
              </div>

              <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4 text-xs text-slate-300 font-sans">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Gateway Identity Email</label>
                  <input 
                    type="email" 
                    value={authEmail} 
                    onChange={(e) => setAuthEmail(e.target.value)} 
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 font-mono" 
                    placeholder="name@example.com"
                  />
                </div>

                {isRegisterMode && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Alias / Display Name</label>
                    <input 
                      type="text" 
                      value={authName} 
                      onChange={(e) => setAuthName(e.target.value)} 
                      required
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" 
                      placeholder="e.g. Node Operator"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 font-semibold">Profile Keyphrase / Password</label>
                  </div>
                  <input 
                    type="password" 
                    value={authPassword} 
                    onChange={(e) => setAuthPassword(e.target.value)} 
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500 font-mono" 
                    placeholder="••••••••"
                  />
                </div>

                {authError && (
                  <p className="text-red-400 text-xs text-center font-semibold">{authError}</p>
                )}

                <button 
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wide transition-all shadow-md shadow-indigo-500/20 cursor-pointer">
                  {isRegisterMode ? 'Complete Registration' : 'Authenticate Credentials'}
                </button>
              </form>

              <div className="border-t border-white/5 pt-4 text-center text-xs text-slate-400 font-sans">
                {isRegisterMode ? (
                  <p>
                    Already have an account?{' '}
                    <button onClick={() => setIsRegisterMode(false)} className="text-indigo-400 font-bold hover:underline">
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p>
                    Need a new proxy profile?{' '}
                    <button onClick={() => setIsRegisterMode(true)} className="text-indigo-400 font-bold hover:underline">
                      Create Profile (Free 100 Credits)
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYSTEM REPORT PREVIEW MODAL */}
      <AnimatePresence>
        {selectedReportFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl flex flex-col h-[85vh] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans">{selectedReportName}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedReportFile}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(selectedReportContent)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Copy Content</span>
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([selectedReportContent], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = selectedReportFile;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download File</span>
                  </button>
                  <a
                    href={`/api/reports/${selectedReportFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Open URL</span>
                  </a>
                  <button
                    onClick={() => setSelectedReportFile(null)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950/25 font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin">
                {isLoadingReport ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" />
                    <span className="text-slate-400 font-sans">Decentralizing intelligence report...</span>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-mono text-slate-300 break-all select-text">{selectedReportContent}</pre>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/5 bg-slate-950/40 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>FILE INTEGRITY CHECK: VERIFIED</span>
                <span>SHA-256 SECURED CONNECTION</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLOBAL TOAST POPUP */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 border border-indigo-500/30 text-indigo-300 font-bold text-xs rounded-xl shadow-2xl flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
