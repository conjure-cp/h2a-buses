<script setup lang="ts">
import { onMounted, ref } from "vue";
import Card from "@/components/Card.vue";
import InputNumber, {
  type InputNumberInterface,
} from "@/components/InputNumber.vue";
import MultiSelect from "primevue/multiselect";
import { BusLane } from "@/routing/control";
import { useMapStore } from "@/stores/MapStore";
import type { BusLine, RouteOptions } from "@/utils/types";
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
    value: RouteOptions;
  }[]
>([]);
const selectedRoutes = ref<RouteOptions[]>([]);
const isSimRunning = ref(false);
const animationFrameId = ref<number[]>([]);

fetch("json/available_lines.json")
  .then((resp) => resp.json())
  .then((data: any) => {
    // fetch all available lines
    data.lines.forEach((serviceCode: string) => {
      // then iterate through the service codes to fetch related info
      fetch(`json/${serviceCode}.json`)
        .then((resp) => resp.json())
        .then((data: BusLine) => {
          // Collect lat & lng info
          const route: L.LatLng[] = [];
          data.stops.forEach((elem) => {
            route.push(L.latLng(elem[0], elem[1]));
          });

          // Collect other info - lineNumber, origin, destination
          routeOptions.value.push({
            label: `${data.line_name} ${data.origin} - ${data.destination}`,
            value: {
              line: data.line_name,
              origin: data.origin,
              destination: data.destination,
              serviceCode: data.service_code,
              waypoints: route,
            },
          });
        });
    });
  });

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
    selectedRoutes.value.forEach(async (data: RouteOptions) => {
      // fetch data from json directly
      const busLane: BusLane = await BusLane.generateFromJSON(data.serviceCode);
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

const cleanAnimationFrames = () => {
  while (animationFrameId.value.length) {
    cancelAnimationFrame(animationFrameId.value.pop()!);
  }
};

const startSimulation = () => {
  if (isSimRunning.value) return;
  isSimRunning.value = true;
  simulate();
};

const stopSimulation = () => {
  isSimRunning.value = false;
  cleanAnimationFrames();
};

const simulate = () => {
  const animateBuses = (markers, speeds, coordArr) => {
    const numCoords = coordArr.length;
    let startTime;
    let totalDistance = 0;

    // Convert coordArr to L.LatLng objects if not already
    const latLngArr = coordArr.map((coord) => L.latLng(coord.lat, coord.lng));

    // Calculate total distance of the route
    for (let i = 0; i < numCoords - 1; i++) {
      totalDistance += latLngArr[i].distanceTo(latLngArr[i + 1]);
    }

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000; // Convert to seconds

      markers.forEach((bus, idx) => {
        const distanceCovered = speeds[idx] * elapsed;

        let distanceTraveled = 0;
        for (let i = 0; i < numCoords - 1; i++) {
          const segmentDistance = latLngArr[i].distanceTo(latLngArr[i + 1]);
          if (distanceTraveled + segmentDistance >= distanceCovered) {
            const factor =
              (distanceCovered - distanceTraveled) / segmentDistance;
            const lat =
              latLngArr[i].lat +
              (latLngArr[i + 1].lat - latLngArr[i].lat) * factor;
            const lng =
              latLngArr[i].lng +
              (latLngArr[i + 1].lng - latLngArr[i].lng) * factor;

            bus.setLatLng([lat, lng]);
            break;
          }
          distanceTraveled += segmentDistance;
        }
      });

      if (markers.some((bus, idx) => speeds[idx] * elapsed < totalDistance)) {
        animationFrameId.value.push(requestAnimationFrame(animate)); // Continue animation
      } else {
        // Restart animation loop for continuous movement
        startTime = timestamp;
        animationFrameId.value.push(requestAnimationFrame(animate));
      }
    };

    animationFrameId.value.push(requestAnimationFrame(animate));
  };

  // Collect all bus markers and assign random speeds
  busLanes.value.forEach((lane) => {
    const busMarkers = [];
    const busSpeeds: number[] = [];
    let speed = 200; // base speed
    const coordArr = lane.routeData.coordinates;
    const markers = [
      ...(lane.markers.get("IC") || []),
      ...(lane.markers.get("EV") || []),
      ...(lane.markers.get("Hydrogen") || []),
    ];

    // Increase the speed by 15 for each new marker
    markers.forEach((marker) => {
      speed = speed + 25;
      busMarkers.push(marker);
      busSpeeds.push(speed);
    });

    animateBuses(busMarkers, busSpeeds, coordArr);
  });
};

// Used to download JSONs containing route data
// const downloadAll = () => {
//   routeOptions.value.forEach((option) => generateRoutingControl(option.value));
// };

onMounted(() => {
  createMap();
});
</script>

<template>
  <div id="map"></div>
  <div class="absolute top-0 right-0 z-[1001] mt-2 mr-2">
    <Card class="flex flex-col gap-y-4">
      <!-- TODO: Improve Chip display?? -->
      <MultiSelect
        v-model="selectedRoutes"
        placeholder="Select Routes"
        :disabled="isSimRunning"
        filter
        :options="routeOptions"
        optionLabel="label"
        optionValue="value"
        :maxSelectedLabels="3"
        :selectionLimit="5"
        :virtualScrollerOptions="{ itemSize: 25 }"
      />
      <!-- TODO: Refactor -->
      <div
        v-for="(lane, idx) in busLanes"
        class="flex flex-row gap-x-2 justify-center"
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
              (
                (inputNumberProps.ptProps as InputNumberPassThroughOptions)
                  .root as InputNumberPassThroughAttributes
              ).class =
                (
                  (inputNumberProps.ptProps as InputNumberPassThroughOptions)
                    .root as InputNumberPassThroughAttributes
                ).class + ' pointer-events-none';
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
              ((
                (inputNumberProps.ptProps as InputNumberPassThroughOptions)
                  .root as InputNumberPassThroughAttributes
              ).class as string) = (
                (inputNumberProps.ptProps as InputNumberPassThroughOptions)
                  .root as InputNumberPassThroughAttributes
              ).class.replace(' pointer-events-none', '');
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
