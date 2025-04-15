<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { createEventDispatcher } from 'svelte';
  import { getCurrentOrganization, getCurrentOrganizationId, addDocument, updateDocument, createDocumentVersion } from '$lib/stores/organization.svelte.js';
  import type { Document, DocumentType } from '$lib/types/index';

  const { document = null, organizationId = '', isOpen = false } = $props<{
    document: Document | null;
    organizationId?: string;
    isOpen: boolean;
  }>();

  let name = $state(document?.name || '');
  let type = $state<DocumentType>(document?.type || 'company');
  let content = $state(document?.content || '');
  let versionComment = $state('');
  let editorTab = $state<'edit' | 'preview'>('edit');
  
  let formValid = $derived(name.trim().length > 0);

  const dispatch = createEventDispatcher<{
    close: void;
    saved: { document: Document };
  }>();

  const currentOrg = $derived(getCurrentOrganization());
  const currentOrgId = $derived(getCurrentOrganizationId());
  const effectiveOrgId = $derived(organizationId || currentOrgId);
  const documentTypes: DocumentType[] = ['brand', 'company', 'design', 'communication', 'custom'];

  // Simple Markdown renderer (basic implementation)
  function renderMarkdown(md: string): string {
    if (!md) return '';
    
    // Convert headers
    let html = md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Convert paragraphs
    html = html.replace(/^\s*(\n)?(.+)/gim, function(m) {
      return /\<(\/)?(h1|h2|h3|ul|ol|li|blockquote|pre|p)/.test(m) ? m : '<p>' + m + '</p>';
    });
    
    // Convert bold
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    
    // Convert italic
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
    
    // Convert lists
    html = html.replace(/^\s*\n\* (.*)/gim, '<ul>\n<li>$1</li>\n</ul>');
    html = html.replace(/^\s*\n- (.*)/gim, '<ul>\n<li>$1</li>\n</ul>');
    
    // Fix multi-line lists
    html = html.replace(/<\/ul>\s*\n<ul>/gim, '');
    
    // Convert line breaks
    html = html.replace(/\n/gim, '<br>');
    
    return html;
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (!formValid || !effectiveOrgId) return;

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
      result = addDocument(effectiveOrgId, name, type, content);
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
    editorTab = 'edit';
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
  
  function handleTypeChange(value: DocumentType) {
    type = value;
  }
</script>

<div class="space-y-4 p-4">
  <h2 class="text-xl font-bold">
    {document ? 'Edit' : 'New'} Document
  </h2>

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
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
      <Tabs value={editorTab} onValueChange={(val) => editorTab = val as 'edit' | 'preview'} class="w-full">
        <TabsList class="w-full">
          <TabsTrigger value="edit" class="flex-1">Edit</TabsTrigger>
          <TabsTrigger value="preview" class="flex-1">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" class="mt-2">
          <Textarea 
            id="content" 
            placeholder="Enter markdown content" 
            bind:value={content} 
            rows={10}
          />
        </TabsContent>
        
        <TabsContent value="preview" class="mt-2">
          <div 
            class="markdown-preview border rounded-md p-4 min-h-[250px] max-h-[500px] overflow-y-auto bg-background"
          >
            {#if content}
              {@html renderMarkdown(content)}
            {:else}
              <p class="text-muted-foreground">No content to preview</p>
            {/if}
          </div>
        </TabsContent>
      </Tabs>
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
      <Button type="submit" disabled={!formValid || !effectiveOrgId}>
        {document ? 'Save Changes' : 'Create Document'}
      </Button>
    </div>
  </form>
</div>

<style>
  .markdown-preview :global(h1) {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .markdown-preview :global(h2) {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .markdown-preview :global(h3) {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .markdown-preview :global(p) {
    margin-bottom: 0.5rem;
  }
  
  .markdown-preview :global(ul), .markdown-preview :global(ol) {
    margin-left: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .markdown-preview :global(li) {
    margin-bottom: 0.2rem;
  }
  
  .markdown-preview :global(blockquote) {
    border-left: 3px solid #ddd;
    padding-left: 1rem;
    margin-left: 0;
    color: #666;
  }
  
  .markdown-preview :global(pre) {
    background-color: #f5f5f5;
    padding: 0.5rem;
    border-radius: 0.25rem;
    overflow-x: auto;
  }
</style> 