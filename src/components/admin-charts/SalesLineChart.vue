<script setup>
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js'
import { computed } from 'vue'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

const props = defineProps({
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
})

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Revenue',
      data: props.values,
      borderColor: '#C6A75A',
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260)
        gradient.addColorStop(0, 'rgba(198, 167, 90, 0.35)')
        gradient.addColorStop(1, 'rgba(198, 167, 90, 0)')
        return gradient
      },
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#C6A75A',
      borderWidth: 2.5,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
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
  scales: {
    x: { grid: { display: false }, ticks: { color: '#A0A0A0', font: { size: 11 } } },
    y: { grid: { color: 'rgba(160,160,160,0.1)' }, ticks: { color: '#A0A0A0', font: { size: 11 } } },
  },
}
</script>

<template>
  <div style="height: 280px">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
