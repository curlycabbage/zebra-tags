<template>
  <button v-if="value" @click.stop="copyToClipboard()">
    <span>{{ label }}</span>
  </button>
</template>

<script>
export default {
  props: {
    value: String,
    label: { type: String, default: "copy" },
  },
  methods: {
    async copyToClipboard() {
      await navigator.clipboard.writeText(this.value);
      this.$emit("copied", this.value);
    },
  },
};
</script>
