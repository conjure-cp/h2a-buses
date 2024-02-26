<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import Card from "@/components/Card.vue";
import SelectForm from "@/components/SelectForm.vue";
import { type BusLine } from "@/utils/types";
import L, { type MapOptions, Marker, LatLng } from "leaflet";
import "leaflet-routing-machine";

let demoMap: L.Map;
let routingControl: L.Routing.Control | undefined;
let busMarker: Marker | undefined;

const busIcon = L.divIcon({
  html: '<i class="fa-solid fa-bus fa-2xl" style="color: #2e85cbff;"></i>',
  className: "busIcon",
});

const options: MapOptions = {
  center: L.latLng(56.34213143540303, -2.794179122392289),
  zoom: 13,
};

const availableLines = ["F028", "F038", "F045", "F099"];
const selectFormOptions = ref<
  {
    lineName: string;
    origin: string;
    destination: string;
  }[]
>([]);
const availableRoutes: L.LatLng[][] = [];

availableLines.forEach((line) => {
  fetch(`json/${line}.json`)
    .then((resp) => resp.json())
    .then((data: BusLine) => {
      // Collect lat & lng info
      const route: L.LatLng[] = [];
      data.stops.forEach((elem) => {
        route.push(L.latLng(elem[0], elem[1]));
      });
      availableRoutes.push(route);

      // Collect other info - lineNumber, origin, destination
      selectFormOptions.value.push({
        lineName: data.line_name,
        origin: data.origin,
        destination: data.destination,
      });
    });
});
/**
 * [0]: Uni St. Andrews - Canongate Primary
 * [1]: Canongate Primary - Uni St. Andrews
 * [2]: Uni St. Andrews - Dundee
 * [3]: Dundee - Uni St. Andrews
 */
// const availableRoutes = [
//   [
//     L.latLng(56.34213143540303, -2.794179122392289),
//     L.latLng(56.33379736952665, -2.81008349458336),
//   ],
//   [
//     L.latLng(56.33379736952665, -2.81008349458336),
//     L.latLng(56.34213143540303, -2.794179122392289),
//   ],
//   [
//     L.latLng(56.34213143540303, -2.794179122392289),
//     L.latLng(56.46224579941079, -2.9668353875167868),
//   ],
//   [
//     L.latLng(56.46224579941079, -2.9668353875167868),
//     L.latLng(56.34213143540303, -2.794179122392289),
//   ],
// ];
const routeCoordinates = ref<LatLng[]>([]);
const selectedRouteId = ref<number>();

watch(
  () => selectedRouteId.value,
  () => {
    // If there is a route, remove it from the map
    if (routingControl !== undefined) {
      demoMap.removeControl(routingControl);
      routingControl = undefined;
    }

    if (busMarker !== undefined) {
      demoMap.removeLayer(busMarker);
      busMarker = undefined;
    }

    // calculate the route
    if (selectedRouteId.value !== undefined) {
      routingControl = L.Routing.control({
        waypoints: availableRoutes[selectedRouteId.value as number],
      })
        .on("routesfound", (e) => {
          console.log("event", e);
          routeCoordinates.value = e.routes[0].coordinates;

          // set the camera
          const zoomCenter = L.latLng(
            (e.waypoints[0].latLng.lat + e.waypoints[1].latLng.lat) / 2,
            (e.waypoints[0].latLng.lng + e.waypoints[1].latLng.lng) / 2
          );
          demoMap.setView(zoomCenter);

          // add the bus marker to the starting point
          busMarker = L.marker(
            [e.waypoints[0].latLng.lat, e.waypoints[0].latLng.lng],
            {
              icon: busIcon,
            }
          ).addTo(demoMap);
        })
        .addTo(demoMap);

      routingControl.hide();
    }
  }
);

const moveMarker = () => {
  if (routeCoordinates.value.length !== 0) {
    routeCoordinates.value.forEach((coord: LatLng, idx: number) => {
      setTimeout(() => {
        busMarker!.setLatLng([coord.lat, coord.lng]);
      }, 100 * idx);
    });
  } else {
    alert("Please select a route!");
  }
};

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
      <SelectForm v-model="selectedRouteId" :options="selectFormOptions" />
      <button
        type="button"
        class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 self-center flex-initial w-32 flex items-center mt-2"
        @click="moveMarker"
      >
        <i class="fa-solid fa-route mr-2" />
        Simulate
      </button>
    </Card>
  </div>
</template>
