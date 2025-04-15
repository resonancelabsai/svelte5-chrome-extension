export interface MenuItem {
  icon: string;
  label: string;
  action?: () => void;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  documents: Document[];
}

export interface Document {
  id: string;
  organizationId: string;
  type: DocumentType;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  versions?: DocumentVersion[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  createdAt: number;
  timestamp: number;
  comment?: string;
}

export type DocumentType = 'brand' | 'company' | 'design' | 'communication' | 'custom';

export type Theme = 'light' | 'dark' | 'system';

export interface Prompt {
  id: string;
  organizationId?: string; // If undefined, it's a global prompt
  category: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface PromptCategory {
  id: string;
  name: string;
  parent?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: Theme;
  defaultOrganizationId?: string;
  defaultDocumentType?: DocumentType;
  keyboardShortcuts: Record<string, string>;
}