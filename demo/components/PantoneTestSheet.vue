<template>
  <div class="grid">
    <ShelfTag200x125
      class="border border-dotted"
      v-bind="tagData"
      @src="src = $event"
    />
    <ImageTag200x125
      v-for="(tag, index) in imageTags"
      :key="index"
      class="border border-dotted"
      :src="tag.src"
    />
  </div>
</template>

<style lang="postcss" scoped>
.grid {
  padding-top: 1.25in;
  display: grid;
  width: 8in;
  grid-template-columns: repeat(4, auto);
  grid-template-rows: repeat(5, 158px);
}

@page {
  margin: 0.25in;
}
</style>

<script>
import ShelfTag200x125 from "@/components/ShelfTag200x125";
import ImageTag200x125 from "@/components/ImageTag200x125";
import { getBlankImage } from "@/components/utils";

export default {
  data() {
    return {
      tagData: {
        productCode: "015532000039",
        brandName: "Montebello",
        description: "Spinach Fettuccini",
        retailPrice: 4.79,
        itemSize: "12 OZ",
        isWeighed: false,
        isTaxed: false,
        isOrganic: false,
        mode: "labelary",
        dpmm: 12,
        // backgroundColor: "#EFDBB2",
      },
      src: getBlankImage(),
    };
  },
  components: {
    ShelfTag200x125,
    ImageTag200x125,
  },
  computed: {
    imageTags() {
      const tags = [];
      const { src } = this;
      for (let i = 0; i < 19; i++) {
        tags.push({ src });
      }
      return tags;
    },
  },
};
</script>
