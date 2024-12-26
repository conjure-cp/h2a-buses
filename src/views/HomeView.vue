<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Card from "@/components/Card.vue";
import InputNumber, {
  type InputNumberInterface,
} from "@/components/InputNumber.vue";
import MultiSelect from "primevue/multiselect";
import { BusLane } from "@/routing/control";
import { useMapStore } from "@/stores/MapStore";
import { getEmission, getCost, calculateAvg, regions } from "@/utils/helper";
import type {
  BusLine,
  BusType,
  RouteOptionDetails,
  RouteRegions,
} from "@/utils/types";
import * as chartConfig from "@/utils/chartConfig";
import L from "leaflet";
import "leaflet-routing-machine";
import { storeToRefs } from "pinia";
import type {
  InputNumberPassThroughAttributes,
  InputNumberPassThroughOptions,
} from "primevue/inputnumber";

const mapStore = useMapStore();
const { demoMap, busLanes, busMarkers } = storeToRefs(mapStore);
const {
  createMap,
  removeLayers,
  removeBusMarkers,
  removeWaypointMarkers,
  addBusLane,
  removeBusLanes,
} = mapStore;

const routeOptions = ref<
  {
    label: string;
    items: {
      label: string;
      value: RouteOptionDetails;
    }[];
  }[]
>([]);
const selectedRoutes = ref<RouteOptionDetails[]>([]);
const isSimRunning = ref(false);
const animationFrameId = ref<number[]>([]);
const chartUpdateIntervalId = ref<number[]>([]);

const totalEmissionIC = ref(0);
const totalEmissionEV = ref(0);
const totalEmissionHydrogen = ref(0);
const emissionsICData = ref<number[]>([]);
const emissionsEVData = ref<number[]>([]);
const emissionsHydrogenData = ref<number[]>([]);

// Initialize series data
const seriesEmission = ref<{ name: string; data: number[][] }[]>([
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

const isEmissionChartDataEmpty = computed(() => {
  return seriesEmission.value.every((elem) => elem.data.length === 0);
});

const chartOptionsEmission = ref(chartConfig.apexChartOptions);
chartOptionsEmission.value = {
  ...chartOptionsEmission.value,
  id: "realtime-emissions-chart",
  title: {
    text: "Emission",
    align: "center",
  },
};

const emptyEmissionsChartData = () => {
  totalEmissionIC.value = 0;
  totalEmissionEV.value = 0;
  totalEmissionHydrogen.value = 0;
  emissionsICData.value = [];
  emissionsEVData.value = [];
  emissionsHydrogenData.value = [];
};

// Costs

const seriesCost = ref<{ name: string; data: number[][] }[]>([
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

const isCostChartDataEmpty = computed(() => {
  return seriesCost.value.every((elem) => elem.data.length === 0);
});

const totalCostIC = ref(0);
const totalCostEV = ref(0);
const totalCostHydrogen = ref(0);
const costsICData = ref<number[]>([]);
const costsEVData = ref<number[]>([]);
const costsHydrogenData = ref<number[]>([]);

const chartOptionsCost = ref(chartConfig.apexChartOptions);
chartOptionsCost.value = {
  ...chartOptionsCost.value,
  id: "realtime-costs-chart",
  title: {
    text: "Cost",
    align: "center",
  },
};

const emptyCostsChartData = () => {
  totalCostIC.value = 0;
  totalCostEV.value = 0;
  totalCostHydrogen.value = 0;
  costsICData.value = [];
  costsEVData.value = [];
  costsHydrogenData.value = [];
};

const costDataByBusType = ref<Record<string, number>>({
  IC: 3,
  EV: 2,
  Hydrogen: 2.5,
});

const emissionDataByBusType = ref<Record<string, number>>({
  IC: 2,
  EV: 0.5,
  Hydrogen: 1,
});

// Chart related
for (const region of regions) {
  fetch(`json/${region}/available_lines.json`)
    .then((resp) => resp.json())
    .then((data: any) => {
      let regionLabel = region
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      routeOptions.value.push({
        label: regionLabel,
        items: [],
      });
      // fetch all available lines
      data.lines.forEach((serviceCode: string) => {
        // then iterate through the service codes to fetch related info
        fetch(`json/${region}/${serviceCode}.json`)
          .then((resp) => resp.json())
          .then((data: BusLine) => {
            // Collect lat & lng info
            const route: L.LatLng[] = [];
            data.stops.forEach((elem) => {
              route.push(L.latLng(elem[0], elem[1]));
            });

            // Collect other info - lineNumber, origin, destination
            routeOptions.value
              .find((g) => g.label === regionLabel)
              ?.items.push({
                label: `${data.line_name} ${data.origin} - ${data.destination}`,
                value: {
                  line: data.line_name,
                  origin: data.origin,
                  destination: data.destination,
                  serviceCode: data.service_code,
                  waypoints: route,
                  region: region as RouteRegions,
                },
              });
          });
      });
    });
}

const inputNumberProps = ref<InputNumberInterface>({
  ptProps: {
    root: {
      class: "flex justify-center text-left font-medium h-full",
    },
    input: {
      root: "order-2 mx-1 w-[35%] px-2 py-1 border text-sm text-center h-full bg-transparent",
    },
    incrementButton: {
      root: "order-3 border-0 rounded !cursor-pointer",
    },
    decrementButton: {
      root: "order-1 border-0 rounded !cursor-pointer",
    },
  },
  min: 0,
  max: 3,
  isDisabled: true,
  inputWrapper: " basis-1/3",
});

const findRoutes = () => {
  // Existing layers should also be removed
  removeLayers();

  // pop every element from the bus marker arr
  removeBusMarkers();

  // remove all buslanes
  removeBusLanes();

  if (selectedRoutes.value.length !== 0) {
    selectedRoutes.value.forEach(async (data: RouteOptionDetails) => {
      // fetch data from json directly
      const busLane: BusLane = await BusLane.generateFromJSON(
        data.region,
        data.serviceCode
      );
      const route = new L.Polyline(busLane.routeData.coordinates);
      removeWaypointMarkers();
      route.addTo(demoMap.value as L.Map);
      addBusLane(busLane);

      // OSRM API can be called using the function below if the data is not present
      // generateRoutingControl(data);
    });
  } else {
    alert("Please select a route!");
  }
};

const clearAnimationFrames = () => {
  while (animationFrameId.value.length) {
    cancelAnimationFrame(animationFrameId.value.pop()!);
  }
};

const clearIntervalIds = () => {
  while (chartUpdateIntervalId.value.length) {
    clearInterval(chartUpdateIntervalId.value.pop()!);
  }
};

const startSimulation = () => {
  if (
    !Object.values(costDataByBusType.value).every((val: number) => val !== 0) ||
    !Object.values(emissionDataByBusType.value).every(
      (val: number) => val !== 0
    )
  ) {
    alert("Please specify cost AND emission factors (> 0)");
    return;
  }

  if (isSimRunning.value) return;
  isSimRunning.value = true;
  emptyEmissionsChartData();
  emptyCostsChartData();

  chartUpdateIntervalId.value.push(
    setInterval(() => {
      updateCharts();
    }, 2000)
  );

  simulate();
};

const stopSimulation = () => {
  isSimRunning.value = false;
  clearAnimationFrames();
  clearIntervalIds();
};

const populateChartData = (emissions: number, costs: number, type: BusType) => {
  const getDataByBusType = (
    type: BusType,
    data: "emission" | "cost" = "emission"
  ) => {
    switch (type) {
      case "IC":
        return data === "emission" ? emissionsICData : costsICData;
      case "EV":
        return data === "emission" ? emissionsEVData : costsEVData;
      case "Hydrogen":
        return data === "emission" ? emissionsHydrogenData : costsHydrogenData;
    }
  };

  const emissionsData = getDataByBusType(type);
  if (emissionsData.value.length >= 100) {
    emissionsData.value.shift();
    emissionsData.value.push(Number(emissions.toFixed(2)));
  } else {
    emissionsData.value.push(Number(emissions.toFixed(2)));
  }

  const costsData = getDataByBusType(type, "cost");
  if (costsData.value.length >= 100) {
    costsData.value.shift();
    costsData.value.push(Number(costs.toFixed(2)));
  } else {
    costsData.value.push(Number(costs.toFixed(2)));
  }
};

const updateCharts = async () => {
  // Will be used to remove data points that are outside the x-axis range
  const currentTime = new Date().getTime();

  // Emissions
  seriesEmission.value[0].data.push([
    new Date().getTime(),
    calculateAvg(emissionsICData.value),
  ]);
  seriesEmission.value[1].data.push([
    new Date().getTime(),
    calculateAvg(emissionsEVData.value),
  ]);
  seriesEmission.value[2].data.push([
    new Date().getTime(),
    calculateAvg(emissionsHydrogenData.value),
  ]);

  seriesEmission.value.forEach((s) => {
    s.data = s.data.filter(
      (dataPoint) => dataPoint[0] >= currentTime - 5 * 1000
    );
  });

  // Dynamically update y-axis max based on the highest value in the series
  const allDataPointsEmission = seriesEmission.value.flatMap((s) => s.data);
  const maxYValueEmission = Math.max(
    ...allDataPointsEmission.map((dataPoint) => dataPoint[1])
  );

  chartOptionsEmission.value = {
    ...chartOptionsEmission.value,
    yaxis: {
      ...chartOptionsEmission.value.yaxis,
      title: {
        text: "Emission (g/mile)",
      },
      max: maxYValueEmission + 10, // Add some padding to the max value
    },
  };

  // Emissions

  // Costs
  seriesCost.value[0].data.push([
    new Date().getTime(),
    calculateAvg(costsICData.value),
  ]);

  seriesCost.value[1].data.push([
    new Date().getTime(),
    calculateAvg(costsEVData.value),
  ]);

  seriesCost.value[2].data.push([
    new Date().getTime(),
    calculateAvg(costsHydrogenData.value),
  ]);

  seriesCost.value.forEach((s) => {
    s.data = s.data.filter(
      (dataPoint) => dataPoint[0] >= currentTime - 5 * 1000
    );
  });

  // Dynamically update y-axis max based on the highest value in the series
  const allDataPointsCost = seriesCost.value.flatMap((s) => s.data);
  const maxYValueCost = Math.max(
    ...allDataPointsCost.map((dataPoint) => dataPoint[1])
  );

  chartOptionsCost.value = {
    ...chartOptionsCost.value,
    yaxis: {
      ...chartOptionsCost.value.yaxis,
      title: {
        // TODO: Confirm this unit?
        text: "Cost (£/mile)",
      },
      max: maxYValueCost + 10, // Add some padding to the max value
    },
  };
  // Costs
};

const simulate = () => {
  const animateBuses = (
    markers: L.Marker[],
    speed: number, // Speed for all buses in miles/s
    coordArr: L.LatLng[],
    direction: ("forward" | "backward")[],
    types: BusType[],
    startDistance: number // Start distance in miles
  ) => {
    const numCoords = coordArr.length;
    let startTime: DOMHighResTimeStamp;
    let totalDistance = 0;

    // Convert coordArr to L.LatLng objects if not already
    const latLngArr = coordArr.map((coord: L.LatLng) =>
      L.latLng(coord.lat, coord.lng)
    );

    // Reverse the array of coordinates
    // TODO: TINY bug. Try to find a way to fix it
    const latLngArrReversed = latLngArr.slice().reverse();

    // Calculate total distance of the route in miles
    for (let i = 0; i < numCoords - 1; i++) {
      totalDistance += latLngArr[i].distanceTo(latLngArr[i + 1]) * 0.000621371; // Convert meters to miles
    }

    // Calculate the time delay for each bus based on the startDistance and speed
    const timeDelays = markers.map((_, idx) =>
      idx > 0 ? (startDistance * idx) / speed : 0
    );

    const animate = (timestamp: DOMHighResTimeStamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000; // Convert to seconds

      markers.forEach((bus, idx) => {
        if (elapsed < timeDelays[idx]) return; // Skip if it's not yet time for this bus to start

        const busElapsed = elapsed - timeDelays[idx]; // Adjust elapsed time for this bus
        const distanceCovered = speed * busElapsed; // Distance covered in miles
        const dir = direction[idx];
        const arr = dir === "forward" ? latLngArr : latLngArrReversed;
        let distanceTraveled = 0;

        for (let i = 0; i < numCoords - 1; i++) {
          const segmentDistance = arr[i].distanceTo(arr[i + 1]) * 0.000621371; // Convert meters to miles
          if (distanceTraveled + segmentDistance >= distanceCovered) {
            const factor =
              (distanceCovered - distanceTraveled) / segmentDistance;
            const lat = arr[i].lat + (arr[i + 1].lat - arr[i].lat) * factor;
            const lng = arr[i].lng + (arr[i + 1].lng - arr[i].lng) * factor;

            bus.setLatLng([lat, lng]);
            break;
          }
          distanceTraveled += segmentDistance;
        }

        // Calculate emissions and costs based on distance covered
        const getDataByBusType = (
          type: BusType,
          data: "emission" | "cost" = "emission"
        ) => {
          switch (type) {
            case "IC":
              return data === "emission" ? totalEmissionIC : totalCostIC;
            case "EV":
              return data === "emission" ? totalEmissionEV : totalCostEV;
            case "Hydrogen":
              return data === "emission"
                ? totalEmissionHydrogen
                : totalCostHydrogen;
          }
        };
        const totalEmission = getDataByBusType(types[idx]);
        totalEmission.value +=
          getEmission(
            emissionDataByBusType.value[types[idx]],
            distanceCovered * 1609.34
          ) / 1609.34; // Scale emission by miles

        const totalCost = getDataByBusType(types[idx], "cost");
        totalCost.value +=
          getCost(
            costDataByBusType.value[types[idx]],
            distanceCovered * 1609.34
          ) /
          (1609.34 * 100); // Scale cost by miles

        populateChartData(totalEmission.value, totalCost.value, types[idx]);
      });

      if (
        markers.some(
          (bus, idx) => speed * (elapsed - timeDelays[idx]) < totalDistance
        )
      ) {
        animationFrameId.value.push(requestAnimationFrame(animate)); // Continue animation
      } else {
        // Restart animation loop for continuous movement
        startTime = timestamp;
        // Move buses back and forth
        markers.forEach((bus, idx) => {
          direction[idx] =
            direction[idx] === "forward" ? "backward" : "forward";
        });
        animationFrameId.value.push(requestAnimationFrame(animate));
      }
    };

    animationFrameId.value.push(requestAnimationFrame(animate));
  };

  // Collect all bus markers and assign a single speed
  busLanes.value.forEach((lane) => {
    const busMarkers: L.Marker[] = [];
    const movingDirection: ("forward" | "backward")[] = [];
    const busTypes: BusType[] = [];
    const speed = 0.124274; // Speed for all buses in miles/s (200 km/h)
    const coordArr = lane.routeData.coordinates;
    // @ts-ignore
    const markers: L.Marker[] = [
      ...(lane.markers.get("IC") || ([] as L.Marker[])),
      ...(lane.markers.get("EV") || ([] as L.Marker[])),
      ...(lane.markers.get("Hydrogen") || ([] as L.Marker[])),
    ];

    const startCoord = coordArr[0];
    markers.forEach((marker, idx) => {
      marker.setLatLng([
        startCoord.lat + idx / 80467, // Adjusting starting position slightly in miles
        startCoord.lng + idx / 80467,
      ]);
      busMarkers.push(marker);
      movingDirection.push("forward");
      busTypes.push(marker.options.title! as BusType);
    });

    animateBuses(
      busMarkers,
      speed,
      coordArr,
      movingDirection,
      busTypes,
      0.621371
    ); // 1 km as the start distance for the next bus, converted to miles
  });
};

// Used to download JSONs containing route data
// const downloadAll = () => {
//   routeOptions.value.forEach((option) => generateRoutingControl(option.value));
// };

watch(
  isSimRunning,
  (running) => {
    if (running) {
      (
        (inputNumberProps.value.ptProps as InputNumberPassThroughOptions)
          .root as InputNumberPassThroughAttributes
      ).class =
        (
          (inputNumberProps.value.ptProps as InputNumberPassThroughOptions)
            .root as InputNumberPassThroughAttributes
        ).class + " pointer-events-none";
    } else {
      ((
        (inputNumberProps.value.ptProps as InputNumberPassThroughOptions)
          .root as InputNumberPassThroughAttributes
      ).class as string) = (
        (inputNumberProps.value.ptProps as InputNumberPassThroughOptions)
          .root as InputNumberPassThroughAttributes
      ).class.replace(" pointer-events-none", "");
    }
  },
  { immediate: true }
);

onMounted(() => {
  createMap();
});

// Cleanup
onUnmounted(() => {
  stopSimulation();
  if (demoMap.value) {
    demoMap.value.remove();
  }
  clearIntervalIds();
});
</script>

<template>
  <div id="map"></div>
  <div
    v-if="!(isEmissionChartDataEmpty || isCostChartDataEmpty)"
    class="bg-white"
    id="charts"
  >
    <apexchart
      type="line"
      :options="chartOptionsEmission"
      :series="seriesEmission"
    />
    <apexchart type="line" :options="chartOptionsCost" :series="seriesCost" />
  </div>
  <div class="absolute top-0 right-0 z-[401] mt-2 mr-2">
    <Card class="flex flex-col gap-y-4 w-[40rem] max-h-80">
      <MultiSelect
        v-model="selectedRoutes"
        placeholder="Select Routes"
        :disabled="isSimRunning"
        :pt="{
          root: {
            class: 'flex-1',
          },
        }"
        filter
        :options="routeOptions"
        optionLabel="label"
        optionValue="value"
        optionGroupLabel="label"
        optionGroupChildren="items"
        :maxSelectedLabels="3"
        :selectionLimit="5"
        :virtualScrollerOptions="{ itemSize: 50 }"
      />
      <!-- TODO: Refactor -->
      <div
        class="flex flex-col gap-y-4 p-4 items-center border border-[#d4d4d8]"
      >
        <div class="grid grid-cols-4 gap-x-2">
          <span class="self-center text-sm">{{ "Cost (£/100miles)" }}</span>
          <div
            v-for="(data, idx) in Object.entries(costDataByBusType)"
            :key="`cost-input-num-${idx}`"
            class="flex flex-col gap-y-1"
          >
            <div
              class="text-sm text-center font-bold"
              :class="
                data[0] === 'IC'
                  ? 'text-red-500'
                  : data[0] === 'EV'
                    ? 'text-green-500'
                    : data[0] === 'Hydrogen'
                      ? 'text-blue-500'
                      : ''
              "
            >
              {{ data[0] }}
            </div>

            <InputNumber
              :modelValue="costDataByBusType[data[0]]"
              :inputProps="{
                ...inputNumberProps,
                step: 0.05,
                maxFractionDigits: 2,
                minFractionDigits: 2,
              }"
              @increase="
                (step: number) => {
                  costDataByBusType[data[0]] += step;
                }
              "
              @decrease="
                (step: number) => {
                  if (costDataByBusType[data[0]] > 0.0) {
                    costDataByBusType[data[0]] = Number(
                      (costDataByBusType[data[0]] - step).toFixed(1)
                    );
                  }
                }
              "
            />
          </div>
        </div>
        <div class="grid grid-cols-4 gap-x-2">
          <span class="self-center text-sm">{{ "CO2 Emission (g/mile)" }}</span>
          <div
            v-for="(data, idx) in Object.entries(emissionDataByBusType)"
            :key="`emission-input-num-${idx}`"
            class="flex flex-col gap-y-1"
          >
            <div
              class="text-sm text-center font-bold"
              :class="
                data[0] === 'IC'
                  ? 'text-red-500'
                  : data[0] === 'EV'
                    ? 'text-green-500'
                    : data[0] === 'Hydrogen'
                      ? 'text-blue-500'
                      : ''
              "
            >
              {{ data[0] }}
            </div>

            <InputNumber
              :modelValue="emissionDataByBusType[data[0]]"
              :inputProps="{ ...inputNumberProps, step: 0.1 }"
              @increase="
                (step: number) => {
                  emissionDataByBusType[data[0]] += step;
                }
              "
              @decrease="
                (step: number) => {
                  if (emissionDataByBusType[data[0]] > 0) {
                    emissionDataByBusType[data[0]] = Number(
                      (emissionDataByBusType[data[0]] - step).toFixed(1)
                    );
                  }
                }
              "
            />
          </div>
        </div>
      </div>
      <div
        v-if="busLanes.length > 0"
        class="flex flex-col gap-y-4 p-4 items-center border border-[#d4d4d8]"
      >
        <div
          v-for="(lane, idx) in busLanes"
          class="grid grid-cols-4 gap-x-2"
          :key="`num-input-container-${idx}`"
        >
          <span class="self-center text-sm">
            {{ lane.label }}
          </span>
          <div class="flex flex-col gap-y-1">
            <div class="text-sm text-red-500 text-center font-bold">IC</div>
            <InputNumber
              :modelValue="lane.numICMarkers"
              :inputProps="inputNumberProps"
              @increase="
                () => {
                  if (lane.numICMarkers! < inputNumberProps.max!)
                    lane.addMarker('IC');
                }
              "
              @decrease="
                () => {
                  if (lane.numICMarkers! > inputNumberProps.min!)
                    lane.removeMarker('IC', lane.numICMarkers!);
                }
              "
            />
          </div>
          <div class="flex flex-col gap-y-1">
            <div class="text-sm text-green-500 text-center font-bold">EV</div>
            <InputNumber
              :modelValue="lane.numEVMarkers"
              :inputProps="inputNumberProps"
              @increase="
                () => {
                  if (lane.numEVMarkers! < inputNumberProps.max!)
                    lane.addMarker('EV');
                }
              "
              @decrease="
                () => {
                  if (lane.numEVMarkers! > inputNumberProps.min!)
                    lane.removeMarker('EV', lane.numEVMarkers!);
                }
              "
            />
          </div>
          <div class="flex flex-col gap-y-1">
            <div class="text-sm text-blue-500 text-center font-bold">
              Hydrogen
            </div>
            <InputNumber
              :modelValue="lane.numHydrogenMarkers"
              :inputProps="inputNumberProps"
              @increase="
                () => {
                  if (lane.numHydrogenMarkers! < inputNumberProps.max!)
                    lane.addMarker('Hydrogen');
                }
              "
              @decrease="
                () => {
                  if (lane.numHydrogenMarkers! > inputNumberProps.min!)
                    lane.removeMarker('Hydrogen', lane.numHydrogenMarkers!);
                }
              "
            />
          </div>
        </div>
      </div>
      <!-- TODO: Refactor -->
      <div class="flex gap-x-4 justify-center">
        <button
          type="button"
          :disabled="isSimRunning"
          class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 self-center flex-initial w-36 flex items-center mt-2"
          @click="findRoutes"
        >
          <i class="fa-solid fa-route mr-2" />
          Find Routes
        </button>

        <button
          type="button"
          :disabled="busMarkers.length === 0 || isSimRunning ? true : false"
          class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 self-center flex-initial w-36 flex items-center mt-2"
          @click="
            () => {
              startSimulation();
            }
          "
        >
          <i class="fa-solid fa-play mr-2" />
          Simulate
        </button>
        <button
          type="button"
          :disabled="!isSimRunning"
          class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 self-center flex-initial w-36 flex items-center mt-2"
          @click="
            () => {
              stopSimulation();
            }
          "
        >
          <i class="fa-solid fa-stop mr-2" />
          Stop
        </button>

        <!-- <button
          type="button"
          class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 self-center flex-initial w-36 flex items-center mt-2"
          @click="downloadAll"
        >
          <i class="fa-solid fa-download mr-2" />
          Download All
        </button> -->
      </div>
    </Card>
  </div>
</template>
<style lang="postcss" scoped></style>
