<script setup lang="ts">
import { onMounted } from "vue";
import L, { type MapOptions, Marker } from "leaflet";
import "leaflet-routing-machine";
import type { LatLng } from "leaflet";

const options: MapOptions = {
  center: L.latLng(51.505, -0.09),
  zoom: 13,
};

let demoMap;
// #2e85cbff

onMounted(() => {
  demoMap = L.map("map", options);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(demoMap);

  const busIcon = L.divIcon({
    html: '<i class="fa-solid fa-bus fa-2xl" style="color: #2e85cbff;"></i>',
    className: "busIcon",
  });
  const busMarker = L.marker([56.34213143540303, -2.794179122392289], {
    icon: busIcon,
  }).addTo(demoMap);

  L.Routing.control({
    waypoints: [
      L.latLng(56.34213143540303, -2.794179122392289),
      L.latLng(56.33379736952665, -2.81008349458336),
    ],
  })
    .on("routesfound", (e) => {
      const routes = e.routes;
      routes[0].coordinates.forEach((coord: LatLng, idx: number) => {
        setTimeout(() => {
          busMarker.setLatLng([coord.lat, coord.lng]);
        }, 100 * idx);
      });
    })
    .addTo(demoMap)
    .hide();
});
</script>

<template>
  <div id="map"></div>
</template>
