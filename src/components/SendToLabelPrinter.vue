<template>
  <button @click.stop="sendToPrinter()">
    <span>{{ label }}</span>
  </button>
</template>

<script>
export default {
  props: {
    printerUrl: String,
    label: { type: String, default: "Send to Label Printer" },
    zpl: String,
  },
  methods: {
    async sendToPrinter() {
      const headers = new Headers();
      headers.append("Content-Type", "text/plain");

      const options = {
        method: "POST",
        headers: headers,
        body: this.zpl,
        redirect: "follow",
        // Without a proxy, this is the best we can do.
        // The response, including the status code, will be opaque.
        mode: "no-cors",
      };

      try {
        const res = await fetch(this.printerUrl, options);
        await res.text();
        this.$emit("success");
      } catch (err) {
        console.log("Error sending label to printer", err);
        this.$emit("error", err);
      }
    },
  },
};
</script>
