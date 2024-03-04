import L, { type MapOptions, Marker, LatLng, Layer } from "leaflet";
import "leaflet-routing-machine";

const busIcon = L.divIcon({
  html: '<i class="fa-solid fa-bus fa-2xl" style="color: #2e85cbff;"></i>',
  className: "busIcon",
});

export const generateRoutingControl = (waypoints: L.LatLng[], map: L.Map) => {
  const routingControl = L.Routing.control({
    waypoints: waypoints,
  }).on("routesfound", (e) => {
    routesFoundCallback(e, map);
  });

  return routingControl;
};

export const routesFoundCallback = (e: any, map: L.Map) => {
  let waypointMarkers = new L.FeatureGroup();
  //set the camera
  //   const zoomCenter = L.latLng(
  //     (e.waypoints[0].latLng.lat + e.waypoints[1].latLng.lat) / 2,
  //     (e.waypoints[0].latLng.lng + e.waypoints[1].latLng.lng) / 2
  //   );
  //   map.setView(zoomCenter);
  //   let zoomThreshold = map.getZoom();

  // add the bus marker to the starting point
  L.marker([e.waypoints[0].latLng.lat, e.waypoints[0].latLng.lng], {
    icon: busIcon,
  }).addTo(map);

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
