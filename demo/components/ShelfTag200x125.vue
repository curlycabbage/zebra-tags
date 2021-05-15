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
      <div class="flex flex-col gap-2">
        <div class="flex gap-2">
          <send-to-label-printer
            label="print http"
            :zpl="zpl"
            host="192.168.88.34"
            mode="http"
          />
          <send-to-label-printer
            label="print proxy"
            :zpl="zpl"
            host="192.168.88.34"
            mode="proxy"
            :proxyUrl="proxyUrl"
            :disabled="!proxyUrl"
            @click="proxyResponse = undefined"
            @success="proxyResponse = $event"
            @error="proxyResponse = $event"
          />
        </div>
        <form @submit.prevent class="flex flex-col">
          <div>
            <input
              class="text-base font-sans"
              autocomplete="on"
              v-model.trim="proxyUrl"
            />
          </div>
          <div class="flex flex-col">
            <label class="text-base font-sans mb-1">proxy response</label>
            <div
              class="
                bg-gray-50
                border border-solid
                font-mono
                whitespace-pre-line
                p-2
              "
            >
              {{ proxyResponse || "none" }}
            </div>
          </div>
        </form>
      </div>
      <div>
        <copy-to-clipboard :value="zpl" label="copy ZPL" />
      </div>
      <pre><code>{{zpl}}</code></pre>
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

.p-2 {
  padding: 0.5rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.whitespace-pre-line {
  white-space: pre-line;
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

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
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

.border-solid {
  border-style: solid;
}

.bg-gray-50 {
  background-color: rgba(243, 244, 246);
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
      proxyUrl: process.env.VUE_APP_DEFAULT_PROXY_URL,
      proxyResponse: undefined,
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
