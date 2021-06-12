/** golden ratio */
export const gr = 1.618;

export function sanitize(value) {
  if (typeof value === "string") {
    return value.replace(/[\^~]/, "");
  }
  return "";
}

export function computeUnitCost({ itemSize, price, isWeighed }) {
  if (isWeighed) {
    return {
      units: "OZ",
      unitCount: 16,
      unitCost: price / 16,
    };
  }
  itemSize = itemSize || "";
  const match = itemSize.match(/^([0-9.]*)(.*)$/);
  const units = match[2].trim() || "CT";
  const unitCount = parseFloat(match[1]) || 1;
  const unitCost = price / unitCount;
  return { units, unitCount, unitCost };
}

export async function fetchLabelaryImage(zpl, options) {
  const { dpmm, width, height, index, signal } = options;
  const url = `https://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${width}x${height}/${index}/`;

  const body = new FormData();
  body.append("file", new Blob([zpl], { type: "text/plain" }), "blob");

  const res = await fetch(url, {
    method: "post",
    headers: {
      accept: "image/png",
    },
    body,
    signal,
  });

  const data = await res.blob();
  return data;
}

export async function sendToPrinter(host, zpl) {
  const headers = new Headers();
  headers.append("Content-Type", "text/plain");

  const options = {
    method: "POST",
    // Without a proxy, this is the best we can do.
    // The response, including the status code, will be opaque.
    mode: "no-cors",
    cache: "no-cache",
    headers: headers,
    body: zpl,
  };

  const url = `http://${host}/pstprnt`;
  const res = await fetch(url, options);
  const text = await res.text();
  return text;
}

export async function sendToProxy(proxyUrl, { host, zpl }) {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  const options = {
    method: "POST",
    cache: "no-cache",
    headers,
    body: JSON.stringify({ host, zpl }),
  };

  const res = await fetch(proxyUrl, options);
  return res.status;
}

export function formatProductCode(productCode) {
  if (productCode.length === 12) {
    return (
      productCode.substring(0, 1) +
      " " +
      productCode.substring(1, 6) +
      " " +
      productCode.substring(6, 11) +
      " " +
      productCode.substring(11, 12)
    );
  }
  if (productCode.length === 13) {
    return (
      productCode.substring(0, 1) +
      " " +
      productCode.substring(1, 7) +
      " " +
      productCode.substring(7, 13)
    );
  }
  return productCode;
}

/**
 * Returns tiny GIF, taken from here: https://stackoverflow.com/a/19126281
 * */
export function getBlankImage() {
  return "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D";
}
