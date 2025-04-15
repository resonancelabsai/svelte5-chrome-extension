<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '$lib/components/ui/dropdown-menu';
  import { 
    getCurrentOrganizationId, 
    getOrganizations, 
    setCurrentOrganization 
  } from '$lib/stores/organization.svelte.js';
  import Building2 from "@lucide/svelte/icons/building-2";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Plus from "@lucide/svelte/icons/plus";
  import Settings from "@lucide/svelte/icons/settings";
  import ThemeToggle from './ThemeToggle.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    newOrg: void;
    openSettings: void;
  }>();

  function handleNewOrg() {
    dispatch('newOrg');
  }

  function handleChangeOrg(id: string) {
    setCurrentOrganization(id);
  }

  function handleOpenSettings() {
    dispatch('openSettings');
  }

  const currentOrgId = $derived(getCurrentOrganizationId());
  const organizations = $derived(getOrganizations());
  const currentOrg = $derived(
    organizations.find(org => org.id === currentOrgId)
  );
</script>

<header class="border-b p-2 flex items-center justify-between">
  <div class="flex items-center gap-2">
    <Building2 class="h-5 w-5" />
    <h1 class="text-lg font-semibold truncate">ContextMaster</h1>
  </div>

  <div class="flex items-center gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="sm" class="flex items-center gap-1">
          <span class="truncate max-w-[120px]">{currentOrg?.name || 'Select Org'}</span>
          <ChevronDown class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {#each organizations as org}
          <DropdownMenuItem 
            on:click={() => handleChangeOrg(org.id)}
          >
            <span class:font-bold={org.id === currentOrgId}>{org.name}</span>
          </DropdownMenuItem>
        {/each}
        <DropdownMenuItem on:click={handleNewOrg}>
          <div class="flex items-center gap-1 text-primary">
            <Plus class="h-4 w-4" />
            <span>New Organization</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Button variant="ghost" size="icon" onclick={handleOpenSettings}>
      <Settings class="h-5 w-5" />
    </Button>
    
    <ThemeToggle />
  </div>
</header> 