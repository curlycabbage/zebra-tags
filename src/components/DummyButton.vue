<template>
  <div>
    <button @click="increment">{{ text }}</button>
  </div>
</template>
<script>
export default {
  props: {
    initialValue: { type: Number, default: 0 },
  },
  data() {
    return {
      count: this.initialValue,
    }
  },
  computed: {
    times() {
      return this.count > 1 ? "times" : "time";
    },
    text() {
      return `I have been clicked ${this.count} ${this.times}`;
    },
  },
  methods: {
    increment() {
      this.count += 1;
    },
  },
};
</script>
