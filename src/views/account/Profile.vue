<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import AvatarUpload from '@/components/account/AvatarUpload.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { User, ShieldCheck, Bell, AlertTriangle, Loader2 } from 'lucide-vue-next'

const loading = ref(false)
const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const tabs = [
  { key: 'info', label: 'Personal Info', icon: User },
  { key: 'security', label: 'Security', icon: ShieldCheck },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'danger', label: 'Danger Zone', icon: AlertTriangle },
]
const activeTab = ref('info')

// ---- Integer-backed enum maps (customer_profile.gender, customer_profile.preferred_language) ----
const GENDER_MAP = { 1: 'male', 2: 'female', 3: 'other' }
const GENDER_MAP_REVERSE = { male: 1, female: 2, other: 3 }

const LANGUAGE_MAP = { 1: 'en', 2: 'es', 3: 'fr', 4: 'vi' }
const LANGUAGE_MAP_REVERSE = { en: 1, es: 2, fr: 3, vi: 4 }

// ---- Personal info ----
// email/avata live on `users`; first_name/last_name/phone/date_of_birth/gender/preferred_language
// live on the nested `customer_profile` relation.
const form = reactive({
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  preferred_language: 'en',
})

const genderOptions = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]
const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'vi', label: 'Tiếng Việt' },
]
const savingProfile = ref(false)
const profileErrors = ref({})

function validateProfile() {
  profileErrors.value = {}
  if (!form.first_name.trim()) profileErrors.value.first_name = 'First name is required'
  if (!form.last_name.trim()) profileErrors.value.last_name = 'Last name is required'
  if (!form.email.trim()) profileErrors.value.email = 'Email is required'
  else if (!/^\S+@\S+\.\S+$/.test(form.email)) profileErrors.value.email = 'Enter a valid email'
  return Object.keys(profileErrors.value).length === 0
}

async function saveProfile() {
  if (!validateProfile()) return
  savingProfile.value = true
  try {
    await auth.updateProfile({
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      date_of_birth: form.date_of_birth,
      gender: form.gender ? (GENDER_MAP_REVERSE[form.gender] ?? null) : null,
      preferred_language: LANGUAGE_MAP_REVERSE[form.preferred_language] ?? 1,
    })
    toast.success('Profile updated successfully.')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Could not update profile.')
  } finally {
    savingProfile.value = false
  }
}

// ---- Security / password ----
const passwords = ref({ current_password: '', password: '', password_confirmation: '' })
const passwordErrors = ref({})
const savingPassword = ref(false)

const passwordStrength = computed(() => {
  const pw = passwords.value.password
  if (!pw) return { label: '', pct: 0, color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const levels = [
    { label: 'Weak', color: '#D9534F' },
    { label: 'Weak', color: '#D9534F' },
    { label: 'Fair', color: '#D0A94C' },
    { label: 'Good', color: '#5B8FB9' },
    { label: 'Strong', color: '#4CAF7D' },
    { label: 'Strong', color: '#4CAF7D' },
  ]
  return { label: levels[score].label, pct: (score / 5) * 100, color: levels[score].color }
})

function validatePassword() {
  passwordErrors.value = {}
  if (!passwords.value.current_password) passwordErrors.value.current_password = 'Enter your current password'
  if (!passwords.value.password) passwordErrors.value.password = 'Enter a new password'
  else if (passwords.value.password.length < 8) passwordErrors.value.password = 'Must be at least 8 characters'
  if (passwords.value.password !== passwords.value.password_confirmation) {
    passwordErrors.value.password_confirmation = 'Passwords do not match'
  }
  return Object.keys(passwordErrors.value).length === 0
}

async function savePassword() {
  if (!validatePassword()) return
  savingPassword.value = true
  try {
    await auth.updateProfile({
      current_password: passwords.value.current_password,
      password: passwords.value.password,
      password_confirmation: passwords.value.password_confirmation,
    })
    toast.success('Password updated successfully.')
    passwords.value = { current_password: '', password: '', password_confirmation: '' }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Could not update password. Check your current password.')
  } finally {
    savingPassword.value = false
  }
}

// ---- Notification preferences ----
const prefs = reactive({
  email_order_updates: true,
  email_promotions: true,
  email_wishlist_restock: true,
  sms_order_updates: false,
  push_enabled: true,
})
const savingPrefs = ref(false)

async function savePreferences() {
  savingPrefs.value = true
  try {
    await auth.updatePreferences({ ...prefs })
    toast.success('Notification preferences saved.')
  } catch (e) {
    toast.error('Could not save preferences.')
  } finally {
    savingPrefs.value = false
  }
}

// ---- Danger zone ----
const deleteConfirmText = ref('')
const deletePassword = ref('')
const deleting = ref(false)
const showDeleteForm = ref(false)

async function handleDeleteAccount() {
  if (deleteConfirmText.value !== 'DELETE') {
    toast.error('Please type DELETE to confirm.')
    return
  }
  if (!deletePassword.value) {
    toast.error('Please enter your password to confirm.')
    return
  }
  deleting.value = true
  try {
    await auth.deleteAccount({ password: deletePassword.value })
    toast.success('Your account has been deleted.')
    router.push({ name: 'home' })
  } catch (e) {
    toast.error(e.response?.data?.message || 'Could not delete account. Please check your password.')
  } finally {
    deleting.value = false
  }
}

async function loadCustomer() {
  loading.value = true
  try {
    await auth.fetchProfile()
    const u = auth.user || {}
    const profile = u.customer_profile || {}

    form.email = u.email || ''
    form.first_name = profile.first_name || ''
    form.last_name = profile.last_name || ''
    form.phone = profile.phone || ''
    form.date_of_birth = profile.date_of_birth || ''
    form.gender = GENDER_MAP[profile.gender] || ''
    form.preferred_language = LANGUAGE_MAP[profile.preferred_language] || 'en'
  } catch (e) {
    toast.error('Could not load your profile.')
  } finally {
    loading.value = false
  }
}

onMounted(loadCustomer)
</script>

<template>
  <div class="space-y-6">
    <!-- Tabs -->
    <div class="flex items-center gap-1 border-b border-app overflow-x-auto">
      <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
        class="flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors -mb-px" :class="activeTab === tab.key
          ? 'border-[#C6A75A] text-main font-medium'
          : 'border-transparent text-muted hover:text-main'">
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Personal Info -->
    <div v-if="activeTab === 'info'" class="bg-card border border-app rounded-2xl p-6 space-y-6">
      <AvatarUpload />

      <div class="border-t border-app pt-6">
        <h3 class="font-semibold text-main mb-5">Personal Information</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput v-model="form.first_name" label="First Name" :error="profileErrors.first_name" required />
          <BaseInput v-model="form.last_name" label="Last Name" :error="profileErrors.last_name" required />
          <BaseInput v-model="form.email" label="Email" type="email" :error="profileErrors.email" required />
          <BaseInput v-model="form.phone" label="Phone" placeholder="+1 (555) 000-0000" />
          <BaseInput v-model="form.date_of_birth" label="Date of Birth" type="date" />
          <BaseSelect v-model="form.gender" label="Gender" :options="genderOptions" />
          <BaseSelect v-model="form.preferred_language" label="Preferred Language" :options="languageOptions" />
        </div>
        <BaseButton class="mt-5" :loading="savingProfile" @click="saveProfile">Save Changes</BaseButton>
      </div>
    </div>

    <!-- Security -->
    <div v-if="activeTab === 'security'" class="space-y-6">
      <div class="bg-card border border-app rounded-2xl p-6">
        <h3 class="font-semibold text-main mb-5">Change Password</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div class="sm:col-span-2">
            <BaseInput v-model="passwords.current_password" label="Current Password" type="password"
              :error="passwordErrors.current_password" />
          </div>
          <div>
            <BaseInput v-model="passwords.password" label="New Password" type="password"
              :error="passwordErrors.password" />
            <div v-if="passwords.password" class="mt-2">
              <div class="h-1.5 rounded-full bg-card-alt overflow-hidden">
                <div class="h-full rounded-full transition-all duration-300"
                  :style="{ width: passwordStrength.pct + '%', backgroundColor: passwordStrength.color }" />
              </div>
              <p class="text-xs mt-1" :style="{ color: passwordStrength.color }">{{ passwordStrength.label }}</p>
            </div>
          </div>
          <BaseInput v-model="passwords.password_confirmation" label="Confirm New Password" type="password"
            :error="passwordErrors.password_confirmation" />
        </div>
        <BaseButton class="mt-5" variant="secondary" :loading="savingPassword" @click="savePassword">Update Password
        </BaseButton>
      </div>

      <div class="bg-card border border-app rounded-2xl p-6">
        <h3 class="font-semibold text-main mb-1">Active Sessions</h3>
        <p class="text-sm text-muted mb-4">You're currently signed in on this device.</p>
        <div class="flex items-center justify-between p-3.5 rounded-xl bg-card-alt">
          <div class="flex items-center gap-3">
            <span class="w-2 h-2 rounded-full bg-[#4CAF7D] shrink-0" />
            <div>
              <p class="text-sm text-main">This device</p>
              <p class="text-xs text-muted">Current session</p>
            </div>
          </div>
          <span class="text-xs text-muted">Active now</span>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <div v-if="activeTab === 'notifications'" class="bg-card border border-app rounded-2xl p-6">
      <h3 class="font-semibold text-main mb-1">Notification Preferences</h3>
      <p class="text-sm text-muted mb-2">Choose what you'd like to hear from us about.</p>

      <div class="divide-y divide-[var(--border-color)]">
        <ToggleSwitch v-model="prefs.email_order_updates" label="Order Updates"
          description="Shipping confirmations, delivery status, and order changes" />
        <ToggleSwitch v-model="prefs.email_promotions" label="Promotions & Offers"
          description="Sales, new arrivals, and exclusive discounts" />
        <ToggleSwitch v-model="prefs.email_wishlist_restock" label="Wishlist Restock Alerts"
          description="Get notified when saved items are back in stock" />
        <ToggleSwitch v-model="prefs.sms_order_updates" label="SMS Order Updates"
          description="Text messages for delivery tracking" />
        <ToggleSwitch v-model="prefs.push_enabled" label="Push Notifications"
          description="Browser notifications for account activity" />
      </div>

      <BaseButton class="mt-5" :loading="savingPrefs" @click="savePreferences">Save Preferences</BaseButton>
    </div>

    <!-- Danger Zone -->
    <div v-if="activeTab === 'danger'" class="bg-card border border-[#D9534F]/30 rounded-2xl p-6">
      <div class="flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-[#D9534F] mt-0.5 shrink-0" />
        <div class="flex-1">
          <h3 class="font-semibold text-main mb-1">Delete Account</h3>
          <p class="text-sm text-muted mb-4">
            This permanently deletes your account, order history, wishlist, and saved addresses. This action cannot be
            undone.
          </p>

          <BaseButton v-if="!showDeleteForm" variant="danger" size="sm" @click="showDeleteForm = true">
            Delete My Account
          </BaseButton>

          <div v-else class="space-y-3 max-w-sm">
            <BaseInput v-model="deletePassword" label="Confirm your password" type="password" />
            <div>
              <label class="text-xs font-medium text-muted uppercase tracking-wide mb-1.5 block">
                Type <span class="text-[#D9534F] font-semibold">DELETE</span> to confirm
              </label>
              <input v-model="deleteConfirmText"
                class="w-full bg-card-alt border border-[#D9534F]/40 rounded-xl px-4 py-2.5 text-sm text-main outline-none focus:border-[#D9534F] transition-colors" />
            </div>
            <div class="flex gap-2 pt-1">
              <BaseButton variant="danger" size="sm" :loading="deleting" @click="handleDeleteAccount">
                <Loader2 v-if="deleting" class="w-4 h-4 animate-spin" />
                Permanently Delete Account
              </BaseButton>
              <BaseButton variant="ghost" size="sm"
                @click="showDeleteForm = false; deleteConfirmText = ''; deletePassword = ''">
                Cancel
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>