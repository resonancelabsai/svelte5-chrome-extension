<script lang="ts">
  import { onMount } from "svelte";
  import { theme, initializeTheme } from "$lib/stores/theme";
  import { initializeOrganizationStore, getCurrentOrganizationId } from "$lib/stores/organization.svelte.js";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
  import { Dialog, DialogContent } from "$lib/components/ui/dialog";
  import Header from "$lib/components/Header.svelte";
  import OrganizationList from "$lib/components/OrganizationList.svelte";
  import DocumentList from "$lib/components/DocumentList.svelte";
  import OrganizationForm from "$lib/components/OrganizationForm.svelte";
  import DocumentForm from "$lib/components/DocumentForm.svelte";
  import SettingsDialog from "$lib/components/SettingsDialog.svelte";
  import type { Organization, Document } from "$lib/types/index";
  import { isIndexedDBSupported } from "$lib/services/db.service";

  // Active tab
  let activeTab = $state("organizations");

  // App state
  let isInitialized = $state(false);
  let initError = $state('');
  let organizationStore: { checkAndSave: () => void } | null = $state(null);

  // Dialog states
  let showOrgDialog = $state(false);
  let showDocDialog = $state(false);
  let showSettingsDialog = $state(false);
  let editingOrg = $state<Organization | undefined>(undefined);
  let editingDoc = $state<Document | null>(null);
  
  function handleNewOrg() {
    editingOrg = undefined;
    showOrgDialog = true;
  }
  
  function handleEditOrg(event: CustomEvent<{organization: Organization}>) {
    editingOrg = event.detail.organization;
    showOrgDialog = true;
  }

  function handleOrgDialogClosed() {
    showOrgDialog = false;
  }

  function handleNewDoc() {
    editingDoc = null;
    showDocDialog = true;
  }

  function handleEditDoc(event: CustomEvent<{document: Document}>) {
    editingDoc = event.detail.document;
    showDocDialog = true;
  }

  function handleDocDialogClosed() {
    showDocDialog = false;
  }

  function handleOpenSettings() {
    console.log("Settings clicked");
    showSettingsDialog = true;
  }

  function handleCloseSettings() {
    showSettingsDialog = false;
  }

  async function initialize() {
    try {
      // Initialize theme
      initializeTheme();
      
      // Check if IndexedDB is supported
      if (!isIndexedDBSupported()) {
        console.warn('IndexedDB is not supported in this browser. Falling back to localStorage.');
      }
      
      // Initialize organization store (async)
      organizationStore = await initializeOrganizationStore();
      
      // Mark as initialized
      isInitialized = true;
      
      // Set up the interval only after successful initialization
      setupSaveInterval();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      initError = 'Failed to initialize app data. Please try refreshing the page.';
    }
  }
  
  // Function to set up the interval for saving
  let saveInterval: ReturnType<typeof setInterval> | undefined;
  
  function setupSaveInterval() {
    // Clear any existing interval first
    if (saveInterval) {
      clearInterval(saveInterval);
    }
    
    // Set up a new interval
    saveInterval = setInterval(() => {
      if (organizationStore) {
        try {
          organizationStore.checkAndSave();
        } catch (err) {
          console.error('Error in periodic save:', err);
        }
      }
    }, 2000);
    
    console.log('Auto-save interval initialized');
  }

  onMount(() => {
    initialize();
    
    // Return a cleanup function
    return () => {
      if (saveInterval) {
        clearInterval(saveInterval);
      }
    };
  });
</script>

<div class="h-[600px] w-[400px] bg-background flex flex-col overflow-hidden" data-theme={$theme}>
  {#if initError}
    <div class="flex-1 flex items-center justify-center p-4 text-center">
      <div class="space-y-2">
        <p class="text-destructive">{initError}</p>
        <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md" onclick={() => initialize()}>
          Retry
        </button>
      </div>
    </div>
  {:else if !isInitialized}
    <div class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  {:else}
    <Header 
      on:newOrg={handleNewOrg}
      on:openSettings={handleOpenSettings}
    />
    
    <Tabs value={activeTab} onValueChange={(val) => activeTab = val} class="flex-1 flex flex-col overflow-hidden">
      <div class="border-b px-4">
        <TabsList class="w-full">
          <TabsTrigger value="organizations" class="flex-1">Organizations</TabsTrigger>
          <TabsTrigger value="documents" class="flex-1">Documents</TabsTrigger>
        </TabsList>
      </div>
      
      <div class="flex-1 overflow-auto">
        <TabsContent value="organizations" class="mt-0 h-full overflow-auto">
          <OrganizationList 
            on:edit={handleEditOrg}
            on:addDocument={(e) => {
              handleNewDoc();
              activeTab = "documents";
            }}
          />
        </TabsContent>
        
        <TabsContent value="documents" class="mt-0 h-full overflow-auto">
          <DocumentList 
            on:edit={handleEditDoc}
            on:add={handleNewDoc}
          />
        </TabsContent>
      </div>
    </Tabs>
    
    <Dialog open={showOrgDialog} onOpenChange={(open) => showOrgDialog = open}>
      <DialogContent class="max-w-lg">
        <OrganizationForm 
          organization={editingOrg}
          on:cancel={handleOrgDialogClosed}
          on:submit={() => {
            handleOrgDialogClosed();
          }}
        />
      </DialogContent>
    </Dialog>
    
    <Dialog open={showDocDialog} onOpenChange={(open) => showDocDialog = open}>
      <DialogContent class="max-w-lg">
        <DocumentForm 
          document={editingDoc}
          organizationId={editingDoc?.organizationId || getCurrentOrganizationId() || ''}
          isOpen={showDocDialog}
          on:close={handleDocDialogClosed}
          on:saved={() => {
            handleDocDialogClosed();
          }}
        />
      </DialogContent>
    </Dialog>
    
    <Dialog open={showSettingsDialog} onOpenChange={(open) => showSettingsDialog = open}>
      <DialogContent class="max-w-lg">
        <SettingsDialog on:close={handleCloseSettings} />
      </DialogContent>
    </Dialog>
  {/if}
</div>
