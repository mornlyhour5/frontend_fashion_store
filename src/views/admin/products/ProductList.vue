<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import Modal from '@/components/admin-ui/Modal.vue'
import ConfirmDialog from '@/components/admin-ui/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { productsApi, categoriesApi, brandsApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Plus, Pencil, Trash2, ImagePlus, X } from 'lucide-vue-next'

const toast = useToastStore()

const columns = [
  { key: 'image', label: '', width: '64px' },
  { key: 'name', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'base_price', label: 'Price' },
  { key: 'status', label: 'Status' },
  { key: 'views_count', label: 'Views' },
  { key: 'actions', label: '', width: '100px' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const searchQuery = ref('')
const loading = ref(false)

const categories = ref([])
const brands = ref([])

const modalOpen = ref(false)
const confirmOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const targetId = ref(null)

const imageFile = ref(null)
const imagePreview = ref(null)
const fileInputRef = ref(null)

const slugManuallyEdited = ref(false)

const form = reactive({
  name: '',
  slug: '',
  category_id: '',
  brand_id: '',
  description: '',
  short_description: '',
  base_price: '',
  material: '',
  country_of_origin: '',
  weight: '',
  gender: 'unisex',
  status: 1,
  is_featured: 0,
})

const statusOptions = [
  { value: 1, label: 'Active' },
  { value: 0, label: 'Inactive' },
]
const genderOptions = [
  { value: '1', label: 'Men' },
  { value: '2', label: 'Women' },
  { value: '3', label: 'Unisex' },
]

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
  form.category_id = categories.value[0]?.id || ''
  form.brand_id = brands.value[0]?.id || ''
  form.description = ''
  form.short_description = ''
  form.base_price = ''
  form.material = ''
  form.country_of_origin = ''
  form.weight = ''
  form.gender = 'unisex'
  form.status = 1
  form.is_featured = 0
  imageFile.value = null
  imagePreview.value = null
  slugManuallyEdited.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function loadLookups() {
  try {
    const [catRes, brandRes] = await Promise.all([categoriesApi.list({ per_page: 100 }), brandsApi.list({ per_page: 100 })])
    categories.value = catRes.data.data || catRes.data || []
    brands.value = brandRes.data.data || brandRes.data || []
  } catch (e) {
    categories.value = []
    brands.value = []
  }
}

async function loadProducts() {
  loading.value = true
  try {
    const res = await productsApi.list({ page: page.value, per_page: perPage.value, search: searchQuery.value })
    rows.value = res.data.data || res.data || []
    total.value = res.data.total ?? rows.value.length
  } catch (e) {
    toast.error('Could not load products. Check your API connection.')
    rows.value = []
    total.value = 0
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
  form.category_id = row.category_id
  form.brand_id = row.brand_id
  form.description = row.description
  form.short_description = row.short_description || ''
  form.base_price = row.base_price
  form.material = row.material || ''
  form.country_of_origin = row.country_of_origin || ''
  form.weight = row.weight || ''
  form.gender = row.gender || 'unisex'
  form.status = row.status
  form.is_featured = row.is_featured || 0
  imageFile.value = null
  imagePreview.value = row.image_url || null
  slugManuallyEdited.value = true
  if (fileInputRef.value) fileInputRef.value.value = ''
  modalOpen.value = true
}

function askDelete(row) {
  targetId.value = row.id
  confirmOpen.value = true
}

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

  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function removeImage() {
  imageFile.value = null
  imagePreview.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function buildFormData() {
  const fd = new FormData()

  // Required for Laravel to treat this multipart POST as a PUT/update.
  // Native HTTP PUT does not reliably parse multipart/form-data bodies,
  // so updateForm() must POST with this override instead.
  if (isEditing.value) {
    fd.append('_method', 'PUT')
  }

  fd.append('name', form.name)
  fd.append('slug', form.slug ? slugify(form.slug) : '')
  if (form.category_id) fd.append('category_id', form.category_id)
  if (form.brand_id) fd.append('brand_id', form.brand_id)
  fd.append('description', form.description || '')
  fd.append('short_description', form.short_description || '')
  if (form.base_price) fd.append('base_price', form.base_price)
  fd.append('material', form.material || '')
  fd.append('country_of_origin', form.country_of_origin || '')
  fd.append('weight', form.weight || '')
  fd.append('gender', form.gender)
  fd.append('status', form.status)
  fd.append('is_featured', form.is_featured)
  if (imageFile.value) fd.append('thumbnail', imageFile.value)
  return fd
}

async function handleSave() {
  if (!form.name || !form.category_id || !form.brand_id || !form.base_price) {
    toast.error('Please fill in all required fields.')
    return
  }

  saving.value = true
  try {
    const payload = buildFormData()

    if (isEditing.value) {
      await productsApi.updateForm(targetId.value, payload)
      toast.success('Product updated successfully.')
    } else {
      await productsApi.createForm(payload)
      toast.success('Product created successfully.')
    }
    modalOpen.value = false
    loadProducts()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to save product.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await productsApi.remove(targetId.value)
    toast.success('Product deleted.')
    confirmOpen.value = false
    loadProducts()
  } catch (e) {
    toast.error('Failed to delete product.')
  } finally {
    deleting.value = false
  }
}

function categoryName(id) {
  return categories.value.find((c) => c.id === id)?.name || '—'
}

onMounted(async () => {
  await loadLookups()
  loadProducts()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-serif font-semibold text-main">Products</h1>
        <p class="text-sm text-muted mt-1">Manage your catalog of {{ total }} products.</p>
      </div>
      <BaseButton @click="openCreate">
        <Plus class="w-4 h-4" /> Add Product
      </BaseButton>
    </div>

    <DataTable :columns="columns" :rows="rows" :loading="loading" v-model:search-query="searchQuery" v-model:page="page"
      :per-page="perPage" :total="total" search-placeholder="Search products..." @search="loadProducts">
      <template #cell-image="{ row }">
        <div class="w-10 h-10 rounded-lg bg-card-alt overflow-hidden flex items-center justify-center">
          <img v-if="row.thumbnail" :src="row.images" class="w-full h-full object-cover" />
          <span v-else class="text-muted text-xs">—</span>
        </div>
      </template>
      <template #cell-name="{ row }">
        <div>
          <p class="font-medium text-main">{{ row.name }}</p>
          <p class="text-xs text-muted">{{ row.slug }}</p>
        </div>
      </template>
      <template #cell-category="{ row }">
        {{ categoryName(row.category_id) }}
      </template>
      <template #cell-base_price="{ value }">
        ${{ Number(value).toFixed(2) }}
      </template>
      <template #cell-status="{ value }">
        <BaseBadge :status="value === 1 ? 'active' : 'inactive'" :text="value === 1 ? 'Active' : 'Inactive'" />
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1.5 justify-end">
          <button @click="openEdit(row)"
            class="p-1.5 rounded-lg text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors">
            <Pencil class="w-4 h-4" />
          </button>
          <button @click="askDelete(row)"
            class="p-1.5 rounded-lg text-muted hover:text-[#D9534F] hover:bg-card-alt transition-colors">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Create / Edit Modal -->
    <Modal v-model="modalOpen" :title="isEditing ? 'Edit Product' : 'Add New Product'" size="lg">
      <form @submit.prevent="handleSave" class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <!-- Image Upload -->
        <div class="sm:col-span-2">
          <label class="text-xs font-medium text-muted uppercase tracking-wide mb-1.5 block">Product Image</label>
          <div class="flex items-center gap-4">
            <div
              class="relative w-24 h-24 rounded-xl bg-card-alt border border-app overflow-hidden flex items-center justify-center shrink-0">
              <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
              <ImagePlus v-else class="w-6 h-6 text-muted" />
              <button v-if="imagePreview" type="button" @click="removeImage"
                class="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                <X class="w-3 h-3" />
              </button>
            </div>
            <div class="flex-1">
              <input ref="fileInputRef" type="file" accept="image/*" @change="onFileChange" class="hidden"
                id="product-image-input" />
              <label for="product-image-input"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-app bg-card-alt text-sm text-main cursor-pointer hover:border-[#C6A75A] transition-colors">
                <ImagePlus class="w-4 h-4" />
                {{ imagePreview ? 'Change Image' : 'Upload Image' }}
              </label>
              <p class="text-xs text-muted mt-1.5">PNG, JPG up to 5MB.</p>
            </div>
          </div>
        </div>

        <div class="sm:col-span-2">
          <BaseInput v-model="form.name" label="Product Name" placeholder="e.g. Cashmere Wool Coat" required />
        </div>

        <div class="sm:col-span-2 flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-muted uppercase tracking-wide">Slug</label>
            <button type="button" @click="regenerateSlug" class="text-xs text-[#C6A75A] hover:underline">
              Regenerate from name
            </button>
          </div>
          <BaseInput v-model="form.slug" placeholder="auto-generated-from-name" @input="onSlugInput" />
        </div>

        <BaseSelect v-model="form.category_id" label="Category"
          :options="categories.map((c) => ({ value: c.id, label: c.name }))" required />
        <BaseSelect v-model="form.brand_id" label="Brand" :options="brands.map((b) => ({ value: b.id, label: b.name }))"
          required />
        <BaseInput v-model="form.base_price" label="Base Price" type="number" step="0.01" placeholder="0.00" required />
        <BaseInput v-model="form.weight" label="Weight (kg)" type="number" step="0.01" placeholder="0.00" />
        <BaseInput v-model="form.material" label="Material" placeholder="e.g. Cotton" />
        <BaseInput v-model="form.country_of_origin" label="Country of Origin" placeholder="e.g. Italy" />
        <BaseSelect v-model="form.gender" label="Gender" :options="genderOptions" />
        <BaseSelect v-model="form.status" label="Status" :options="statusOptions" />

        <div class="sm:col-span-2 flex flex-col gap-1.5">
          <label class="text-xs font-medium text-muted uppercase tracking-wide">Short Description</label>
          <input v-model="form.short_description" placeholder="Brief one-liner..."
            class="bg-card-alt border border-app rounded-xl px-4 py-2.5 text-sm text-main placeholder:text-muted/60 outline-none focus:border-[#C6A75A] transition-colors" />
        </div>

        <div class="sm:col-span-2 flex flex-col gap-1.5">
          <label class="text-xs font-medium text-muted uppercase tracking-wide">Description</label>
          <textarea v-model="form.description" rows="4" placeholder="Product description..."
            class="bg-card-alt border border-app rounded-xl px-4 py-2.5 text-sm text-main placeholder:text-muted/60 outline-none focus:border-[#C6A75A] transition-colors resize-none" />
        </div>
      </form>
      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton :loading="saving" @click="handleSave">{{ isEditing ? 'Save Changes' : 'Create Product' }}
        </BaseButton>
      </template>
    </Modal>

    <ConfirmDialog v-model="confirmOpen" title="Delete this product?"
      message="This will permanently remove the product and its variants." :loading="deleting"
      @confirm="handleDelete" />
  </div>
</template>