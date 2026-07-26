<script setup>
import { ref, reactive, onMounted } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { addressesApi } from '@/api/resources'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Plus, Pencil, Trash2, MapPin, Star } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToastStore()
const addresses = ref([])
const loading = ref(true)
const formOpen = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const saving = ref(false)

const form = reactive({
  label: '', recipient_name: '', phone: '', address: '', city: '', province: '', postal_code: '', country: '', is_default: false,
})

function resetForm() {
  form.label = ''; form.recipient_name = ''; form.phone = ''; form.address = ''
  form.city = ''; form.province = ''; form.postal_code = ''; form.country = ''; form.is_default = false
}

async function loadAddresses() {
  loading.value = true
  try {
    const res = await addressesApi.list({ user_id: auth.user.id })
    addresses.value = res.data.data || res.data || []
  } catch (e) {
    toast.error('Could not load addresses.')
    addresses.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() { isEditing.value = false; resetForm(); formOpen.value = true }
function openEdit(addr) {
  isEditing.value = true
  editingId.value = addr.id
  Object.assign(form, addr)
  formOpen.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (isEditing.value) {
      await addressesApi.update(editingId.value, { ...form })
      toast.success('Address updated.')
    } else {
      await addressesApi.create({ ...form, user_id: auth.user.id })
      toast.success('Address added.')
    }
    formOpen.value = false
    loadAddresses()
  } catch (e) {
    toast.error('Could not save address.')
  } finally {
    saving.value = false
  }
}

async function handleDelete(addr) {
  try {
    await addressesApi.remove(addr.id)
    toast.success('Address removed.')
    loadAddresses()
  } catch (e) {
    toast.error('Could not remove address.')
  }
}

async function setDefault(addr) {
  try {
    await addressesApi.update(addr.id, { is_default: true })
    toast.success('Default address updated.')
    loadAddresses()
  } catch (e) {
    toast.error('Could not update default address.')
  }
}

onMounted(loadAddresses)
</script>

<template>
  <div class="bg-card border border-app rounded-2xl p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="font-semibold text-main">My Addresses</h3>
      <BaseButton size="sm" @click="openCreate"><Plus class="w-4 h-4" /> Add New</BaseButton>
    </div>

    <div v-if="loading" class="text-center py-16 text-muted text-sm">Loading addresses...</div>

    <div v-else-if="!addresses.length && !formOpen" class="text-center py-16">
      <MapPin class="w-12 h-12 text-muted opacity-30 mx-auto mb-3" />
      <p class="text-sm text-muted">No saved addresses yet.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div v-for="addr in addresses" :key="addr.id" class="border border-app rounded-xl p-4 relative">
        <div class="flex items-center gap-2 mb-1.5">
          <p class="text-sm font-medium text-main">{{ addr.label || 'Address' }}</p>
          <span v-if="addr.is_default" class="text-[10px] px-2 py-0.5 rounded-full bg-[#C6A75A]/15 text-[#C6A75A] font-semibold uppercase">Default</span>
        </div>
        <p class="text-sm text-muted leading-relaxed">{{ addr.recipient_name }}<br />{{ addr.address }}, {{ addr.city }}, {{ addr.province }} {{ addr.postal_code }}<br />{{ addr.phone }}</p>
        <div class="flex items-center gap-3 mt-3">
          <button @click="openEdit(addr)" class="text-xs text-[#C6A75A] hover:underline flex items-center gap-1"><Pencil class="w-3 h-3" /> Edit</button>
          <button v-if="!addr.is_default" @click="setDefault(addr)" class="text-xs text-muted hover:text-main flex items-center gap-1"><Star class="w-3 h-3" /> Set default</button>
          <button @click="handleDelete(addr)" class="text-xs text-[#D9534F] hover:underline flex items-center gap-1"><Trash2 class="w-3 h-3" /> Delete</button>
        </div>
      </div>
    </div>

    <div v-if="formOpen" class="border border-app rounded-xl p-5 space-y-3">
      <p class="text-sm font-medium text-main mb-2">{{ isEditing ? 'Edit Address' : 'New Address' }}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BaseInput v-model="form.label" label="Label" placeholder="Home, Office..." />
        <BaseInput v-model="form.recipient_name" label="Recipient Name" required />
        <BaseInput v-model="form.phone" label="Phone" />
        <BaseInput v-model="form.country" label="Country" />
        <div class="sm:col-span-2">
          <BaseInput v-model="form.address" label="Street Address" required />
        </div>
        <BaseInput v-model="form.city" label="City" />
        <BaseInput v-model="form.province" label="Province/State" />
        <BaseInput v-model="form.postal_code" label="Postal Code" />
      </div>
      <label class="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" v-model="form.is_default" class="accent-[#C6A75A] rounded" /> Set as default address
      </label>
      <div class="flex gap-2 pt-2">
        <BaseButton size="sm" :loading="saving" @click="handleSave">{{ isEditing ? 'Save Changes' : 'Save Address' }}</BaseButton>
        <BaseButton size="sm" variant="ghost" @click="formOpen = false">Cancel</BaseButton>
      </div>
    </div>
  </div>
</template>
