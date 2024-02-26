<script setup lang="ts">
interface Options {
  lineName: string;
  origin: string;
  destination: string;
}

interface IProps {
  options: Options[];
}
const modelVal = defineModel();
const props = defineProps<IProps>();
</script>
<template>
  <form class="max-w-sm mx-auto flex flex-col">
    <label for="routes" class="block mb-2 text-sm font-medium text-gray-900"
      >Please select a route</label
    >
    <select
      id="route-select"
      name="routes"
      v-model="modelVal"
      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
    >
      <option selected disabled value="">Please select a route</option>
      <option v-for="(data, idx) in props.options" :value="idx">
        {{ `${data.lineName}(${data.origin} - ${data.destination})` }}
      </option>
    </select>
  </form>
</template>
