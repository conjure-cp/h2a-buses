import { busIconColors } from "@/utils/helper";
import L, { type MapOptions, Marker, LatLng, Layer } from "leaflet";
import "leaflet-routing-machine";

export const addedRoutesCoords: L.LatLng[][] = [];

export const generateRoutingControl = (waypoints: L.LatLng[], map: L.Map) => {
  let coordinates: LatLng[] = [];

  const routingControl = L.Routing.control({
    waypoints: waypoints,
  }).on("routesfound", (e) => {
    routesFoundCallback(e, map);
    addedRoutesCoords.push(e.routes[0].coordinates);
  });

  return routingControl;
};

export const routesFoundCallback = (e: any, map: L.Map) => {
  let waypointMarkers = new L.FeatureGroup();

  // add bus markers (3) to the starting point, representing a different engine type (IC, EV, Hybrid)
  for (let i = 0; i < busIconColors.length; i++) {
    const icon = L.divIcon({
      html: `<i class="fa-solid fa-bus fa-2xl" style="color: ${busIconColors[i]};"></i>`,
      className: `busIcon${i}`,
    });

    L.marker(
      [
        e.waypoints[0].latLng.lat + i / 1000,
        e.waypoints[0].latLng.lng + i / 1000,
      ],
      {
        icon: icon,
      }
    ).addTo(map);
  }

  //set the camera
  //   const zoomCenter = L.latLng(
  //     (e.waypoints[0].latLng.lat + e.waypoints[1].latLng.lat) / 2,
  //     (e.waypoints[0].latLng.lng + e.waypoints[1].latLng.lng) / 2
  //   );
  //   map.setView(zoomCenter);
  //   let zoomThreshold = map.getZoom();

  map.eachLayer((layer: Layer) => {
    if (
      layer instanceof Marker &&
      !layer.getIcon().options.className?.includes("bus")
    ) {
      waypointMarkers.addLayer(layer);
    }
  });

  // TODO: Solve this duplicate layer problem!
  map.addLayer(waypointMarkers);
  map.removeLayer(waypointMarkers);
};
