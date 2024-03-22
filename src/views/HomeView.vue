<script setup lang="ts">
import { onMounted, ref } from "vue";
import Card from "@/components/Card.vue";
import MultiSelect from "primevue/multiselect";
import InputNumber from "primevue/inputnumber";
import {
  generateRoutingControl,
  addedRoutesCoords,
  addedRoutesCoordsReverse,
  busMarkers,
} from "@/routing/control";
import { type BusLine } from "@/utils/types";
import L, { type MapOptions, Marker, LatLng, Layer } from "leaflet";
import "leaflet-routing-machine";

let demoMap: L.Map;

const options: MapOptions = {
  center: L.latLng(56.34213143540303, -2.794179122392289),
  zoom: 13,
};

const routeOptions = ref<
  {
    label: string;
    value: {
      line: string;
      waypoints: LatLng[];
    };
  }[]
>([]);
const selectedRoutes = ref<
  {
    line: string;
    waypoints: LatLng[];
  }[]
>([]);
const addedRoutes: L.Routing.Control[] = [];

const stopSim = ref(false);

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
          const route: LatLng[] = [];
          data.stops.forEach((elem) => {
            route.push(L.latLng(elem[0], elem[1]));
          });

          // Collect other info - lineNumber, origin, destination
          routeOptions.value.push({
            label: `${data.line_name} ${data.origin} - ${data.destination}`,
            value: {
              line: data.line_name,
              waypoints: route,
            },
          });
        });
    });
  });

const findRoutes = () => {
  // TODO: Existing layers should also be removed
  demoMap.eachLayer((layer: Layer) => {
    if (layer instanceof Marker) {
      demoMap.removeLayer(layer);
    }
  });

  // pop every element from the bus marker arr
  while (busMarkers.length > 0) {
    busMarkers.shift();
  }

  // Remove every control object added to map first
  while (addedRoutes.length > 0) {
    demoMap.removeControl(addedRoutes.shift()!);
    addedRoutesCoords.shift();
    addedRoutesCoordsReverse.shift();
  }

  if (selectedRoutes.value.length !== 0) {
    selectedRoutes.value.forEach(
      (data: { line: string; waypoints: LatLng[] }) => {
        const routingControl = generateRoutingControl(data.waypoints, demoMap);
        routingControl.addTo(demoMap);
        routingControl.hide();
        addedRoutes.push(routingControl);
      }
    );
  } else {
    alert("Please select a route!");
  }
};

const simulate = () => {
  let numSelectedRoutes = addedRoutesCoords.length;
  addedRoutesCoords.forEach((coordArr: LatLng[], i: number) => {
    let coordArrLen = coordArr.length;
    coordArr.forEach((coord: LatLng, j: number) => {
      setTimeout(() => {
        busMarkers[i * 3].setLatLng([coord.lat, coord.lng]);
      }, 100 * j);

      // await sleep(1000);

      setTimeout(() => {
        busMarkers[i * 3 + 1].setLatLng([coord.lat, coord.lng]);
      }, 125 * j);

      // await sleep(1000);

      setTimeout(() => {
        busMarkers[i * 3 + 2].setLatLng([coord.lat, coord.lng]);
        if (i === numSelectedRoutes - 1 && j === coordArrLen - 1) {
          simulateReverse();
        }
      }, 150 * j);
    });
  });
};

const simulateReverse = () => {
  let numSelectedRoutes = addedRoutesCoordsReverse.length;
  addedRoutesCoordsReverse.forEach((coordArr: LatLng[], i: number) => {
    let coordArrLen = coordArr.length;
    coordArr.forEach((coord: LatLng, j: number) => {
      setTimeout(() => {
        busMarkers[i * 3].setLatLng([coord.lat, coord.lng]);
      }, 100 * j);

      setTimeout(() => {
        busMarkers[i * 3 + 1].setLatLng([coord.lat, coord.lng]);
      }, 125 * j);

      setTimeout(() => {
        busMarkers[i * 3 + 2].setLatLng([coord.lat, coord.lng]);
        if (i === numSelectedRoutes - 1 && j === coordArrLen - 1) {
          simulate();
        }
      }, 150 * j);
    });
  });
};
const stopSimulation = () => {
  stopSim.value = true;
};

onMounted(() => {
  demoMap = L.map("map", options);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(demoMap);
});

const dummyModelVal1 = ref(0);
const dummyModelVal2 = ref(0);
const dummyModelVal3 = ref(0);

const defaultNumberFieldProps = {
  root: "justify-center flex",
  input:
    "border-x-0 border-y-0 text-sm focus:shadow-none focus:border-0 text-center focus-visible:outline-none h-full w-full bg-transparent",
};
</script>

<template>
  <div id="map"></div>
  <div class="absolute top-0 right-0 z-[1001] mt-2 mr-2">
    <Card class="flex flex-col gap-y-4">
      <!-- <SelectForm v-model="selectedRouteId" :options="selectFormOptions" /> -->
      <!-- TODO: Improve Chip display?? -->
      <MultiSelect
        v-model="selectedRoutes"
        placeholder="Select Routes"
        filter
        :options="routeOptions"
        optionLabel="label"
        optionValue="value"
        :maxSelectedLabels="3"
        :selectionLimit="5"
        :virtualScrollerOptions="{ itemSize: 25 }"
      />
      <!-- <div class="flex flex-row gap-x-4 justify-center">
   
        <input
          v-for="(data, idx) in selectedRoutes"
          :key="idx"
          type="number"
          class="border flex-initial w-20"
          v-model="dummyModelVal1"
        />
    
        <input
          type="number"
          class="border flex-initial w-20"
          v-model="dummyModelVal2"
          min="0"
          max="3"
          pattern="^[0-3]{1}$"
        />
        <input
          type="number"
          class="border flex-initial w-20"
          v-model="dummyModelVal3"
        />
      
      </div> -->
      <div class="flex gap-x-4 justify-center">
        <button
          type="button"
          class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 self-center flex-initial w-36 flex items-center mt-2"
          @click="findRoutes"
        >
          <i class="fa-solid fa-route mr-2" />
          Find Routes
        </button>

        <button
          type="button"
          class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 self-center flex-initial w-36 flex items-center mt-2"
          @click="
            () => {
              stopSim = false;
              simulate();
            }
          "
        >
          <i class="fa-solid fa-play mr-2" />
          Simulate
        </button>
        <button
          type="button"
          class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 self-center flex-initial w-36 flex items-center mt-2"
          @click="stopSimulation"
        >
          <i class="fa-solid fa-stop mr-2" />
          Stop
        </button>
      </div>
    </Card>
  </div>
</template>
