<template>
  <button
    @click.stop="
      $emit('click');
      print();
    "
  >
    <span>{{ label }}</span>
  </button>
</template>

<script>
import { sendToPrinter, sendToProxy } from "./utils";

export default {
  props: {
    host: String,
    proxyUrl: String,
    label: { type: String, default: "Send to Label Printer" },
    zpl: String,
    mode: String,
  },
  methods: {
    print() {
      if (this.mode === "http") {
        return this.printHttp();
      } else {
        return this.printProxy();
      }
    },
    async printHttp() {
      try {
        const res = await sendToPrinter(this.host, this.zpl);
        this.$emit("success", res);
      } catch (err) {
        this.$emit("error", err);
      }
    },
    async printProxy() {
      const { proxyUrl, host, zpl } = this;
      try {
        const res = await sendToProxy(proxyUrl, { host, zpl });
        this.$emit("success", res);
      } catch (err) {
        this.$emit("error", err);
      }
    },
  },
};
</script>
