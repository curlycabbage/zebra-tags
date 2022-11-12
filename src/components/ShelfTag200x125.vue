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
    <ImageTag200x125
      v-show="mode === 'labelary'"
      :src="src"
      :style="backgroundColor ? `background-color: ${backgroundColor}` : ''"
    />
  </div>
</template>

<style lang="css" scoped>
@import url("https://fonts.googleapis.com/css2?family=Oswald:wght@600&display=swap");

.canvas {
  height: 1.27in;
  width: 2in;
  display: block;
}
</style>

<script>
import ImageTag200x125 from "./ImageTag200x125.vue";
import {
  computeUnitCost,
  formatProductCode,
  getBlankImage,
  sanitize,
  fetchLabelaryImage,
  goldenRatio,
} from "./utils";

export default {
  name: "ShelfTag200x125",
  components: { ImageTag200x125 },
  props: {
    productCode: String,
    brandName: String,
    description: String,
    countryOfOrigin: String,
    itemSize: String,
    quantity: { type: Number, default: 1 },
    retailPrice: Number,
    isWeighed: Boolean,
    isTaxed: Boolean,
    isOrganic: Boolean,
    perOunce: Boolean,
    shelf: String,
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
        height: 1.27,
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
        vm.countryOfOrigin,
        vm.itemSize,
        vm.quantity,
        vm.retailPrice,
        vm.isWeighed,
        vm.isTaxed,
        vm.isOrganic,
        vm.perOunce,
        vm.dpmm,
        vm.lineWidth,
        vm.backgroundColor,
        vm.mode,
        vm.shelf,
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
      return Math.round((40 / 96) * this.dpi);
    },

    /** horizontal rule 2 */
    hr2() {
      return Math.round((80 / 96) * this.dpi);
    },

    /** vertical rule 2 */
    vr2() {
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
    vr1gap() {
      const h = this.hr1;
      return Math.round(h / goldenRatio ** 7);
    },

    /** size of vertical gap used between lines */
    linegap() {
      const h = this.hr1;
      return Math.round(h / goldenRatio ** 10);
    },

    /** size of vertical gap used between first and second lines */
    vr2gap() {
      const h = this.hr2 - this.hr1;
      return Math.round((h - h / goldenRatio) / 2);
    },

    /** size of vertical gap used below the second line */
    vr3gap() {
      return Math.round((this.inch.height / goldenRatio ** 6) * this.dpi);
    },
    computedValues() {
      /** width multiplier */
      const wx = 1.05;

      /** height multipler */
      const hx = 1;

      const productCode = sanitize(this.productCode);
      const brandName = sanitize(this.brandName);
      const description = sanitize(this.description);
      const countryOfOrigin = sanitize(this.countryOfOrigin);
      const itemSize = sanitize(this.itemSize);
      const quantity = this.quantity || 1;
      const shelf = sanitize(this.shelf);
      const isWeighed = this.isWeighed ? true : false;
      const isTaxed = this.isTaxed ? true : false;
      const isOrganic = this.isOrganic ? true : false;
      const retailPrice = this.retailPrice;
      const perOunce = this.perOunce;

      const productCodeText = formatProductCode(productCode);

      const { units, unitCount, unitCost } = computeUnitCost({
        itemSize,
        price: retailPrice,
        isWeighed,
        perOunce,
      });

      const displayPrice =
        isWeighed && perOunce ? retailPrice / 16 : retailPrice;
      const retailPriceText = displayPrice.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const itemSizeText =
        !itemSize || isWeighed
          ? ""
          : quantity > 1
          ? `${quantity}/${unitCount} ${units}`
          : `${unitCount} ${units}`;

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
          maxWidth: this.vr2 - this.hm * 2,
        },
        shelf: {
          maxFontSize: 40,
          maxWidth: this.width - this.vr2 - this.hm * 2,
        },
        brandName: {
          minFontSize: 50,
          maxWidth: this.vr2 - this.hm * 2,
        },
        description: {
          maxWidth: this.width - this.hm * 2,
        },
        countryOfOrigin: {
          minFontSize: 36,
          maxFontSize: 36,
          maxWidth: this.width - this.hm * 2,
        },
        retailPriceText: {
          maxWidth: this.width - this.vr2 - this.hm * 2,
        },
        itemSizeText: {
          maxFontSize: 48,
          maxWidth: this.width - this.vr2 - this.hm * 2,
        },
        unitCostText: {
          maxFontSize: 48,
          maxWidth: this.width - this.vr2 - this.hm * 2,
        },
      };

      const result = {
        productCode,
        productCodeText,
        brandName,
        description,
        countryOfOrigin,
        itemSize,
        itemSizeText,
        retailPrice,
        retailPriceText,
        shelf,
        isWeighed,
        isTaxed,
        isOrganic,
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
        const derived = deriveMetrics(longerValue, {
          maxWidth: metrics.brandName.maxWidth,
          maxFontSize: 56,
          minFontSize: metrics.brandName.minFontSize,
        });
        Object.assign(metrics.brandName, derived);
        metrics.brandName.height = metrics.brandName.height * 2.3;
      }

      metrics.productCodeText.top = Math.round(
        this.hr1 - this.vr1gap - metrics.productCodeText.height
      );

      metrics.shelf.top = this.vm / 2;

      metrics.brandName.top = Math.round(
        this.hr1 + (this.hr2 - this.hr1 - metrics.brandName.height) / 2
      );

      metrics.retailPriceText.top = Math.round(
        this.hr1 + (this.hr2 - this.hr1 - metrics.retailPriceText.height) / 2
      );

      metrics.description.top = Math.round(this.hr2 + this.vr3gap);
      metrics.countryOfOrigin.top = Math.round(
        this.height - metrics.countryOfOrigin.height - Math.round(this.vm / 2)
      );

      metrics.unitCostText.top = Math.round(
        this.hr1 - this.vr1gap - metrics.unitCostText.height
      );

      metrics.itemSizeText.top = Math.round(
        this.hr1 -
          this.vr1gap -
          metrics.unitCostText.height -
          this.linegap -
          metrics.itemSizeText.height
      );

      if (isTaxed || isWeighed) {
        result.retailPriceSubtext = `${
          isWeighed ? (perOunce ? "/OZ" : "/LB") : ""
        }${isTaxed ? "+TX" : ""}`;
        metrics.retailPriceSubtext = {
          fontSize: 28,
          top:
            metrics.retailPriceText.top +
            metrics.retailPriceText.height +
            (this.hr2 - this.hr1) / goldenRatio ** 7,
        };
      }

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
      const {
        productCode,
        productCodeText,
        brandName,
        description,
        countryOfOrigin,
        itemSizeText,
        unitCostText,
        retailPriceText,
        retailPriceSubtext,
        shelf,
        isOrganic,
        metrics,
      } = this.computedValues;

      const { r, g, b } = this.computeRbg();
      const backgroundZpl = `~BR0,0,${this.width},${this.height},${r},${g},${b}`;

      const isOrganicZpl = !isOrganic
        ? ""
        : `
^FO${this.vr2 - 25},${this.hr1 - 60}
^GFA,350,350,7,K07FC,J07IF8,I03F003F,I0F8I07C,001CK0E,0078K078,00EL01C,01CM0E,038M07,
07N038,06N018,0CO0C,1CO0E,180CCE7C3006,300CDB7E3803,300CDB667803,300CDC667803,
600CCEI68018,600CC7I6C018,600CD366FC018,C00CDB76EC00C,C0079F7ECC00C,C00104L0C,CQ0C,
:DPFEC,CPFCC,:CF842189287CC,4FA42088093CC,6F20278829FD8,6F04212821FD8,6324210029398,
37842001083B,338DA0212C73,33OF3,19NFE6,1DNFEE,0CF7LFCC,063MF98,073KFBF38,039LFE7,
01CLFCE,00E3EJF1C,0078JFC78,001C3IF0E,I0F80407C,I03F003F,J07IF8,K0FF8,
^FS`;

      const retailPriceSubtextZpl = !retailPriceSubtext
        ? ""
        : `
^FX isTaxed ^FS
^FO${this.vr2},${metrics.retailPriceSubtext.top}
^FB${this.width - this.vr2 - this.hm},2,,R,
^A0,${metrics.retailPriceSubtext.fontSize}
^FD${retailPriceSubtext}\\&
^FS`;

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
^BCN,${metrics.productCodeText.top - Math.round(this.vm / 2)},N,,,A
^FD${productCode}
^FS

^FX product code ^FS
^FO${this.hm},${metrics.productCodeText.top}
^FB${this.vr2},2,,L,
^A0,${metrics.productCodeText.fontSize}
^FD${productCodeText}\\&
^FS

^FX shelf ^FS
^FO${this.vr2},${metrics.shelf.top}
^FB${this.width - this.vr2 - this.hm},2,,R,
^A0,${metrics.shelf.fontSize}
^FD${shelf}\\&
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

^FX retailPrice ^FS
^FO${this.vr2},${metrics.retailPriceText.top}
^FB${this.width - this.vr2 - this.hm},2,,R,
^A0,${metrics.retailPriceText.fontSize}
^FD${retailPriceText}\\&
^FS

${retailPriceSubtextZpl}

^FX text1 ^FS
^FO0,${metrics.brandName.top}
^FB${this.vr2},2,,C,
^A0,${metrics.brandName.fontSize}
^FD${brandName.replace("\n", "\\&")}\\&
^FS

^FX text2 ^FS
^FO0,${metrics.description.top}
^FB${this.width},2,,C,
^A0,${metrics.description.fontSize}
^FD${description}\\&
^FS

^FX text2 ^FS
^FO0,${metrics.countryOfOrigin.top}
^FB${this.width},2,,C,
^A0,${metrics.countryOfOrigin.fontSize}
^FD${countryOfOrigin}\\&
^FS

${isOrganicZpl}

${backgroundZpl}

^XZ`;
      this.zpl = value;
      this.$emit("zpl", value);
    },
    drawTag() {
      const {
        productCodeText,
        brandName,
        description,
        countryOfOrigin,
        retailPriceText,
        itemSizeText,
        unitCostText,
        isTaxedText,
        shelf,
        metrics,
        ctx,
        canvas,
      } = this.computedValues;

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

      ctx.font = this.createFont(metrics.productCodeText.fontSize);
      ctx.fillText(productCodeText, this.vr2 / 2, metrics.productCodeText.top);

      // LOCATION

      ctx.textBaseline = "top";
      ctx.textAlign = "right";

      ctx.font = this.createFont(metrics.shelf.fontSize);
      ctx.fillText(shelf, this.width - this.hm, metrics.shelf.top);

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

      // retailPrice

      ctx.textBaseline = "top";
      ctx.textAlign = "right";

      ctx.font = this.createFont(metrics.retailPriceText.fontSize);
      ctx.fillText(
        retailPriceText,
        this.width - this.hm,
        metrics.retailPriceText.top
      );

      // TAX

      if (isTaxedText) {
        ctx.textBaseline = "top";
        ctx.textAlign = "right";

        ctx.font = this.createFont(metrics.isTaxedText.fontSize);
        ctx.fillText(
          isTaxedText,
          this.width - this.hm,
          metrics.isTaxedText.top
        );
      }

      // BRAND

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      const brandLines = brandName.split("\n");
      if (brandLines.length > 1) {
        ctx.font = this.createFont(metrics.brandName.fontSize);
        ctx.fillText(brandLines[0], this.vr2 / 2, metrics.brandName.top);
        ctx.fillText(
          brandLines[1],
          this.vr2 / 2,
          metrics.brandName.top + metrics.brandName.height / 2
        );
      } else {
        ctx.font = this.createFont(metrics.brandName.fontSize);
        ctx.fillText(brandName, this.vr2 / 2, metrics.brandName.top);
      }

      // DESCRIPTION

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.description.fontSize);
      ctx.fillText(description, this.width / 2, metrics.description.top);

      // COUNTRY OF ORIGIN

      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      ctx.font = this.createFont(metrics.countryOfOrigin.fontSize);
      ctx.fillText(
        countryOfOrigin,
        this.width / 2,
        metrics.countryOfOrigin.top
      );

      ctx.restore();

      if (this.mode === "labelary") {
        this.src = canvas.toDataURL();
      }
    },
  },
};
</script>
