<template>
  <img class="labelary" ref="labelary" />
</template>

<style lang="css" scoped>
.labelary {
  height: 1.24in;
  width: 2in;
  object-fit: contain;
  display: block;
}
</style>

<script>
import { fetchLabelaryImage } from "./utils";

// a tiny gif, taken from here: https://stackoverflow.com/a/19126281
const blankImgSrc =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D";

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
      this.abortController && this.abortController.abort();

      if (!this.zpl) {
        const el = this.$refs.labelary;
        if (el) el.src = blankImgSrc;
        return;
      }

      this.timeout = setTimeout(async () => {
        this.abortController && this.abortController.abort();
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        const zpl = this.zpl;
        const data = await fetchLabelaryImage(zpl, {
          dpmm: this.dpmm,
          width: 2,
          height: 1.24,
          index: 0,
          signal,
        });

        // if the zpl has changed the request came back, abandon the new image.
        if (zpl !== this.zpl) return;

        // update the image
        const el = this.$refs.labelary;
        if (el) el.src = URL.createObjectURL(data);
      }, delay);
    },
  },
};
</script>
