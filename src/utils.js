export function sanitize(value) {
  if (typeof value === "string") {
    return value.replace(/[\^~]/, "");
  }
  return value;
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
  const unitCount = parseFloat(match[1]);
  const unitCost = price / unitCount;
  return { units, unitCount, unitCost };
}
