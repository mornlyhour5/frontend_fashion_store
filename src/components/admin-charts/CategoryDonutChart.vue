<script setup>
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { computed } from 'vue'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
})

const palette = ['#C6A75A', '#8A6F32', '#5B8FB9', '#4CAF7D', '#D9534F', '#A0A0A0']

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.values,
      backgroundColor: palette,
      borderColor: '#242424',
      borderWidth: 2,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#A0A0A0', boxWidth: 10, boxHeight: 10, padding: 14, font: { size: 11 } },
    },
    tooltip: {
      backgroundColor: '#242424',
      titleColor: '#F5F5F5',
      bodyColor: '#F5F5F5',
      borderColor: '#C6A75A',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    },
  },
}
</script>

<template>
  <div style="height: 260px">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>
