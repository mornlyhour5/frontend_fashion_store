<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import Modal from '@/components/admin-ui/Modal.vue'
import ConfirmDialog from '@/components/admin-ui/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { brandsApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Plus, Pencil, Trash2, ImagePlus, X } from 'lucide-vue-next'

const toast = useToastStore()
const columns = [
  { key: 'logo', label: '', width: '56px' },
  { key: 'name', label: 'Brand' },
  { key: 'link', label: 'Website' },
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

const logoFile = ref(null)
const logoPreview = ref(null)
const fileInputRef = ref(null)

const slugManuallyEdited = ref(false)

const form = reactive({ name: '', slug: '', description: '', link: '', sort_order: 0, status: 1 })
const statusOptions = [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }]

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

watch(() => form.name, (newName) => {
  if (!slugManuallyEdited.value) {
    form.slug = slugify(newName)
  }
})

function onSlugInput() {
  slugManuallyEdited.value = true
}

function regenerateSlug() {
  form.slug = slugify(form.name)
  slugManuallyEdited.value = false
}

function resetForm() {
  form.name = ''
  form.slug = ''
  form.description = ''
  form.link = ''
  form.sort_order = 0
  form.status = 1
  logoFile.value = null
  logoPreview.value = null
  slugManuallyEdited.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function loadBrands() {
  loading.value = true
  try {
    const res = await brandsApi.list({ page: page.value, per_page: perPage.value, search: searchQuery.value })
    rows.value = res.data.data || res.data || []
    total.value = res.data.total ?? rows.value.length
  } catch (e) {
    toast.error('Could not load brands.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  targetId.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row) {
  isEditing.value = true
  targetId.value = row.id
  form.name = row.name
  form.slug = row.slug
  form.description = row.description
  form.link = row.link
  form.sort_order = row.sort_order
  form.status = row.status
  logoFile.value = null
  logoPreview.value = row.logo_url || null
  slugManuallyEdited.value = true
  if (fileInputRef.value) fileInputRef.value.value = ''
  modalOpen.value = true
}

function askDelete(row) { targetId.value = row.id; confirmOpen.value = true }

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.error('Please select a valid image file.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image must be smaller than 5MB.')
    return
  }

  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

function removeLogo() {
  logoFile.value = null
  logoPreview.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function buildFormData() {
  const fd = new FormData()
  fd.append('name', form.name)
  fd.append('slug', slugify(form.slug))
  fd.append('description', form.description || '')
  fd.append('link', form.link || '')
  fd.append('sort_order', form.sort_order)
  fd.append('status', form.status)

  if (logoFile.value) {
    fd.append('logo', logoFile.value)
  }

  return fd
}

async function handleSave() {
  if (!form.name) {
    toast.error('Brand name is required.')
    return
  }

  saving.value = true
  try {
    const payload = buildFormData()

    if (isEditing.value) {
      await brandsApi.updateForm(targetId.value, payload)
      toast.success('Brand updated.')
    } else {
      await brandsApi.createForm(payload)
      toast.success('Brand created.')
    }
    modalOpen.value = false
    loadBrands()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to save brand.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await brandsApi.remove(targetId.value)
    toast.success('Brand deleted.')
    confirmOpen.value = false
    loadBrands()
  } catch (e) {
    toast.error('Failed to delete brand.')
  } finally {
    deleting.value = false
  }
}

onMounted(loadBrands)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-serif font-semibold text-main">Brands</h1>
        <p class="text-sm text-muted mt-1">Manage the brands carried in your store.</p>
      </div>
      <BaseButton @click="openCreate"><Plus class="w-4 h-4" /> Add Brand</BaseButton>
    </div>

    <DataTable
      :columns="columns" :rows="rows" :loading="loading"
      v-model:search-query="searchQuery" v-model:page="page"
      :per-page="perPage" :total="total" search-placeholder="Search brands..."
      @search="loadBrands"
    >
      <template #cell-logo="{ row }">
        <div class="w-9 h-9 rounded-lg bg-card-alt overflow-hidden flex items-center justify-center">
          <img v-if="row.logo" :src="row.logo_url" class="w-full h-full object-cover" />
          <span v-else class="text-muted text-xs">—</span>
        </div>
      </template>
      <template #cell-link="{ value }">
        <a v-if="value" :href="value" target="_blank" class="text-[#C6A75A] hover:underline text-xs">{{ value }}</a>
        <span v-else class="text-muted">—</span>
      </template>
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

    <Modal v-model="modalOpen" :title="isEditing ? 'Edit Brand' : 'Add Brand'" size="sm">
      <form @submit.prevent="handleSave" class="space-y-4">

        <!-- Logo Upload -->
        <div>
          <label class="text-xs font-medium text-muted uppercase tracking-wide mb-1.5 block">Brand Logo</label>
          <div class="flex items-center gap-4">
            <div class="relative w-16 h-16 rounded-xl bg-card-alt border border-app overflow-hidden flex items-center justify-center shrink-0">
              <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover" />
              <ImagePlus v-else class="w-5 h-5 text-muted" />
              <button v-if="logoPreview" type="button" @click="removeLogo"
                class="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                <X class="w-3 h-3" />
              </button>
            </div>
            <div class="flex-1">
              <input ref="fileInputRef" type="file" accept="image/*" @change="onFileChange" class="hidden" id="brand-logo-input" />
              <label for="brand-logo-input"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-app bg-card-alt text-sm text-main cursor-pointer hover:border-[#C6A75A] transition-colors">
                <ImagePlus class="w-4 h-4" />
                {{ logoPreview ? 'Change Logo' : 'Upload Logo' }}
              </label>
              <p class="text-xs text-muted mt-1.5">PNG, JPG up to 5MB.</p>
            </div>
          </div>
        </div>

        <BaseInput v-model="form.name" label="Brand Name" required />

        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-muted uppercase tracking-wide">Slug</label>
            <button type="button" @click="regenerateSlug" class="text-xs text-[#C6A75A] hover:underline">
              Regenerate from name
            </button>
          </div>
          <BaseInput v-model="form.slug" placeholder="auto-generated-from-name" @input="onSlugInput" />
        </div>

        <BaseInput v-model="form.link" label="Website Link" placeholder="https://..." />
        <BaseInput v-model="form.sort_order" label="Sort Order" type="number" />
        <BaseSelect v-model="form.status" label="Status" :options="statusOptions" />
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-muted uppercase tracking-wide">Description</label>
          <textarea v-model="form.description" rows="3" class="bg-card-alt border border-app rounded-xl px-4 py-2.5 text-sm text-main outline-none focus:border-[#C6A75A] transition-colors resize-none" />
        </div>
      </form>
      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton :loading="saving" @click="handleSave">{{ isEditing ? 'Save Changes' : 'Create' }}</BaseButton>
      </template>
    </Modal>

    <ConfirmDialog v-model="confirmOpen" title="Delete this brand?" :loading="deleting" @confirm="handleDelete" />
  </div>
</template>