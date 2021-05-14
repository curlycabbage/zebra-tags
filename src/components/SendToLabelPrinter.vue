<template>
  <button @click.stop="print">
    <span>{{ label }}</span>
  </button>
</template>

<script>
import { sendToPrinter } from "./utils";

export default {
  props: {
    printerUrl: String,
    label: { type: String, default: "Send to Label Printer" },
    zpl: String,
  },
  methods: {
    async print() {
      try {
        await sendToPrinter(this.printerUrl, this.zpl);
        this.$emit("success");
      } catch (err) {
        this.$emit("error", err);
      }
    },
  },
};
</script>
