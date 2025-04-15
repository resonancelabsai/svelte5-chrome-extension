import type { Organization } from '$lib/types';
import { 
  saveOrganizations, 
  loadOrganizations, 
  deleteDatabase, 
  sanitizeForStorage 
} from '$lib/services/db.service';

/**
 * Exports all application data to a JSON string
 * @returns A promise that resolves to the exported data as a JSON string
 */
export async function exportData(): Promise<string> {
  try {
    // Fetch all organizations from the database
    const organizations = await loadOrganizations();
    
    // Create export object
    const exportObj = {
      organizations: sanitizeForStorage(organizations),
      version: 1,
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(exportObj, null, 2);
  } catch (error) {
    console.error('Export error:', error);
    throw new Error(`Error exporting data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Downloads exported data as a JSON file
 * @param data The JSON string to download
 * @param filename Optional custom filename
 */
export function downloadExportFile(data: string, filename?: string): void {
  if (!data) return;
  
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `context-master-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports data from a JSON string
 * @param jsonData The JSON string containing the data to import
 * @returns A promise that resolves when the import is complete
 */
export async function importData(jsonData: string): Promise<void> {
  if (!jsonData) {
    throw new Error('No data provided for import');
  }
  
  try {
    // Parse the import data
    const importObj = JSON.parse(jsonData);
    
    // Validate the data structure
    if (!importObj.organizations || !Array.isArray(importObj.organizations)) {
      throw new Error('Invalid import data: organizations data is missing or invalid');
    }
    
    // Save the imported organizations
    await saveOrganizations(importObj.organizations);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Import error:', error);
    throw new Error(`Error importing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clears all application data
 * @returns A promise that resolves when the operation is complete
 */
export async function clearAllData(): Promise<void> {
  try {
    await deleteDatabase();
    return Promise.resolve();
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Error deleting data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 