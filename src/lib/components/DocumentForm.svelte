<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { getCurrentOrganization, addDocument, updateDocument, createDocumentVersion } from '$lib/stores/organization.svelte.js';
  import type { Document, DocumentType } from '$lib/types';
  import { createEventDispatcher } from 'svelte';

  const { document = null, organizationId, isOpen = false } = $props<{
    document: Document | null;
    organizationId: string;
    isOpen: boolean;
  }>();

  let name = $state(document?.name || '');
  let type = $state<DocumentType>(document?.type || 'company');
  let content = $state(document?.content || '');
  let versionComment = $state('');
  
  let formValid = $derived(name.trim().length > 0);

  const dispatch = createEventDispatcher<{
    close: void;
    saved: { document: Document };
  }>();

  const currentOrg = $derived(getCurrentOrganization());
  const documentTypes: DocumentType[] = ['brand', 'company', 'design', 'communication', 'custom'];

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (!formValid || !currentOrg) return;

    let result: Document | null;

    if (document) {
      // Create a version of the existing document if content changed
      if (document.content !== content) {
        createDocumentVersion(document.id, content, versionComment || undefined);
      }
      
      // Update existing
      result = updateDocument(document.id, { name, type, content });
    } else {
      // Create new
      result = addDocument(currentOrg.id, name, type, content);
    }

    if (result) {
      dispatch('saved', { document: result });
    }
    
    resetForm();
    dispatch('close');
  }

  function resetForm() {
    if (!document) {
      name = '';
      type = 'company';
      content = '';
    }
    versionComment = '';
  }

  function handleCancel() {
    resetForm();
    dispatch('close');
  }

  $effect(() => {
    if (isOpen && document) {
      name = document.name;
      type = document.type;
      content = document.content;
      versionComment = '';
    } else if (isOpen && !document) {
      name = '';
      type = 'company';
      content = '';
      versionComment = '';
    }
  });
  
  function handleTypeChange(value: string) {
    if (value === 'brand' || value === 'company' || value === 'design' || 
        value === 'communication' || value === 'custom') {
      type = value;
    }
  }
</script>

<div class="space-y-4 p-4">
  <h2 class="text-xl font-bold">
    {document ? 'Edit' : 'New'} Document
  </h2>

  <form onsubmit={handleSubmit} class="space-y-4">
    <div class="space-y-2">
      <Label for="name">Document Name</Label>
      <Input 
        id="name" 
        placeholder="Enter document name" 
        bind:value={name} 
        required
      />
    </div>

    <div class="space-y-2">
      <Label for="type">Document Type</Label>
      <div class="relative">
        <select 
          id="type" 
          class="w-full h-10 px-3 border rounded-md bg-background"
          bind:value={type}
        >
          {#each documentTypes as docType}
            <option value={docType}>{docType}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="space-y-2">
      <Label for="content">Content (Markdown)</Label>
      <Textarea 
        id="content" 
        placeholder="Enter markdown content" 
        bind:value={content} 
        rows={10}
      />
    </div>

    {#if document}
      <div class="space-y-2">
        <Label for="versionComment">Version Comment (optional)</Label>
        <Input 
          id="versionComment" 
          placeholder="Describe the changes made" 
          bind:value={versionComment} 
        />
        <p class="text-xs text-muted-foreground">
          If you changed the content, this comment will be saved with the previous version
        </p>
      </div>
    {/if}

    <div class="flex justify-end gap-2">
      <Button 
        type="button" 
        variant="outline" 
        onclick={handleCancel}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={!formValid || !currentOrg}>
        {document ? 'Save Changes' : 'Create Document'}
      </Button>
    </div>
  </form>
</div> 