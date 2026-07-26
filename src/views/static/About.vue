<script setup>
import MainLayout from '@/layouts/MainLayout.vue'
import { Sparkles, Leaf, Heart, Award } from 'lucide-vue-next'

const values = [
  { icon: Sparkles, title: 'Timeless Design', desc: 'We design pieces meant to outlast trends, not chase them.' },
  { icon: Leaf, title: 'Responsible Sourcing', desc: 'Materials chosen with care for the people and places behind them.' },
  { icon: Heart, title: 'Made to Last', desc: 'Quality construction that holds up to years of real wear.' },
  { icon: Award, title: 'Craft First', desc: 'Every detail considered, from stitch to silhouette.' },
]
</script>

<template>
  <MainLayout>
    <section class="bg-card-alt py-20">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <p class="text-xs uppercase tracking-[0.2em] text-[#C6A75A] font-semibold mb-4">Our Story</p>
        <h1 class="text-3xl sm:text-4xl font-serif font-semibold text-main mb-6">Crafted with Intention</h1>
        <p class="text-muted leading-relaxed">
          Maison began with a simple idea: clothing should be made to be worn, not replaced. Every piece in our
          collection is designed with longevity in mind — considered fabrics, thoughtful construction, and a
          silhouette that feels as relevant years from now as it does today.
        </p>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="value in values" :key="value.title" class="text-center p-6 rounded-2xl border border-app">
          <div class="w-12 h-12 rounded-xl bg-[#C6A75A]/10 flex items-center justify-center mx-auto mb-4">
            <component :is="value.icon" class="w-5 h-5 text-[#C6A75A]" />
          </div>
          <h3 class="font-serif font-semibold text-main mb-2">{{ value.title }}</h3>
          <p class="text-sm text-muted leading-relaxed">{{ value.desc }}</p>
        </div>
      </div>
    </section>

    <section class="bg-card-alt py-16">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 class="text-2xl font-serif font-semibold text-main mb-4">Join the Maison Community</h2>
        <p class="text-muted mb-8">Be the first to know about new collections, exclusive events, and stories from our ateliers.</p>
      </div>
    </section>
  </MainLayout>
</template>
