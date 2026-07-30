<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Camera, Loader2, X, ZoomIn, Eye } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToastStore()
const fileInput = ref(null)
const uploading = ref(false)
const previewUrl = ref(null)
const dragOver = ref(false)

const MAX_SIZE = 500

const displayUrl = computed(() => previewUrl.value || auth.user?.avata_url || null)
const initials = computed(() => (auth.displayName || 'U').charAt(0).toUpperCase())

// --- View profile (lightbox) ---
const viewModalOpen = ref(false)

function openViewModal() {
  if (!displayUrl.value) return
  viewModalOpen.value = true
}

function closeViewModal() {
  viewModalOpen.value = false
}

function handleAvatarClick() {
  if (displayUrl.value) {
    openViewModal()
  } else {
    triggerPicker()
  }
}

function switchToChangePhoto() {
  viewModalOpen.value = false
  triggerPicker()
}

// --- Crop modal state ---
const cropModalOpen = ref(false)
const cropImageSrc = ref(null)
const cropZoom = ref(1)
const cropOffset = ref({ x: 0, y: 0 })
const naturalSize = ref({ w: 0, h: 0 })
const stageRef = ref(null)
const dragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const pendingFileName = ref('avatar.jpg')

const STAGE_SIZE = 300

function triggerPicker() {
  fileInput.value?.click()
}

function onFileChange(e) {
  openCropper(e.target.files?.[0])
  e.target.value = ''
}

function onDrop(e) {
  dragOver.value = false
  openCropper(e.dataTransfer.files?.[0])
}

function openCropper(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.error('Please choose an image file.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image must be under 5MB.')
    return
  }

  pendingFileName.value = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      naturalSize.value = { w: img.width, h: img.height }
      cropImageSrc.value = e.target.result
      cropZoom.value = 1
      cropOffset.value = { x: 0, y: 0 }
      cropModalOpen.value = true
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

const baseScale = computed(() => {
  if (!naturalSize.value.w) return 1
  return Math.max(STAGE_SIZE / naturalSize.value.w, STAGE_SIZE / naturalSize.value.h)
})

const imgStyle = computed(() => {
  const scale = baseScale.value * cropZoom.value
  const w = naturalSize.value.w * scale
  const h = naturalSize.value.h * scale
  return {
    width: w + 'px',
    height: h + 'px',
    transform: `translate(-50%, -50%) translate(${cropOffset.value.x}px, ${cropOffset.value.y}px)`,
  }
})

function clampOffset() {
  const scale = baseScale.value * cropZoom.value
  const w = naturalSize.value.w * scale
  const h = naturalSize.value.h * scale
  const maxX = Math.max(0, (w - STAGE_SIZE) / 2)
  const maxY = Math.max(0, (h - STAGE_SIZE) / 2)
  cropOffset.value.x = Math.min(maxX, Math.max(-maxX, cropOffset.value.x))
  cropOffset.value.y = Math.min(maxY, Math.max(-maxY, cropOffset.value.y))
}

function startDrag(e) {
  dragging.value = true
  const point = e.touches ? e.touches[0] : e
  dragStart.value = { x: point.clientX - cropOffset.value.x, y: point.clientY - cropOffset.value.y }
}

function onDrag(e) {
  if (!dragging.value) return
  const point = e.touches ? e.touches[0] : e
  cropOffset.value = {
    x: point.clientX - dragStart.value.x,
    y: point.clientY - dragStart.value.y,
  }
  clampOffset()
}

function stopDrag() {
  dragging.value = false
}

function onZoomChange() {
  clampOffset()
}

function cancelCrop() {
  cropModalOpen.value = false
  cropImageSrc.value = null
}

async function confirmCrop() {
  const scale = baseScale.value * cropZoom.value
  const w = naturalSize.value.w * scale
  const h = naturalSize.value.h * scale

  const sx = (w / 2 - STAGE_SIZE / 2 - cropOffset.value.x) / scale
  const sy = (h / 2 - STAGE_SIZE / 2 - cropOffset.value.y) / scale
  const sSize = STAGE_SIZE / scale

  const img = new Image()
  img.src = cropImageSrc.value
  await new Promise((resolve) => { img.onload = resolve })

  const canvas = document.createElement('canvas')
  canvas.width = MAX_SIZE
  canvas.height = MAX_SIZE
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, MAX_SIZE, MAX_SIZE)

  canvas.toBlob(async (blob) => {
    if (!blob) {
      toast.error('Could not process image.')
      return
    }
    const croppedFile = new File([blob], pendingFileName.value, { type: 'image/jpeg' })
    previewUrl.value = URL.createObjectURL(croppedFile)
    cropModalOpen.value = false
    cropImageSrc.value = null
    await upload(croppedFile)
  }, 'image/jpeg', 0.9)
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
</script>

<template>
  <div class="flex items-center gap-5">
    <div class="relative w-20 h-20 rounded-full shrink-0 group cursor-pointer" @click="handleAvatarClick"
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
        <Eye v-else-if="displayUrl" class="w-5 h-5 text-white" />
        <Camera v-else class="w-5 h-5 text-white" />
      </div>

      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
    </div>

    <div>
      <p class="text-sm font-medium text-main">Profile Photo</p>
      <p class="text-xs text-muted mt-0.5">Click to view. Drag a new image here to change it.</p>
    </div>

    <!-- View Profile Modal -->
    <Teleport to="body">
      <div
        v-if="viewModalOpen"
        class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
        @click="closeViewModal"
      >
        <button
          class="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          @click="closeViewModal"
        >
          <X class="w-6 h-6" />
        </button>

        <div class="flex flex-col items-center gap-4" @click.stop>
          <img
            :src="displayUrl"
            class="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-2xl"
          />
          <button
            @click="switchToChangePhoto"
            class="bg-[#C6A75A] hover:bg-[#B8985A] text-[#0B0B0B] text-sm font-medium rounded-xl px-5 py-2.5 transition-colors"
          >
            Change Photo
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Crop Modal -->
    <Teleport to="body">
      <div
        v-if="cropModalOpen"
        class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
      >
        <div class="bg-card rounded-2xl p-5 w-full max-w-sm" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-main">Crop your photo</h3>
            <button @click="cancelCrop" class="text-muted hover:text-main p-1">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div
            ref="stageRef"
            class="relative mx-auto overflow-hidden rounded-full bg-black/20 select-none"
            :style="{ width: STAGE_SIZE + 'px', height: STAGE_SIZE + 'px', cursor: dragging ? 'grabbing' : 'grab' }"
            @mousedown="startDrag"
            @mousemove="onDrag"
            @mouseup="stopDrag"
            @mouseleave="stopDrag"
            @touchstart="startDrag"
            @touchmove="onDrag"
            @touchend="stopDrag"
          >
            <img
              v-if="cropImageSrc"
              :src="cropImageSrc"
              :style="imgStyle"
              class="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
              draggable="false"
            />
          </div>

          <div class="flex items-center gap-3 mt-4">
            <ZoomIn class="w-4 h-4 text-muted shrink-0" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              v-model.number="cropZoom"
              @input="onZoomChange"
              class="w-full accent-[#C6A75A]"
            />
          </div>

          <div class="flex gap-2 mt-5">
            <button
              @click="confirmCrop"
              class="flex-1 bg-[#C6A75A] hover:bg-[#B8985A] text-[#0B0B0B] text-sm font-medium rounded-xl py-2.5 transition-colors"
            >
              Save Photo
            </button>
            <button
              @click="cancelCrop"
              class="px-4 rounded-xl border border-app text-sm text-muted hover:text-main transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>