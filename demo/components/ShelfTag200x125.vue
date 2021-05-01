<template>
  <div class="flex gap-4">
    <div class="flex flex-col gap-4">
      <shelf-tag
        :productCode="productCode"
        :brand="brand"
        :description="description"
        :price="price"
        :itemSize="itemSize"
        @zpl="zpl = $event"
      />
      <form @submit.prevent class="flex flex-col gap-4">
        <div>
          <input class="text-base" v-model.trim="productCode" />
        </div>
        <div>
          <input class="text-base" v-model.trim="brand" />
        </div>
        <div>
          <input class="text-base" v-model.trim="description" />
        </div>
        <div>
          <input class="text-base" v-model.trim="itemSize" />
        </div>
        <div>
          <input class="text-base" v-model.number="price" />
        </div>
      </form>
    </div>
    <div class="flex flex-col gap-4">
      <img class="labelaryImg" ref="labelaryImg" />
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

.text-base {
  font-size: 1rem;
  line-height: 1.5rem;
}

.labelaryImg {
  height: 1.25in;
  width: 2in;
  object-fit: contain;
  background-color: mistyrose;
}
</style>

<script>
import ShelfTag from "@/components/ShelfTag200x125";
import CopyToClipboard from "@/components/CopyToClipboard";
import SendToLabelPrinter from "@/components/SendToLabelPrinter.vue";

export default {
  data() {
    return {
      productCode: "015532000039",
      brand: "Montebello",
      description: "Spinach Fettuccini",
      price: 4.79,
      itemSize: "12 OZ",
      // productCode: "1234ABC",
      // brand: "Vosges",
      // description: "Raw Honey Cacao 100%",
      // price: 7.99,
      // itemSize: undefined,
      zpl: undefined,
    };
  },
  components: {
    ShelfTag,
    CopyToClipboard,
    SendToLabelPrinter,
  },
  watch: {
    zpl(val) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(async () => {
        this.abortController && this.abortController.abort();
        this.abortController = new AbortController();

        const dpmm = 12;
        const width = 2;
        const height = 1.25;
        const index = 0;
        const url = `http://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${width}x${height}/${index}/`;

        const body = new FormData();
        body.append("file", new Blob([val], { type: "text/plain" }), "blob");

        const signal = this.abortController.signal;

        const res = await fetch(url, {
          method: "post",
          headers: {
            accept: "image/png",
          },
          body,
          signal,
        });
        const data = await res.blob();

        const el = this.$refs.labelaryImg;
        el.src = URL.createObjectURL(data);
      }, 500);
    },
  },
};
</script>
