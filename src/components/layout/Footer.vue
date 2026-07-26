<script setup>
import { RouterLink } from 'vue-router'
import { Instagram, Facebook, Twitter } from 'lucide-vue-next'
</script>

<template>
  <footer class="bg-panel border-t border-app mt-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div class="col-span-2 md:col-span-1">
        <p class="font-serif font-semibold text-xl text-main mb-3">MAISON</p>
        <p class="text-sm text-muted leading-relaxed">Timeless pieces, crafted for the modern wardrobe.</p>
        <div class="flex items-center gap-3 mt-4">
          <a href="#" class="p-2 rounded-lg bg-card-alt text-muted hover:text-[#C6A75A] transition-colors"><Instagram class="w-4 h-4" /></a>
          <a href="#" class="p-2 rounded-lg bg-card-alt text-muted hover:text-[#C6A75A] transition-colors"><Facebook class="w-4 h-4" /></a>
          <a href="#" class="p-2 rounded-lg bg-card-alt text-muted hover:text-[#C6A75A] transition-colors"><Twitter class="w-4 h-4" /></a>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold text-main uppercase tracking-wide mb-3">Shop</p>
        <div class="flex flex-col gap-2">
          <RouterLink to="/category/women" class="text-sm text-muted hover:text-main transition-colors">Women</RouterLink>
          <RouterLink to="/category/men" class="text-sm text-muted hover:text-main transition-colors">Men</RouterLink>
          <RouterLink to="/category/accessories" class="text-sm text-muted hover:text-main transition-colors">Accessories</RouterLink>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold text-main uppercase tracking-wide mb-3">Account</p>
        <div class="flex flex-col gap-2">
          <RouterLink to="/track-order" class="text-sm text-muted hover:text-main transition-colors">Track Order</RouterLink>
          <RouterLink to="/account/orders" class="text-sm text-muted hover:text-main transition-colors">Order History</RouterLink>
          <RouterLink to="/account/wishlist" class="text-sm text-muted hover:text-main transition-colors">Wishlist</RouterLink>
          <RouterLink to="/account/support" class="text-sm text-muted hover:text-main transition-colors">Support</RouterLink>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold text-main uppercase tracking-wide mb-3">Company</p>
        <div class="flex flex-col gap-2">
          <RouterLink to="/about" class="text-sm text-muted hover:text-main transition-colors">About Us</RouterLink>
          <RouterLink to="/contact" class="text-sm text-muted hover:text-main transition-colors">Contact</RouterLink>
          <a href="#" class="text-sm text-muted hover:text-main transition-colors">Privacy Policy</a>
          <a href="#" class="text-sm text-muted hover:text-main transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
    <div class="border-t border-app px-4 sm:px-6 py-5 text-center text-xs text-muted">
      © 2026 Maison. All rights reserved.
    </div>
  </footer>
</template>
