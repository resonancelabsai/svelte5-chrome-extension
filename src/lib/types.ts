/**
 * Types for the organization structure
 */
export interface Organization {
  id?: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  documents: Document[];
}

/**
 * Document types
 */
export type DocumentType = 'brand' | 'company' | 'design' | 'communication' | 'custom';

/**
 * Document version interface
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  createdAt: number;
  timestamp: number;
  comment?: string;
}

/**
 * Document interface
 */
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