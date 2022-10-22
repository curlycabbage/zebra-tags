<script>
import Vue from "vue";
import TagDemo from "../demo/TagDemo.vue";

export default Vue.extend({
  name: "ServeDev",
  components: {
    TagDemo,
  },
});
</script>

<template>
  <div id="app">
    <TagDemo />
  </div>
</template>
