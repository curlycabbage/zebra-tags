<template>
  <div style="position: relative">
    <canvas
      v-show="mode === 'canvas'"
      ref="canvas"
      :style="{
        display: 'block',
        height: `${inch.height * scale}in`,
        width: `${inch.width * scale}in`,
        'background-color': backgroundColor,
      }"
      :width="dpi.width"
      :height="dpi.height"
    />
    <img
      v-show="mode === 'image'"
      ref="image"
      :src="src"
      :style="{
        display: 'block',
        'object-fit': 'contain',
        height: `${inch.height * scale}in`,
        width: `${inch.width * scale}in`,
        'background-color': backgroundColor,
      }"
    />
    <OrganicSeal
      v-if="isOrganic"
      :color="true"
      ref="seal"
      :style="{
        position: 'absolute',
        left: `${0.15 * scale}in`,
        bottom: `${0.15 * scale}in`,
        height: `${0.6 * scale}in`,
        width: `${0.6 * scale}in`,
      }"
    />
  </div>
</template>

<script>
import bwipjs from "bwip-js";
import OrganicSeal from "./OrganicSeal";

import {
  computeUnitCost,
  sanitize,
  formatProductCode,
  getBlankImage,
  gr,
} from "./utils";

export default {
  name: "ItemTag325x450",
  components: {
    OrganicSeal,
  },
  props: {
    productCode: String,
    brandName: String,
    description: String,
    itemSize: String,
    retailPrice: Number,
    salePrice: Number,
    percentOff: { type: Number, default: 0 },
    isWeighed: Boolean,
    isTaxed: Boolean,
    isOrganic: Boolean,
    /** dots per millimeter, only 12 works at the moment. */
    dpmm: { type: Number, default: 12 },
    /** canvas or labelary, only canvas implemented at the moment */
    mode: { type: String, default: "canvas" },
    backgroundColor: String,
    scale: { type: Number, default: 1 },
  },
  data() {
    return {
      src: getBlankImage(),
    };
  },
  mounted() {
    this.$watch(
      (vm) => [
        vm.productCode,
        vm.brandName,
        vm.description,
        vm.itemSize,
        vm.retailPrice,
        vm.salePrice,
        vm.percentOff,
        vm.isWeighed,
        vm.isTaxed,
        vm.isOrganic,
        vm.dpmm,
        vm.lineWidth,
        vm.backgroundColor,
      ],
      () => {
        this.drawTag();
      },
      {
        immediate: true,
        deep: true,
      }
    );
  },
  computed: {
    /** measurements in inches. */
    inch() {
      return {
        width: 3.25,
        height: 4.5,
        hr1: 1.25,
        hm: 0.25,
        vm: 0.3,
      };
    },

    /** measurements in dots per inch. */
    dpi() {
      const dotsPerInch = this.dpmm * 25.4;
      const lineWidth = 3;
      const result = { dotsPerInch, lineWidth };
      Object.keys(this.inch).forEach((key) => {
        result[key] = this.inch[key] * dotsPerInch;
      });
      return result;
    },

    computedValues() {
      /** width multiplier */
      const wx = 1.1;

      /** height multipler */
      const hx = 1;

      /** measurements in dots per inch. */
      const { dpi } = this;

      const productCode = sanitize(this.productCode);
      const brandName = sanitize(this.brandName);
      const description = sanitize(this.description);
      const itemSize = sanitize(this.itemSize);
      const isWeighed = this.isWeighed ? true : false;
      const isTaxed = this.isTaxed ? true : false;
      const isOrganic = this.isOrganic ? true : false;
      const retailPrice = this.retailPrice || 0;

      const { units, unitCount } = computeUnitCost({
        itemSize,
        price: retailPrice,
        isWeighed,
      });

      const retailPriceText =
        retailPrice.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + (isWeighed ? "/lb" : "/ea");

      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");

      const productCodeText = formatProductCode(productCode);

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
        brandName: {
          maxFontSize: 156,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        description: {
          minFontSize: 108,
          maxFontSize: 156,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        retailPriceText: {
          maxFontSize: 84,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        productCodeText: {
          maxFontSize: 36,
          maxWidth: dpi.width - dpi.hm * 2,
        },
      };

      const result = {
        brandName,
        description,
        retailPrice,
        retailPriceText,
        isWeighed,
        isTaxed,
        isOrganic,
        productCode,
        productCodeText,
        units,
        unitCount,
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

      // if description has overflown max width, split into two lines.
      if (metrics.description.width > metrics.description.maxWidth) {
        const segments = description.split(" ");
        let value1 = "";
        let value2 = description;
        let lastGap = 0 - ctx.measureText(value2).width;
        let longerValue = description;
        // split description into two lines of approximately equal length
        for (let i = 0, n = segments.length; i < n; i++) {
          value1 = segments.slice(0, i + 1).join(" ");
          value2 = segments.slice(i + 1).join(" ");
          const m1 = ctx.measureText(value1);
          const m2 = ctx.measureText(value2);
          const currGap = m1.width - m2.width;
          if (currGap > 0) {
            longerValue = value1;
            if (Math.abs(currGap) > Math.abs(lastGap)) {
              value1 = segments.slice(0, i).join(" ");
              value2 = segments.slice(i).join(" ");
              longerValue = value2;
            }
            break;
          }
          lastGap = currGap;
        }
        result.description = `${value1}\n${value2}`;
        const derived = deriveMetrics(longerValue, {
          maxWidth: metrics.description.maxWidth,
          maxFontSize: metrics.description.minFontSize,
          minFontSize: metrics.description.minFontSize,
        });
        Object.assign(metrics.description, derived);
      }

      const lineHeight = (dpi.height - dpi.hr1) / 12;
      let anchor = dpi.height - (dpi.height - dpi.hr1) / gr;

      metrics.description.top = anchor; // - metrics.description.height / 2;

      if (brandName) {
        metrics.brandName.top = anchor - lineHeight * 3;
      }

      metrics.retailPriceText.top = anchor + lineHeight * 3.5;

      metrics.productCodeText.top =
        dpi.height - metrics.productCodeText.height * gr ** 2;

      return result;
    },
  },
  methods: {
    createFont(fontSize, italic) {
      const italicText = italic ? "italic " : "";
      return `${italicText}600 condensed ${fontSize}px sans-serif-condensed, sans-serif`;
    },
    drawTag() {
      const {
        brandName,
        description,
        retailPriceText,
        productCode,
        productCodeText,
        metrics,
        ctx,
        canvas,
      } = this.computedValues;

      const { dpi } = this;

      ctx.save();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // set line stroke and line width
      ctx.strokeStyle = "black";
      ctx.lineWidth = this.lineWidth;

      ctx.beginPath();
      ctx.moveTo(0, dpi.hr1);
      ctx.lineTo(dpi.width, dpi.hr1);
      ctx.stroke();

      const center = dpi.width / 2;

      // BRAND

      if (brandName) {
        ctx.textBaseline = "top";
        ctx.textAlign = "center";

        ctx.font = this.createFont(metrics.brandName.fontSize);
        ctx.fillText(brandName, center, metrics.brandName.top);
      }

      // DESCRIPTION

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      const descLines = description.split("\n");
      if (descLines.length > 1) {
        ctx.font = this.createFont(metrics.description.fontSize);
        ctx.fillText(descLines[0], center, metrics.description.top);
        ctx.fillText(
          descLines[1],
          center,
          metrics.description.top + metrics.description.height * 1.5
        );
      } else {
        ctx.font = this.createFont(metrics.description.fontSize);
        ctx.fillText(description, center, metrics.description.top);
      }

      // RETAIL PRICE

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.retailPriceText.fontSize);
      ctx.fillText(retailPriceText, center, metrics.retailPriceText.top);

      // PRODUCT CODE

      const barcode = document.createElement("canvas");
      bwipjs.toCanvas(barcode, {
        bcid: "code128", // Barcode type
        text: productCode, // Text to encode
        scale: 3, // 3x scaling factor
        height: 10, // Bar height, in millimeters
        includetext: false, // Show human-readable text
        textxalign: "center", // Always good to set this
      });

      ctx.drawImage(
        barcode,
        this.dpi.width - barcode.width - this.dpi.vm / 2,
        this.dpi.height - barcode.height * 2
      );

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.productCodeText.fontSize);
      ctx.fillText(
        productCodeText,
        this.dpi.width - barcode.width / 2 - this.dpi.vm / 2,
        this.dpi.height -
          barcode.height * 2 -
          metrics.productCodeText.height * 1.5
      );

      ctx.beginPath();
      ctx.arc(
        center,
        this.dpi.hr1 / 4,
        this.dpi.hr1 / 10,
        0,
        Math.PI * 2,
        true
      ); // Outer circle
      ctx.stroke();

      // AND DONE.

      ctx.restore();
      this.src = canvas.toDataURL();
    },
  },
};
</script>
