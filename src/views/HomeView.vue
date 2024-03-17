<script setup lang="ts">
import { onMounted, ref } from "vue";
import Card from "@/components/Card.vue";
import MultiSelect from "primevue/multiselect";
import {
  generateRoutingControl,
  addedRoutesCoords,
  busMarkers,
} from "@/routing/control";
import { type BusLine } from "@/utils/types";
import L, { type MapOptions, Marker, LatLng, Layer } from "leaflet";
import "leaflet-routing-machine";

let demoMap: L.Map;
// let busMarker: Marker | undefined;

const options: MapOptions = {
  center: L.latLng(56.34213143540303, -2.794179122392289),
  zoom: 13,
};

const routeOptions = ref<
  {
    label: string;
    value: LatLng[];
  }[]
>([]);
const selectedRoutes = ref<LatLng[][]>([]);
const addedRoutes: L.Routing.Control[] = [];

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
            value: route,
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

  // Remove every control object added to map first
  while (addedRoutes.length > 0) {
    demoMap.removeControl(addedRoutes.shift()!);
    addedRoutesCoords.shift();
  }

  if (selectedRoutes.value.length !== 0) {
    selectedRoutes.value.forEach((route: LatLng[]) => {
      const routingControl = generateRoutingControl(route, demoMap);
      routingControl.addTo(demoMap);
      routingControl.hide();
      addedRoutes.push(routingControl);
    });
  } else {
    alert("Please select a route!");
  }
};

const simulate = () => {
  addedRoutesCoords.forEach((coordArr: LatLng[], i: number) => {
    coordArr.forEach(async (coord: LatLng, j: number) => {
      setTimeout(() => {
        busMarkers[i * 3].setLatLng([coord.lat, coord.lng]);
      }, 100 * j);

      // await sleep(1000);

      setTimeout(() => {
        busMarkers[i * 3 + 1].setLatLng([coord.lat, coord.lng]);
      }, 150 * j);

      // await sleep(1000);

      setTimeout(() => {
        busMarkers[i * 3 + 2].setLatLng([coord.lat, coord.lng]);
      }, 200 * j);
    });
  });
};
const stopSimulation = () => {};

onMounted(() => {
  demoMap = L.map("map", options);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(demoMap);
});
</script>

<template>
  <div id="map"></div>
  <div class="absolute top-0 right-0 z-[1001] mt-2 mr-2">
    <Card :class="'flex flex-col'">
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
        class="w-[32rem]"
      />
      <div class="flex gap-x-4 justify-center mt-2">
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
          @click="simulate"
        >
          <i class="fa-solid fa-play mr-2" />
          Simulate
        </button>
        <button
          type="button"
          class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 self-center flex-initial w-36 flex items-center mt-2"
          @click="findRoutes"
        >
          <i class="fa-solid fa-stop mr-2" />
          Stop
        </button>
      </div>
    </Card>
  </div>
</template>
