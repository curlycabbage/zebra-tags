export function sanitize(value) {
  if (typeof value === "string") {
    return value.replace(/[\^~]/, "");
  }
  return "";
}

export function computeUnitCost({ itemSize, price, isWeighed }) {
  if (isWeighed) {
    return {
      units: "LB",
      unitCount: 1,
      unitCost: price,
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

export async function sendToPrinter(printerUrl, zpl) {
  const headers = new Headers();
  headers.append("Content-Type", "text/plain");

  const options = {
    method: "POST",
    headers: headers,
    body: zpl,
    redirect: "follow",
    // Without a proxy, this is the best we can do.
    // The response, including the status code, will be opaque.
    mode: "no-cors",
  };

  const res = await fetch(printerUrl, options);
  const text = await res.text();
  return text;
}
