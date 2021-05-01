<template>
  <dummy-button :initialValue="initialValue" />
</template>

<script>
import DummyButton from "@/components/DummyButton";

export default {
  data() {
    return { initialValue: 10 };
  },
  components: {
    DummyButton,
  },
};
</script>
