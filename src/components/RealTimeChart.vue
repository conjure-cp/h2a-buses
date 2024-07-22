<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

// Define chart options
const chartOptions = {
  chart: {
    id: "realtime",
    animations: {
      enabled: true,
      easing: "linear",
      dynamicAnimation: {
        speed: 1000,
      },
    },
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
  },
  dataLabels: {
    enabled: false,
  },
  colors: ["#fb5607", "#588157", "#3a86ff"],
  stroke: {
    curve: "smooth",
  },
  xaxis: {
    type: "datetime",
    range: 10 * 1000, // 10 seconds
  },
  yaxis: {
    max: 100,
  },
};

// Initialize series data
const series = ref<{ name: string; data: number[][] }[]>([
  {
    name: "IC",
    data: [],
  },
  {
    name: "EV",
    data: [],
  },
  {
    name: "Hydrogen",
    data: [],
  },
  // Add more series as needed
]);

// Function to generate new data points
const generateDataPoint = () => {
  const timestamp = new Date().getTime();
  const value1 = Math.floor(Math.random() * 100);
  const value2 = Math.floor(Math.random() * 100);
  return [
    [timestamp, value1],
    [timestamp, value2],
  ];
};

// Function to update the chart data
const updateChartData = () => {
  const newDataPoints = generateDataPoint();
  series.value[0].data.push(newDataPoints[0]);
  series.value[1].data.push(newDataPoints[1]);

  // Remove data points that are outside the x-axis range
  const currentTime = new Date().getTime();
  series.value.forEach((s) => {
    s.data = s.data.filter(
      (dataPoint) => dataPoint[0] >= currentTime - 10 * 1000
    );
  });
};

let intervalId: number;

// Start updating the chart data when the component is mounted
onMounted(() => {
  intervalId = setInterval(updateChartData, 1000);
});

// Clean up the interval when the component is unmounted
onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <div>
    <apexchart type="line" :options="chartOptions" :series="series"></apexchart>
  </div>
</template>
