<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Camera, Loader2 } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToastStore()
const fileInput = ref(null)
const uploading = ref(false)
const previewUrl = ref(null)
const dragOver = ref(false)

// auth.user.avata is the stored filename; auth.user.avata_url is the
// full public URL built by the model's getAvataUrlAttribute() accessor
// (appended via $appends = ['avata_url']). Always bind to avata_url.
const displayUrl = computed(() => previewUrl.value || auth.user?.avata_url || null)
const initials = computed(() => (auth.displayName || 'U').charAt(0).toUpperCase())

function triggerPicker() {
  fileInput.value?.click()
}

function validateAndUpload(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.error('Please choose an image file.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image must be under 5MB.')
    return
  }
  previewUrl.value = URL.createObjectURL(file)
  upload(file)
}

async function upload(file) {
  uploading.value = true
  try {
    await auth.uploadAvatar(file)
    toast.success('Profile photo updated.')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Could not upload photo.')
    previewUrl.value = null
  } finally {
    uploading.value = false
  }
}

function onFileChange(e) {
  validateAndUpload(e.target.files?.[0])
  e.target.value = ''
}

function onDrop(e) {
  dragOver.value = false
  validateAndUpload(e.dataTransfer.files?.[0])
}
</script>

<template>
  <div class="flex items-center gap-5">
    <div class="relative w-20 h-20 rounded-full shrink-0 group cursor-pointer" @click="triggerPicker"
      @dragover.prevent="dragOver = true" @dragleave.prevent="dragOver = false" @drop.prevent="onDrop">
      <div
        class="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[#D0B45C] to-[#8A6F32] flex items-center justify-center text-[#0B0B0B] font-semibold text-2xl transition-opacity"
        :class="{ 'opacity-50': uploading, 'ring-2 ring-[#C6A75A] ring-offset-2 ring-offset-app': dragOver }">
        <img v-if="displayUrl" :src="displayUrl" class="w-full h-full object-cover" />
        <span v-else>{{ initials }}</span>
      </div>

      <div
        class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Loader2 v-if="uploading" class="w-5 h-5 text-white animate-spin" />
        <Camera v-else class="w-5 h-5 text-white" />
      </div>

      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
    </div>

    <div>
      <p class="text-sm font-medium text-main">Profile Photo</p>
      <p class="text-xs text-muted mt-0.5">Click or drag an image to update. JPG or PNG, up to 5MB.</p>
    </div>
  </div>
</template>