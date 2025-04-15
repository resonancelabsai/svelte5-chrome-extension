<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { loadFromDatabase } from '$lib/stores/organization.svelte';
  import { theme, setTheme } from '$lib/stores/theme';
  import { exportData, downloadExportFile, importData, clearAllData } from '$lib/storage/importExport';

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  // Use $state for reactive variables (Svelte 5)
  let activeTab = $state('appearance');
  let exportDataText = $state('');
  let importDataText = $state('');
  let exportMessage = $state('');
  let importError = $state('');
  let deleteConfirm = $state('');
  let isExporting = $state(false);
  let isImporting = $state(false);
  let isDeleting = $state(false);

  // Handle the theme
  const themes = ['light', 'dark', 'system'] as const;

  function handleClose() {
    dispatch('close');
  }

  async function handleExportData() {
    isExporting = true;
    exportMessage = '';
    
    try {
      exportDataText = await exportData();
      exportMessage = 'Data exported successfully!';
    } catch (error) {
      console.error('Export error:', error);
      exportMessage = `Error exporting data: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      isExporting = false;
    }
  }

  function handleDownloadExport() {
    if (!exportDataText) return;
    downloadExportFile(exportDataText);
  }

  async function handleImportData() {
    if (!importDataText) {
      importError = 'Please paste export data first';
      return;
    }
    
    isImporting = true;
    importError = '';
    
    try {
      await importData(importDataText);
      
      // Reload data from database
      await loadFromDatabase();
      
      exportMessage = 'Data imported successfully!';
      importDataText = '';
    } catch (error) {
      console.error('Import error:', error);
      importError = `Error importing data: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      isImporting = false;
    }
  }

  async function handleDeleteAllData() {
    if (deleteConfirm !== 'DELETE') return;
    
    isDeleting = true;
    
    try {
      await clearAllData();
      
      // Reset UI state
      exportDataText = '';
      importDataText = '';
      exportMessage = 'All data has been deleted.';
      importError = '';
      deleteConfirm = '';
      
      // Show a simple alert
      alert('All data has been deleted');
      
      // Reload with empty data
      await loadFromDatabase();
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Error deleting data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isDeleting = false;
    }
  }

  // This function updates the active tab using a simple string value
  function updateActiveTab(newTab: string) {
    activeTab = newTab;
  }
</script>

<div class="space-y-4 p-4 max-h-[80vh] overflow-auto">
  <h2 class="text-xl font-bold">Settings</h2>

  <Tabs value={activeTab} onValueChange={updateActiveTab} class="w-full">
    <TabsList class="w-full">
      <TabsTrigger value="appearance" class="flex-1">Appearance</TabsTrigger>
      <TabsTrigger value="data" class="flex-1">Data Management</TabsTrigger>
    </TabsList>
    
    <TabsContent value="appearance" class="mt-4 space-y-4">
      <div class="space-y-2">
        <Label for="theme">Theme</Label>
        <div class="flex gap-2">
          {#each themes as themeOption}
            <Button 
              variant={$theme === themeOption ? 'default' : 'outline'} 
              onclick={() => setTheme(themeOption)}
            >
              {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
            </Button>
          {/each}
        </div>
      </div>
    </TabsContent>
    
    <TabsContent value="data" class="mt-4 space-y-6">
      <div class="border rounded-md p-4 space-y-4">
        <h3 class="text-lg font-medium">Export Data</h3>
        <p class="text-sm text-muted-foreground">Export your data to a JSON file that you can save as a backup or import into another instance.</p>
        
        <div class="flex gap-2">
          <Button onclick={handleExportData} variant="outline" disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
          {#if exportDataText}
            <Button onclick={handleDownloadExport} variant="outline">Download File</Button>
          {/if}
        </div>
        
        {#if exportMessage}
          <p class="text-sm text-green-600 dark:text-green-400">{exportMessage}</p>
        {/if}
        
        {#if exportDataText}
          <div class="mt-2">
            <textarea
              class="w-full h-32 p-2 text-xs font-mono border rounded-md"
              readonly
              value={exportDataText}
            ></textarea>
          </div>
        {/if}
      </div>
      
      <div class="border rounded-md p-4 space-y-4">
        <h3 class="text-lg font-medium">Import Data</h3>
        <p class="text-sm text-muted-foreground">Import data from a previously exported JSON file or by pasting the JSON content below.</p>
        
        <div>
          <textarea
            class="w-full h-32 p-2 text-xs font-mono border rounded-md"
            placeholder="Paste exported JSON data here"
            bind:value={importDataText}
          ></textarea>
        </div>
        
        {#if importError}
          <p class="text-sm text-red-600 dark:text-red-400">{importError}</p>
        {/if}
        
        <Button onclick={handleImportData} variant="outline" disabled={isImporting}>
          {isImporting ? 'Importing...' : 'Import Data'}
        </Button>
      </div>
      
      <div class="border rounded-md p-4 space-y-4 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
        <h3 class="text-lg font-medium text-red-700 dark:text-red-400">Danger Zone</h3>
        <p class="text-sm text-red-600 dark:text-red-400">Delete all data from this application. This action cannot be undone.</p>
        
        <div>
          <Label for="delete-confirm" class="text-sm">Type DELETE to confirm</Label>
          <input
            id="delete-confirm"
            type="text"
            class="w-full p-2 border rounded-md mt-1"
            placeholder="Type DELETE here"
            bind:value={deleteConfirm}
          />
        </div>
        
        <Button 
          onclick={handleDeleteAllData} 
          variant="destructive" 
          disabled={isDeleting || deleteConfirm !== 'DELETE'}
        >
          {isDeleting ? 'Deleting...' : 'Delete All Data'}
        </Button>
      </div>
    </TabsContent>
  </Tabs>
  
  <div class="flex justify-end mt-6">
    <Button onclick={handleClose}>Close</Button>
  </div>
</div> 