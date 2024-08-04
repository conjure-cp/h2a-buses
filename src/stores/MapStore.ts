import { ref } from "vue";
import L, { Marker } from "leaflet";
import { defineStore } from "pinia";
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

    demoMap.value.on('zoomend', () => {
      const zoomLevel = demoMap.value?.getZoom();
      // Adjust marker size based on `zoom level`
      document.querySelectorAll('[class*="fa-bus"]').forEach((marker: any) => {
        let { fontSize } = marker.style;
        fontSize =  Number((fontSize as string).slice(0, (fontSize as string).indexOf('r')))
        marker.style.fontSize = `${zoomLevel ?? 13}px`
      });
    })
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

    demoMap.value?.addLayer(waypointMarkers);
    demoMap.value?.removeLayer(waypointMarkers);
  };

  const addMarkerToMap = (marker: Marker) => {
    busMarkers.value.push(marker);
    marker.addTo(demoMap.value!);
  };

  // Remove specific marker
  const removeBusMarker = (
    id: number,
    type: BusMarkerType,
    serviceCode: string
  ) => {
    demoMap.value?.eachLayer((layer: L.Layer) => {
      if (
        layer instanceof L.Marker &&
        layer
          .getIcon()
          .options.className?.includes(`busIcon-${type}-${serviceCode}-${id}`)
      ) {
        demoMap.value?.removeLayer(layer);
      }
    });
    busMarkers.value.shift();
  };

  // Remove all
  const removeBusMarkers = () => {
    busMarkers.value = [];
  };
  //   Map related

  return {
    demoMap,
    createMap,
    removeLayers,
    busMarkers,
    addMarkerToMap,
    removeBusMarker,
    removeBusMarkers,
    removeWaypointMarkers,
    busLanes,
    addBusLane,
    removeBusLanes,
  };
});
