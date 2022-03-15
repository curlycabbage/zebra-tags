<template>
  <img class="image" ref="image" />
</template>

<style lang="css" scoped>
.image {
  height: 1.27in;
  width: 2in;
  object-fit: contain;
  display: block;
}
</style>

<script>
export default {
  props: {
    src: String,
  },
  name: "ImageTag200x125",
  watch: {
    src() {
      this.bindImage();
    },
  },
  mounted() {
    this.bindImage();
  },
  methods: {
    bindImage() {
      const el = this.$refs.image;
      if (el) el.src = this.src;
    },
  },
};
</script>
