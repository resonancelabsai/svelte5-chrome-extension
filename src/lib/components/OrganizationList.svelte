<script lang="ts">
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { getOrganizations, getCurrentOrganizationId, setCurrentOrganization, deleteOrganization } from '$lib/stores/organization.svelte.js';
  import type { Organization } from '$lib/types';
  import Building2 from "@lucide/svelte/icons/building-2";
  import Edit from "@lucide/svelte/icons/edit";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    edit: { organization: Organization };
    addDocument: { organizationId: string };
  }>();

  function handleEdit(org: Organization) {
    dispatch('edit', { organization: org });
  }

  function handleAddDocument(orgId: string) {
    dispatch('addDocument', { organizationId: orgId });
  }

  function handleDelete(orgId: string) {
    if (confirm('Are you sure you want to delete this organization?')) {
      deleteOrganization(orgId);
    }
  }

  function handleSelectOrg(orgId: string) {
    setCurrentOrganization(orgId);
  }
  
  // Use derived values from the getters
  const organizations = $derived(getOrganizations());
  const currentOrgId = $derived(getCurrentOrganizationId());
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
  {#each organizations as org}
    <Card class={"h-full " + (org.id === currentOrgId ? "border-primary" : "")}>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="flex items-center gap-2">
              <button
                onclick={() => handleSelectOrg(org.id)}
                class="hover:underline flex items-center gap-1"
              >
                <Building2 class="h-4 w-4" />
                <span>{org.name}</span>
              </button>
            </CardTitle>
            <CardDescription>
              {org.documents.length} document{org.documents.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div class="flex gap-2">
            <Button variant="ghost" size="icon" onclick={() => handleEdit(org)}>
              <Edit class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onclick={() => handleDelete(org.id)}>
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="pb-0">
        <div class="text-sm">
          {#if org.documents.length > 0}
            <ul class="list-disc pl-5 space-y-1">
              {#each org.documents.slice(0, 3) as doc}
                <li class="truncate">{doc.name}</li>
              {/each}
              {#if org.documents.length > 3}
                <li class="text-muted-foreground">+{org.documents.length - 3} more</li>
              {/if}
            </ul>
          {:else}
            <p class="text-muted-foreground">No documents yet</p>
          {/if}
        </div>
      </CardContent>
      <CardFooter class="pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          class="w-full"
          onclick={() => handleAddDocument(org.id)}
        >
          Add Document
        </Button>
      </CardFooter>
    </Card>
  {/each}
</div> 