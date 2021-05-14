<template>
  <canvas class="shelf-tag" ref="canvas" :width="width" :height="height">
  </canvas>
</template>

<style lang="css" scoped>
.shelf-tag {
  border: dotted 1px grey;
  height: 1.25in;
  width: 2in;
}
</style>

<script>
import { computeUnitCost, sanitize } from "./utils";

/** golden ratio */
const gr = 1.618;

export default {
  props: {
    productCode: String,
    brand: String,
    description: String,
    itemSize: String,
    isWeighed: Boolean,
    price: Number,
    dpmm: { type: Number, default: 12 },
    renderCanvas: Boolean,
  },
  data() {
    const dpi = Math.floor(this.dpmm * 25.4);
    return {
      // key dimensions in pixels, converted to DPI
      /** overall width */
      width: Math.round((192 / 96) * dpi),
      /** overall height */
      height: Math.round((120 / 96) * dpi),

      /** horizontal rule 1 */
      hr1: Math.round((44 / 96) * dpi),
      /** horizontal rule 2 */
      hr2: Math.round((84 / 96) * dpi),

      /** vertical rule 2 */
      vr2: Math.round((192 / gr / 96) * dpi),
      /** horizonal margin */
      hm: Math.round((192 / gr ** 7 / 96) * dpi),
      /** vertical margin */
      vm: Math.round((120 / gr ** 7 / 96) * dpi),

      /** width of dividing lines */
      lineWidth: 3,

      /** something to approximate the scalable Zebra font 0 */
      fontFamily: "sans-serif",
    };
  },
  computed: {
    /** size of vertical gap used above first line */
    vr1gap() {
      const h = this.hr1;
      return Math.round(h / gr ** 5);
    },
    /** size of vertical gap used between first and second lines */
    vr2gap() {
      const h = this.hr2 - this.hr1;
      return Math.round((h - h / gr) / 2);
    },
  },
  mounted() {
    const { width, height, hr1, hr2, vr2, hm, vm, vr1gap, vr2gap } = this;
    console.log({ width, height, hr1, hr2, vr2, hm, vm, vr1gap, vr2gap });
    this.$watch(
      (vm) => [
        vm.brand,
        vm.description,
        vm.itemSize,
        vm.isWeighed,
        vm.price,
        vm.productCode,
      ],
      () => {
        this.drawTag();
        this.computeZpl();
      },
      {
        immediate: true,
        deep: true,
      }
    );
  },
  methods: {
    createFont(fontSize) {
      return `bold condensed ${fontSize}px ${this.fontFamily}`;
    },
    computeValues() {
      /** width multiplier */
      const wm = 1.1;

      /** height multipler */
      const hm = 1;

      const productCode = sanitize(this.productCode);
      const brand = sanitize(this.brand);
      const description = sanitize(this.description);
      const itemSize = sanitize(this.itemSize);
      const isWeighed = this.isWeighed ? true : false;
      const price = this.price;

      const { units, unitCount, unitCost } = computeUnitCost({
        itemSize,
        price,
        isWeighed,
      });

      const priceText = `${price.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}${isWeighed ? "/LB" : ""}`;

      const itemSizeText = `${unitCount} ${units}`;
      const unitCostText = `${unitCost.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}/${units}`;

      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");

      const deriveMetrics = (value, maxWidth, maxFontSize) => {
        ctx.save();
        const max = maxFontSize || 72;
        const min = 42;
        let fontSize = max;
        let metrics;
        for (;;) {
          // for measurement purposes, replace characters that hang below the line
          // with characters of equivalent width.
          const testValue = value
            .replace(/[gqp]/g, "d")
            .replace(/[y]/g, "v")
            .replace(/[j]/g, "i");
          ctx.font = this.createFont(fontSize);
          metrics = ctx.measureText(testValue);
          if (metrics.width * wm <= maxWidth || fontSize <= min) break;
          fontSize -= 2;
        }

        ctx.restore();

        console.log({ value, metrics });

        const width = metrics.width;
        const height =
          metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        return {
          fontSize,
          width: width * wm,
          height: height * hm,
        };
      };

      const metrics = {
        productCode: {
          maxFontSize: 40,
          maxWidth: this.vr2 - this.hm * 2,
        },
        brand: {
          maxWidth: this.vr2 - this.hm * 2,
        },
        description: {
          maxWidth: this.width - this.hm * 2,
        },
        priceText: {
          maxWidth: this.width - this.vr2 - this.hm * 2,
        },
        itemSizeText: {
          maxFontSize: 54,
          maxWidth: this.width - this.vr2 - this.hm * 2,
        },
        unitCostText: {
          maxFontSize: 54,
          maxWidth: this.width - this.vr2 - this.hm * 2,
        },
      };

      const result = {
        productCode,
        brand,
        description,
        itemSize,
        itemSizeText,
        price,
        priceText,
        isWeighed,
        units,
        unitCount,
        unitCost,
        unitCostText,
        metrics,
        canvas,
        ctx,
      };

      Object.keys(metrics).forEach((key) => {
        const v = result[key];
        const m = metrics[key];
        const d = deriveMetrics(v, m.maxWidth, m.maxFontSize);
        Object.assign(m, d);
      });

      // if brand has overflown max width, split into two lines.
      if (metrics.brand.width > metrics.brand.maxWidth) {
        const segments = brand.split(" ");
        let brand1 = "";
        let brand2 = brand;
        let lastGap = 0 - ctx.measureText(brand2).width;
        let longerValue = brand;
        // split brand into two lines of approximately equal length
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
        result.brand = `${brand1}\n${brand2}`;
        const derived = deriveMetrics(longerValue, metrics.brand.maxWidth, 56);
        Object.assign(metrics.brand, derived);
        metrics.brand.height = metrics.brand.height * 2.3;
      }

      metrics.productCode.top = Math.round(
        this.hr1 - this.vr1gap - metrics.productCode.height
      );

      metrics.brand.top = Math.round(
        this.hr1 + (this.hr2 - this.hr1 - metrics.brand.height) / 2
      );

      metrics.priceText.top = Math.round(
        this.hr1 + (this.hr2 - this.hr1 - metrics.priceText.height) / 2
      );

      metrics.description.top = Math.round(this.hr2 + this.vr2gap);

      metrics.unitCostText.top = Math.round(
        this.hr1 - this.vr1gap - metrics.unitCostText.height
      );

      metrics.itemSizeText.top = Math.round(
        this.hr1 -
          this.vr1gap -
          metrics.unitCostText.height -
          this.vr1gap -
          metrics.itemSizeText.height
      );

      console.log(result);
      return result;
    },
    computeZpl() {
      const {
        productCode,
        brand,
        description,
        itemSizeText,
        unitCostText,
        priceText,
        metrics,
      } = this.computeValues();

      const value = `^XA
^CI28

^PW${this.width}
^LL${this.height}

^FX vertical lines ^FS
^FO${this.vr2},${this.hr1 + this.vr2gap}^GB${this.lineWidth},${
        this.hr2 - this.hr1 - this.vr2gap * 2
      },3^FS

^FX horizontal lines ^FS
^FO0,${this.hr1}^GB${this.width},${this.lineWidth},${this.lineWidth}^FS
^FO0,${this.hr2}^GB${this.width},${this.lineWidth},${this.lineWidth}^FS

^FX barcode ^FS
^FO${this.hm},0
^BY3
^BCN,90,N,,,A
^FD${productCode}
^FS

^FX product code ^FS
^FO0,${metrics.productCode.top}
^FB${this.vr2},2,,C,
^A0,${metrics.productCode.fontSize}
^FD${productCode}\\&
^FS

^FX item size ^FS
^FO${this.vr2},${metrics.itemSizeText.top}
^FB${this.width - this.vr2 - this.hm},2,,R,
^A0,${metrics.itemSizeText.fontSize}
^FD${itemSizeText}\\&
^FS

^FX unit cost ^FS
^FO${this.vr2},${metrics.unitCostText.top}
^FB${this.width - this.vr2 - this.hm},2,,R,
^A0,${metrics.unitCostText.fontSize}
^FD${unitCostText}\\&
^FS

^FX price ^FS
^FO${this.vr2},${metrics.priceText.top}
^FB${this.width - this.vr2 - this.hm},2,,R,
^A0,${metrics.priceText.fontSize}
^FD${priceText}\\&
^FS

^FX text1 ^FS
^FO0,${metrics.brand.top}
^FB${this.vr2},2,,C,
^A0,${metrics.brand.fontSize}
^FD${brand.replace("\n", "\\&")}\\&
^FS

^FX text2 ^FS
^FO0,${metrics.description.top}
^FB${this.width},2,,C,
^A0,${metrics.description.fontSize}
^FD${description}\\&
^FS

^XZ`;
      this.$emit("zpl", value);
      return value;
    },
    drawTag() {
      const {
        productCode,
        brand,
        description,
        priceText,
        itemSizeText,
        unitCostText,
        metrics,
        ctx,
        canvas,
      } = this.computeValues();

      ctx.save();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // set line stroke and line width
      ctx.strokeStyle = "black";
      ctx.lineWidth = this.lineWidth;

      ctx.beginPath();
      ctx.moveTo(0, this.hr1);
      ctx.lineTo(this.width, this.hr1);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, this.hr2);
      ctx.lineTo(this.width, this.hr2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.vr2, this.hr1 + this.vr2gap);
      ctx.lineTo(this.vr2, this.hr2 - this.vr2gap);
      ctx.stroke();

      // PRODUCT CODE

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.productCode.fontSize);
      ctx.fillText(productCode, this.vr2 / 2, metrics.productCode.top);

      // ITEM SIZE

      ctx.textBaseline = "top";
      ctx.textAlign = "right";

      ctx.font = this.createFont(metrics.itemSizeText.fontSize);
      ctx.fillText(
        itemSizeText,
        this.width - this.hm,
        metrics.itemSizeText.top
      );

      // UNIT COST

      ctx.textBaseline = "top";
      ctx.textAlign = "right";

      ctx.font = this.createFont(metrics.unitCostText.fontSize);
      ctx.fillText(
        unitCostText,
        this.width - this.hm,
        metrics.unitCostText.top
      );

      // PRICE

      ctx.textBaseline = "top";
      ctx.textAlign = "right";

      ctx.font = this.createFont(metrics.priceText.fontSize);
      ctx.fillText(priceText, this.width - this.hm, metrics.priceText.top);

      // BRAND

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      const brandLines = brand.split("\n");
      if (brandLines.length > 1) {
        ctx.font = this.createFont(metrics.brand.fontSize);
        ctx.fillText(brandLines[0], this.vr2 / 2, metrics.brand.top);
        ctx.fillText(
          brandLines[1],
          this.vr2 / 2,
          metrics.brand.top + metrics.brand.height / 2
        );
      } else {
        ctx.font = this.createFont(metrics.brand.fontSize);
        ctx.fillText(brand, this.vr2 / 2, metrics.brand.top);
      }

      // DESCRIPTION

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.description.fontSize);
      ctx.fillText(description, this.width / 2, metrics.description.top);

      ctx.restore();
    },
  },
};
</script>
