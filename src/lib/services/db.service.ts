import type { Organization, Document, DocumentType } from '$lib/types/index';

// Constants
const DB_NAME = 'context-master-db';
const DB_VERSION = 1;
const STORES = {
  ORGANIZATIONS: 'organizations',
  CURRENT_ORG: 'current-org',
};

/**
 * Interface for database structure
 */
interface DBSchema {
  [STORES.ORGANIZATIONS]: { key: string; value: Organization };
  [STORES.CURRENT_ORG]: { key: string; value: string };
}

/**
 * Opens a connection to the IndexedDB database
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening database:', event);
      reject(new Error('Could not open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.ORGANIZATIONS)) {
        db.createObjectStore(STORES.ORGANIZATIONS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.CURRENT_ORG)) {
        db.createObjectStore(STORES.CURRENT_ORG);
      }
    };
  });
}

/**
 * Gets a transaction and store for a specific store name
 */
async function getStore<T extends keyof DBSchema>(
  storeName: T,
  mode: IDBTransactionMode = 'readonly'
): Promise<IDBObjectStore> {
  const db = await openDB();
  const transaction = db.transaction(storeName as string, mode);
  return transaction.objectStore(storeName as string);
}

/**
 * Saves multiple organizations to IndexedDB
 */
export async function saveOrganizations(organizations: Organization[]): Promise<void> {
  try {
    const store = await getStore(STORES.ORGANIZATIONS, 'readwrite');
    
    // Clear the store first
    store.clear();
    
    // Convert proxies to plain objects before storing
    organizations.forEach(org => {
      // Use our helper function to sanitize the object
      const plainOrg = sanitizeForStorage(org);
      store.put(plainOrg);
    });
  } catch (error) {
    console.error('Error saving organizations to IndexedDB:', error);
    throw error;
  }
}

/**
 * Loads all organizations from IndexedDB
 */
export async function loadOrganizations(): Promise<Organization[]> {
  try {
    const store = await getStore(STORES.ORGANIZATIONS);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        // We don't need to do any special conversion here
        // as IndexedDB already returns plain objects
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error loading organizations:', event);
        reject(new Error('Could not load organizations'));
      };
    });
  } catch (error) {
    console.error('Error accessing organizations store:', error);
    return [];
  }
}

/**
 * Saves the current organization ID
 */
export async function saveCurrentOrganizationId(id: string | null): Promise<void> {
  try {
    const store = await getStore(STORES.CURRENT_ORG, 'readwrite');
    
    // Use a fixed key for the current organization
    // Ensure id is a simple string, not a reactive value
    const plainId = id ? String(id) : '';
    store.put(plainId, 'current');
  } catch (error) {
    console.error('Error saving current organization ID:', error);
    throw error;
  }
}

/**
 * Loads the current organization ID
 */
export async function loadCurrentOrganizationId(): Promise<string | null> {
  try {
    const store = await getStore(STORES.CURRENT_ORG);
    
    return new Promise((resolve, reject) => {
      const request = store.get('current');
      
      request.onsuccess = () => {
        // If result is empty string or doesn't exist, return null
        resolve(request.result || null);
      };
      
      request.onerror = (event) => {
        console.error('Error loading current organization ID:', event);
        reject(new Error('Could not load current organization ID'));
      };
    });
  } catch (error) {
    console.error('Error accessing current organization store:', error);
    return null;
  }
}

/**
 * Initializes the database with default data if empty
 */
export async function initializeDBIfEmpty(defaultOrganizations: Organization[]): Promise<void> {
  try {
    const organizations = await loadOrganizations();
    
    if (organizations.length === 0 && defaultOrganizations.length > 0) {
      await saveOrganizations(defaultOrganizations);
      
      // Set the first organization as current
      if (defaultOrganizations[0]?.id) {
        await saveCurrentOrganizationId(defaultOrganizations[0].id);
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Deletes the entire database
 */
export async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      console.error('Error deleting database:', event);
      reject(new Error('Could not delete database'));
    };
  });
}

/**
 * Check if IndexedDB is supported in the current browser
 */
export function isIndexedDBSupported(): boolean {
  return !!window.indexedDB;
}

/**
 * Sanitizes an object for storage in IndexedDB by converting it to 
 * a plain object without proxies, functions, or other non-serializable content
 */
export function sanitizeForStorage<T>(obj: T): T {
  // Use JSON to create a plain object
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Migrate data from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    // Check if we have data in localStorage
    const orgsData = localStorage.getItem('contextmaster-organizations');
    const currentOrgId = localStorage.getItem('contextmaster-current-org');
    
    if (orgsData) {
      const organizations = JSON.parse(orgsData);
      if (Array.isArray(organizations) && organizations.length > 0) {
        // localStorage data is already plain objects, so we don't need sanitizeForStorage here
        await saveOrganizations(organizations);
      }
    }
    
    if (currentOrgId) {
      await saveCurrentOrganizationId(currentOrgId);
    }
    
    // Optionally clear localStorage after migration
    localStorage.removeItem('contextmaster-organizations');
    localStorage.removeItem('contextmaster-current-org');
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
    throw error;
  }
} 