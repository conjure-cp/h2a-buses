import { ref } from "vue";
import L, { Marker } from "leaflet";
import { defineStore } from "pinia";
import { busIconColors } from "@/utils/helper";
import type { BusLane } from "@/routing/control";
import type { BusMarkerType } from "@/utils/types";

export const useMapStore = defineStore("map", () => {
  // Routing related
  const busLanes = ref<BusLane[]>([]);

  const addBusLane = (lane: BusLane) => {
    busLanes.value.push(lane);
  };

  // Bulk delete
  // TODO: Consider removing single lane as well
  const removeBusLanes = () => {
    busLanes.value = [];
  };

  // Routing related

  // Map related
  const options: L.MapOptions = {
    center: L.latLng(56.34213143540303, -2.794179122392289),
    zoom: 13,
  };

  const demoMap = ref<L.Map>();
  const busMarkers = ref<L.Marker[]>([]);

  const createMap = () => {
    demoMap.value = L.map("map", options);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(demoMap.value);
  };

  const removeLayers = () => {
    demoMap.value?.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        demoMap.value?.removeLayer(layer);
      }
    });
  };

  const removeWaypointMarkers = () => {
    let waypointMarkers = new L.FeatureGroup();
    demoMap.value?.eachLayer((layer: L.Layer) => {
      if (
        layer instanceof L.Marker &&
        !layer.getIcon().options.className?.includes("bus")
      ) {
        waypointMarkers.addLayer(layer);
      }
    });

    // TODO: Solve this duplicate layer problem!
    demoMap.value?.addLayer(waypointMarkers);
    demoMap.value?.removeLayer(waypointMarkers);
  };

  //   TODO: Update this implementation. Currenly only 3 markers
  const createBusMarkers = (waypoints: L.LatLng[]) => {
    for (let i = 0; i < busIconColors.length; i++) {
      const icon = L.divIcon({
        html: `<i class="fa-solid fa-bus fa-2xl" style="color: ${busIconColors[i]};"></i>`,
        className: `busIcon${i}`,
      });

      const marker = L.marker(
        [waypoints[0].lat + i / 1000, waypoints[0].lng + i / 1000],
        {
          icon: icon,
        }
      );
      busMarkers.value.push(marker);
      marker.addTo(demoMap.value!);
    }
  };

  const addMarkerToMap = (marker: Marker) => {
    marker.addTo(demoMap.value!);
  };

  const removeBusMarkerFromMap = (id: number, type: BusMarkerType, serviceCode: string) => {
    console.log("called with ", id)
    demoMap.value?.eachLayer((layer: L.Layer) => {
      if (
        layer instanceof L.Marker &&
        layer.getIcon().options.className?.includes("bus") &&
        layer.getIcon().options.className?.includes(`${id}`) && 
        layer.getIcon().options.className?.includes(type) &&
        layer.getIcon().options.className?.includes(serviceCode)
      ) {
        console.log("removing layer", layer)
        demoMap.value?.removeLayer(layer);
        ; // remove one at a time
      }
    });
  };

  const removeBusMarkers = () => {
    busMarkers.value = [];
  };
  //   Map related

  return {
    demoMap,
    createMap,
    removeLayers,
    busMarkers,
    createBusMarkers,
    removeBusMarkers,
    removeWaypointMarkers,
    addMarkerToMap,
    removeBusMarkerFromMap,
    busLanes,
    addBusLane,
    removeBusLanes,
  };
});
