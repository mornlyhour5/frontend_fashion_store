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
import { Plus, Pencil, Trash2, ImageOff } from 'lucide-vue-next'

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

// build a full URL for images stored on the backend
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

function onImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
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
        <img
          v-if="row.image_url"
          :src="imageUrl(row.image_url)"
          :alt="row.name"
          class="h-10 w-10 rounded-lg object-cover border border-border"
        />
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
          <input type="file" accept="image/*" @change="onImageChange" class="text-sm text-muted" />
          <img v-if="imagePreview" :src="imagePreview" class="mt-2 h-16 w-16 object-cover rounded-lg border border-border" />
        </div>
      </form>
      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton :loading="saving" @click="handleSave">{{ isEditing ? 'Save Changes' : 'Create' }}</BaseButton>
      </template>
    </Modal>

    <ConfirmDialog v-model="confirmOpen" title="Delete this category?" :loading="deleting" @confirm="handleDelete" />
  </div>
</template>