import { ref } from "vue";
import L from "leaflet";
import { defineStore } from "pinia";
import { busIconColors } from "@/utils/helper";

export const useMapStore = defineStore("map", () => {
  // Routing related
  const addedRoutesCoords = ref<L.LatLng[][]>([]);
  const addedRoutesCoordsReverseOrder = ref<L.LatLng[][]>([]);

  const addRouteCoords = (coords: L.LatLng[]) => {
    addedRoutesCoords.value.push(coords);
    addedRoutesCoordsReverseOrder.value.push(coords.slice().reverse());
  };

  const removeRouteCoords = () => {
    addedRoutesCoords.value = [];
    addedRoutesCoordsReverseOrder.value = [];
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
  }

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
    addedRoutesCoords,
    addedRoutesCoordsReverseOrder,
    addRouteCoords,
    removeRouteCoords
  };
});
