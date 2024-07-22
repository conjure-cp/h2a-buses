export const options = {
  responsive: true,
};

// Define chart options
export const apexChartOptions: any = {
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
    range: 5 * 1000, // 3 seconds
  },

  yaxis: {
    tickAmount: 5, // Define the number of ticks on the y-axis

  }
};
