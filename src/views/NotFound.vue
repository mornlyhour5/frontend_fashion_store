<script setup>
import { RouterLink } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<template>
  <MainLayout>
    <div class="min-h-[60vh] flex items-center justify-center p-4">
      <div class="text-center">
        <p class="text-7xl font-serif font-bold text-[#C6A75A] mb-2">404</p>
        <h1 class="text-xl font-semibold text-main mb-2">Page not found</h1>
        <p class="text-sm text-muted mb-6">The page you're looking for doesn't exist.</p>
        <RouterLink to="/">
          <BaseButton>Back to Home</BaseButton>
        </RouterLink>
      </div>
    </div>
  </MainLayout>
</template>
