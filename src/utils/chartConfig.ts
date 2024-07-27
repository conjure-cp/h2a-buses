export const options = {
  responsive: true,
};

// Define chart options
// TODO: Add title to the charts and labels to both x and y axis
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
    height: '250px'
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
  },
};
