<script setup lang="ts">
import { onMounted, ref } from "vue";
import Card from "@/components/Card.vue";
import InputNumber, {
  type InputNumberInterface,
} from "@/components/InputNumber.vue";
import MultiSelect from "primevue/multiselect";
import { BusLane, generateRoutingControl } from "@/routing/control";
import { useMapStore } from "@/stores/MapStore";
import type { BusLine, RouteOptions } from "@/utils/types";
import L from "leaflet";
import "leaflet-routing-machine";
import { storeToRefs } from "pinia";
import type {
  InputNumberPassThroughAttributes,
  InputNumberPassThroughOptions,
} from "primevue/inputnumber";

const mapStore = useMapStore();
const { demoMap, busLanes, busMarkers } = storeToRefs(mapStore);
const {
  createMap,
  removeLayers,
  removeBusMarkers,
  removeWaypointMarkers,
  addBusLane,
  removeBusLanes,
} = mapStore;

const routeOptions = ref<
  {
    label: string;
    value: RouteOptions;
  }[]
>([]);
const selectedRoutes = ref<RouteOptions[]>([]);
const isSimRunning = ref(false);
const timerIDArr: number[] = [];

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
          const route: L.LatLng[] = [];
          data.stops.forEach((elem) => {
            route.push(L.latLng(elem[0], elem[1]));
          });

          // Collect other info - lineNumber, origin, destination
          routeOptions.value.push({
            label: `${data.line_name} ${data.origin} - ${data.destination}`,
            value: {
              line: data.line_name,
              origin: data.origin,
              destination: data.destination,
              serviceCode: data.service_code,
              waypoints: route,
            },
          });
        });
    });
  });

const inputNumberProps = ref<InputNumberInterface>({
  ptProps: {
    root: {
      class: "flex justify-center text-left font-medium h-full",
    },
    input: {
      root: "order-2 mx-1 w-[35%] px-2 py-1 border text-sm text-center h-full bg-transparent",
    },
    incrementButton: {
      root: "order-3 border-0 rounded !cursor-pointer",
    },
    decrementButton: {
      root: "order-1 border-0 rounded !cursor-pointer",
    },
  },
  min: 0,
  max: 3,
  isDisabled: true,
  inputWrapper: " basis-1/3",
});

const findRoutes = () => {
  // Existing layers should also be removed
  removeLayers();

  // pop every element from the bus marker arr
  removeBusMarkers();

  // remove all buslanes
  removeBusLanes();

  if (selectedRoutes.value.length !== 0) {
    selectedRoutes.value.forEach((data: RouteOptions) => {
      if (localStorage.getItem(data.serviceCode)) {
        const busLane: BusLane = BusLane.generateFromLocalStorage(
          data.serviceCode
        );
        const route = new L.Polyline(busLane.routeData.coordinates);
        removeWaypointMarkers();
        route.addTo(demoMap.value as L.Map);
        addBusLane(busLane);
      } else {
        // otherwise call osrm API and cache route coordinates
        generateRoutingControl(data);
      }
    });
  } else {
    alert("Please select a route!");
  }
};

const simulate = () => {
  let numSelectedLanes = busLanes.value.length;
  busLanes.value.forEach((lane, i: number) => {
    const coordArr = (lane as BusLane).routeData.coordinates;
    const ICBuses = (lane as BusLane).markers.get("IC");
    const EVBuses = (lane as BusLane).markers.get("EV");
    const hybridBuses = (lane as BusLane).markers.get("Hybrid");
    const coordArrLen = coordArr.length;
    coordArr.forEach((coord: L.LatLng, j: number) => {
      timerIDArr.push(
        setTimeout(() => {
          ICBuses?.forEach((bus: L.Marker, idx: number) => {
            bus.setLatLng([coord.lat + idx / 1000, coord.lng + idx / 1000]);
          });
        }, 100 * j)
      );

      timerIDArr.push(
        setTimeout(() => {
          EVBuses?.forEach((bus: L.Marker, idx: number) => {
            bus.setLatLng([coord.lat + idx / 1000, coord.lng + idx / 1000]);
          });
        }, 125 * j)
      );

      timerIDArr.push(
        setTimeout(() => {
          hybridBuses?.forEach((bus: L.Marker, idx: number) => {
            bus.setLatLng([coord.lat + idx / 1000, coord.lng + idx / 1000]);
          });
          if (i === numSelectedLanes - 1 && j === coordArrLen - 1) {
            simulateReverse();
          }
        }, 150 * j)
      );
    });
  });
};

const simulateReverse = () => {
  const numSelectedLanes = busLanes.value.length;
  busLanes.value.forEach((lane, i: number) => {
    const coordArr = (lane as BusLane).coordinatesReverse;
    const ICBuses = (lane as BusLane).markers.get("IC");
    const EVBuses = (lane as BusLane).markers.get("EV");
    const hybridBuses = (lane as BusLane).markers.get("Hybrid");
    const coordArrLen = coordArr.length;
    coordArr.forEach((coord: L.LatLng, j: number) => {
      timerIDArr.push(
        setTimeout(() => {
          ICBuses?.forEach((bus: L.Marker, idx: number) => {
            bus.setLatLng([coord.lat + idx / 1000, coord.lng + idx / 1000]);
          });
        }, 100 * j)
      );

      timerIDArr.push(
        setTimeout(() => {
          EVBuses?.forEach((bus: L.Marker, idx: number) => {
            bus.setLatLng([coord.lat + idx / 1000, coord.lng + idx / 1000]);
          });
        }, 125 * j)
      );

      timerIDArr.push(
        setTimeout(() => {
          hybridBuses?.forEach((bus: L.Marker, idx: number) => {
            bus.setLatLng([coord.lat + idx / 1000, coord.lng + idx / 1000]);
          });
          if (i === numSelectedLanes - 1 && j === coordArrLen - 1) {
            simulate();
          }
        }, 150 * j)
      );
    });
  });
};
const stopSimulation = () => {
  ((
    (inputNumberProps.value.ptProps as InputNumberPassThroughOptions)
      .root as InputNumberPassThroughAttributes
  ).class as string) = (
    (inputNumberProps.value.ptProps as InputNumberPassThroughOptions)
      .root as InputNumberPassThroughAttributes
  ).class.replace(" pointer-events-none", "");

  isSimRunning.value = false;

  while (timerIDArr.length) {
    clearTimeout(timerIDArr.pop());
  }
};

onMounted(() => {
  createMap();
});
</script>

<template>
  <div id="map"></div>
  <div class="absolute top-0 right-0 z-[1001] mt-2 mr-2">
    <Card class="flex flex-col gap-y-4">
      <!-- TODO: Improve Chip display?? -->
      <MultiSelect
        v-model="selectedRoutes"
        placeholder="Select Routes"
        :disabled="isSimRunning"
        filter
        :options="routeOptions"
        optionLabel="label"
        optionValue="value"
        :maxSelectedLabels="3"
        :selectionLimit="5"
        :virtualScrollerOptions="{ itemSize: 25 }"
      />
      <!-- TODO: Refactor -->
      <div
        v-for="(lane, idx) in busLanes"
        class="flex flex-row gap-x-2 justify-center"
        :key="`num-input-container-${idx}`"
      >
        <span class="self-center text-sm">
          {{ lane.label }}
        </span>
        <div class="flex flex-col gap-y-1">
          <div class="text-sm text-red-500 text-center font-bold">IC</div>
          <InputNumber
            :modelValue="lane.numICMarkers"
            :inputProps="inputNumberProps"
            @increase="
              () => {
                if (lane.numICMarkers! < inputNumberProps.max!)
                  lane.addMarker('IC');
              }
            "
            @decrease="
              () => {
                if (lane.numICMarkers! > inputNumberProps.min!)
                  lane.removeMarker('IC', lane.numICMarkers!);
              }
            "
          />
        </div>
        <div class="flex flex-col gap-y-1">
          <div class="text-sm text-green-500 text-center font-bold">EV</div>
          <InputNumber
            :modelValue="lane.numEVMarkers"
            :inputProps="inputNumberProps"
            @increase="
              () => {
                if (lane.numEVMarkers! < inputNumberProps.max!)
                  lane.addMarker('EV');
              }
            "
            @decrease="
              () => {
                if (lane.numEVMarkers! > inputNumberProps.min!)
                  lane.removeMarker('EV', lane.numEVMarkers!);
              }
            "
          />
        </div>
        <div class="flex flex-col gap-y-1">
          <div class="text-sm text-blue-500 text-center font-bold">Hybrid</div>
          <InputNumber
            :modelValue="lane.numHybridMarkers"
            :inputProps="inputNumberProps"
            @increase="
              () => {
                if (lane.numHybridMarkers! < inputNumberProps.max!)
                  lane.addMarker('Hybrid');
              }
            "
            @decrease="
              () => {
                if (lane.numHybridMarkers! > inputNumberProps.min!)
                  lane.removeMarker('Hybrid', lane.numHybridMarkers!);
              }
            "
          />
        </div>
      </div>
      <!-- TODO: Refactor -->
      <div class="flex gap-x-4 justify-center">
        <button
          type="button"
          :disabled="isSimRunning"
          class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 self-center flex-initial w-36 flex items-center mt-2"
          @click="findRoutes"
        >
          <i class="fa-solid fa-route mr-2" />
          Find Routes
        </button>

        <button
          type="button"
          :disabled="busMarkers.length === 0 || isSimRunning ? true : false"
          class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 self-center flex-initial w-36 flex items-center mt-2"
          @click="
            () => {
              (
                (inputNumberProps.ptProps as InputNumberPassThroughOptions)
                  .root as InputNumberPassThroughAttributes
              ).class =
                (
                  (inputNumberProps.ptProps as InputNumberPassThroughOptions)
                    .root as InputNumberPassThroughAttributes
                ).class + ' pointer-events-none';
              isSimRunning = true;
              simulate();
            }
          "
        >
          <i class="fa-solid fa-play mr-2" />
          Simulate
        </button>
        <button
          type="button"
          :disabled="!isSimRunning"
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
