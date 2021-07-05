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
    <OrganicSeal v-show="false" :color="true" ref="seal" />
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
  name: "SaleTag325x450",
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
    width: { type: Number, default: 3 },
    height: { type: Number, default: 5 },
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
        vm.width,
        vm.height,
      ],
      () => {
        this.drawTagAsync();
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
        width: this.width,
        height: this.height,
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

      let offset = dpi.hr1 + dpi.vm;
      metrics.salesText.top = offset;
      offset += metrics.salesText.height;

      offset += metrics.percentOffText.height * 0.3;
      metrics.percentOffText.top = offset;
      offset += metrics.percentOffText.height * 0.9;

      const lineHeight = metrics.description.height;

      offset += lineHeight * 1.4;
      if (brandName) {
        metrics.brandName.top = offset;
      }

      offset += lineHeight * 1.4;
      metrics.description.top = offset;

      offset += lineHeight * 1.4;
      if (itemSizeText) {
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
    async drawTagAsync() {
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
        productCode,
        productCodeText,
        isOrganic,
        metrics,
        ctx,
        canvas,
      } = this.computeValues();

      const { dpi } = this;
      const center = dpi.width / 2;

      ctx.save();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // set line stroke and line width
      ctx.strokeStyle = "black";
      ctx.lineWidth = this.lineWidth;

      // PUNCH HOLE

      ctx.beginPath();
      ctx.arc(center, dpi.hr1 / 4, dpi.hr1 / 10, 0, Math.PI * 2, true); // Outer circle
      ctx.stroke();

      // CREASE LINE

      ctx.beginPath();
      ctx.moveTo(0, dpi.hr1);
      ctx.lineTo(dpi.width, dpi.hr1);
      ctx.stroke();

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

      // FOOTER WITH BARCODE, PRODUCT CODE AND SEAL

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
        dpi.width - barcode.width - dpi.vm,
        dpi.height - barcode.height * 2
      );

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.productCodeText.fontSize);
      ctx.fillText(
        productCodeText,
        dpi.width - barcode.width / 2 - dpi.vm,
        dpi.height - barcode.height * 2 - metrics.productCodeText.height * 1.5
      );

      if (isOrganic) {
        const svgNode = this.$refs.seal.$refs.svg;
        const svgXml = new XMLSerializer().serializeToString(svgNode);
        const svg64 = btoa(svgXml);
        const b64Start = "data:image/svg+xml;base64,";
        const image64 = b64Start + svg64;

        const image = new Image();
        const height = 140;
        await this.loadImageAsync(image, image64);
        ctx.drawImage(
          image,
          dpi.vm,
          dpi.height - dpi.hm - height,
          height,
          height
        );
      }

      // AND DONE.

      ctx.restore();

      this.src = canvas.toDataURL();
      canvas.toBlob((blob) => {
        this.$emit("blob", blob);
      });
    },
    loadImageAsync(image, src) {
      image.src = src;
      return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
      });
    },
  },
};
</script>
