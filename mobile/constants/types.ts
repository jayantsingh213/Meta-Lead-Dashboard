/**
 * Shared TypeScript types for the Meta Leads app.
 */

export interface Lead {
  _id: string;
  metaLeadId: string;
  name: string;
  email: string;
  phone: string;
  createdTime?: string;
  receivedAt: string;
  /** True only for leads that arrived during this session (not fetched on startup) */
  isNew?: boolean;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
