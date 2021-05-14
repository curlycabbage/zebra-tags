<template>
  <img class="labelary" ref="labelary" />
</template>

<style lang="css" scoped>
.labelary {
  height: 1.25in;
  width: 2in;
  object-fit: contain;
  display: block;
}
</style>

<script>
import { fetchLabelaryImage } from "./utils";

export default {
  props: {
    zpl: String,
    dpmm: Number,
  },
  name: "LabelaryTag200x125",
  watch: {
    zpl() {
      this.renderImage(500);
    },
  },
  mounted() {
    this.renderImage(0);
  },
  methods: {
    renderImage(delay) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(async () => {
        this.abortController && this.abortController.abort();
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        const data = await fetchLabelaryImage(this.zpl, {
          dpmm: this.dpmm,
          width: 2,
          height: 1.25,
          index: 0,
          signal,
        });

        const el = this.$refs.labelary;
        el.src = URL.createObjectURL(data);
      }, delay);
    },
  },
};
</script>
