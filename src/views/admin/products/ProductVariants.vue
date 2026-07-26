<script setup>
import { ref, reactive, onMounted } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import Modal from '@/components/admin-ui/Modal.vue'
import ConfirmDialog from '@/components/admin-ui/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { productVariantsApi, productsApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Plus, Pencil, Trash2, AlertTriangle, ImagePlus, X, Star } from 'lucide-vue-next'

const toast = useToastStore()
const columns = [
  { key: 'image', label: '', width: '56px' },
  { key: 'sku', label: 'SKU' },
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Size' },
  { key: 'unit_price', label: 'Price' },
  { key: 'quantity', label: 'Stock' },
  { key: 'actions', label: '', width: '100px' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const searchQuery = ref('')
const loading = ref(false)

const products = ref([])

const modalOpen = ref(false)
const confirmOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const targetId = ref(null)

// Existing images loaded when editing (from product_images table)
const existingImages = ref([])
// Newly selected files to upload (not yet saved)
const newImageFiles = ref([])
const fileInputRef = ref(null)

const form = reactive({
  product_id: '', sku: '', color: '', size: '', unit_price: '', quantity: 0,
  low_stock_threshold: 5, barcode: '', cost_price: '', status: 1, weight: '',
})

function resetForm() {
  form.product_id = ''; form.sku = ''; form.color = ''; form.size = ''
  form.unit_price = ''; form.quantity = 0; form.low_stock_threshold = 5
  form.barcode = ''; form.cost_price = ''; form.status = 1; form.weight = ''
  existingImages.value = []
  newImageFiles.value = []
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function loadProducts() {
  try {
    const res = await productsApi.list({ per_page: 100 })
    products.value = res.data.data || res.data || []
  } catch (e) {
    products.value = []
  }
}

async function loadVariants() {
  loading.value = true
  try {
    const res = await productVariantsApi.list({ page: page.value, per_page: perPage.value, search: searchQuery.value })
    rows.value = res.data.data || res.data || []
    total.value = res.data.total ?? rows.value.length
  } catch (e) {
    toast.error('Could not load product variants.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

function mainImage(row) {
  const images = row.product_images || row.Product_images || []
  return images.find((img) => img.is_main)?.image_url || images[0]?.image_url || null
}

function openCreate() {
  isEditing.value = false
  resetForm()
  modalOpen.value = true
}

function openEdit(row) {
  isEditing.value = true
  targetId.value = row.id
  form.product_id = row.product_id
  form.sku = row.sku
  form.color = row.color
  form.size = row.size
  form.unit_price = row.unit_price
  form.quantity = row.quantity
  form.low_stock_threshold = row.low_stock_threshold
  form.barcode = row.barcode || ''
  form.cost_price = row.cost_price || ''
  form.status = row.status ?? 1
  form.weight = row.weight || ''
  existingImages.value = (row.product_images || row.Product_images || []).map((img) => ({ ...img }))
  newImageFiles.value = []
  if (fileInputRef.value) fileInputRef.value.value = ''
  modalOpen.value = true
}

function askDelete(row) {
  targetId.value = row.id
  confirmOpen.value = true
}

function onFilesChange(e) {
  const files = Array.from(e.target.files || [])
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} is not a valid image.`)
      continue
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} exceeds 5MB.`)
      continue
    }
    newImageFiles.value.push({ file, preview: URL.createObjectURL(file) })
  }
}

function removeNewImage(index) {
  newImageFiles.value.splice(index, 1)
}

async function removeExistingImage(image) {
  try {
    await productVariantsApi.removeImage(targetId.value, image.id)
    existingImages.value = existingImages.value.filter((i) => i.id !== image.id)
    toast.success('Image removed.')
  } catch (e) {
    toast.error('Failed to remove image.')
  }
}

async function setMainImage(image) {
  try {
    await productVariantsApi.setMainImage(targetId.value, image.id)
    existingImages.value = existingImages.value.map((i) => ({ ...i, is_main: i.id === image.id }))
    toast.success('Main image updated.')
  } catch (e) {
    toast.error('Failed to set main image.')
  }
}

function buildFormData() {
  const fd = new FormData()
  fd.append('product_id', form.product_id)
  fd.append('sku', form.sku)
  fd.append('color', form.color)
  fd.append('size', form.size)
  fd.append('unit_price', form.unit_price)
  fd.append('quantity', form.quantity)
  fd.append('low_stock_threshold', form.low_stock_threshold || 0)

  // Nullable fields — only append if they have a value, since 'nullable' rules
  // reject empty strings differently than omitted keys in some validator setups
  if (form.barcode) fd.append('barcode', form.barcode)
  if (form.cost_price !== '' && form.cost_price !== null) fd.append('cost_price', form.cost_price)
  if (form.status !== '' && form.status !== null) fd.append('status', form.status)
  if (form.weight !== '' && form.weight !== null) fd.append('weight', form.weight)

  newImageFiles.value.forEach((entry) => {
    fd.append('image[]', entry.file)
  })

  return fd
}

async function handleSave() {
  if (!form.product_id || !form.sku || !form.unit_price || !form.color || !form.size) {
    toast.error('Product, SKU, Color, Size, and Unit Price are required.')
    return
  }

  saving.value = true
  try {
    const payload = buildFormData()

    if (isEditing.value) {
      await productVariantsApi.updateForm(targetId.value, payload)
      toast.success('Variant updated.')
    } else {
      await productVariantsApi.createForm(payload)
      toast.success('Variant created.')
    }
    modalOpen.value = false
    loadVariants()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to save variant.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await productVariantsApi.remove(targetId.value)
    toast.success('Variant deleted.')
    confirmOpen.value = false
    loadVariants()
  } catch (e) {
    toast.error('Failed to delete variant.')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await loadProducts()
  loadVariants()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-serif font-semibold text-main">Product Variants</h1>
        <p class="text-sm text-muted mt-1">Manage SKUs, sizes, colors, and stock levels.</p>
      </div>
      <BaseButton @click="openCreate"><Plus class="w-4 h-4" /> Add Variant</BaseButton>
    </div>

    <DataTable
      :columns="columns" :rows="rows" :loading="loading"
      v-model:search-query="searchQuery" v-model:page="page"
      :per-page="perPage" :total="total" search-placeholder="Search by SKU..."
      @search="loadVariants"
    >
      <template #cell-image="{ row }">
        <div class="w-9 h-9 rounded-lg bg-card-alt overflow-hidden flex items-center justify-center">
          <img v-if="mainImage(row)" :src="mainImage(row)" class="w-full h-full object-cover" />
          <span v-else class="text-muted text-xs">—</span>
        </div>
      </template>
      <template #cell-unit_price="{ value }">${{ Number(value).toFixed(2) }}</template>
      <template #cell-quantity="{ row }">
        <div class="flex items-center gap-1.5">
          <span :class="row.quantity <= row.low_stock_threshold ? 'text-[#D9534F] font-medium' : 'text-main'">
            {{ Number(row.quantity).toFixed() }}
          </span>
          <AlertTriangle v-if="row.quantity <= row.low_stock_threshold" class="w-3.5 h-3.5 text-[#D9534F]" />
        </div>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1.5 justify-end">
          <button @click="openEdit(row)" class="p-1.5 rounded-lg text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors"><Pencil class="w-4 h-4" /></button>
          <button @click="askDelete(row)" class="p-1.5 rounded-lg text-muted hover:text-[#D9534F] hover:bg-card-alt transition-colors"><Trash2 class="w-4 h-4" /></button>
        </div>
      </template>
    </DataTable>

    <Modal v-model="modalOpen" :title="isEditing ? 'Edit Variant' : 'Add Variant'" size="md">
      <form @submit.prevent="handleSave" class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <BaseSelect v-model="form.product_id" label="Product"
            :options="products.map((p) => ({ value: p.id, label: p.name }))" required />
        </div>
        <BaseInput v-model="form.sku" label="SKU" required />
        <BaseInput v-model="form.unit_price" label="Unit Price" type="number" step="0.01" required />
        <BaseInput v-model="form.color" label="Color" required />
        <BaseInput v-model="form.size" label="Size" required />
        <BaseInput v-model="form.quantity" label="Stock Quantity" type="number" />
        <BaseInput v-model="form.low_stock_threshold" label="Low Stock Threshold" type="number" />
        <BaseInput v-model="form.barcode" label="Barcode" />
        <BaseInput v-model="form.cost_price" label="Cost Price" type="number" step="0.01" />
        <BaseInput v-model="form.weight" label="Weight" type="number" step="0.01" />
        <BaseSelect v-model="form.status" label="Status"
          :options="[{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }]" />
        <!-- Variant Images (product_images table) -->
        <div class="col-span-2">
          <label class="text-xs font-medium text-muted uppercase tracking-wide mb-1.5 block">Variant Images</label>

          <div class="flex flex-wrap gap-3">
            <!-- Existing images already saved in product_images -->
            <div v-for="img in existingImages" :key="'existing-' + img.id"
              class="relative w-20 h-20 rounded-xl bg-card-alt border border-app overflow-hidden shrink-0 group">
              <img :src="img.image_url" class="w-full h-full object-cover" />
              <button type="button" @click="removeExistingImage(img)"
                class="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100">
                <X class="w-3 h-3" />
              </button>
              <button type="button" @click="setMainImage(img)"
                class="absolute bottom-1 left-1 p-1 rounded-full transition-colors"
                :class="img.is_main ? 'bg-[#C6A75A] text-[#0B0B0B]' : 'bg-black/60 text-white opacity-0 group-hover:opacity-100'">
                <Star class="w-3 h-3" :fill="img.is_main ? 'currentColor' : 'none'" />
              </button>
            </div>

            <!-- Newly picked, not-yet-uploaded images -->
            <div v-for="(entry, idx) in newImageFiles" :key="'new-' + idx"
              class="relative w-20 h-20 rounded-xl bg-card-alt border border-app overflow-hidden shrink-0 group">
              <img :src="entry.preview" class="w-full h-full object-cover" />
              <button type="button" @click="removeNewImage(idx)"
                class="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100">
                <X class="w-3 h-3" />
              </button>
            </div>

            <!-- Upload trigger -->
            <label for="variant-image-input"
              class="w-20 h-20 rounded-xl border border-dashed border-app flex flex-col items-center justify-center gap-1 text-muted cursor-pointer hover:border-[#C6A75A] transition-colors shrink-0">
              <ImagePlus class="w-5 h-5" />
              <span class="text-[10px]">Add</span>
            </label>
            <input ref="fileInputRef" id="variant-image-input" type="file" accept="image/*" multiple
              @change="onFilesChange" class="hidden" />
          </div>
          <p class="text-xs text-muted mt-1.5">PNG, JPG up to 5MB each. Click the star to set the main image.</p>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton :loading="saving" @click="handleSave">{{ isEditing ? 'Save Changes' : 'Create' }}</BaseButton>
      </template>
    </Modal>

    <ConfirmDialog v-model="confirmOpen" title="Delete this variant?" :loading="deleting" @confirm="handleDelete" />
  </div>
</template>