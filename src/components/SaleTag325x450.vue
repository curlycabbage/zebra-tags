<template>
  <div>
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
  </div>
</template>

<style lang="css" scoped>
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
</style>

<script>
import {
  computeUnitCost,
  sanitize,
  formatProductCode,
  getBlankImage,
  gr,
} from "./utils";

export default {
  name: "SaleTag325x450",
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
  },
  methods: {
    createFont(fontSize, italic) {
      const italicText = italic ? "italic " : "";
      return `${italicText}600 condensed ${fontSize}px sans-serif-condensed, sans-serif`;
    },
    computeValues() {
      /** width multiplier */
      const wx = 1.1;

      /** height multipler */
      const hx = 1;

      /** measurements in dots per inch. */
      const { dpi } = this;

      const salesText = "SALE";
      const lowerPriceText = "new low price";
      const productCode = sanitize(this.productCode);
      const brandName = sanitize(this.brandName);
      const description = sanitize(this.description);
      const itemSize = sanitize(this.itemSize);
      const isWeighed = this.isWeighed ? true : false;
      const isTaxed = this.isTaxed ? true : false;
      const isOrganic = this.isOrganic ? true : false;
      const retailPrice = this.retailPrice || 0;
      const salePrice = this.salePrice || retailPrice;
      const savings = retailPrice - salePrice;
      const percentOff = this.percentOff || (100 * savings) / retailPrice;

      const { units, unitCount, unitCost } = computeUnitCost({
        itemSize,
        price: retailPrice,
        isWeighed,
      });

      const retailPriceText = `was ${retailPrice.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

      const salePriceText = `${salePrice.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}/${isWeighed ? "lb" : "ea"}`;

      const percentOffText = `${(percentOff / 100).toLocaleString("en-US", {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} OFF`;

      const savingsText = `SAVE ${savings.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

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
        salesText: {
          maxFontSize: 120,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        percentOffText: {
          maxFontSize: 120,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        brandName: {
          maxFontSize: 56,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        description: {
          maxFontSize: 56,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        retailPriceText: {
          maxFontSize: 56,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        itemSizeText: {
          maxFontSize: 42,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        lowerPriceText: {
          maxFontSize: 56,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        salePriceText: {
          maxFontSize: 96,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        savingsText: {
          maxFontSize: 120,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        unitCostText: {
          maxFontSize: 48,
          maxWidth: dpi.width - dpi.hm * 2,
        },
        productCodeText: {
          maxFontSize: 36,
          maxWidth: dpi.width - dpi.hm * 2,
        },
      };

      const result = {
        salesText,
        percentOff,
        percentOffText,
        brandName,
        description,
        retailPrice,
        retailPriceText,
        lowerPriceText,
        salePrice,
        salePriceText,
        savings,
        savingsText,
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

      // if brandName has overflown max width, split into two lines.
      if (metrics.brandName.width > metrics.brandName.maxWidth) {
        const segments = brandName.split(" ");
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
        const derived = deriveMetrics(longerValue, {
          maxWidth: metrics.brandName.maxWidth,
          maxFontSize: 56,
          minFontSize: metrics.brandName.minFontSize,
        });
        Object.assign(metrics.brandName, derived);
        metrics.brandName.height = metrics.brandName.height * 2.3;
      }

      let offset = dpi.hr1 + dpi.vm;
      metrics.salesText.top = offset;
      offset += metrics.salesText.height;

      offset += metrics.percentOffText.height * 0.3;
      metrics.percentOffText.top = offset;
      offset += metrics.percentOffText.height * 0.9;

      const lineHeight = metrics.description.height;

      if (brandName) {
        offset += lineHeight * 1.4;
        metrics.brandName.top = offset;
      }

      offset += lineHeight * 1.4;
      metrics.description.top = offset;

      if (itemSizeText) {
        offset += lineHeight * 1.4;
        metrics.itemSizeText.top = offset;
      }

      offset += lineHeight * 1.8;
      metrics.retailPriceText.top = offset;

      offset += lineHeight * 1.4;
      metrics.lowerPriceText.top = offset;

      offset += lineHeight * 2.0;
      metrics.salePriceText.top = offset;

      offset += metrics.salePriceText.height * 1.5;
      metrics.savingsText.top = offset;

      metrics.productCodeText.top =
        dpi.height - metrics.productCodeText.height * gr ** 2;

      return result;
    },
    drawTag() {
      const {
        salesText,
        percentOffText,
        brandName,
        description,
        itemSizeText,
        retailPriceText,
        lowerPriceText,
        salePriceText,
        savingsText,
        productCodeText,
        metrics,
        ctx,
        canvas,
      } = this.computeValues();

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

      // SALE

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.salesText.fontSize);
      ctx.fillText(salesText, center, metrics.salesText.top);

      // PERCENT OFF

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.percentOffText.fontSize);
      ctx.fillText(percentOffText, center, metrics.percentOffText.top);

      // BRAND

      if (brandName) {
        ctx.textBaseline = "top";
        ctx.textAlign = "center";

        const brandLines = brandName.split("\n");
        if (brandLines.length > 1) {
          ctx.font = this.createFont(metrics.brandName.fontSize);

          let top = metrics.brandName.top;
          ctx.fillText(brandLines[0], center, top);

          top += metrics.brandName.height / 2;
          ctx.fillText(brandLines[1], center, top);
        } else {
          ctx.font = this.createFont(metrics.brandName.fontSize);
          ctx.fillText(brandName, center, metrics.brandName.top);
        }
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

      // NEW LOW PRICE

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.lowerPriceText.fontSize, true);
      ctx.fillText(lowerPriceText, center, metrics.lowerPriceText.top);

      // SALES TEXT

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.salePriceText.fontSize, true);
      ctx.fillText(salePriceText, center, metrics.salePriceText.top);

      // SAVINGS TEXT

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.savingsText.fontSize);
      ctx.fillText(savingsText, center, metrics.savingsText.top);

      ctx.restore();

      // PRODUCT CODE

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.productCodeText.fontSize);
      ctx.fillText(productCodeText, center, metrics.productCodeText.top);

      ctx.restore();

      this.src = canvas.toDataURL();
    },
  },
};
</script>
