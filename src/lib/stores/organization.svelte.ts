import { v4 as uuidv4 } from 'uuid';
import type { Organization, Document, DocumentType } from '$lib/types';

// Current organization ID
let currentOrganizationId = $state<string | null>(null);

// All organizations
let organizations = $state<Organization[]>([]);

// Export getters and setters for the state
export function getCurrentOrganizationId() {
  return currentOrganizationId;
}

export function setCurrentOrganizationId(id: string | null) {
  currentOrganizationId = id;
}

export function getOrganizations() {
  return organizations;
}

// Sample documents for a new organization
const getSampleDocuments = (orgId: string): Document[] => {
  const now = Date.now();
  return [
    {
      id: uuidv4(),
      organizationId: orgId,
      type: 'brand',
      name: 'Brand Guidelines',
      content: '# Brand Guidelines\n\nThis document outlines the brand guidelines for your organization.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      organizationId: orgId,
      type: 'company',
      name: 'Company Information',
      content: '# Company Information\n\nThis document contains information about your organization.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      organizationId: orgId,
      type: 'design',
      name: 'Design System',
      content: '# Design System\n\nThis document outlines the design system for your organization.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      organizationId: orgId,
      type: 'communication',
      name: 'Communication Guidelines',
      content: '# Communication Guidelines\n\nThis document contains communication guidelines for your organization.',
      createdAt: now,
      updatedAt: now,
    }
  ];
};

// Get current organization
export function getCurrentOrganization() {
  if (!currentOrganizationId) return null;
  return organizations.find(org => org.id === currentOrganizationId) || null;
}

// Create a new organization
export function createOrganization(name: string) {
  const id = uuidv4();
  const now = Date.now();
  
  const newOrg: Organization = {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    documents: getSampleDocuments(id)
  };
  
  organizations = [...organizations, newOrg];
  
  // If this is the first organization, set it as current
  if (organizations.length === 1) {
    currentOrganizationId = id;
  }
  
  return newOrg;
}

// Update an organization
export function updateOrganization(id: string, updates: Partial<Organization>) {
  organizations = organizations.map(org => {
    if (org.id === id) {
      return { ...org, ...updates, updatedAt: Date.now() };
    }
    return org;
  });
}

// Delete an organization
export function deleteOrganization(id: string) {
  organizations = organizations.filter(org => org.id !== id);
  
  // If the current organization is deleted, set the first available org as current
  if (currentOrganizationId === id) {
    currentOrganizationId = organizations.length > 0 ? organizations[0].id : null;
  }
}

// Set current organization
export function setCurrentOrganization(id: string) {
  if (organizations.some(org => org.id === id)) {
    currentOrganizationId = id;
    return true;
  }
  return false;
}

// Add a document to an organization
export function addDocument(organizationId: string, name: string, type: DocumentType, content: string = '') {
  const org = organizations.find(o => o.id === organizationId);
  if (!org) return null;
  
  const now = Date.now();
  const newDoc: Document = {
    id: uuidv4(),
    organizationId,
    type,
    name,
    content,
    createdAt: now,
    updatedAt: now
  };
  
  updateOrganization(organizationId, {
    documents: [...org.documents, newDoc],
    updatedAt: now
  });
  
  return newDoc;
}

// Update a document
export function updateDocument(documentId: string, updates: Partial<Document>) {
  let updatedDoc: Document | null = null;
  
  organizations = organizations.map(org => {
    const updatedDocs = org.documents.map(doc => {
      if (doc.id === documentId) {
        updatedDoc = { ...doc, ...updates, updatedAt: Date.now() };
        return updatedDoc;
      }
      return doc;
    });
    
    if (updatedDocs.some(doc => doc.id === documentId)) {
      return { ...org, documents: updatedDocs, updatedAt: Date.now() };
    }
    
    return org;
  });
  
  return updatedDoc;
}

// Delete a document
export function deleteDocument(documentId: string) {
  organizations = organizations.map(org => {
    const hasDoc = org.documents.some(doc => doc.id === documentId);
    
    if (hasDoc) {
      return {
        ...org,
        documents: org.documents.filter(doc => doc.id !== documentId),
        updatedAt: Date.now()
      };
    }
    
    return org;
  });
}

// Create a version for a document
export function createDocumentVersion(documentId: string, content: string, comment?: string) {
  let updatedDoc: Document | null = null;
  
  organizations = organizations.map(org => {
    const updatedDocs = org.documents.map(doc => {
      if (doc.id === documentId) {
        const now = Date.now();
        const newVersion = {
          id: uuidv4(),
          documentId,
          content: doc.content, // Save current content as version
          createdAt: now,
          timestamp: now,
          comment
        };
        
        const versions = [...(doc.versions || []), newVersion];
        updatedDoc = { 
          ...doc, 
          content, // Update with new content
          versions,
          updatedAt: now 
        };
        
        return updatedDoc;
      }
      return doc;
    });
    
    if (updatedDocs.some(doc => doc.id === documentId)) {
      return { ...org, documents: updatedDocs };
    }
    
    return org;
  });
  
  return updatedDoc;
}

// Initialize with sample data in development
export function initializeWithSampleData() {
  if (organizations.length === 0) {
    createOrganization('Acme Corporation');
    createOrganization('Personal Projects');
  }
}

// Save organizations to local storage
export function saveToLocalStorage() {
  try {
    localStorage.setItem('contextmaster-organizations', JSON.stringify(organizations));
    localStorage.setItem('contextmaster-current-org', currentOrganizationId || '');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Load organizations from local storage
export function loadFromLocalStorage() {
  try {
    const orgsData = localStorage.getItem('contextmaster-organizations');
    const currentOrgId = localStorage.getItem('contextmaster-current-org');
    
    if (orgsData) {
      organizations = JSON.parse(orgsData);
    }
    
    if (currentOrgId) {
      currentOrganizationId = currentOrgId;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
}

// Initialize the store
export function initializeOrganizationStore() {
  loadFromLocalStorage();
  
  if (organizations.length === 0) {
    initializeWithSampleData();
  }
  
  // Save to localStorage whenever organizations change
  $effect(() => {
    saveToLocalStorage();
  });
} 