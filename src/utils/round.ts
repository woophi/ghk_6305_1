export const round2 = (n: number): number => {
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

export const round = (value: number, precision: number = 0) => {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
};
