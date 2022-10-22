<template>
  <div class="flex gap-4">
    <div class="flex flex-col gap-4">
      <div>
        <ItemTag200x075
          class="border border-dotted"
          :productCode="productCode"
          :brandName="brandName"
          :description="description"
          :mode="mode"
          :dpmm="dpmm"
          :backgroundColor="backgroundColor"
          @zpl="zpl = $event"
          @src="src = $event"
        />
      </div>
      <form @submit.prevent class="flex flex-col gap-4">
        <div class="flex justify-between">
          <select class="text-base font-sans" v-model.trim="mode">
            <option>canvas</option>
            <option>labelary</option>
            <option>zpl</option>
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
      </form>
    </div>
    <div class="flex flex-col gap-4">
      <ImageTag200x075 class="border border-dotted" :src="src" />
      <div class="flex flex-col gap-2">
        <div class="flex gap-2">
          <SendToLabelPrinter
            label="print http"
            :zpl="zpl"
            host="192.168.88.34"
            mode="http"
          />
          <SendToLabelPrinter
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
          <div class="flex flex-col w-48">
            <label class="text-base font-sans mb-1">proxy response</label>
            <div
              class="bg-gray-50 border border-solid font-mono whitespace-pre-line p-2"
            >
              {{ proxyResponse || "none" }}
            </div>
          </div>
        </form>
      </div>
      <div>
        <CopyToClipboard :value="zpl" label="copy ZPL" />
      </div>
      <pre><code>{{zpl}}</code></pre>
    </div>
  </div>
</template>

<script>
import "./demo.css";
import ItemTag200x075 from "@/components/ItemTag200x075";
import ImageTag200x075 from "@/components/ImageTag200x075.vue";
import { getBlankImage } from "@/components/utils";
import CopyToClipboard from "./CopyToClipboard";
import SendToLabelPrinter from "./SendToLabelPrinter";

export default {
  data() {
    return {
      productCode: "015532000039",
      brandName: "Montebello",
      description: "Spinach Fettuccini",
      mode: "canvas",
      dpmm: 12,
      zpl: undefined,
      src: getBlankImage(),
      backgroundColor: "#EFDBB2",
      proxyUrl: process.env.VUE_APP_DEFAULT_PROXY_URL,
      proxyResponse: undefined,
    };
  },
  components: {
    ItemTag200x075,
    CopyToClipboard,
    SendToLabelPrinter,
    ImageTag200x075,
  },
};
</script>
