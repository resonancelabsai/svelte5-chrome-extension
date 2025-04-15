import { v4 as uuidv4 } from 'uuid';
import type { Organization, Document, DocumentType } from '$lib/types/index';
import { 
  loadOrganizations, 
  saveOrganizations, 
  loadCurrentOrganizationId, 
  saveCurrentOrganizationId,
  migrateFromLocalStorage,
  isIndexedDBSupported
} from '$lib/services/db.service';

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
  // Persist the change asynchronously
  saveCurrentOrganizationId(id).catch(err => {
    console.error('Failed to persist current organization ID:', err);
  });
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
export function createOrganization(name: string, description: string = `Organization for ${name}`) {
  const id = uuidv4();
  const now = Date.now();
  
  const newOrg: Organization = {
    id,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    documents: getSampleDocuments(id)
  };
  
  organizations = [...organizations, newOrg];
  
  // If this is the first organization, set it as current
  if (organizations.length === 1) {
    currentOrganizationId = id;
  }
  
  // Save changes immediately
  saveToDatabase();
  
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
  
  // Save changes immediately
  saveToDatabase();
}

// Delete an organization
export function deleteOrganization(id: string) {
  organizations = organizations.filter(org => org.id !== id);
  
  // If the current organization is deleted, set the first available org as current
  if (currentOrganizationId === id) {
    currentOrganizationId = organizations.length > 0 ? organizations[0].id : null;
  }
  
  // Save changes immediately
  saveToDatabase();
}

// Set current organization
export function setCurrentOrganization(id: string) {
  if (organizations.some(org => org.id === id)) {
    currentOrganizationId = id;
    
    // Save changes immediately
    saveToDatabase();
    saveCurrentOrganizationId(id).catch(err => {
      console.error('Failed to persist current organization ID:', err);
    });
    
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
  
  // Note: updateOrganization already saves to database
  
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
  
  // Save changes immediately
  saveToDatabase();
  
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
  
  // Save changes immediately
  saveToDatabase();
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
  
  // Save changes immediately
  saveToDatabase();
  
  return updatedDoc;
}

// Initialize with sample data in development
export function initializeWithSampleData() {
  if (organizations.length === 0) {
    createOrganization('Acme Corporation', 'A fictional corporation for demonstration purposes');
    createOrganization('Personal Projects', 'Your personal projects and documents');
  }
}

// Save organizations to database with retry capability
export function saveToDatabase(retryCount = 0) {
  try {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500; // ms
    
    saveOrganizations(organizations).catch(err => {
      console.error('Error saving to IndexedDB:', err);
      
      // Retry logic with exponential backoff
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying save (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
        setTimeout(() => {
          saveToDatabase(retryCount + 1);
        }, RETRY_DELAY * Math.pow(2, retryCount));
        return;
      }
      
      // Fallback to localStorage if all retries failed or IndexedDB isn't supported
      console.warn('Falling back to localStorage for data persistence');
      if (isIndexedDBSupported()) {
        localStorage.setItem('contextmaster-organizations', JSON.stringify(organizations));
        localStorage.setItem('contextmaster-current-org', currentOrganizationId || '');
      }
    });
  } catch (error) {
    console.error('Error initiating save operation:', error);
  }
}

// Load organizations from database
export async function loadFromDatabase() {
  try {
    // Try loading from IndexedDB first
    if (isIndexedDBSupported()) {
      // Migrate data from localStorage to IndexedDB if needed (one-time operation)
      await migrateFromLocalStorage();
      
      // Load organizations from IndexedDB
      const orgs = await loadOrganizations();
      if (orgs && orgs.length > 0) {
        organizations = orgs;
      }
      
      // Load current organization ID
      const currentOrgId = await loadCurrentOrganizationId();
      if (currentOrgId) {
        currentOrganizationId = currentOrgId;
      }
      
      return;
    }
    
    // Fallback to localStorage if IndexedDB is not supported
    const orgsData = localStorage.getItem('contextmaster-organizations');
    const currentOrgId = localStorage.getItem('contextmaster-current-org');
    
    if (orgsData) {
      organizations = JSON.parse(orgsData);
    }
    
    if (currentOrgId) {
      currentOrganizationId = currentOrgId;
    }
  } catch (error) {
    console.error('Error loading from database:', error);
  }
}

// Initialize the store
export async function initializeOrganizationStore() {
  await loadFromDatabase();
  
  if (organizations.length === 0) {
    initializeWithSampleData();
  }
  
  // Set up a manual watcher for the organizations store
  // This avoids using $effect outside of component context
  const originalOrganizations = [...organizations];
  
  // Return functions to manage the store
  return {
    // Function to check if organizations have changed and save if needed
    checkAndSave: () => {
      // We can't use deep comparison easily, so we'll just save whenever this is called
      saveToDatabase();
    }
  };
} 