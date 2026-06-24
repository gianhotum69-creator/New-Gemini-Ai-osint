/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Owner' | 'Super Admin' | 'Admin' | 'User';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  credits: number;
  referralCode: string;
  referredBy?: string;
  planId: string; // 'free' | 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  credits: number;
  dailyLimit: number;
  monthlyLimit: number;
  apiLimit: number;
  searchLimit: number;
  endpointAccess: string[]; // e.g. ['phone', 'email']
  priceUSD: number;
}

export interface Wallet {
  userId: string;
  balance: number;
  credits: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'refund' | 'usage' | 'referral_bonus';
  amount: number;
  credits: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  timestamp: string;
  description: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceUSD: number;
}

export interface APIProvider {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  headers: Record<string, string>;
  parameters: Record<string, string>;
  timeoutMs: number;
  retries: number;
  priority: number; // 1 = highest
  status: 'active' | 'inactive';
  failoverProviderId?: string;
}

export interface SearchModule {
  id: string;
  name: string;
  slug: string; // e.g. 'phone-lookup'
  icon: string; // lucide icon name
  description: string;
  costCredits: number;
  status: 'active' | 'inactive';
  providers: string[]; // APIProvider IDs
  fields: string[]; // e.g. ['phone', 'country']
  // Response transformation configuration
  responseMapping: {
    showFields: string[]; // e.g. ['name', 'location']
    renameFields: Record<string, string>; // original -> mapped
    groupFields: Record<string, string[]>; // groupName -> original fields
    fieldOrder?: string[]; // Field output sequence
  };
  // Dynamic layout design configuration
  layout: {
    type: 'card' | 'table' | 'grid';
    title: string;
    showBorders: boolean;
    rawJsonEnabled?: boolean;
    prettyJsonEnabled?: boolean;
    cardViewEnabled?: boolean;
    tableViewEnabled?: boolean;
  };
}

export interface CustomAPIKey {
  id: string;
  userId: string;
  key: string; // OSINT_xxxxx or sk_live_xxxxx
  name: string;
  createdAt: string;
  expiryDate?: string;
  status: 'active' | 'revoked' | 'suspended';
  limitQueries: number;
  usedQueries: number;
  allowedEndpoints: string[]; // slugs
}

export interface SearchLog {
  id: string;
  userId: string;
  moduleSlug: string;
  query: string;
  providerId: string;
  costCredits: number;
  timestamp: string;
  status: 'success' | 'failed';
  result: any;
  rawResult?: any; // hidden original response
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'update' | 'maintenance';
  status: 'active' | 'archived';
  createdAt: string;
}

export interface MenuConfig {
  id: string;
  label: string;
  path: string;
  icon: string;
  roleRequired: UserRole;
  isHidden: boolean;
  order: number;
}

export interface SystemPopup {
  id: string;
  title: string;
  content: string;
  type: 'welcome' | 'maintenance' | 'promo' | 'custom';
  status: 'active' | 'inactive';
  triggerUrl?: string; // which route triggers it
}

export interface ReferralLog {
  id: string;
  referrerId: string;
  referredEmail: string;
  creditsEarned: number;
  status: 'pending' | 'completed';
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string; // e.g. 'LOGIN', 'API_KEY_REVOKED', 'PROVIDER_CREATED'
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface SystemHealth {
  cpuUsage: number;
  ramUsage: {
    used: number;
    total: number;
  };
  diskUsage: {
    used: number;
    total: number;
  };
  databaseStatus: 'healthy' | 'unhealthy';
  apiStatus: Record<string, 'online' | 'offline'>;
  uptime: number; // seconds
}

export interface HomePageCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
}

export interface NavLink {
  id: string;
  label: string;
  path: string;
  icon?: string;
  order: number;
  isHidden: boolean;
}

export interface ActionButton {
  id: string;
  key: string; // 'telegram_bot' | 'telegram_channel' | 'whatsapp' | 'contact' | 'support' | 'buy_api'
  label: string;
  url: string;
  isHidden: boolean;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  active: boolean;
  type: 'info' | 'warning' | 'success';
  createdAt: string;
}

export interface ContentConfig {
  siteTitle?: string;
  siteBranding?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroLabel: string;
  botCardTitle: string;
  botCardDesc: string;
  botCardBullets: string[];
  botUsername: string;
  footerText: string;
  homePageCards: HomePageCard[];
  actionButtons: ActionButton[];
  broadcastMessages: BroadcastMessage[];
  navigationLinks: NavLink[];
  howItWorksSteps: { id: string; stepNumber: number; title: string; description: string }[];
}

