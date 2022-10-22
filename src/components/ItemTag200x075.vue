<template>
  <div>
    <canvas
      v-show="mode === 'canvas'"
      class="canvas"
      :style="backgroundColor ? `background-color: ${backgroundColor}` : ''"
      ref="canvas"
      :width="width"
      :height="height"
    />
    <ImageTag200x075
      v-show="mode === 'labelary'"
      :src="src"
      :style="backgroundColor ? `background-color: ${backgroundColor}` : ''"
    />
  </div>
</template>

<style lang="css" scoped>
@import url("https://fonts.googleapis.com/css2?family=Oswald:wght@600&display=swap");

.canvas {
  height: 0.75in;
  width: 2in;
  display: block;
}
</style>

<script>
import ImageTag200x075 from "./ImageTag200x075.vue";
import {
  formatProductCode,
  getBlankImage,
  sanitize,
  fetchLabelaryImage,
  goldenRatio,
} from "./utils";

export default {
  name: "ItemTag200x075",
  components: { ImageTag200x075 },
  props: {
    productCode: String,
    brandName: String,
    description: String,
    /** dots per millimeter, only 12 works at the moment. */
    dpmm: { type: Number, default: 12 },
    mode: { type: String, default: "canvas" },
    backgroundColor: String,
  },
  data() {
    return {
      /** the computed zpl */
      zpl: undefined,
      src: getBlankImage(),
      loading: false,
      inch: {
        height: 0.75,
        width: 2,
      },
    };
  },
  mounted() {
    this.$watch(
      (vm) => [
        vm.productCode,
        vm.brandName,
        vm.description,
        vm.dpmm,
        vm.lineWidth,
        vm.backgroundColor,
        vm.mode,
      ],
      () => this.handleChanges(500),
      {
        deep: true,
      }
    );
    this.handleChanges(0);
  },
  computed: {
    /** dots per inch, converted from dpmm */
    dpi() {
      return Math.floor(this.dpmm * 25.4);
    },

    // key dimensions in pixels, converted to DPI
    /** overall width */
    width() {
      return Math.round(this.inch.width * this.dpi);
    },

    /** overall height */
    height() {
      return Math.round(this.inch.height * this.dpi);
    },

    /** horizontal rule 1 */
    hr1() {
      return Math.round((44 / 96) * this.dpi);
    },

    /** vertical rule 1 */
    vr1() {
      return Math.round((this.inch.width / goldenRatio) * this.dpi);
    },

    /** horizonal margin */
    hm() {
      return Math.round((this.inch.width / goldenRatio ** 7) * this.dpi);
    },

    /** vertical margin */
    vm() {
      return Math.round((this.inch.height / goldenRatio ** 7) * this.dpi);
    },

    /** width of dividing lines */
    lineWidth() {
      return 3;
    },

    /** size of vertical gap used above first line */
    gap() {
      const h = this.hr1;
      return Math.round(h / goldenRatio ** 7);
    },

    computedValues() {
      /** width multiplier */
      const wx = 1.05;

      /** height multipler */
      const hx = 1;

      const productCode = sanitize(this.productCode);
      const brandName = sanitize(this.brandName);
      const description = sanitize(this.description);

      const productCodeText = formatProductCode(productCode);

      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");

      const deriveMetrics = (value, { maxWidth, maxFontSize, minFontSize }) => {
        ctx.save();
        const max = maxFontSize || 72;
        const min = minFontSize || 42;
        let fontSize = max;
        let metrics;
        for (;;) {
          // for measurement purposes, replace characters that hang below the line
          // with similar characters of equivalent width.
          const testValue = value
            .replace(/[gqp]/g, "d")
            .replace(/[y]/g, "v")
            .replace(/[j]/g, "i")
            .replace(/[$]/g, "S")
            .replace(/[@]/g, "W")
            .replace(/[^a-zA-Z0-9 ]/g, ".");
          ctx.font = this.createFont(fontSize);
          metrics = ctx.measureText(testValue);
          if (metrics.width * wx <= maxWidth || fontSize <= min) break;
          fontSize -= 2;
        }

        ctx.restore();

        const width = metrics.width;
        const height =
          metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        return {
          fontSize,
          width: width * wx,
          height: height * hx,
        };
      };

      const metrics = {
        productCodeText: {
          maxFontSize: 40,
          maxWidth: this.vr1 - this.hm * 2,
        },
        brandName: {
          minFontSize: 50,
          maxWidth: this.width - this.vr1 - this.hm * 2,
        },
        description: {
          maxWidth: this.width - this.hm * 2,
        },
      };

      const result = {
        productCode,
        productCodeText,
        brandName,
        description,
        metrics,
        canvas,
        ctx,
      };

      Object.keys(metrics).forEach((key) => {
        const v = result[key];
        const m = metrics[key];
        const d = deriveMetrics(v, m);
        Object.assign(m, d);
      });

      // if brandName has overflown max width, split into two lines.
      if (metrics.brandName.width > metrics.brandName.maxWidth) {
        const segments = brandName.split(" ");
        if (segments.length === 1) {
          const halfway = Math.round(brandName.length / 2);
          segments[0] = brandName.substring(0, halfway);
          segments[1] = brandName.substring(halfway);
        }
        let brand1 = "";
        let brand2 = brandName;
        let lastGap = 0 - ctx.measureText(brand2).width;
        let longerValue = brandName;
        // split brandName into two lines of approximately equal length
        for (let i = 0, n = segments.length; i < n; i++) {
          brand1 = segments.slice(0, i + 1).join(" ");
          brand2 = segments.slice(i + 1).join(" ");
          const m1 = ctx.measureText(brand1);
          const m2 = ctx.measureText(brand2);
          const currGap = m1.width - m2.width;
          if (currGap > 0) {
            longerValue = brand1;
            if (Math.abs(currGap) > Math.abs(lastGap)) {
              brand1 = segments.slice(0, i).join(" ");
              brand2 = segments.slice(i).join(" ");
              longerValue = brand2;
            }
            break;
          }
          lastGap = currGap;
        }
        result.brandName = `${brand1}\n${brand2}`;
        console.log({ longerValue });
        const derived = deriveMetrics(longerValue, {
          maxWidth: metrics.brandName.maxWidth,
          maxFontSize: 56,
          minFontSize: metrics.brandName.minFontSize,
        });
        Object.assign(metrics.brandName, derived);
        metrics.brandName.height = metrics.brandName.height * 2.3;
      }

      metrics.productCodeText.top = Math.round(
        this.hr1 - this.gap - metrics.productCodeText.height
      );

      metrics.brandName.top = Math.round(
        this.hr1 - this.vm * 2 - metrics.brandName.height
      );

      metrics.description.top = Math.round(this.hr1 + this.vm * 2);

      console.log(metrics.brandName);
      console.log(result.brandName);
      return result;
    },
  },
  methods: {
    handleChanges(imageDelay) {
      if (this.mode === "canvas" || this.mode === "labelary") {
        this.drawTag();
      }
      if (this.mode === "zpl" || this.mode === "labelary") {
        this.computeZpl();
      }
      if (this.mode === "labelary") {
        this.loadImage(imageDelay);
      }
    },
    loadImage(delay) {
      this.loading = true;
      clearTimeout(this.timeout);
      this.abortController && this.abortController.abort();

      if (!this.zpl) {
        this.src = getBlankImage();
        this.$emit("src", this.src);
        this.loading = false;
        return;
      }

      this.timeout = setTimeout(async () => {
        this.abortController && this.abortController.abort();
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        const zpl = this.zpl;
        const data = await fetchLabelaryImage(zpl, {
          dpmm: this.dpmm,
          width: this.inch.width,
          height: this.inch.height,
          index: 0,
          signal,
        });

        // if the zpl has changed the request came back, abandon the new image.
        if (zpl !== this.zpl) return;

        // update the image
        // TODO: URL.revokeObjectURL() on the old src.
        this.src = URL.createObjectURL(data);
        this.$emit("src", this.src);
        this.loading = false;
      }, delay);
    },
    createFont(fontSize) {
      // Oswald is an excellent approximation of Zebra 0.
      return `600 condensed ${fontSize}px Oswald, sans-serif-condensed, sans-serif`;
    },
    computeRbg() {
      const styles = window.getComputedStyle(this.$refs.canvas);
      const color = styles && styles.backgroundColor;
      if (color) {
        const match = color.match(
          /rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/i
        );
        if (match) {
          const [, r, g, b] = match;
          return { r, g, b };
        }
      }
      return { r: 255, g: 255, b: 255 };
    },
    computeZpl() {
      const { productCode, productCodeText, brandName, description, metrics } =
        this.computedValues;

      const { r, g, b } = this.computeRbg();
      const backgroundZpl = `~BR0,0,${this.width},${this.height},${r},${g},${b}`;

      const value = `^XA
^CI28

^PW${this.width}
^LL${this.height}

^FX horizontal lines ^FS
^FO0,${this.hr1}^GB${this.width},${this.lineWidth},${this.lineWidth}^FS

^FX barcode ^FS
^FO${this.hm},0
^BY3
^BCN,90,N,,,A
^FD${productCode}
^FS

^FX product code ^FS
^FO0,${metrics.productCodeText.top}
^FB${this.vr1},2,,C,
^A0,${metrics.productCodeText.fontSize}
^FD${productCodeText}\\&
^FS

^FX text1 ^FS
^FO${this.vr1},${metrics.brandName.top}
^FB${this.width - this.vr1},2,,C,
^A0,${metrics.brandName.fontSize}
^FD${brandName.replace("\n", "\\&")}\\&
^FS

^FX text2 ^FS
^FO0,${metrics.description.top}
^FB${this.width},2,,C,
^A0,${metrics.description.fontSize}
^FD${description}\\&
^FS

${backgroundZpl}

^XZ`;
      this.zpl = value;
      this.$emit("zpl", value);
    },
    drawTag() {
      const { productCodeText, brandName, description, metrics, ctx, canvas } =
        this.computedValues;

      ctx.save();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // set line stroke and line width
      ctx.strokeStyle = "black";
      ctx.lineWidth = this.lineWidth;

      ctx.beginPath();
      ctx.moveTo(0, this.hr1);
      ctx.lineTo(this.width, this.hr1);
      ctx.stroke();

      // PRODUCT CODE

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.productCodeText.fontSize);
      ctx.fillText(productCodeText, this.vr1 / 2, metrics.productCodeText.top);

      // BRAND

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      const brandLines = brandName.split("\n");
      const brandX = this.vr1 + (this.width - this.vr1) / 2;
      if (brandLines.length > 1) {
        ctx.font = this.createFont(metrics.brandName.fontSize);
        ctx.fillText(brandLines[0], brandX, metrics.brandName.top);
        ctx.fillText(
          brandLines[1],
          brandX,
          metrics.brandName.top + metrics.brandName.height / 2
        );
      } else {
        ctx.font = this.createFont(metrics.brandName.fontSize);
        ctx.fillText(brandName, brandX, metrics.brandName.top);
      }

      // DESCRIPTION

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.description.fontSize);
      ctx.fillText(description, this.width / 2, metrics.description.top);

      ctx.restore();

      if (this.mode === "labelary") {
        this.src = canvas.toDataURL();
      }
    },
  },
};
</script>
