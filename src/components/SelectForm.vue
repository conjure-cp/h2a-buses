<script setup lang="ts">
const modelVal = defineModel();
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
      <option :value="0">University of St. Andrews - Canongate Primary</option>
      <option :value="1">Canongate Primary - University of St. Andrews</option>
      <option :value="2">University of St. Andrews - Dundee</option>
      <option :value="3">Dundee - University of St. Andrews</option>
    </select>
  </form>
</template>
