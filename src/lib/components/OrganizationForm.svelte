<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Organization } from '$lib/types';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Form from '$lib/components/ui/form';

  const { organization = undefined } = $props<{
    organization?: Organization;
  }>();

  // Create a typed event dispatcher
  const dispatch = createEventDispatcher<{
    cancel: undefined;
    submit: { organization: Organization };
  }>();

  // Initialize form state from organization or with default values
  let name = $state(organization?.name || '');
  let description = $state(organization?.description || '');
  let isSubmitting = $state(false);
  
  // Form validation
  let nameError = $state('');
  let descriptionError = $state('');
  
  // Validate the form inputs
  function validateName(value: string) {
    if (!value.trim()) {
      nameError = 'Name is required';
      return false;
    }
    if (value.trim().length < 3) {
      nameError = 'Name must be at least 3 characters';
      return false;
    }
    nameError = '';
    return true;
  }
  
  function validateDescription(value: string) {
    if (!value.trim()) {
      descriptionError = 'Description is required';
      return false;
    }
    if (value.trim().length < 3) {
      descriptionError = 'Description must be at least 3 characters';
      return false;
    }
    descriptionError = '';
    return true;
  }
  
  // Validate on input change
  $effect(() => {
    if (name) validateName(name);
  });
  
  $effect(() => {
    if (description) validateDescription(description);
  });
  
  // Check if the form is valid
  const isFormValid = $derived(
    name.trim().length >= 3 && 
    description.trim().length >= 3 && 
    !nameError && 
    !descriptionError
  );

  // Handle form submission
  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    // Validate all fields
    const nameIsValid = validateName(name);
    const descriptionIsValid = validateDescription(description);
    
    if (!nameIsValid || !descriptionIsValid) {
      return;
    }
    
    isSubmitting = true;

    // Create organization object from form data
    const updatedOrganization: Organization = {
      id: organization?.id,
      name,
      description,
      createdAt: organization?.createdAt || new Date().getTime(),
      updatedAt: new Date().getTime(),
      documents: organization?.documents || []
    };

    // Dispatch the submit event with the updated organization
    dispatch('submit', { organization: updatedOrganization });
    isSubmitting = false;
  }

  // Handle cancel button click
  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="space-y-4 p-4">
  <h2 class="text-xl font-bold">
    {organization ? 'Edit' : 'New'} Organization
  </h2>

  <form onsubmit={handleSubmit} class="space-y-4">
    <div class="space-y-2">
      <Label for="name">Name</Label>
      <Input 
        id="name" 
        bind:value={name} 
        required 
        aria-invalid={!!nameError}
      />
      {#if nameError}
        <p class="text-sm text-red-500">{nameError}</p>
      {/if}
    </div>

    <div class="space-y-2">
      <Label for="description">Description</Label>
      <Input 
        id="description" 
        bind:value={description} 
        required 
        aria-invalid={!!descriptionError}
      />
      {#if descriptionError}
        <p class="text-sm text-red-500">{descriptionError}</p>
      {/if}
    </div>

    <div class="flex justify-end space-x-2">
      <Button variant="outline" onclick={handleCancel} type="button">Cancel</Button>
      <Button type="submit" disabled={!isFormValid || isSubmitting}>
        {organization ? 'Update' : 'Create'} Organization
      </Button>
    </div>
  </form>
</div> 