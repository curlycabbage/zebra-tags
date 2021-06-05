<template>
  <div class="item-tag">
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
    <img
      v-if="isOrganic"
      src="../assets/organicSealColor.svg"
      class="organic-seal"
      ref="seal"
    />
  </div>
</template>

<style lang="css" scoped>
.item-tag {
  position: relative;
}

.canvas {
  height: 4.5in;
  width: 3.25in;
  display: block;
}

.image {
  height: 4.5in;
  width: 3.25in;
  display: block;
  object-fit: contain;
}

.organic-seal {
  position: absolute;
  left: 5%;
  bottom: 4%;
  height: 15%;
}
</style>

<script>
import bwipjs from "bwip-js";

import {
  computeUnitCost,
  sanitize,
  formatProductCode,
  getBlankImage,
  gr,
} from "./utils";

export default {
  name: "ItemTag325x450",
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

      const { units, unitCount, unitCost } = computeUnitCost({
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
        }) + (isWeighed ? "/lb" : "");

      const itemSizeText =
        !itemSize || isWeighed ? "" : `${unitCount} ${units}`;

      const unitCostText =
        !itemSize && !isWeighed
          ? ""
          : `${unitCost.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}/${units}`;

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
          maxFontSize: 96,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        description: {
          maxFontSize: 96,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        retailPriceText: {
          maxFontSize: 84,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        itemSizeText: {
          maxFontSize: 72,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        unitCostText: {
          maxFontSize: 72,
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
        itemSize,
        itemSizeText,
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
        const d = deriveMetrics(v, m);
        Object.assign(m, d);
      });

      let offset = dpi.hr1 + dpi.vm;

      const lineHeight = metrics.description.height;

      metrics.description.top =
        this.dpi.height / gr - metrics.description.height;
      offset = metrics.description.top;

      if (brandName) {
        metrics.brandName.top = offset - lineHeight * 4;
      }

      if (itemSizeText) {
        metrics.itemSizeText.top = offset + lineHeight * 1.5;
      }

      metrics.retailPriceText.top = offset + lineHeight * 4;

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
        itemSizeText,
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

      ctx.font = this.createFont(metrics.description.fontSize);
      ctx.fillText(description, center, metrics.description.top);

      // ITEM SIZE

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.itemSizeText.fontSize);
      ctx.fillText(itemSizeText, center, metrics.itemSizeText.top);

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
        (this.dpi.width - barcode.width) / 2,
        this.dpi.height - barcode.height
      );

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.productCodeText.fontSize);
      ctx.fillText(
        productCodeText,
        center,
        this.dpi.height - barcode.height - metrics.productCodeText.height * 1.5
      );

      // AND DONE.

      ctx.restore();
      this.src = canvas.toDataURL();
    },
  },
};
</script>
