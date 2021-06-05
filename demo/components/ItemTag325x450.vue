<template>
  <div class="flex gap-4">
    <div class="flex flex-col gap-4">
      <form @submit.prevent class="flex flex-col gap-4">
        <div class="flex justify-between">
          <select class="text-base font-sans" v-model.trim="mode">
            <option>canvas</option>
            <option>image</option>
          </select>
          <select class="text-base font-sans" v-model.trim="dpmm">
            <option :value="6">6 dpmm</option>
            <option :value="8">8 dpmm</option>
            <option :value="12">12 dpmm</option>
          </select>
        </div>
        <select class="text-base font-sans" v-model.number="scale">
          <option :value="0.25">25%</option>
          <option :value="0.5">50%</option>
          <option :value="0.75">75%</option>
          <option :value="1">100%</option>
          <option :value="1.25">125%</option>
        </select>
        <div>
          <input class="text-base font-sans" v-model.trim="backgroundColor" />
        </div>
        <div>
          <input class="text-base font-sans" v-model.trim="productCode" />
        </div>
        <div>
          <input class="text-base font-sans" v-model.trim="brandName" />
        </div>
        <div>
          <input class="text-base font-sans" v-model.trim="description" />
        </div>
        <div>
          <input class="text-base font-sans" v-model.trim="itemSize" />
        </div>
        <div>
          <input class="text-base font-sans" v-model.number="retailPrice" />
        </div>
        <div>
          <input id="isWeighed" type="checkbox" v-model="isWeighed" />
          <label for="isWeighed" class="text-base font-sans">Weighed</label>
        </div>
        <div>
          <input id="isTaxed" type="checkbox" v-model="isTaxed" />
          <label for="isTaxed" class="text-base font-sans">Taxed</label>
        </div>
        <div>
          <input id="isOrganic" type="checkbox" v-model="isOrganic" />
          <label for="isOrganic" class="text-base font-sans">Organic</label>
        </div>
      </form>
    </div>
    <div>
      <ItemTag325x450
        class="border border-dotted"
        :productCode="productCode"
        :brandName="brandName"
        :description="description"
        :retailPrice="retailPrice"
        :itemSize="itemSize"
        :isWeighed="isWeighed"
        :isTaxed="isTaxed"
        :isOrganic="isOrganic"
        :mode="mode"
        :dpmm="dpmm"
        :backgroundColor="backgroundColor"
        :scale="scale"
        @zpl="zpl = $event"
      />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
@import "./demo.css";
</style>

<script>
import ItemTag325x450 from "@/components/ItemTag325x450";

export default {
  data() {
    return {
      productCode: "33142",
      brandName: "Mighty Food Farm",
      description: "Red Onions",
      retailPrice: 3.25,
      itemSize: "each",
      isWeighed: true,
      isTaxed: false,
      isOrganic: true,
      mode: "canvas",
      dpmm: 12,
      scale: 1,
      zpl: undefined,
      backgroundColor: "#EFDBB2",
      proxyUrl: process.env.VUE_APP_DEFAULT_PROXY_URL,
      proxyResponse: undefined,
    };
  },
  components: {
    ItemTag325x450,
  },
};
</script>
