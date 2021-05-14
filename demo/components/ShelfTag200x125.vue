<template>
  <div class="flex gap-4">
    <div class="flex flex-col gap-4">
      <div>
        <shelf-tag
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
          @zpl="zpl = $event"
        />
      </div>
      <form @submit.prevent class="flex flex-col gap-4">
        <div class="flex justify-between">
          <select class="text-base font-sans" v-model.trim="mode">
            <option>canvas</option>
            <option>labelary</option>
          </select>
          <select class="text-base font-sans" v-model.trim="dpmm">
            <option :value="6">6 dpmm</option>
            <option :value="8">8 dpmm</option>
            <option :value="12">12 dpmm</option>
          </select>
        </div>
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
    <div class="flex flex-col gap-4">
      <labelary-tag-200x-125
        class="border border-dotted"
        :zpl="zpl"
        :dpmm="dpmm"
      />
      <div>
        <div class="flex gap-2">
          <copy-to-clipboard :value="zpl" label="copy ZPL" />
          <send-to-label-printer
            :zpl="zpl"
            label="print label"
            printerUrl="http://192.168.88.34/pstprnt"
          />
        </div>
        <pre><code>{{zpl}}</code></pre>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-4 {
  gap: 1rem;
}

.justify-between {
  justify-content: space-between;
}

.font-sans {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

.text-base {
  font-size: 1rem;
  line-height: 1.5rem;
}

.border {
  border-width: 1px;
}

.border-dotted {
  border-style: dotted;
}
</style>

<script>
import ShelfTag from "@/components/ShelfTag200x125";
import CopyToClipboard from "@/components/CopyToClipboard";
import SendToLabelPrinter from "@/components/SendToLabelPrinter.vue";
import LabelaryTag200x125 from "@/components/LabelaryTag200x125.vue";

export default {
  data() {
    return {
      productCode: "015532000039",
      brandName: "Montebello",
      description: "Spinach Fettuccini",
      retailPrice: 4.79,
      itemSize: "12 OZ",
      isWeighed: false,
      isTaxed: false,
      isOrganic: false,
      mode: "canvas",
      dpmm: 12,
      zpl: undefined,
      backgroundColor: "#EFDBB2",
    };
  },
  components: {
    ShelfTag,
    CopyToClipboard,
    SendToLabelPrinter,
    LabelaryTag200x125,
  },
};
</script>
