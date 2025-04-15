<script lang="ts">
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { getCurrentOrganization, deleteDocument } from '$lib/stores/organization.svelte.js';
  import type { Document } from '$lib/types/index';
  import FileText from "@lucide/svelte/icons/file-text";
  import Edit from "@lucide/svelte/icons/edit";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { createEventDispatcher } from 'svelte';
  import { Input } from '$lib/components/ui/input';
  import { formatDate } from '$lib/utils/formatters';

  const dispatch = createEventDispatcher<{
    edit: { document: Document };
    add: void;
  }>();

  // Search functionality
  let searchQuery = $state('');
  let searchResults = $derived(getFilteredDocuments());

  function handleEdit(doc: Document) {
    dispatch('edit', { document: doc });
  }

  function handleAdd() {
    dispatch('add');
  }

  function handleDelete(doc: Document) {
    if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      deleteDocument(doc.id);
    }
  }

  function getFilteredDocuments(): Document[] {
    if (!searchQuery.trim() || !documents.length) {
      return documents;
    }
    
    const query = searchQuery.toLowerCase();
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(query) || 
      doc.content.toLowerCase().includes(query) ||
      doc.type.toLowerCase().includes(query)
    );
  }

  const currentOrg = $derived(getCurrentOrganization());
  const documents = $derived(currentOrg?.documents || []);

  // Get color based on document type
  function getTypeColor(type: string): string {
    switch (type) {
      case 'brand':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'company':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'design':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'communication':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  function getDocumentTypeEmoji(type: string): string {
    switch (type) {
      case 'brand': return '🎨';
      case 'company': return '🏢';
      case 'design': return '✏️';
      case 'communication': return '📣';
      case 'custom': return '📄';
      default: return '📄';
    }
  }
</script>

<div class="p-4 space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold">{currentOrg ? `${currentOrg.name} Documents` : 'Documents'}</h2>
    <Button variant="default" size="sm" onclick={handleAdd} disabled={!currentOrg}>
      Add Document
    </Button>
  </div>

  <div class="relative">
    <Input
      type="text"
      placeholder="Search documents by name or content..."
      bind:value={searchQuery}
      class="w-full"
    />
    {#if searchQuery}
      <button 
        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
        onclick={() => searchQuery = ''}
      >
        ✕
      </button>
    {/if}
  </div>

  {#if !currentOrg}
    <div class="p-8 text-center">
      <p class="text-muted-foreground">Select or create an organization to view documents</p>
    </div>
  {:else if documents.length === 0}
    <div class="p-8 text-center">
      <p class="text-muted-foreground">No documents yet</p>
      <p class="text-muted-foreground text-sm mt-2">Click "Add Document" to create your first document</p>
    </div>
  {:else if searchResults.length === 0}
    <div class="p-4 text-center text-muted-foreground">
      <p>No documents match your search query.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {#each searchResults as doc}
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <span class="text-lg">{getDocumentTypeEmoji(doc.type)}</span>
                  <span>{doc.name}</span>
                </CardTitle>
                <CardDescription>
                  <Badge class={getTypeColor(doc.type)}>
                    {doc.type}
                  </Badge>
                </CardDescription>
              </div>
              <div class="flex gap-2">
                <Button variant="ghost" size="icon" onclick={() => handleEdit(doc)}>
                  <Edit class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onclick={() => handleDelete(doc)}>
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="max-h-16 overflow-hidden text-sm text-muted-foreground">
              {doc.content.length > 100 ? doc.content.slice(0, 100) + '...' : doc.content}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              class="w-full"
              onclick={() => handleEdit(doc)}
            >
              Edit Content
            </Button>
          </CardFooter>
        </Card>
      {/each}
    </div>
  {/if}
</div> 