<script lang="ts">
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { getCurrentOrganization, deleteDocument } from '$lib/stores/organization.svelte.js';
  import type { Document } from '$lib/types';
  import FileText from "@lucide/svelte/icons/file-text";
  import Edit from "@lucide/svelte/icons/edit";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    edit: { document: Document };
    add: void;
  }>();

  function handleEdit(doc: Document) {
    dispatch('edit', { document: doc });
  }

  function handleAdd() {
    dispatch('add');
  }

  function handleDelete(docId: string) {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocument(docId);
    }
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
</script>

<div class="p-4 space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold">{currentOrg ? `${currentOrg.name} Documents` : 'Documents'}</h2>
    <Button variant="default" size="sm" onclick={handleAdd} disabled={!currentOrg}>
      Add Document
    </Button>
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
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {#each documents as doc}
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="flex items-center gap-2">
                  <FileText class="h-4 w-4" />
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
                <Button variant="ghost" size="icon" onclick={() => handleDelete(doc.id)}>
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