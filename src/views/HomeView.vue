<script setup lang="ts">
import { onMounted } from 'vue'
import L, { type MapOptions, Marker } from 'leaflet'
import 'leaflet-routing-machine'
// import { map, latLng, tileLayer, marker, type MapOptions } from 'leaflet'

const options: MapOptions = {
  center: L.latLng(51.505, -0.09),
  zoom: 13
}

let demoMap
let animatedMarker: Marker

const line = L.polyline(
  [
    [40.6851, -73.94136],
    [40.68576, -73.94149],
    [40.68649, -73.94165]
  ],
  {
    color: '#02929b',
    weight: 2
  }
)

const moveMarker = () => {
  let arr = line.getLatLngs()

  let lastElem = arr[arr.length - 1]
  let firstElem = arr[0]

  arr[arr.length - 1] = firstElem
  arr[0] = lastElem
}
onMounted(() => {
  demoMap = L.map('map', options)

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(demoMap)

  line.addTo(demoMap)

  animatedMarker = L.animatedMarker(line.getLatLngs(), {
    autoStart: true,
    interval: 2000
  })

  demoMap.addLayer(animatedMarker)

  const group = L.featureGroup([animatedMarker])

  demoMap.fitBounds(group.getBounds())

  // demoMap.fitBounds(group.getBounds())
  // L.Routing.control({
  //   waypoints: [L.latLng(51.505, -0.09), L.latLng(51.506, -0.08)],
  //   routeWhileDragging: true
  // }).addTo(demoMap)
})
</script>

<template>
  <div id="map"></div>
</template>
