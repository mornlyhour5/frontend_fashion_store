<script setup>
import { ref } from 'vue'
import Sidebar from '@/components/admin-layout/Sidebar.vue'
import Topbar from '@/components/admin-layout/Topbar.vue'

const collapsed = ref(false)
</script>

<template>
  <div class="flex bg-app min-h-screen">
    <Sidebar :collapsed="collapsed" />
    <div class="flex-1 flex flex-col min-w-0">
      <Topbar @toggle-sidebar="collapsed = !collapsed" />
      <main class="flex-1 p-6">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
