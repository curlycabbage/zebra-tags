<template>
  <div>
    <div class="flex gap-2 mb-2">
      <button
        v-for="(value, key) in components"
        :key="key"
        :value="value"
        @click="selected = value"
        class="p-2"
        :class="{ 'bg-blue-700 text-white': selected === value }"
      >
        {{ key }}
      </button>
    </div>
    <component v-bind:is="selected" />
  </div>
</template>

<style scoped></style>

<script>
import ShelfTag200x075 from "./components/ShelfTag200x075.vue";
import ShelfTag200x125 from "./components/ShelfTag200x125.vue";
import PantoneTestSheet from "./components/PantoneTestSheet.vue";

const components = {
  ShelfTag200x075,
  ShelfTag200x125,
  PantoneTestSheet,
};

export default {
  components,
  data() {
    return {
      components,
      selected: components[Object.keys(components)[0]],
    };
  },
};
</script>
