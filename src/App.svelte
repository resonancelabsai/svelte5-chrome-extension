<script lang="ts">
  import { onMount } from "svelte";
  import { theme, initializeTheme } from "$lib/stores/theme";
  import { initializeOrganizationStore } from "$lib/stores/organization.svelte.js";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
  import { Dialog, DialogContent } from "$lib/components/ui/dialog";
  import Header from "$lib/components/Header.svelte";
  import OrganizationList from "$lib/components/OrganizationList.svelte";
  import DocumentList from "$lib/components/DocumentList.svelte";
  import OrganizationForm from "$lib/components/OrganizationForm.svelte";
  import DocumentForm from "$lib/components/DocumentForm.svelte";
  import type { Organization, Document } from "$lib/types";

  // Active tab
  let activeTab = $state("organizations");

  // Dialog states
  let showOrgDialog = $state(false);
  let showDocDialog = $state(false);
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
    // TODO: Implement settings dialog
  }

  onMount(() => {
    initializeTheme();
    initializeOrganizationStore();
  });
</script>

<div class="h-[600px] w-[400px] bg-background flex flex-col overflow-hidden" data-theme={$theme}>
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
        on:close={handleOrgDialogClosed}
      />
    </DialogContent>
  </Dialog>
  
  <Dialog open={showDocDialog} onOpenChange={(open) => showDocDialog = open}>
    <DialogContent class="max-w-lg">
      <DocumentForm 
        document={editingDoc}
        organizationId={editingDoc?.organizationId || ''}
        isOpen={showDocDialog}
        on:close={handleDocDialogClosed}
      />
    </DialogContent>
  </Dialog>
</div>
