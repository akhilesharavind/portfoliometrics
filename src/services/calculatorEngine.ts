export interface CagrInput {
  initialValue: number;
  finalValue: number;
  years: number;
}

export interface CagrYearRow {
  year: number;
  balance: number;
  gain: number;
}

export interface CagrResult {
  cagr: number;
  totalGain: number;
  totalReturnPercent: number;
  yearlySchedule: CagrYearRow[];
}

export function calculateCagr(input: CagrInput): CagrResult {
  const { initialValue, finalValue, years } = input;
  const preserveSubDollar = Number.isFinite(initialValue) && initialValue > 0 && initialValue < 1;
  const formatVal = (v: number) =>
    preserveSubDollar || (Math.abs(v) > 0 && Math.abs(v) < 1)
      ? Number(v.toFixed(2))
      : Math.round(v);

  if (
    !Number.isFinite(initialValue) ||
    !Number.isFinite(finalValue) ||
    !Number.isFinite(years) ||
    initialValue <= 0 ||
    years <= 0
  ) {
    const totalGain = Number.isFinite(finalValue) && Number.isFinite(initialValue)
      ? formatVal(finalValue - initialValue)
      : 0;
    return {
      cagr: 0,
      totalGain,
      totalReturnPercent: 0,
      yearlySchedule: Number.isFinite(initialValue) && initialValue > 0
        ? [{ year: 0, balance: formatVal(initialValue), gain: 0 }]
        : []
    };
  }

  const cagr = finalValue <= 0 ? -100 : (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
  const totalGain = finalValue - initialValue;
  const totalReturnPercent = (totalGain / initialValue) * 100;

  const yearlySchedule: CagrYearRow[] = [];
  const rate = cagr / 100;

  yearlySchedule.push({ year: 0, balance: formatVal(initialValue), gain: 0 });

  const isInteger = Math.abs(years - Math.round(years)) < 1e-6;
  const targetYears = isInteger ? Math.round(years) : Number(years.toFixed(2));
  const maxFullYear = Math.floor(years);

  for (let y = 1; y <= maxFullYear; y++) {
    if (y < targetYears) {
      const next = finalValue <= 0 ? 0 : initialValue * Math.pow(1 + rate, y);
      yearlySchedule.push({
        year: y,
        balance: formatVal(next),
        gain: formatVal(next - initialValue)
      });
    }
  }

  // Trajectory endpoint lands on finalValue (floored at 0 balance for <= 0) and exact totalGain
  yearlySchedule.push({
    year: targetYears,
    balance: Math.max(0, formatVal(finalValue)),
    gain: formatVal(totalGain)
  });

  return {
    cagr: Number(cagr.toFixed(2)),
    totalGain: formatVal(totalGain),
    totalReturnPercent: Number(totalReturnPercent.toFixed(2)),
    yearlySchedule
  };
}

export interface CompoundInterestInput {
  initialInvestment: number;
  monthlyContribution: number;
  annualInterestRate: number; // %
  years: number;
  compoundingFrequency?: 1 | 2 | 4 | 12 | 365; // 1 = Annual, 2 = Semi-Annual, 4 = Quarterly, 12 = Monthly, 365 = Daily
  depositTiming?: 'beginning' | 'end';
}

export interface CompoundYearRow {
  year: number;
  principal: number;
  interestEarned: number;
  totalBalance: number;
  balance?: number;
}

export interface CompoundInterestResult {
  finalBalance: number;
  totalPrincipal: number;
  totalInterest: number;
  schedule: CompoundYearRow[];
}

export function calculateCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const {
    initialInvestment,
    monthlyContribution,
    annualInterestRate,
    years,
    compoundingFrequency = 12,
    depositTiming = 'end'
  } = input;

  const safeInitial = Number.isFinite(initialInvestment) ? Math.max(0, initialInvestment) : 0;
  const safeMonthly = Number.isFinite(monthlyContribution) ? monthlyContribution : 0;
  const safeRate = Number.isFinite(annualInterestRate) ? annualInterestRate : 0;
  const f = compoundingFrequency;
  const nominalRate = safeRate / 100;

  // Effective monthly growth rate derived from nominal annual rate and compounding frequency
  // EAR = (1 + r/f)^f - 1
  // r_m = (1 + EAR)^(1/12) - 1 = (1 + r/f)^(f/12) - 1
  const base = 1 + nominalRate / f;
  const r_m = nominalRate === 0
    ? 0
    : (base <= 0 ? -1 : Math.pow(base, f / 12) - 1);

  let balance = safeInitial;
  let totalDeposited = safeInitial;

  const schedule: CompoundYearRow[] = [
    {
      year: 0,
      principal: Math.round(safeInitial),
      interestEarned: 0,
      totalBalance: Math.round(safeInitial),
      balance: Math.round(safeInitial)
    }
  ];

  if (!Number.isFinite(years) || years <= 0) {
    return {
      finalBalance: Math.round(safeInitial),
      totalPrincipal: Math.round(safeInitial),
      totalInterest: 0,
      schedule
    };
  }

  const stepMonth = (fraction: number = 1) => {
    const contrib = safeMonthly * fraction;
    const growthFactor = fraction === 1
      ? (1 + r_m)
      : (1 + r_m <= 0 ? 0 : Math.pow(1 + r_m, fraction));
    if (depositTiming === 'beginning') {
      balance = (balance + contrib) * growthFactor;
    } else {
      balance = balance * growthFactor + contrib;
    }
    balance = Math.max(0, balance);
    if (contrib < 0) {
      totalDeposited = Math.max(0, totalDeposited + contrib);
    } else {
      totalDeposited += contrib;
    }
  };

  const fullYears = Math.floor(years);
  for (let y = 1; y <= fullYears; y++) {
    for (let m = 0; m < 12; m++) {
      stepMonth(1);
    }
    const interest = balance - totalDeposited;
    schedule.push({
      year: y,
      principal: Math.round(totalDeposited),
      interestEarned: Math.round(interest),
      totalBalance: Math.round(balance),
      balance: Math.round(balance)
    });
  }

  // Handle fractional year remainder (including sub-0.5 month remainders)
  const remainingFraction = years - fullYears;
  const exactRemainingMonths = remainingFraction * 12;
  if (exactRemainingMonths > 1e-6) {
    const wholeRem = Math.floor(exactRemainingMonths);
    const fracMonth = exactRemainingMonths - wholeRem;
    for (let m = 0; m < wholeRem; m++) {
      stepMonth(1);
    }
    if (fracMonth > 1e-6) {
      stepMonth(fracMonth);
    }
    const interest = balance - totalDeposited;
    const finalYr = Number(years.toFixed(2));
    schedule.push({
      year: finalYr,
      principal: Math.round(totalDeposited),
      interestEarned: Math.round(interest),
      totalBalance: Math.round(balance),
      balance: Math.round(balance)
    });
  }

  return {
    finalBalance: Math.round(balance),
    totalPrincipal: Math.round(totalDeposited),
    totalInterest: Math.round(balance - totalDeposited),
    schedule
  };
}
