import { round2 } from './round';

export type Money = number;

export interface TermInput {
  /** Срок в годах (если указан, имеет приоритет над Tm) */
  T?: number;
  /** Срок в месяцах (используется, если T не задан) */
  Tm?: number;
}

export interface DepositInput extends TermInput {
  /** Сумма инвестиций (руб) */
  S: Money;
  /**
   * Кол-во периодов капитализации в год:
   * 1 — раз в год (MVP), 12 — ежемесячно и т.п.
   */
  compoundingPerYear?: number; // default: 1
}

function getYears({ T, Tm }: TermInput): number {
  if (typeof T === 'number') return T;
  if (typeof Tm === 'number') return Tm / 12;
  throw new Error('Срок не задан: укажите T (годы) или Tm (месяцы).');
}

function getMonths({ T, Tm }: TermInput): number {
  if (typeof T === 'number') return Math.round(T * 12);
  if (typeof Tm === 'number') return Math.round(Tm);
  throw new Error('Срок не задан: укажите T (годы) или Tm (месяцы).');
}

function annualizedPercent(S: number, A: number, Tyears: number): number {
  const cagr = Math.pow(A / S, 1 / Tyears) - 1;
  return round2(cagr * 100);
}

function iisPortfolioFinal(S: number, years: number, bShare: number, sShare: number, bRate: number, sRate: number): number {
  const bonds = S * bShare * Math.pow(1 + bRate, years);
  const stocks = S * sShare * Math.pow(1 + sRate, years);
  return bonds + stocks;
}

const DepositAnnualRate = 0.09; // 9% годовых
const StocksAnnualRate = 0.12; // 12% годовых
const GoldAnnualRate = 0.11; // 11% годовых
const PiggyAnnualRate = 0.105; // 10.5% годовых

export const calcDeposit = (input: DepositInput) => {
  const { S, compoundingPerYear = 1, ...term } = input;

  if (S < 0) throw new Error('S не может быть отрицательным');

  const years = getYears(term);
  const base = 1 + DepositAnnualRate / compoundingPerYear;
  const power = compoundingPerYear * years;

  const finalAmountRaw = S * Math.pow(base, power);
  const profitRaw = finalAmountRaw - S;

  return {
    finalAmount: round2(finalAmountRaw),
    profit: round2(profitRaw),
    profitPercents: round2((profitRaw / S) * 100),
    annualizedPercent: annualizedPercent(S, finalAmountRaw, years),
  };
};

export interface BondsInput extends TermInput {
  /** S — Сумма (номинал/база расчёта), руб */
  S: Money;
  /** Купонная ставка годовая, по умолчанию 10.5% */
  couponRate?: number; // 0.105
  /** Цена покупки в % от номинала, по умолчанию 98% */
  pricePercent?: number; // 98
}

export const calcBonds = (input: BondsInput) => {
  const { S, couponRate = 0.105, pricePercent = 98, ...term } = input;
  if (S < 0) throw new Error('S не может быть отрицательным');

  const years = getYears(term);

  const couponIncomeRaw = S * couponRate * years;
  const discountIncomeRaw = (S * (100 - pricePercent)) / 100;
  const profitRaw = couponIncomeRaw + discountIncomeRaw;
  const finalAmountRaw = S + profitRaw;

  return {
    finalAmount: round2(finalAmountRaw),
    profit: round2(profitRaw),
    profitPercents: round2((profitRaw / S) * 100),
    annualizedPercent: annualizedPercent(S, finalAmountRaw, years),
  };
};

export const calcStocks = (input: DepositInput) => {
  const { S, compoundingPerYear = 1, ...term } = input;

  if (S < 0) throw new Error('S не может быть отрицательным');

  const years = getYears(term);
  const base = 1 + StocksAnnualRate / compoundingPerYear;
  const power = compoundingPerYear * years;

  const finalAmountRaw = S * Math.pow(base, power);
  const profitRaw = finalAmountRaw - S;

  return {
    finalAmount: round2(finalAmountRaw),
    profit: round2(profitRaw),
    profitPercents: round2((profitRaw / S) * 100),
    annualizedPercent: annualizedPercent(S, finalAmountRaw, years),
  };
};
export const calcGold = (input: DepositInput) => {
  const { S, compoundingPerYear = 1, ...term } = input;

  if (S < 0) throw new Error('S не может быть отрицательным');

  const years = getYears(term);
  const base = 1 + GoldAnnualRate / compoundingPerYear;
  const power = compoundingPerYear * years;

  const finalAmountRaw = S * Math.pow(base, power);
  const profitRaw = finalAmountRaw - S;

  return {
    finalAmount: round2(finalAmountRaw),
    profit: round2(profitRaw),
    profitPercents: round2((profitRaw / S) * 100),
    annualizedPercent: annualizedPercent(S, finalAmountRaw, years),
  };
};

export interface PiggyInput extends TermInput {
  /** S — Общая сумма пополнений за весь период, руб (расход) */
  S: Money;
}

export const calcPiggy = (input: PiggyInput) => {
  const { S, ...term } = input;
  if (S < 0) throw new Error('S не может быть отрицательным');

  const n = getMonths(term);
  if (n <= 0) throw new Error('Количество месяцев должно быть положительным');

  const monthlyContributionRaw = S / n;
  const r = PiggyAnnualRate / 12;

  const finalAmountRaw = r === 0 ? monthlyContributionRaw * n : monthlyContributionRaw * ((Math.pow(1 + r, n) - 1) / r);

  const profitRaw = finalAmountRaw - S;
  const years = n / 12;

  return {
    finalAmount: round2(finalAmountRaw),
    profit: round2(profitRaw),
    profitPercents: round2((profitRaw / S) * 100),
    annualizedPercent: annualizedPercent(S, finalAmountRaw, years),
  };
};

export interface IISInput extends TermInput {
  /** S — сумма инвестиций (руб) */
  S: Money;

  /** Доли портфеля, по умолчанию 70/30 */
  bondShare?: number; // 0.7
  stockShare?: number; // 0.3

  /** Годовые ставки, по умолчанию облигации 10.5%, акции 12% */
  bondAnnualRate?: number; // 0.105
  stockAnnualRate?: number; // 0.12

  /** Параметры вычета типа А */
  taxRate?: number; // 0.13 (13%)
  typeA_CapPerYear?: Money; // 52000 руб/год
}

export const calcIISA = (input: IISInput) => {
  const {
    S,
    bondShare = 0.7,
    stockShare = 0.3,
    bondAnnualRate = 0.105,
    stockAnnualRate = 0.12,
    taxRate = 0.13,
    typeA_CapPerYear = 52_000,
    ...term
  } = input;
  if (S < 0) throw new Error('S не может быть отрицательным');
  const years = getYears(term);
  // нормализуем доли
  const totalShare = bondShare + stockShare;
  if (totalShare <= 0) throw new Error('Сумма долей портфеля должна быть > 0');
  const bShare = bondShare / totalShare;
  const sShare = stockShare / totalShare;

  const portfolioFinal = iisPortfolioFinal(S, years, bShare, sShare, bondAnnualRate, stockAnnualRate);

  // Вычет типа А (MVP): min(13% * S, 52_000 * T)
  const deduction = Math.min(S * taxRate, typeA_CapPerYear * years);

  const A = round2(portfolioFinal + deduction);
  const P = round2(A - S);

  return {
    profitPercents: round2((P / S) * 100),
    finalAmount: A,
    profit: P,
    annualizedPercent: annualizedPercent(S, A, years),
  };
};

export const calcIISBase = (input: IISInput) => {
  const { S, bondShare = 0.7, stockShare = 0.3, bondAnnualRate = 0.105, stockAnnualRate = 0.12, ...term } = input;

  if (S < 0) throw new Error('S не может быть отрицательным');

  const years = getYears(term);
  const totalShare = bondShare + stockShare;
  if (totalShare <= 0) throw new Error('Сумма долей портфеля должна быть > 0');
  const bShare = bondShare / totalShare;
  const sShare = stockShare / totalShare;

  const Araw = iisPortfolioFinal(S, years, bShare, sShare, bondAnnualRate, stockAnnualRate);
  const A = round2(Araw);
  const P = round2(A - S);

  return {
    profitPercents: round2((P / S) * 100),
    finalAmount: A,
    profit: P,
    annualizedPercent: annualizedPercent(S, A, years),
  };
};
