<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import Modal from '@/components/admin-ui/Modal.vue'
import ConfirmDialog from '@/components/admin-ui/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { categoriesApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Plus, Pencil, Trash2, ImageOff, X, ZoomIn } from 'lucide-vue-next'

const toast = useToastStore()
const columns = [
  { key: 'image', label: 'Image', width: '70px' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'parent_id', label: 'Parent' },
  { key: 'sort_order', label: 'Sort Order' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', width: '100px' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const searchQuery = ref('')
const loading = ref(false)

const modalOpen = ref(false)
const confirmOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const targetId = ref(null)

const imageFile = ref(null)
const imagePreview = ref('')

const MAX_SIZE = 500

const form = reactive({
  name: '',
  slug: '',
  parent_id: '',
  sort_order: 0,
  status: 1,
})
const statusOptions = [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }]

const parentOptions = computed(() => {
  const opts = [{ value: '', label: '— (root)' }]
  rows.value.forEach(r => {
    if (!isEditing.value || r.id !== targetId.value) {
      opts.push({ value: r.id, label: r.name })
    }
  })
  return opts
})

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const slugTouched = ref(false)
watch(() => form.name, (val) => {
  if (!isEditing.value && !slugTouched.value) {
    form.slug = slugify(val)
  }
})

function imageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  const base = import.meta.env.VITE_ASSET_URL || ''
  return `${base}/storage/${path}`
}

function resetForm() {
  form.name = ''
  form.slug = ''
  form.parent_id = ''
  form.sort_order = 0
  form.status = 1
  imageFile.value = null
  imagePreview.value = ''
  slugTouched.value = false
}

async function loadCategories() {
  loading.value = true
  try {
    const res = await categoriesApi.list({ page: page.value, per_page: perPage.value, search: searchQuery.value })
    rows.value = res.data.data || res.data || []
    total.value = res.data.total ?? rows.value.length
  } catch (e) {
    toast.error('Could not load categories.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  resetForm()
  modalOpen.value = true
}

function openEdit(row) {
  isEditing.value = true
  targetId.value = row.id
  form.name = row.name
  form.slug = row.slug
  form.parent_id = row.parent_id ?? ''
  form.sort_order = row.sort_order
  form.status = row.status
  imageFile.value = null
  imagePreview.value = imageUrl(row.image_url)
  slugTouched.value = true
  modalOpen.value = true
}

function askDelete(row) {
  targetId.value = row.id
  confirmOpen.value = true
}

// --- Crop modal state ---
const cropModalOpen = ref(false)
const cropImageSrc = ref(null)
const cropZoom = ref(1)
const cropOffset = ref({ x: 0, y: 0 })
const naturalSize = ref({ w: 0, h: 0 })
const dragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const pendingFileName = ref('category.jpg')
const fileInputRef = ref(null)

const STAGE_SIZE = 300

function onImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  openCropper(file)
  e.target.value = ''
}

function openCropper(file) {
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

function confirmCrop() {
  const scale = baseScale.value * cropZoom.value
  const w = naturalSize.value.w * scale
  const h = naturalSize.value.h * scale

  const sx = (w / 2 - STAGE_SIZE / 2 - cropOffset.value.x) / scale
  const sy = (h / 2 - STAGE_SIZE / 2 - cropOffset.value.y) / scale
  const sSize = STAGE_SIZE / scale

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = MAX_SIZE
    canvas.height = MAX_SIZE
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, MAX_SIZE, MAX_SIZE)

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Could not process image.')
        return
      }
      const croppedFile = new File([blob], pendingFileName.value, { type: 'image/jpeg' })
      imageFile.value = croppedFile
      imagePreview.value = URL.createObjectURL(croppedFile)
      cropModalOpen.value = false
      cropImageSrc.value = null
    }, 'image/jpeg', 0.9)
  }
  img.src = cropImageSrc.value
}

// --- View big image modal (table + form preview) ---
const viewModalOpen = ref(false)
const viewImageSrc = ref('')
const viewImageName = ref('')

function openViewImage(src, name) {
  if (!src) return
  viewImageSrc.value = src
  viewImageName.value = name || ''
  viewModalOpen.value = true
}

function buildPayload() {
  const fd = new FormData()
  fd.append('name', form.name)
  fd.append('slug', form.slug || slugify(form.name))
  fd.append('parent_id', form.parent_id || '')
  fd.append('sort_order', form.sort_order)
  fd.append('status', form.status)
  if (imageFile.value) {
    fd.append('image', imageFile.value)
  }
  return fd
}

async function handleSave() {
  saving.value = true
  try {
    const payload = buildPayload()
    if (isEditing.value) {
      await categoriesApi.updateForm(targetId.value, payload)
      toast.success('Category updated.')
    } else {
      await categoriesApi.create(payload)
      toast.success('Category created.')
    }
    modalOpen.value = false
    loadCategories()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to save category.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await categoriesApi.remove(targetId.value)
    toast.success('Category deleted.')
    confirmOpen.value = false
    loadCategories()
  } catch (e) {
    toast.error('Failed to delete category.')
  } finally {
    deleting.value = false
  }
}

onMounted(loadCategories)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-serif font-semibold text-main">Categories</h1>
        <p class="text-sm text-muted mt-1">Organize your product catalog structure.</p>
      </div>
      <BaseButton @click="openCreate"><Plus class="w-4 h-4" /> Add Category</BaseButton>
    </div>

    <DataTable
      :columns="columns" :rows="rows" :loading="loading"
      v-model:search-query="searchQuery" v-model:page="page"
      :per-page="perPage" :total="total" search-placeholder="Search categories..."
      @search="loadCategories"
    >
      <template #cell-image="{ row }">
        <button
          v-if="row.image_url"
          type="button"
          @click="openViewImage(imageUrl(row.image_url), row.name)"
          class="h-10 w-10 rounded-lg overflow-hidden border border-border cursor-zoom-in hover:ring-2 hover:ring-[#C6A75A] transition-all"
        >
          <img :src="imageUrl(row.image_url)" :alt="row.name" class="h-full w-full object-cover" />
        </button>
        <div v-else class="h-10 w-10 rounded-lg border border-border bg-card-alt flex items-center justify-center text-muted">
          <ImageOff class="w-4 h-4" />
        </div>
      </template>
      <template #cell-parent_id="{ value }">{{ value || '— (root)' }}</template>
      <template #cell-status="{ value }">
        <BaseBadge :status="value === 1 ? 'active' : 'inactive'" :text="value === 1 ? 'Active' : 'Inactive'" />
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1.5 justify-end">
          <button @click="openEdit(row)" class="p-1.5 rounded-lg text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors"><Pencil class="w-4 h-4" /></button>
          <button @click="askDelete(row)" class="p-1.5 rounded-lg text-muted hover:text-[#D9534F] hover:bg-card-alt transition-colors"><Trash2 class="w-4 h-4" /></button>
        </div>
      </template>
    </DataTable>

    <Modal v-model="modalOpen" :title="isEditing ? 'Edit Category' : 'Add Category'" size="sm">
      <form @submit.prevent="handleSave" class="space-y-4">
        <BaseInput v-model="form.name" label="Category Name" required />
        <BaseInput v-model="form.slug" label="Slug" placeholder="auto-generated-from-name" @input="slugTouched = true" />
        <BaseSelect v-model="form.parent_id" label="Parent Category" :options="parentOptions" />
        <BaseInput v-model="form.sort_order" label="Sort Order" type="number" />
        <BaseSelect v-model="form.status" label="Status" :options="statusOptions" />

        <div>
          <label class="block text-sm font-medium text-main mb-1.5">Image</label>
          <input ref="fileInputRef" type="file" accept="image/*" @change="onImageChange" class="text-sm text-muted" />
          <button
            v-if="imagePreview"
            type="button"
            @click="openViewImage(imagePreview, form.name)"
            class="mt-2 block cursor-zoom-in hover:ring-2 hover:ring-[#C6A75A] rounded-lg transition-all"
          >
            <img :src="imagePreview" class="h-16 w-16 object-cover rounded-lg border border-border" />
          </button>
          <p class="text-xs text-muted mt-1">Image will be cropped and saved as 500x500px.</p>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton :loading="saving" @click="handleSave">{{ isEditing ? 'Save Changes' : 'Create' }}</BaseButton>
      </template>
    </Modal>

    <ConfirmDialog v-model="confirmOpen" title="Delete this category?" :loading="deleting" @confirm="handleDelete" />

    <!-- Crop Modal -->
    <Teleport to="body">
      <div v-if="cropModalOpen" class="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6">
        <div class="bg-card rounded-2xl p-5 w-full max-w-sm" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-main">Crop image (500x500)</h3>
            <button @click="cancelCrop" class="text-muted hover:text-main p-1"><X class="w-4 h-4" /></button>
          </div>

          <div
            class="relative mx-auto overflow-hidden rounded-xl bg-black/20 select-none"
            :style="{ width: STAGE_SIZE + 'px', height: STAGE_SIZE + 'px', cursor: dragging ? 'grabbing' : 'grab' }"
            @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag"
            @touchstart="startDrag" @touchmove="onDrag" @touchend="stopDrag"
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
            <input type="range" min="1" max="3" step="0.01" v-model.number="cropZoom" @input="onZoomChange" class="w-full accent-[#C6A75A]" />
          </div>

          <div class="flex gap-2 mt-5">
            <button @click="confirmCrop" class="flex-1 bg-[#C6A75A] hover:bg-[#B8985A] text-[#0B0B0B] text-sm font-medium rounded-xl py-2.5 transition-colors">Save Crop</button>
            <button @click="cancelCrop" class="px-4 rounded-xl border border-app text-sm text-muted hover:text-main transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- View Big Image Modal -->
    <Teleport to="body">
      <div v-if="viewModalOpen" class="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6" @click="viewModalOpen = false">
        <button class="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors" @click="viewModalOpen = false">
          <X class="w-6 h-6" />
        </button>
        <div class="flex flex-col items-center gap-3" @click.stop>
          <img :src="viewImageSrc" class="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
          <p v-if="viewImageName" class="text-white/80 text-sm">{{ viewImageName }}</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>