/**
 * PortfolioMetrics Comprehensive E2E Test Suite (Tiers 1 - 4)
 * 
 * Implements requirement-driven, opaque-box tests covering:
 * - Tier 1: Feature Coverage (Build, Themes, Antislop, Quantitative Engines, Generative UI)
 * - Tier 2: Boundary & Corner Cases (Negative CAGR, Singularities, Horizon Extremes, Props Fallbacks)
 * - Tier 3: Cross-Feature Interactions (MPT -> Backtesting, Copilot Sync, Theme Harmonization)
 * - Tier 4: Real-World Application Scenarios (End-to-End Multi-Step Workflows)
 * 
 * Invocation: npx tsx scripts/test-e2e.ts or npm run test:e2e
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// ---------------------------------------------------------------------------
// Engine, Data & Component Imports
// ---------------------------------------------------------------------------
import { getAsset } from '../src/data/assets';
import { POPULAR_PORTFOLIOS } from '../src/data/popularPortfolios';
import { runBacktest } from '../src/services/backtestingEngine';
import { runOptimization, OptimizationAssetInput } from '../src/services/optimizationEngine';
import { runMonteCarloSimulation } from '../src/services/monteCarloEngine';
import {
  calculateCagr,
  calculateCompoundInterest
} from '../src/services/calculatorEngine';
import { processAiQuery } from '../src/services/aiAssistantService';
import { LineChart } from '../src/components/SimpleChart';
import { MarkdownRenderer } from '../src/components/copilot/MarkdownRenderer';
import { GenerativeWidgetRenderer } from '../src/components/generative/GenerativeWidgetRenderer';
import { WidgetType } from '../src/components/generative/types';

// ---------------------------------------------------------------------------
// Path Resolution
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Test Runner Harness
// ---------------------------------------------------------------------------
interface TestRecord {
  id: string;
  name: string;
  tier: number;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const testResults: TestRecord[] = [];
let currentTier = 1;

function setTier(tier: number) {
  currentTier = tier;
}

async function runTest(id: string, name: string, fn: () => void | Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    testResults.push({ id, name, tier: currentTier, passed: true, durationMs });
    console.log(`  ✓ [${id}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const errorMsg = err?.message || String(err);
    testResults.push({ id, name, tier: currentTier, passed: false, error: errorMsg, durationMs });
    console.log(`  ✗ [${id}] ${name} (${durationMs}ms)`);
    console.log(`      Error: ${errorMsg}`);
  }
}

// ---------------------------------------------------------------------------
// Assertion Helpers
// ---------------------------------------------------------------------------
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} -> Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertClose(actual: number, expected: number, tolerance: number, message: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message} -> Expected ${expected} ±${tolerance}, got ${actual}`);
  }
}

function assertMatches(text: string, regex: RegExp, message: string) {
  if (!regex.test(text)) {
    throw new Error(`${message} -> Pattern ${regex} not matched in content`);
  }
}

function assertNotMatches(text: string, regex: RegExp, message: string) {
  if (regex.test(text)) {
    throw new Error(`${message} -> Forbidden pattern ${regex} found in content`);
  }
}

function readFileSafe(relPath: string): string {
  const fullPath = path.resolve(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Required file does not exist: ${relPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function walkFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, exts));
    } else if (entry.isFile() && exts.some(ext => entry.name.toLowerCase().endsWith(ext.toLowerCase()))) {
      results.push(fullPath);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// MAIN TEST SUITE
// ---------------------------------------------------------------------------
async function main() {
  console.log('======================================================================');
  console.log('       PORTFOLIOMETRICS E2E COMPREHENSIVE TEST SUITE (TIERS 1-4)       ');
  console.log('======================================================================\n');

  // =========================================================================
  // TIER 1: Feature Coverage (≥30 tests)
  // =========================================================================
  setTier(1);
  console.log('--- Tier 1: Feature Coverage ---');

  // T1.01: Clean build and typecheck
  await runTest('T1.01', 'Build and Typecheck: Vite production build succeeds', () => {
    try {
      execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
      const distIndex = path.resolve(ROOT, 'dist', 'index.html');
      assert(fs.existsSync(distIndex), 'dist/index.html was not generated by npm run build');
    } catch (e: any) {
      throw new Error(`Build failed: ${e.stdout ? e.stdout.toString() : e.message}`);
    }
  });

  // T1.02: Theme Primary Token (#ff5f14)
  await runTest('T1.02', 'Theme Tokens: tailwind.config.js defines primary #ff5f14', () => {
    const config = readFileSafe('tailwind.config.js');
    assertMatches(config, /#ff5f14/i, 'primary #ff5f14 token missing from tailwind.config.js');
  });

  // T1.03: Theme Semantic Warning Token (#f59e0b)
  await runTest('T1.03', 'Theme Tokens: tailwind.config.js defines semantic.warning #f59e0b', () => {
    const config = readFileSafe('tailwind.config.js');
    assertMatches(config, /warning:\s*['"]#f59e0b['"]/i, 'semantic.warning #f59e0b missing in tailwind.config.js');
  });

  // T1.04: Theme Semantic Warning Light Token (#d97706)
  await runTest('T1.04', 'Theme Tokens: tailwind.config.js defines semantic.warningLight #d97706', () => {
    const config = readFileSafe('tailwind.config.js');
    assertMatches(config, /warningLight:\s*['"]#d97706['"]/i, 'semantic.warningLight #d97706 missing in tailwind.config.js');
  });

  // T1.05: Theme Graphite Ramp Tokens
  await runTest('T1.05', 'Theme Tokens: tailwind.config.js defines graphite slate ramp', () => {
    const config = readFileSafe('tailwind.config.js');
    assertMatches(config, /#141415/i, 'graphite.deep (#141415) missing in tailwind.config.js');
    assertMatches(config, /#1a1b1c/i, 'graphite.bg (#1a1b1c) missing in tailwind.config.js');
    assertMatches(config, /#1f2022/i, 'graphite.card (#1f2022) missing in tailwind.config.js');
    assertMatches(config, /#282829/i, 'graphite.raised (#282829) missing in tailwind.config.js');
    assertMatches(config, /#e3e7eb/i, 'graphite.text (#e3e7eb) missing in tailwind.config.js');
    assertMatches(config, /#969696/i, 'graphite.secondary (#969696) missing in tailwind.config.js');
  });

  // T1.06: Root Theme Harmony in index.html
  await runTest('T1.06', 'Root Theme: index.html eliminates legacy #0F141C and #F4F6F8', () => {
    const indexHtml = readFileSafe('index.html');
    assertNotMatches(indexHtml, /#0F141C/i, 'Legacy dark #0F141C still present in index.html');
    assertNotMatches(indexHtml, /#F4F6F8/i, 'Legacy light #F4F6F8 still present in index.html');
  });

  // T1.07: Root Theme Harmony in src/App.tsx
  await runTest('T1.07', 'Root Theme: App.tsx eliminates legacy #0F141C and #F4F6F8', () => {
    const appTsx = readFileSafe('src/App.tsx');
    assertNotMatches(appTsx, /#0F141C/i, 'Legacy dark #0F141C still present in App.tsx');
    assertNotMatches(appTsx, /#F4F6F8/i, 'Legacy light #F4F6F8 still present in App.tsx');
  });

  // T1.08: Antislop: App.css Deleted
  await runTest('T1.08', 'Antislop Hygiene: src/App.css is completely removed', () => {
    const appCssPath = path.resolve(ROOT, 'src', 'App.css');
    assert(!fs.existsSync(appCssPath), 'src/App.css exists and must be removed');
  });

  // T1.09: Antislop: Recursive scan of src/, index.html, and public/brand-icon.svg for forbidden styling tokens
  await runTest('T1.09', 'Antislop Hygiene: Recursive scan eliminates purple/indigo/amber/legacy tokens across src & shell', () => {
    const srcFiles = walkFiles(path.resolve(ROOT, 'src'), ['.ts', '.tsx', '.css']);
    const extraFiles = [
      path.resolve(ROOT, 'index.html'),
      path.resolve(ROOT, 'public', 'brand-icon.svg')
    ];
    const allTargets = [...srcFiles, ...extraFiles];
    assert(allTargets.length >= 25, `Expected at least 25 files scanned, got ${allTargets.length}`);

    const forbiddenPatterns: [RegExp, string][] = [
      [/from-purple-/i, 'from-purple-'],
      [/from-indigo-/i, 'from-indigo-'],
      [/shadow-neon/i, 'shadow-neon'],
      [/shadow-2xl/i, 'shadow-2xl'],
      [/backdrop-blur/i, 'backdrop-blur'],
      [/#863bff/i, '#863bff'],
      [/#aa3bff/i, '#aa3bff'],
      [/#00A76F/i, '#00A76F'],
      [/#0F141C/i, '#0F141C'],
      [/#F4F6F8/i, '#F4F6F8'],
      [/amber-/i, 'amber-']
    ];

    for (const filePath of allTargets) {
      assert(fs.existsSync(filePath), `Target file missing: ${filePath}`);
      const content = fs.readFileSync(filePath, 'utf-8');
      const rel = path.relative(ROOT, filePath);
      for (const [pattern, label] of forbiddenPatterns) {
        assertNotMatches(content, pattern, `Found forbidden ${label} in ${rel}`);
      }
    }
  });

  // T1.10: Antislop: Absence of glowing shadows
  await runTest('T1.10', 'Antislop Hygiene: Absence of glowing shadow-neon or shadow-2xl on pricing', () => {
    const pricingTsx = readFileSafe('src/pages/PricingPage.tsx');
    assertNotMatches(pricingTsx, /shadow-neon/i, 'Found shadow-neon in PricingPage.tsx');
    assertNotMatches(pricingTsx, /shadow-2xl/i, 'Found shadow-2xl in PricingPage.tsx');
    assertNotMatches(pricingTsx, /backdrop-blur-sm/i, 'Found backdrop-blur-sm in PricingPage.tsx');
  });

  // T1.11: Antislop: Typography Geist & Geist Mono
  await runTest('T1.11', 'Antislop Typography: Geist and Geist Mono configured in Tailwind', () => {
    const config = readFileSafe('tailwind.config.js');
    assertMatches(config, /sans:\s*\[['"]Geist['"]/i, 'Geist font family missing in sans config');
    assertMatches(config, /mono:\s*\[['"]Geist Mono['"]/i, 'Geist Mono font family missing in mono config');
  });

  // T1.12: Mobile Touch Standards in Navbar.tsx
  await runTest('T1.12', 'Mobile Standards: Navbar.tsx mobile touch targets min-h-[44px]', () => {
    const navbar = readFileSafe('src/components/Navbar.tsx');
    assertMatches(navbar, /min-h-\[44px\]/i, 'Navbar mobile items lack min-h-[44px]');
  });

  // T1.13: Mobile Standards: Button types in Navbar.tsx
  await runTest('T1.13', 'Mobile Standards: Navbar interactive buttons have type="button"', () => {
    const navbar = readFileSafe('src/components/Navbar.tsx');
    // Ensure button elements have explicit type attribute
    assertMatches(navbar, /<button[^>]*type=["']button["']/i, 'Navbar buttons missing explicit type="button"');
  });

  // T1.14: CTA Arrow Cliché Elimination
  await runTest('T1.14', 'CTA Precision: Absence of arrow glyphs (→ / ArrowRight) on primary CTAs', () => {
    const home = readFileSafe('src/pages/HomePage.tsx');
    assertNotMatches(home, /import\s+{[^}]*ArrowRight[^}]*}\s+from\s+['"]lucide-react['"]/i, 'HomePage imports ArrowRight icon');
    assertNotMatches(home, /<ArrowRight/i, 'HomePage renders ArrowRight component');
    assertNotMatches(home, /→/i, 'HomePage contains raw unicode arrow →');
  });

  // T1.15: Engine Emoji Cleansing in backtestingEngine.ts
  await runTest('T1.15', 'Antislop Engines: backtestingEngine.ts commentary contains zero emojis', () => {
    const engineCode = readFileSafe('src/services/backtestingEngine.ts');
    assertNotMatches(engineCode, /🟢|🟡|⚠️|🛡️/i, 'backtestingEngine.ts contains legacy emojis (🟢, 🟡, ⚠️, 🛡️)');
    assertNotMatches(engineCode, /\p{Extended_Pictographic}/u, 'backtestingEngine.ts contains pictographic emoji characters');
  });

  // T1.16: Copy Tone Refinement in aiAssistantService.ts
  await runTest('T1.16', 'Copy Tone: aiAssistantService.ts narrative contains zero exclamation marks', () => {
    const aiService = readFileSafe('src/services/aiAssistantService.ts');
    // We check narrative strings (ignoring code non-null assertions like `!`)
    const stringMatches = aiService.match(/`[^`]*`|"[^"]*"|'[^']*'/g) || [];
    for (const str of stringMatches) {
      if (str.includes('!')) {
        // Allow not-equal or operators if any, but detect exclamation marks in sentences
        if (/[\w\s]!/.test(str)) {
          throw new Error(`Found exclamation mark in narrative string: ${str.slice(0, 60)}...`);
        }
      }
    }
  });

  // T1.17: Quantitative Backtesting CAGR
  await runTest('T1.17', 'Backtesting Engine: Computes SPY historical CAGR accurately (2020-2024)', () => {
    const res = runBacktest({
      allocations: [{ symbol: 'SPY', weight: 100 }],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2020,
      endYear: 2024,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    // SPY returns: 2020: 18.3%, 2021: 28.7%, 2022: -18.2%, 2023: 26.2%, 2024: 25.0%
    // 10000 -> 11830 -> 15225 -> 12454 -> 15717 -> 19646. CAGR = (19646/10000)^0.2 - 1 = 14.46%
    assertClose(res.cagr, 14.46, 0.5, 'Backtest CAGR computation mismatch');
    assertEqual(res.yearHistory.length, 5, 'Year history length mismatch');
  });

  // T1.18: Quantitative Backtesting Sharpe & Sortino
  await runTest('T1.18', 'Backtesting Engine: Computes positive Sharpe & Sortino ratios', () => {
    const res = runBacktest({
      allocations: [{ symbol: 'SPY', weight: 100 }],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2020,
      endYear: 2024,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    assert(res.sharpeRatio > 0.4 && res.sharpeRatio < 1.2, `Sharpe ratio out of expected bounds: ${res.sharpeRatio}`);
    assert(res.sortinoRatio > res.sharpeRatio, `Sortino ratio (${res.sortinoRatio}) should exceed Sharpe (${res.sharpeRatio})`);
  });

  // T1.19: Quantitative Backtesting Max Drawdown
  await runTest('T1.19', 'Backtesting Engine: Computes peak-to-trough Max Drawdown correctly', () => {
    const res = runBacktest({
      allocations: [{ symbol: 'QQQ', weight: 100 }],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2021,
      endYear: 2023,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    // QQQ crashed 32.6% in 2022. Engine reports maxDrawdown as negative percentage (-32.6%).
    assert(Math.abs(res.maxDrawdown) >= 30, `Expected abs(Max Drawdown) >= 30%, got ${res.maxDrawdown}%`);
  });

  // T1.20: Quantitative Backtesting Weight Normalization
  await runTest('T1.20', 'Backtesting Engine: Normalizes raw weights summing != 100%', () => {
    const res = runBacktest({
      allocations: [
        { symbol: 'VTI', weight: 50 },
        { symbol: 'BND', weight: 50 },
        { symbol: 'SPY', weight: 100 }
      ],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2020,
      endYear: 2024,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    const vti = res.allocations.find(a => a.symbol === 'VTI');
    const bnd = res.allocations.find(a => a.symbol === 'BND');
    const spy = res.allocations.find(a => a.symbol === 'SPY');
    assertClose(vti?.weight || 0, 25, 0.1, 'VTI normalized weight mismatch');
    assertClose(bnd?.weight || 0, 25, 0.1, 'BND normalized weight mismatch');
    assertClose(spy?.weight || 0, 50, 0.1, 'SPY normalized weight mismatch');
  });

  // T1.21: Markowitz MPT Covariance and Correlation
  await runTest('T1.21', 'Markowitz Engine: Computes symmetric correlation matrix with unit diagonal', () => {
    const res = runOptimization([
      { symbol: 'VTI', currentWeight: 60 },
      { symbol: 'BND', currentWeight: 40 }
    ]);
    const { matrix } = res.correlationMatrix;
    assertEqual(matrix[0][0], 1, 'Diagonal [0][0] must be 1.0');
    assertEqual(matrix[1][1], 1, 'Diagonal [1][1] must be 1.0');
    assertEqual(matrix[0][1], matrix[1][0], 'Correlation matrix must be symmetric');
  });

  // T1.22: Markowitz MPT Efficient Frontier Monotonicity
  await runTest('T1.22', 'Markowitz Engine: Generates Efficient Frontier curve with non-decreasing return', () => {
    const res = runOptimization([
      { symbol: 'VTI', currentWeight: 50 },
      { symbol: 'BND', currentWeight: 30 },
      { symbol: 'GLD', currentWeight: 20 }
    ]);
    const frontier = res.efficientFrontier;
    assert(frontier.length >= 5, 'Efficient frontier contains fewer than 5 points');
    for (let i = 1; i < frontier.length; i++) {
      assert(
        frontier[i].expectedReturn >= frontier[i - 1].expectedReturn,
        `Frontier point ${i} return (${frontier[i].expectedReturn}%) is lower than previous (${frontier[i - 1].expectedReturn}%)`
      );
    }
  });

  // T1.23: Markowitz MPT Max Sharpe Weights Sum
  await runTest('T1.23', 'Markowitz Engine: Max Sharpe portfolio weights sum to 100%', () => {
    const res = runOptimization([
      { symbol: 'VTI', currentWeight: 25 },
      { symbol: 'BND', currentWeight: 25 },
      { symbol: 'VXUS', currentWeight: 25 },
      { symbol: 'VNQ', currentWeight: 25 }
    ]);
    const sum = Object.values(res.maxSharpePortfolio.weights).reduce((a, b) => a + b, 0);
    assertClose(sum, 100, 0.5, 'Max Sharpe weights do not sum to 100%');
  });

  // T1.24: Markowitz MPT Minimum Volatility Portfolio
  await runTest('T1.24', 'Markowitz Engine: Minimum Volatility portfolio has lower risk than equal-weight', () => {
    const res = runOptimization([
      { symbol: 'VTI', currentWeight: 50 },
      { symbol: 'BND', currentWeight: 50 }
    ]);
    assert(
      res.minVolatilityPortfolio.volatility <= res.currentPortfolio.volatility + 0.1,
      `Min Vol (${res.minVolatilityPortfolio.volatility}%) should be <= Current (${res.currentPortfolio.volatility}%)`
    );
  });

  // T1.25: Monte Carlo Stochastic Path Simulation
  await runTest('T1.25', 'Monte Carlo Engine: Executes 1,000 trials with Box-Muller variates', () => {
    const res = runMonteCarloSimulation({
      initialInvestment: 100000,
      expectedAnnualReturn: 8.0,
      annualVolatility: 15.0,
      annualWithdrawal: 4000,
      inflationRate: 2.5,
      years: 15,
      simulationsCount: 1000
    });
    assertEqual(res.percentilesByYear.length, 16, 'Percentiles array should have 16 points (years 0..15)');
    assert(res.probabilityOfSuccess > 80, `Expected high probability of success (>80%), got ${res.probabilityOfSuccess}%`);
  });

  // T1.26: Monte Carlo Percentile Fan Ordering
  await runTest('T1.26', 'Monte Carlo Engine: Percentile ordering strictly holds (p10 <= p25 <= p50 <= p75 <= p90)', () => {
    const res = runMonteCarloSimulation({
      initialInvestment: 500000,
      expectedAnnualReturn: 7.0,
      annualVolatility: 16.0,
      annualWithdrawal: 20000,
      inflationRate: 2.5,
      years: 20
    });
    for (const pt of res.percentilesByYear) {
      assert(pt.p10 <= pt.p25, `Year ${pt.year}: p10 (${pt.p10}) > p25 (${pt.p25})`);
      assert(pt.p25 <= pt.p50, `Year ${pt.year}: p25 (${pt.p25}) > p50 (${pt.p50})`);
      assert(pt.p50 <= pt.p75, `Year ${pt.year}: p50 (${pt.p50}) > p75 (${pt.p75})`);
      assert(pt.p75 <= pt.p90, `Year ${pt.year}: p75 (${pt.p75}) > p90 (${pt.p90})`);
    }
  });

  // T1.27: Compound Interest Monthly Formula Adherence
  await runTest('T1.27', 'Compound Interest Engine: Monthly compounding matches standard financial formula', () => {
    const res = calculateCompoundInterest({
      initialInvestment: 10000,
      monthlyContribution: 500,
      annualInterestRate: 7.0,
      years: 10
    });
    // Standard future value with 7% annual / 12 monthly is ~$106,639
    assertClose(res.finalBalance, 106639, 1500, 'Compound interest balance mismatch');
    assertEqual(res.totalPrincipal, 10000 + 500 * 120, 'Total deposited principal mismatch');
    assertEqual(res.schedule.length, 11, 'Schedule rows count mismatch (years 0..10)');
  });

  // T1.28: Compound Interest Multi-Frequency Closed-Form Accuracy
  await runTest('T1.28', 'Compound Interest Engine: Closed-form accuracy across frequencies (1, 2, 4, 12, 365)', () => {
    const expectedByFreq: Array<{ freq: 1 | 2 | 4 | 12 | 365; expected: number }> = [
      { freq: 1, expected: 21589 },
      { freq: 2, expected: 21911 },
      { freq: 4, expected: 22080 },
      { freq: 12, expected: 22196 },
      { freq: 365, expected: 22253 }
    ];
    for (const { freq, expected } of expectedByFreq) {
      const res = calculateCompoundInterest({
        initialInvestment: 10000,
        monthlyContribution: 0,
        annualInterestRate: 8,
        years: 10,
        compoundingFrequency: freq
      });
      assertClose(
        res.finalBalance,
        expected,
        1,
        `Frequency ${freq}/yr finalBalance mismatch`
      );
      assertEqual(res.totalPrincipal, 10000, `Frequency ${freq}/yr totalPrincipal mismatch`);
      assertEqual(res.totalInterest, res.finalBalance - 10000, `Frequency ${freq}/yr totalInterest mismatch`);
    }
  });

  // T1.29: CAGR Calculation Precision
  await runTest('T1.29', 'CAGR Engine: Computes geometric mean return for $10k -> $35k over 10 years', () => {
    const res = calculateCagr({
      initialValue: 10000,
      finalValue: 35000,
      years: 10
    });
    // CAGR = (35000/10000)^(1/10) - 1 = 13.35%
    assertEqual(res.cagr, 13.35, 'CAGR percentage mismatch');
    assertEqual(res.totalGain, 25000, 'Total gain mismatch');
    assertEqual(res.totalReturnPercent, 250.00, 'Total return percentage mismatch');
  });

  // T1.30: CAGR Progression Schedule Table
  await runTest('T1.30', 'CAGR Engine: Generates annual schedule trajectory matching start and end values', () => {
    const res = calculateCagr({
      initialValue: 10000,
      finalValue: 35000,
      years: 10
    });
    assertEqual(res.yearlySchedule.length, 11, 'Schedule length should be 11 (0..10)');
    assertEqual(res.yearlySchedule[0].balance, 10000, 'Year 0 balance must equal initial value');
    assertClose(res.yearlySchedule[10].balance, 35000, 2, 'Year 10 balance must equal final value');
  });

  // T1.31: Generative UI Types Contract
  await runTest('T1.31', 'Generative UI: src/components/generative/types.ts exports ChatMessagePart & WidgetType', () => {
    const typesPath = path.resolve(ROOT, 'src', 'components', 'generative', 'types.ts');
    assert(fs.existsSync(typesPath), 'src/components/generative/types.ts does not exist');
    const content = fs.readFileSync(typesPath, 'utf-8');
    assertMatches(content, /export\s+(type|interface)\s+ChatMessagePart/i, 'ChatMessagePart type missing');
    assertMatches(content, /export\s+(type|interface)\s+WidgetType/i, 'WidgetType type missing');
    assertMatches(content, /export\s+(type|interface)\s+WidgetPayloadMap/i, 'WidgetPayloadMap type missing');
  });

  // T1.32: Generative Widget Registry Dispatcher
  await runTest('T1.32', 'Generative UI: GenerativeWidgetRenderer.tsx dynamic registry exists', () => {
    const rendererPath = path.resolve(ROOT, 'src', 'components', 'generative', 'GenerativeWidgetRenderer.tsx');
    assert(fs.existsSync(rendererPath), 'GenerativeWidgetRenderer.tsx does not exist');
    const content = fs.readFileSync(rendererPath, 'utf-8');
    assertMatches(content, /BacktestScenarioWidget/i, 'BacktestScenarioWidget not registered');
    assertMatches(content, /MptFrontierWidget/i, 'MptFrontierWidget not registered');
    assertMatches(content, /MonteCarloFanWidget/i, 'MonteCarloFanWidget not registered');
  });

  // T1.33: Global Studio Context State Contract
  await runTest('T1.33', 'Generative UI: src/context/StudioContext.tsx exports provider and hook', () => {
    const ctxPath = path.resolve(ROOT, 'src', 'context', 'StudioContext.tsx');
    assert(fs.existsSync(ctxPath), 'src/context/StudioContext.tsx does not exist');
    const content = fs.readFileSync(ctxPath, 'utf-8');
    assertMatches(content, /export\s+const\s+StudioProvider/i, 'StudioProvider export missing');
    assertMatches(content, /export\s+const\s+useStudioContext/i, 'useStudioContext export missing');
  });

  // T1.34: Cross-App Copilot Drawer & StudioContext Wiring
  await runTest('T1.34', 'Generative UI: StudioCopilotDrawer, App, Navbar, Optimization & Backtesting connect to StudioContext', () => {
    const drawerCode = readFileSafe('src/components/copilot/StudioCopilotDrawer.tsx');
    assertMatches(drawerCode, /useStudioContext/, 'StudioCopilotDrawer.tsx must import/use useStudioContext');
    assertMatches(drawerCode, /MarkdownRenderer/, 'StudioCopilotDrawer.tsx must use MarkdownRenderer');
    assertMatches(drawerCode, /GenerativeWidgetRenderer/, 'StudioCopilotDrawer.tsx must use GenerativeWidgetRenderer');
    assertMatches(drawerCode, /['"]Escape['"]/, 'StudioCopilotDrawer.tsx must handle Escape key to close');

    const appCode = readFileSafe('src/App.tsx');
    assertMatches(appCode, /StudioProvider/, 'App.tsx must wrap app with StudioProvider');
    assertMatches(appCode, /<StudioCopilotDrawer\s*\/>/, 'App.tsx must mount StudioCopilotDrawer');

    const navbarCode = readFileSafe('src/components/Navbar.tsx');
    assertMatches(navbarCode, /useStudioContext/, 'Navbar.tsx must connect to useStudioContext');
    assertMatches(navbarCode, /toggleCopilot/, 'Navbar.tsx must wire toggleCopilot');

    const optCode = readFileSafe('src/pages/OptimizationPage.tsx');
    assertMatches(optCode, /useStudioContext/, 'OptimizationPage.tsx must connect to useStudioContext');
    assertMatches(optCode, /applyAllocationsToWorkspace/, 'OptimizationPage.tsx must wire applyAllocationsToWorkspace');

    const btCode = readFileSafe('src/pages/BacktestingPage.tsx');
    assertMatches(btCode, /useStudioContext/, 'BacktestingPage.tsx must connect to useStudioContext');
    assertMatches(btCode, /activeAllocations/, 'BacktestingPage.tsx must synchronize activeAllocations');
  });

  // T1.35: Precision Markdown Renderer Behavioral Verification
  await runTest('T1.35', 'Generative UI: MarkdownRenderer renders tables, h4, ol, code blocks, nested lists & **Rate * 2**', () => {
    const mdSample = [
      '### Portfolio Telemetry',
      '#### Risk Breakdown',
      '1. Primary factor: **Rate * 2** escalation',
      '  - Nested sensitivity item',
      '  - Second nested item',
      '2. Secondary check',
      '',
      '| Metric | Value |',
      '|---|---|',
      '| Sharpe | 1.42 |',
      '| CAGR | 14.5% |',
      '',
      '```',
      'const sharpe = (cagr - rf) / vol;',
      '```'
    ].join('\n');

    const html = renderToStaticMarkup(React.createElement(MarkdownRenderer, { content: mdSample }));
    assertMatches(html, /<h4[^>]*>Portfolio Telemetry<\/h4>/, 'MarkdownRenderer failed to render ### as <h4>');
    assertMatches(html, /<h4[^>]*>Risk Breakdown<\/h4>/, 'MarkdownRenderer failed to render #### as <h4>');
    assertMatches(html, /<strong[^>]*>Rate \* 2<\/strong>/, 'MarkdownRenderer failed to render **Rate * 2** cleanly');
    assertMatches(html, /<ol[^>]*>[\s\S]*<ul[^>]*>[\s\S]*Nested sensitivity item[\s\S]*<\/ul>[\s\S]*<\/ol>/, 'MarkdownRenderer failed to render nested list inside <ol>');
    assertMatches(html, /<table[^>]*>[\s\S]*<thead[^>]*>[\s\S]*<th[^>]*>Metric<\/th>[\s\S]*<td[^>]*>1\.42<\/td>[\s\S]*<\/table>/, 'MarkdownRenderer failed to render markdown table');
    assertMatches(html, /<pre[^>]*><code[^>]*>const sharpe = \(cagr - rf\) \/ vol;<\/code><\/pre>/, 'MarkdownRenderer failed to render fenced code block');
    assert(!html.includes('**'), 'Raw ** markdown leaked into rendered HTML');
    assert(!html.includes('###'), 'Raw ### markdown leaked into rendered HTML');
    assert(!html.includes('|---|'), 'Raw table separator leaked into rendered HTML');
    assert(!html.includes('```'), 'Raw code fence leaked into rendered HTML');
  });

  // T1.36: Backtesting Rebalancing Frequency Differentiation & Single-Asset Invariance
  await runTest('T1.36', 'Backtesting Engine: Genuine rebalancing differentiation (NVDA/BND) & 100% SPY invariance', () => {
    const baseAlloc = [
      { symbol: 'NVDA', weight: 50 },
      { symbol: 'BND', weight: 50 }
    ];
    const noneRes = runBacktest({
      allocations: baseAlloc,
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'none',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    const annualRes = runBacktest({
      allocations: baseAlloc,
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    const quarterlyRes = runBacktest({
      allocations: baseAlloc,
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'quarterly',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    const monthlyRes = runBacktest({
      allocations: baseAlloc,
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'monthly',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    const distinctValues = new Set([
      noneRes.finalValue,
      annualRes.finalValue,
      quarterlyRes.finalValue,
      monthlyRes.finalValue
    ]);
    assertEqual(
      distinctValues.size,
      4,
      `Expected 4 distinct finalValues for none/annually/quarterly/monthly on NVDA/BND, got ${[
        noneRes.finalValue,
        annualRes.finalValue,
        quarterlyRes.finalValue,
        monthlyRes.finalValue
      ].join(', ')}`
    );

    // 100% single-asset portfolio must remain invariant across rebalancing frequencies
    const spyNone = runBacktest({
      allocations: [{ symbol: 'SPY', weight: 100 }],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'none',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    const spyMonthly = runBacktest({
      allocations: [{ symbol: 'SPY', weight: 100 }],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'monthly',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    assertEqual(spyNone.finalValue, spyMonthly.finalValue, '100% SPY finalValue must be invariant to rebalancing');
    assertEqual(spyNone.cagr, spyMonthly.cagr, '100% SPY CAGR must be invariant to rebalancing');
  });

  // =========================================================================
  // TIER 2: Boundary & Corner Cases (≥15 tests)
  // =========================================================================
  setTier(2);
  console.log('\n--- Tier 2: Boundary & Corner Cases ---');

  // T2.01: Negative CAGR Returns Calculation
  await runTest('T2.01', 'Boundary: Negative CAGR calculation ($10k -> $4k over 3 years)', () => {
    const res = calculateCagr({
      initialValue: 10000,
      finalValue: 4000,
      years: 3
    });
    // Ratio = 0.4. (0.4)^(1/3) - 1 = -26.32%
    assertEqual(res.cagr, -26.32, 'Negative CAGR percentage mismatch');
    assertEqual(res.totalGain, -6000, 'Total capital loss mismatch');
    assertEqual(res.totalReturnPercent, -60.00, 'Total loss percentage mismatch');
  });

  // T2.02: Negative CAGR UI Styling Contract (No + prefix, no green styling)
  await runTest('T2.02', 'Boundary: CagrCalculatorPage.tsx does not display + sign on negative returns', () => {
    const pageCode = readFileSafe('src/pages/CagrCalculatorPage.tsx');
    // Ensure it does not hardcode `+{result.totalReturnPercent}%` unconditionally
    assertNotMatches(
      pageCode,
      /<div[^>]*>\+{result\.totalReturnPercent}%/i,
      'CagrCalculatorPage.tsx unconditionally prefixes return with + sign'
    );
    // Ensure it conditionally selects negative styling on loss
    assertMatches(
      pageCode,
      /result\.totalReturnPercent\s*>=?\s*0|result\.totalGain\s*>=?\s*0/i,
      'CagrCalculatorPage.tsx lacks conditional check for negative return styling'
    );
  });

  // T2.03: Zero Initial Investment in Compound Interest
  await runTest('T2.03', 'Boundary: Compound interest with $0 initial investment and monthly deposits', () => {
    const res = calculateCompoundInterest({
      initialInvestment: 0,
      monthlyContribution: 500,
      annualInterestRate: 8.0,
      years: 10
    });
    assert(res.finalBalance > 90000, `Expected balance > $90,000, got $${res.finalBalance}`);
    assertEqual(res.totalPrincipal, 60000, 'Total deposited should equal $60,000');
    assert(res.totalInterest > 30000, 'Total interest should exceed $30,000');
  });

  // T2.04: Zero Annual Interest Rate Compounding
  await runTest('T2.04', 'Boundary: Compound interest with 0% rate evaluates pure accumulation', () => {
    const res = calculateCompoundInterest({
      initialInvestment: 10000,
      monthlyContribution: 100,
      annualInterestRate: 0,
      years: 5
    });
    assertEqual(res.finalBalance, 16000, 'Ending balance with 0% interest mismatch');
    assertEqual(res.totalInterest, 0, 'Total interest with 0% interest must be 0');
    assertEqual(res.totalPrincipal, 16000, 'Total principal mismatch');
  });

  // T2.05: Zero Years Horizon Handling
  await runTest('T2.05', 'Boundary: Zero years horizon does not return NaN or throw', () => {
    const cagrRes = calculateCagr({
      initialValue: 10000,
      finalValue: 10000,
      years: 0
    });
    assert(!Number.isNaN(cagrRes.cagr), 'CAGR returned NaN for 0 years');
    assert(Number.isFinite(cagrRes.cagr), 'CAGR returned Infinity for 0 years');

    const compRes = calculateCompoundInterest({
      initialInvestment: 10000,
      monthlyContribution: 100,
      annualInterestRate: 5,
      years: 0
    });
    assert(!Number.isNaN(compRes.finalBalance), 'Compound interest returned NaN for 0 years');
  });

  // T2.06: Extreme 100-Year Compounding Horizon
  await runTest('T2.06', 'Boundary: 100-year compounding horizon without numeric overflow', () => {
    const res = calculateCompoundInterest({
      initialInvestment: 10000,
      monthlyContribution: 100,
      annualInterestRate: 6.0,
      years: 100
    });
    assert(Number.isFinite(res.finalBalance), 'Final balance overflowed');
    assert(res.finalBalance > 10000000, 'Expected > $10,000,000 for 100-year compounding');
  });

  // T2.07: Fractional Year Horizon Fidelity (CAGR, Compound Interest, and UI Input)
  await runTest('T2.07', 'Boundary: Fractional year horizon (2.5 yrs & 0.04 yrs) accurate without overshoot', () => {
    const cagrFrac = calculateCagr({ initialValue: 10000, finalValue: 15000, years: 2.5 });
    const cagrEnd = cagrFrac.yearlySchedule[cagrFrac.yearlySchedule.length - 1];
    assertEqual(cagrEnd?.year, 2.5, 'CAGR fractional schedule endpoint year must equal 2.5');
    assertEqual(cagrEnd?.balance, 15000, 'CAGR fractional schedule endpoint balance must equal 15000');
    assertClose(cagrFrac.cagr, 17.61, 0.05, 'CAGR for $10k -> $15k in 2.5 yrs must be ~17.61%');

    const comp25 = calculateCompoundInterest({
      initialInvestment: 10000,
      monthlyContribution: 500,
      annualInterestRate: 8.0,
      years: 2.5
    });
    const comp30 = calculateCompoundInterest({
      initialInvestment: 10000,
      monthlyContribution: 500,
      annualInterestRate: 8.0,
      years: 3
    });
    const compEnd = comp25.schedule[comp25.schedule.length - 1];
    assertEqual(compEnd?.year, 2.5, 'Compound interest schedule endpoint year must equal 2.5');
    assertEqual(comp25.totalPrincipal, 25000, 'Compound interest 2.5-yr principal must equal $25,000');
    assert(
      comp25.finalBalance < comp30.finalBalance,
      `2.5-yr balance (${comp25.finalBalance}) must be strictly less than 3-yr balance (${comp30.finalBalance})`
    );

    // Sub-0.5 month remainder (0.04 yrs = 0.48 months) must still accrue positive interest
    const compSubMonth = calculateCompoundInterest({
      initialInvestment: 10000,
      monthlyContribution: 0,
      annualInterestRate: 12.0,
      years: 0.04
    });
    assert(
      compSubMonth.finalBalance > 10000,
      `Expected 0.04-year compounding balance > $10,000, got $${compSubMonth.finalBalance}`
    );

    const pageCode = readFileSafe('src/pages/CompoundInterestPage.tsx');
    assertMatches(
      pageCode,
      /id="ci-horizon-years"[\s\S]*?step="any"/i,
      'CompoundInterestPage.tsx horizon input missing step="any"'
    );
    assertNotMatches(
      pageCode,
      /<select[^>]*id="ci-horizon-years"[^>]*>\s*\{\[5,\s*10,\s*15,\s*20,\s*25,\s*30,\s*40\]/i,
      'CompoundInterestPage.tsx still uses rigid 8-value select instead of flexible input'
    );
  });

  // T2.08: Single Asset 100% Allocation Backtest
  await runTest('T2.08', 'Boundary: Backtest with 100% in single asset matches benchmark exactly', () => {
    const res = runBacktest({
      allocations: [{ symbol: 'SPY', weight: 100 }],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2020,
      endYear: 2024,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    for (const yr of res.yearHistory) {
      assertEqual(yr.portfolioReturn, yr.benchmarkReturn, `Year ${yr.year}: portfolio return != benchmark return`);
      assertEqual(yr.endBalance, yr.benchmarkBalance, `Year ${yr.year}: portfolio balance != benchmark balance`);
    }
  });

  // T2.09: Zero Total Allocation Graceful Handling
  await runTest('T2.09', 'Boundary: Backtest with zero total weights does not divide by zero', () => {
    const res = runBacktest({
      allocations: [{ symbol: 'SPY', weight: 0 }, { symbol: 'BND', weight: 0 }],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2022,
      endYear: 2024,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    assert(Number.isFinite(res.cagr), 'CAGR returned non-finite value on zero weights');
  });

  // T2.10: Markowitz Perfectly Correlated Assets Singularity
  await runTest('T2.10', 'Boundary: Markowitz optimization with two identical assets handles correlation = 1.0', () => {
    const res = runOptimization([
      { symbol: 'VTI', currentWeight: 50 },
      { symbol: 'VTI', currentWeight: 50 }
    ]);
    assert(Number.isFinite(res.maxSharpePortfolio.expectedReturn), 'Max Sharpe return was NaN');
    assert(Number.isFinite(res.maxSharpePortfolio.volatility), 'Max Sharpe vol was NaN');
  });

  // T2.11: Markowitz Zero Volatility Handling (True annualVolatility: 0 override)
  await runTest('T2.11', 'Boundary: Markowitz engine handles true zero-volatility assets without NaN or Infinity', () => {
    const multiRes = runOptimization([
      { symbol: 'BND', currentWeight: 50, annualVolatility: 0 },
      { symbol: 'VTI', currentWeight: 50 }
    ]);
    assertEqual(multiRes.minVolatilityPortfolio.volatility, 0, 'Min volatility with 0-vol asset should reach 0%');
    for (const portfolio of [
      multiRes.currentPortfolio,
      multiRes.maxSharpePortfolio,
      multiRes.minVolatilityPortfolio,
      multiRes.riskParityPortfolio
    ]) {
      assert(Number.isFinite(portfolio.sharpeRatio), `Portfolio Sharpe ratio non-finite: ${portfolio.sharpeRatio}`);
      assert(Number.isFinite(portfolio.volatility), `Portfolio volatility non-finite: ${portfolio.volatility}`);
      assert(Number.isFinite(portfolio.expectedReturn), `Portfolio return non-finite: ${portfolio.expectedReturn}`);
    }
    for (const metric of multiRes.assetMetrics) {
      assert(Number.isFinite(metric.sharpe), `Asset ${metric.symbol} Sharpe non-finite: ${metric.sharpe}`);
    }

    const singleRes = runOptimization([
      { symbol: 'BND', currentWeight: 100, annualVolatility: 0 }
    ]);
    assertEqual(singleRes.minVolatilityPortfolio.volatility, 0, 'Single 0-vol asset volatility must be 0');
    assert(Number.isFinite(singleRes.minVolatilityPortfolio.sharpeRatio), 'Single 0-vol asset Sharpe non-finite');
    assert(Number.isFinite(singleRes.assetMetrics[0].sharpe), 'Single 0-vol asset metric Sharpe non-finite');
  });

  // T2.12: Monte Carlo High Withdrawal Rate Depletion to 0
  await runTest('T2.12', 'Boundary: Monte Carlo 60% annual withdrawal depletes to 0 without negative balance', () => {
    const res = runMonteCarloSimulation({
      initialInvestment: 100000,
      expectedAnnualReturn: 6.0,
      annualVolatility: 12.0,
      annualWithdrawal: 60000,
      inflationRate: 2.0,
      years: 10,
      simulationsCount: 200
    });
    for (const yr of res.percentilesByYear) {
      assert(yr.p10 >= 0, `Year ${yr.year} p10 balance fell below zero: ${yr.p10}`);
      assert(yr.p50 >= 0, `Year ${yr.year} p50 balance fell below zero: ${yr.p50}`);
    }
    assertEqual(res.percentilesByYear[10].p10, 0, '10th percentile should be depleted to 0 by year 10');
  });

  // T2.13: Monte Carlo Zero Initial Balance & Zero Withdrawal
  await runTest('T2.13', 'Boundary: Monte Carlo $0 initial balance and $0 withdrawal produces clean zeros', () => {
    const res = runMonteCarloSimulation({
      initialInvestment: 0,
      expectedAnnualReturn: 8.0,
      annualVolatility: 15.0,
      annualWithdrawal: 0,
      inflationRate: 2.0,
      years: 5
    });
    assertEqual(res.medianFinalBalance, 0, 'Median final balance should be 0');
    assert(!Number.isNaN(res.probabilityOfSuccess), 'Probability of success returned NaN');
  });

  // T2.14: AI Assistant Empty Query Handling (must not fabricate a portfolio)
  await runTest('T2.14', 'Boundary: AI Assistant handles empty or whitespace queries gracefully', () => {
    const res = processAiQuery('');
    assert(res.text.length > 0, 'Expected helpful guidance text on empty query');
    assert(res.text.includes('Not Understood'), 'Expected explicit Not Understood guidance');
    assert(res.backtestData === undefined, 'Empty query must not fabricate backtest data');
  });

  // T2.15: AI Assistant Special Characters / Script Injection
  await runTest('T2.15', 'Boundary: AI Assistant handles script tags and special symbols without error', () => {
    const res = processAiQuery('<script>alert("XSS")</script> &^%$#@! ~`');
    assert(typeof res.text === 'string' && res.text.length > 0, 'Failed to process special character input');
  });

  // T2.16: Chart Props Fallback Defaults
  await runTest('T2.16', 'Boundary: SimpleChart.tsx provides default labels when props omitted', () => {
    const chartCode = readFileSafe('src/components/SimpleChart.tsx');
    assertMatches(
      chartCode,
      /seriesName\??:\s*string/i,
      'SimpleChart.tsx LineChartProps missing optional seriesName'
    );
    assertMatches(
      chartCode,
      /benchmarkName\??:\s*string/i,
      'SimpleChart.tsx LineChartProps missing optional benchmarkName'
    );
  });

  // T2.17: Chart Legend Decoupling Support
  await runTest('T2.17', 'Boundary: SimpleChart.tsx renders custom seriesName and benchmarkName', () => {
    const chartCode = readFileSafe('src/components/SimpleChart.tsx');
    assertMatches(
      chartCode,
      /{\s*seriesName\s*\|\|\s*['"]Strategy['"]\s*}|seriesName/i,
      'SimpleChart.tsx does not parameterize Strategy legend'
    );
    assertMatches(
      chartCode,
      /{\s*benchmarkName\s*\|\|\s*['"]Benchmark \(S&P 500\)['"]\s*}|benchmarkName/i,
      'SimpleChart.tsx does not parameterize Benchmark legend'
    );
  });

  // T2.18: Backtesting initialValue <= 0 NaN Guard
  await runTest('T2.18', 'Boundary: Backtest initialValue <= 0 (0 and -500) produces zero NaN in metrics & aiInsights', () => {
    for (const initialVal of [0, -500]) {
      const res = runBacktest({
        allocations: [{ symbol: 'SPY', weight: 100 }],
        initialValue: initialVal,
        cashFlowType: 'none',
        cashFlowAmount: 0,
        startYear: 2020,
        endYear: 2024,
        rebalancing: 'annually',
        benchmark: 'SPY',
        riskFreeRate: 0.04
      });
      for (const val of [
        res.initialValue,
        res.finalValue,
        res.totalDeposits,
        res.cagr,
        res.volatility,
        res.sharpeRatio,
        res.sortinoRatio,
        res.maxDrawdown,
        res.calmarRatio,
        res.benchmarkFinalValue,
        res.benchmarkCagr
      ]) {
        assert(Number.isFinite(val), `Non-finite metric (${val}) for initialValue=${initialVal}`);
      }
      assert(!res.aiInsights.includes('NaN'), `aiInsights contains NaN for initialValue=${initialVal}: ${res.aiInsights}`);
      assert(!res.aiInsights.includes('Infinity'), `aiInsights contains Infinity for initialValue=${initialVal}`);
    }
  });

  // T2.19: Backtesting startYear > endYear Guard
  await runTest('T2.19', 'Boundary: Backtest startYear > endYear returns empty yearHistory without fabricated 2020/2022', () => {
    const res = runBacktest({
      allocations: [{ symbol: 'SPY', weight: 100 }],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2025,
      endYear: 2021,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    assertEqual(res.yearHistory.length, 0, 'yearHistory must be empty when startYear > endYear');
    assertEqual(res.cagr, 0, 'cagr must be 0 when startYear > endYear');
    assert(res.bestYear.year !== 2020, 'bestYear must not fabricate year 2020');
    assert(res.worstYear.year !== 2022, 'worstYear must not fabricate year 2022');
    assertEqual(res.bestYear.year, 2025, 'bestYear.year should preserve startYear');
    assertEqual(res.worstYear.year, 2021, 'worstYear.year should preserve endYear');
  });

  // T2.20: Backtesting Empty Allocations Guard
  await runTest('T2.20', 'Boundary: Backtest allocations: [] returns finite guarded zero metrics', () => {
    const res = runBacktest({
      allocations: [],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2020,
      endYear: 2024,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    assertEqual(res.yearHistory.length, 0, 'yearHistory must be empty for empty allocations');
    assertEqual(res.cagr, 0, 'cagr must be 0 for empty allocations');
    assertEqual(res.volatility, 0, 'volatility must be 0 for empty allocations');
    assertEqual(res.finalValue, 10000, 'finalValue should remain initialValue on empty allocations');
    assert(!res.aiInsights.includes('NaN'), 'aiInsights must not contain NaN');
  });

  // T2.21: Optimization Empty Input Guard
  await runTest('T2.21', 'Boundary: runOptimization([]) returns clean empty frontier and finite 0 metrics', () => {
    const res = runOptimization([]);
    assertEqual(res.efficientFrontier.length, 0, 'efficientFrontier must be empty');
    assertEqual(res.assetMetrics.length, 0, 'assetMetrics must be empty');
    assertEqual(res.correlationMatrix.symbols.length, 0, 'correlationMatrix.symbols must be empty');
    assertEqual(res.maxSharpePortfolio.sharpeRatio, 0, 'maxSharpePortfolio.sharpeRatio must be 0');
    assertEqual(res.minVolatilityPortfolio.volatility, 0, 'minVolatilityPortfolio.volatility must be 0');
  });

  // T2.22: Optimization Duplicate-Symbol Consolidation & Exact 100.0% Weight Sum
  await runTest('T2.22', 'Boundary: Optimization consolidates duplicate symbols and enforces exact 100.0% weight sum', () => {
    const dupRes = runOptimization([
      { symbol: 'VTI', currentWeight: 50 },
      { symbol: 'VTI', currentWeight: 50 }
    ]);
    assertEqual(Object.keys(dupRes.currentPortfolio.weights).length, 1, 'Duplicate VTI must consolidate into 1 key');
    assertEqual(dupRes.currentPortfolio.weights['VTI'], 100, 'Consolidated VTI weight must equal 100');
    assertEqual(dupRes.maxSharpePortfolio.weights['VTI'], 100, 'Max Sharpe consolidated VTI weight must equal 100');

    const fiveAssetRes = runOptimization([
      { symbol: 'VTI', currentWeight: 20 },
      { symbol: 'BND', currentWeight: 20 },
      { symbol: 'GLD', currentWeight: 20 },
      { symbol: 'VXUS', currentWeight: 20 },
      { symbol: 'NVDA', currentWeight: 20 }
    ]);
    for (const [label, weights] of [
      ['currentPortfolio', fiveAssetRes.currentPortfolio.weights],
      ['maxSharpePortfolio', fiveAssetRes.maxSharpePortfolio.weights],
      ['minVolatilityPortfolio', fiveAssetRes.minVolatilityPortfolio.weights],
      ['riskParityPortfolio', fiveAssetRes.riskParityPortfolio.weights],
      ...fiveAssetRes.efficientFrontier.map((pt, idx) => [`frontier[${idx}]`, pt.weights] as const)
    ]) {
      const sum = Object.values(weights).reduce((s, w) => s + w, 0);
      assert(Math.abs(sum - 100) < 1e-9, `${label} weight sum (${sum}) does not equal exact 100.0`);
    }
  });

  // T2.23: Optimization minWeight / maxWeight Constraint Enforcement
  await runTest('T2.23', 'Boundary: Optimization enforces minWeight and maxWeight bounds across frontier', () => {
    const inputs: OptimizationAssetInput[] = [
      { symbol: 'VTI', currentWeight: 30, minWeight: 20, maxWeight: 50 },
      { symbol: 'BND', currentWeight: 40, minWeight: 25, maxWeight: 60 },
      { symbol: 'GLD', currentWeight: 30, minWeight: 10, maxWeight: 40 }
    ];
    const res = runOptimization(inputs);
    const portfolios = [
      res.maxSharpePortfolio,
      res.minVolatilityPortfolio,
      ...res.efficientFrontier
    ];
    for (const p of portfolios) {
      for (const inp of inputs) {
        const w = p.weights[inp.symbol];
        assert(
          w >= (inp.minWeight ?? 0) - 1e-9 && w <= (inp.maxWeight ?? 100) + 1e-9,
          `${inp.symbol} weight ${w}% violated [${inp.minWeight}, ${inp.maxWeight}]`
        );
      }
      const sum = Object.values(p.weights).reduce((s, v) => s + v, 0);
      assert(Math.abs(sum - 100) < 1e-9, `Bounded portfolio weight sum ${sum} !== 100`);
    }
  });

  // T2.24: Optimization Full-Span Efficient Frontier (5-Asset Spread Including BTC-USD)
  await runTest('T2.24', 'Boundary: Optimization Efficient Frontier spans full return/vol range through maxSharpePortfolio', () => {
    const res = runOptimization([
      { symbol: 'BND', currentWeight: 20 },
      { symbol: 'TLT', currentWeight: 20 },
      { symbol: 'VTI', currentWeight: 20 },
      { symbol: 'NVDA', currentWeight: 20 },
      { symbol: 'BTC-USD', currentWeight: 20 }
    ]);
    const frontier = res.efficientFrontier;
    assert(frontier.length >= 5 && frontier.length <= 30, `Frontier length out of bounds: ${frontier.length}`);
    for (let i = 1; i < frontier.length; i++) {
      assert(
        frontier[i].volatility > frontier[i - 1].volatility,
        `Frontier volatility not strictly increasing at index ${i}`
      );
      assert(
        frontier[i].expectedReturn > frontier[i - 1].expectedReturn,
        `Frontier expectedReturn not strictly increasing at index ${i}`
      );
    }
    const maxSharpeOnCurve = frontier.some(
      p => p.volatility === res.maxSharpePortfolio.volatility && p.expectedReturn === res.maxSharpePortfolio.expectedReturn
    );
    assert(maxSharpeOnCurve, 'Efficient frontier omitted maxSharpePortfolio point');
    assert(
      frontier[frontier.length - 1].volatility >= res.maxSharpePortfolio.volatility,
      'Efficient frontier upper tail truncated before maxSharpePortfolio'
    );
  });

  // T2.25: Monte Carlo simulationsCount: 0 & maxDepletionYear Accuracy
  await runTest('T2.25', 'Boundary: Monte Carlo simulationsCount: 0 guard & maxDepletionYear tracking (150% vs 0% withdrawal)', () => {
    const zeroCount = runMonteCarloSimulation({
      initialInvestment: 100000,
      expectedAnnualReturn: 7,
      annualVolatility: 15,
      annualWithdrawal: 4000,
      inflationRate: 2.5,
      years: 10,
      simulationsCount: 0
    });
    assertEqual(zeroCount.percentilesByYear.length, 11, 'Expected 11 rows (0..10) for simulationsCount: 0');
    assertEqual(zeroCount.probabilityOfSuccess, 0, 'probabilityOfSuccess must be 0 for simulationsCount: 0');
    assertEqual(zeroCount.medianFinalBalance, 0, 'medianFinalBalance must be 0 for simulationsCount: 0');
    assertEqual(zeroCount.maxDepletionYear, null, 'maxDepletionYear must be null for simulationsCount: 0');

    const instantDeplete = runMonteCarloSimulation({
      initialInvestment: 100000,
      expectedAnnualReturn: 5,
      annualVolatility: 5,
      annualWithdrawal: 150000, // 150% withdrawal
      inflationRate: 2,
      years: 10,
      simulationsCount: 50
    });
    assertEqual(instantDeplete.maxDepletionYear, 1, '150% annual withdrawal should deplete in year 1');

    const noDeplete = runMonteCarloSimulation({
      initialInvestment: 100000,
      expectedAnnualReturn: 8,
      annualVolatility: 5,
      annualWithdrawal: 0,
      inflationRate: 2,
      years: 10,
      simulationsCount: 50
    });
    assertEqual(noDeplete.maxDepletionYear, null, '0% withdrawal with positive return should have maxDepletionYear === null');
  });

  // T2.26: CAGR Edge Cases (finalValue=0, sub-dollar 0.5->1, initialValue=0, years=0)
  await runTest('T2.26', 'Boundary: CAGR handles finalValue=0 (-100%), 0.5->1 (100%), initialValue=0 (0%), years=0 (0%)', () => {
    const totalLoss = calculateCagr({ initialValue: 10000, finalValue: 0, years: 3 });
    assertEqual(totalLoss.cagr, -100, 'finalValue=0 must yield -100% CAGR');
    assertEqual(totalLoss.yearlySchedule[totalLoss.yearlySchedule.length - 1].balance, 0, 'Endpoint balance must be 0');

    const subDollar = calculateCagr({ initialValue: 0.5, finalValue: 1, years: 1 });
    assertEqual(subDollar.cagr, 100, '0.5 -> 1 over 1 year must yield 100% CAGR');

    const zeroInit = calculateCagr({ initialValue: 0, finalValue: 1000, years: 5 });
    assertEqual(zeroInit.cagr, 0, 'initialValue=0 must guard to 0% CAGR');

    const zeroYrs = calculateCagr({ initialValue: 10000, finalValue: 15000, years: 0 });
    assertEqual(zeroYrs.cagr, 0, 'years=0 must guard to 0% CAGR');
  });

  // T2.27: Compound Interest Negative Rate & Negative Contribution Guards
  await runTest('T2.27', 'Boundary: Compound Interest guards rate=-150% (no NaN), contrib=-500 (>=0), rate=-10% (totalInterest<0)', () => {
    const extremeNegRate = calculateCompoundInterest({
      initialInvestment: 10000,
      monthlyContribution: 0,
      annualInterestRate: -150,
      years: 5,
      compoundingFrequency: 1
    });
    assert(Number.isFinite(extremeNegRate.finalBalance), 'finalBalance must be finite for -150% rate');
    assertEqual(extremeNegRate.finalBalance, 0, 'finalBalance must floor at 0 for -150% rate');

    const negContrib = calculateCompoundInterest({
      initialInvestment: 10000,
      monthlyContribution: -500,
      annualInterestRate: 4,
      years: 5
    });
    assert(negContrib.finalBalance >= 0, `finalBalance must remain >= 0, got ${negContrib.finalBalance}`);
    assert(negContrib.totalPrincipal >= 0, `totalPrincipal must remain >= 0, got ${negContrib.totalPrincipal}`);

    const negRate = calculateCompoundInterest({
      initialInvestment: 10000,
      monthlyContribution: 0,
      annualInterestRate: -10,
      years: 3
    });
    assert(negRate.totalInterest < 0, `Expected negative totalInterest for -10% rate, got ${negRate.totalInterest}`);
  });

  // T2.28: SimpleChart Negative Dataset & GenerativeWidgetRenderer Null-Payload / 0-Value Integrity
  await runTest('T2.28', 'Boundary: SimpleChart negative ticks/coords & GenerativeWidgetRenderer null/zero payload safety', () => {
    const chartHtml = renderToStaticMarkup(
      React.createElement(LineChart, {
        data: [
          { label: '2020', value: -100 },
          { label: '2021', value: -95 }
        ],
        valuePrefix: '$'
      })
    );
    assert(!chartHtml.includes('$-'), 'Negative LineChart tick rendered malformed $- instead of -$');

    // Verify Y ticks appear in ascending order and coordinates stay within [20, 244]
    const yTickMatches = [...chartHtml.matchAll(/<text[^>]*x="50"[^>]*>([^<]+)<\/text>/g)].map(m => m[1]);
    assertEqual(yTickMatches.length, 5, `Expected 5 Y ticks, got ${yTickMatches.length}`);
    const parsedTicks = yTickMatches.map(t => Number(t.replace('$', '')));
    for (let i = 1; i < parsedTicks.length; i++) {
      assert(parsedTicks[i] > parsedTicks[i - 1], `Y ticks not strictly ascending: ${yTickMatches.join(', ')}`);
    }

    const polyMatch = chartHtml.match(/<polyline[^>]*points="([^"]+)"/);
    assert(polyMatch !== null, 'LineChart missing polyline');
    for (const pair of polyMatch![1].trim().split(/\s+/)) {
      const y = Number(pair.split(',')[1]);
      assert(y >= 20 && y <= 244, `Polyline Y coordinate ${y} escaped chart bounds [20, 244]`);
    }

    // Null / undefined payload resistance across all 6 WidgetType variants
    const widgetTypes: WidgetType[] = [
      'backtest_scenario',
      'mpt_frontier',
      'monte_carlo_fan',
      'cagr_projection',
      'compound_growth',
      'portfolio_comparison'
    ];
    for (const wt of widgetTypes) {
      const nullHtml = renderToStaticMarkup(
        React.createElement(GenerativeWidgetRenderer, { widgetType: wt, payload: null })
      );
      assertEqual(nullHtml, '', `Null payload for ${wt} should render empty safely`);
    }

    // 0-value preservation check (must not fall back to non-zero defaults)
    const zeroCagrHtml = renderToStaticMarkup(
      React.createElement(GenerativeWidgetRenderer, {
        widgetType: 'cagr_projection',
        payload: { initialValue: 10000, finalValue: 0, years: 3 }
      })
    );
    assert(zeroCagrHtml.includes('-100%'), 'CagrProjectionWidget failed to preserve finalValue: 0 (-100%)');

    const zeroCompoundHtml = renderToStaticMarkup(
      React.createElement(GenerativeWidgetRenderer, {
        widgetType: 'compound_growth',
        payload: { initialInvestment: 10000, monthlyContribution: 0, annualInterestRate: 0, years: 5 }
      })
    );
    assert(zeroCompoundHtml.includes('$10,000'), 'CompoundGrowthWidget failed to preserve 0 contribution/rate');
  });

  // =========================================================================
  // TIER 3: Cross-Feature Interactions (≥10 tests)
  // =========================================================================
  setTier(3);
  console.log('\n--- Tier 3: Cross-Feature Interactions ---');

  // T3.01: MPT Max Sharpe -> Backtesting Workspace Handoff
  await runTest('T3.01', 'Interaction: Max Sharpe portfolio from MPT is directly backtestable', () => {
    const mpt = runOptimization([
      { symbol: 'VTI', currentWeight: 30 },
      { symbol: 'BND', currentWeight: 30 },
      { symbol: 'GLD', currentWeight: 20 },
      { symbol: 'VNQ', currentWeight: 20 }
    ]);
    const allocations = Object.entries(mpt.maxSharpePortfolio.weights).map(([symbol, weight]) => ({
      symbol,
      weight
    }));
    const backtest = runBacktest({
      allocations,
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2018,
      endYear: 2024,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    assert(backtest.cagr > 0, 'Backtested CAGR for MPT Max Sharpe should be positive');
    assert(backtest.sharpeRatio > 0, 'Backtested Sharpe for MPT Max Sharpe should be positive');
  });

  // T3.02: Metric Coherence between MPT and Backtest
  await runTest('T3.02', 'Interaction: MPT expected return aligns with historical backtest CAGR bounds', () => {
    const mpt = runOptimization([{ symbol: 'VTI', currentWeight: 100 }]);
    const backtest = runBacktest({
      allocations: [{ symbol: 'VTI', weight: 100 }],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2024,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    // Expected annualized return of VTI is ~13.4%
    assertClose(mpt.currentPortfolio.expectedReturn, 13.4, 1.0, 'MPT expected return mismatch');
    assertClose(backtest.cagr, 13.0, 2.5, 'Backtest CAGR mismatch');
  });

  // T3.03: Compounding Frequency Monotonicity (1, 2, 4, 12, 365)
  await runTest('T3.03', 'Interaction: Higher compounding frequency yields monotonically higher balance & interest', () => {
    const baseInput = {
      initialInvestment: 10000,
      monthlyContribution: 200,
      annualInterestRate: 8.0,
      years: 15
    };
    const annual = calculateCompoundInterest({ ...baseInput, compoundingFrequency: 1 });
    const semiAnnual = calculateCompoundInterest({ ...baseInput, compoundingFrequency: 2 });
    const quarterly = calculateCompoundInterest({ ...baseInput, compoundingFrequency: 4 });
    const monthly = calculateCompoundInterest({ ...baseInput, compoundingFrequency: 12 });
    const daily = calculateCompoundInterest({ ...baseInput, compoundingFrequency: 365 });

    assert(
      daily.finalBalance > monthly.finalBalance &&
        monthly.finalBalance > quarterly.finalBalance &&
        quarterly.finalBalance > semiAnnual.finalBalance &&
        semiAnnual.finalBalance > annual.finalBalance,
      `Final balances not strictly monotonic (daily>monthly>quarterly>semiAnnual>annual): ${[
        daily.finalBalance,
        monthly.finalBalance,
        quarterly.finalBalance,
        semiAnnual.finalBalance,
        annual.finalBalance
      ].join(', ')}`
    );
    assert(
      daily.totalInterest > monthly.totalInterest &&
        monthly.totalInterest > quarterly.totalInterest &&
        quarterly.totalInterest > semiAnnual.totalInterest &&
        semiAnnual.totalInterest > annual.totalInterest,
      'Total interest not strictly monotonic across compounding frequencies'
    );
  });

  // T3.04: Generative Compound Widget Engine Synchronization
  await runTest('T3.04', 'Interaction: CompoundGrowthWidget maps inputs to calculatorEngine', () => {
    const widgetPath = path.resolve(ROOT, 'src', 'components', 'generative', 'CompoundGrowthWidget.tsx');
    assert(fs.existsSync(widgetPath), 'src/components/generative/CompoundGrowthWidget.tsx does not exist');
    const content = fs.readFileSync(widgetPath, 'utf-8');
    assertMatches(content, /calculateCompoundInterest/i, 'CompoundGrowthWidget does not import calculateCompoundInterest');
  });

  // T3.05: Copilot Drawer State Synchronization
  await runTest('T3.05', 'Interaction: StudioContext provides unified copilotOpen and toggleCopilot', () => {
    const ctxPath = path.resolve(ROOT, 'src', 'context', 'StudioContext.tsx');
    assert(fs.existsSync(ctxPath), 'src/context/StudioContext.tsx does not exist');
    const content = fs.readFileSync(ctxPath, 'utf-8');
    assertMatches(content, /copilotOpen/i, 'StudioContext missing copilotOpen state');
    assertMatches(content, /toggleCopilot/i, 'StudioContext missing toggleCopilot function');
    assertMatches(content, /activeAllocations/i, 'StudioContext missing activeAllocations state');
  });

  // T3.06: Theme Consistency: OptimizationPage SVG Stroke
  await runTest('T3.06', 'Interaction: OptimizationPage Efficient Frontier stroke eliminates #00A76F', () => {
    const optPage = readFileSafe('src/pages/OptimizationPage.tsx');
    assertNotMatches(optPage, /#00A76F/i, 'Found legacy green #00A76F in OptimizationPage.tsx');
    assertMatches(optPage, /#ff5f14|primary/i, 'OptimizationPage does not use primary #ff5f14 for Efficient Frontier');
  });

  // T3.07: Theme Consistency: MonteCarloPage Median Fan Stroke
  await runTest('T3.07', 'Interaction: MonteCarloPage median 50th percentile stroke eliminates #00A76F', () => {
    const mcPage = readFileSafe('src/pages/MonteCarloPage.tsx');
    assertNotMatches(mcPage, /#00A76F/i, 'Found legacy green #00A76F in MonteCarloPage.tsx');
  });

  // T3.08: AI Assistant Generative Widget Dispatch Payload Validity
  await runTest('T3.08', 'Interaction: AI Assistant query generates executable portfolio allocations', () => {
    const res = processAiQuery('all weather');
    assert(res.backtestData !== undefined, 'Backtest data was not attached');
    const totalWeight = res.backtestData.allocations.reduce((sum, a) => sum + a.weight, 0);
    assertClose(totalWeight, 100, 0.5, 'Allocations in AI response do not sum to 100%');
    for (const alloc of res.backtestData.allocations) {
      assert(getAsset(alloc.symbol) !== undefined, `Asset ${alloc.symbol} not in ASSET_DATABASE`);
    }
  });

  // T3.09: Backtesting Embedded AI Strategy Explorer
  await runTest('T3.09', 'Interaction: BacktestingPage integrates embedded AI Strategy Explorer', () => {
    const backtestingPage = readFileSafe('src/pages/BacktestingPage.tsx');
    assertMatches(
      backtestingPage,
      /AI Strategy Explorer|StudioCopilotDrawer|useStudioContext|copilot/i,
      'BacktestingPage lacks integration with AI Strategy Explorer or StudioContext'
    );
  });

  // T3.10: Popular Portfolios Engine Interoperability
  await runTest('T3.10', 'Interaction: Popular portfolios can be ingested by both Backtest and MPT engines', () => {
    for (const p of POPULAR_PORTFOLIOS) {
      const bRes = runBacktest({
        allocations: p.allocations.map(a => ({ symbol: a.symbol, weight: a.weight })),
        initialValue: 10000,
        cashFlowType: 'none',
        cashFlowAmount: 0,
        startYear: 2020,
        endYear: 2024,
        rebalancing: 'annually',
        benchmark: 'SPY',
        riskFreeRate: 0.04
      });
      assert(bRes.cagr > -50 && bRes.cagr < 100, `CAGR out of range for ${p.id}`);

      const mRes = runOptimization(p.allocations.map(a => ({ symbol: a.symbol, currentWeight: a.weight })));
      assert(mRes.currentPortfolio.volatility > 0, `Volatility 0 for ${p.id}`);
    }
  });

  // T3.11: CAGR Schedule to Chart Data Compatibility
  await runTest('T3.11', 'Interaction: CAGR yearlySchedule maps seamlessly to LineChart data schema', () => {
    const res = calculateCagr({ initialValue: 10000, finalValue: 20000, years: 5 });
    const chartData = res.yearlySchedule.map(s => ({
      label: `Yr ${s.year}`,
      value: s.balance
    }));
    assertEqual(chartData.length, 6, 'Chart data rows count mismatch');
    assertEqual(chartData[0].value, 10000, 'First chart point value mismatch');
    assertEqual(chartData[5].value, 20000, 'Last chart point value mismatch');
  });

  // T3.12: Backtesting Rebalancing + Monthly Contributions Interaction
  await runTest('T3.12', 'Interaction: Backtesting rebalancing (none vs monthly) with monthly contributions stays finite & distinct', () => {
    const allocs = [
      { symbol: 'NVDA', weight: 50 },
      { symbol: 'BND', weight: 50 }
    ];
    const noneContrib = runBacktest({
      allocations: allocs,
      initialValue: 10000,
      cashFlowType: 'monthly_contribution',
      cashFlowAmount: 500,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'none',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    const monthlyContrib = runBacktest({
      allocations: allocs,
      initialValue: 10000,
      cashFlowType: 'monthly_contribution',
      cashFlowAmount: 500,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'monthly',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    assert(Number.isFinite(noneContrib.finalValue) && Number.isFinite(monthlyContrib.finalValue), 'Non-finite finalValue');
    assert(Number.isFinite(noneContrib.cagr) && Number.isFinite(monthlyContrib.cagr), 'Non-finite CAGR');
    assert(
      noneContrib.finalValue !== monthlyContrib.finalValue,
      `Expected none (${noneContrib.finalValue}) !== monthly (${monthlyContrib.finalValue}) with contributions`
    );
  });

  // T3.13: Backtesting TWR CAGR Separation Under Heavy Inflows
  await runTest('T3.13', 'Interaction: Backtesting TWR CAGR excludes deposit inflow inflation (BND + $1k/mo < 5%)', () => {
    const res = runBacktest({
      allocations: [{ symbol: 'BND', weight: 100 }],
      initialValue: 10000,
      cashFlowType: 'monthly_contribution',
      cashFlowAmount: 1000,
      startYear: 2020,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });
    assert(res.totalDeposits >= 70000, `Expected totalDeposits >= $70,000, got $${res.totalDeposits}`);
    assert(res.cagr < 5, `TWR CAGR for BND (2020-2025) must remain < 5% despite $1k/mo deposits, got ${res.cagr}%`);
    assert(res.cagr > -5, `TWR CAGR for BND (2020-2025) out of expected range: ${res.cagr}%`);
  });

  // T3.14: AI Assistant Intent Routing, Prompt Parsing & Widget Selection
  await runTest('T3.14', 'Interaction: aiAssistantService routes CAGR, MPT, custom allocations & retirement prompts accurately', () => {
    // 1. CAGR routing + dynamic computation check
    const cagrRes = processAiQuery('Calculate Compound Annual Growth Rate (CAGR) for $10k to $50k');
    const cagrWidget = cagrRes.parts.find(p => p.type === 'widget' && p.widgetType === 'cagr_projection');
    assert(cagrWidget !== undefined, 'CAGR prompt did not emit cagr_projection widget');
    if (cagrWidget && cagrWidget.type === 'widget' && cagrWidget.widgetType === 'cagr_projection') {
      assertEqual(cagrWidget.payload.initialValue, 10000, 'CAGR initialValue mismatch');
      assertEqual(cagrWidget.payload.finalValue, 50000, 'CAGR finalValue mismatch');
    }
    const cagrCustom = processAiQuery('Calculate CAGR for $10k to $40k over 5 years');
    assert(cagrCustom.text.includes('31.95%'), `Expected computed 31.95% CAGR, got: ${cagrCustom.text.slice(0, 120)}`);

    // 2. MPT routing
    const mptRes = processAiQuery('Compare Max Sharpe vs Min Volatility');
    const mptWidget = mptRes.parts.find(p => p.type === 'widget' && p.widgetType === 'mpt_frontier');
    assert(mptWidget !== undefined, 'MPT prompt did not emit mpt_frontier widget');

    // 3. Custom allocations parsing
    const customRes = processAiQuery('60% QQQ, 40% TLT');
    const customWidget = customRes.parts.find(p => p.type === 'widget' && p.widgetType === 'backtest_scenario');
    assert(customWidget !== undefined, 'Custom allocation prompt did not emit backtest_scenario widget');
    if (customWidget && customWidget.type === 'widget' && customWidget.widgetType === 'backtest_scenario') {
      const qqq = customWidget.payload.allocations.find(a => a.symbol === 'QQQ');
      const tlt = customWidget.payload.allocations.find(a => a.symbol === 'TLT');
      assertEqual(qqq?.weight, 60, 'Custom allocation QQQ weight mismatch');
      assertEqual(tlt?.weight, 40, 'Custom allocation TLT weight mismatch');
    }

    // 4. Retirement prompt parsing ($40k withdrawal on $1M portfolio)
    const retRes = processAiQuery('Simulate $40k annual withdrawal on $1M portfolio');
    const mcWidget = retRes.parts.find(p => p.type === 'widget' && p.widgetType === 'monte_carlo_fan');
    assert(mcWidget !== undefined, 'Retirement prompt did not emit monte_carlo_fan widget');
    if (mcWidget && mcWidget.type === 'widget' && mcWidget.widgetType === 'monte_carlo_fan') {
      assertEqual(mcWidget.payload.initialInvestment, 1000000, 'Parsed retirement initialInvestment mismatch');
      assertEqual(mcWidget.payload.annualWithdrawal, 40000, 'Parsed retirement annualWithdrawal mismatch');
    }
    assert(retRes.text.includes('$1,000,000'), 'Retirement narrative missing parsed $1,000,000');
    assert(retRes.text.includes('$40,000'), 'Retirement narrative missing parsed $40,000');
  });

  // T3.15: GenerativeWidgetRenderer Multi-Portfolio Comparison Rendering
  await runTest('T3.15', 'Interaction: portfolio_comparison widget renders multi-portfolio comparison telemetry', () => {
    const html = renderToStaticMarkup(
      React.createElement(GenerativeWidgetRenderer, {
        widgetType: 'portfolio_comparison',
        payload: {
          title: 'Core vs Growth Comparison',
          startYear: 2018,
          endYear: 2024,
          initialValue: 10000,
          portfolios: [
            {
              id: 'p-60-40',
              name: 'Classic 60/40',
              allocations: [
                { symbol: 'VTI', weight: 60 },
                { symbol: 'BND', weight: 40 }
              ]
            },
            {
              id: 'p-growth',
              name: 'Nasdaq Tilt',
              allocations: [
                { symbol: 'QQQ', weight: 80 },
                { symbol: 'BND', weight: 20 }
              ]
            }
          ]
        }
      })
    );
    assert(html.includes('Core vs Growth Comparison'), 'Missing portfolio_comparison title');
    assert(html.includes('[2 Portfolios · 2018-2024]'), 'Missing portfolio count/period badge');
    assert(html.includes('Classic 60/40'), 'Missing first portfolio name');
    assert(html.includes('Nasdaq Tilt'), 'Missing second portfolio name');
    assert(html.includes('CAGR') && html.includes('Sharpe') && html.includes('Max DD'), 'Missing telemetry columns');
  });

  // =========================================================================
  // TIER 4: Real-World Application Scenarios (5 Comprehensive Scenarios)
  // =========================================================================
  setTier(4);
  console.log('\n--- Tier 4: Real-World Application Scenarios ---');

  // Scenario 1: End-to-End Portfolio Optimization and Backtest Validation
  await runTest('T4.01', 'Scenario 1: End-to-End 4-Asset MPT Optimization and Historical Backtest', () => {
    // 1. Optimize 4 core ETF universe
    const assets: OptimizationAssetInput[] = [
      { symbol: 'VTI', currentWeight: 40 },
      { symbol: 'BND', currentWeight: 30 },
      { symbol: 'VXUS', currentWeight: 20 },
      { symbol: 'VNQ', currentWeight: 10 }
    ];
    const mpt = runOptimization(assets, 0.04);

    // 2. Validate Max Sharpe weights
    const weightsSum = Object.values(mpt.maxSharpePortfolio.weights).reduce((a, b) => a + b, 0);
    assertClose(weightsSum, 100, 0.5, 'Max Sharpe weights do not sum to 100%');

    // 3. Validate Minimum Volatility has lower risk than Max Sharpe
    assert(
      mpt.minVolatilityPortfolio.volatility < mpt.maxSharpePortfolio.volatility,
      'Min Volatility portfolio should have strictly lower risk than Max Sharpe'
    );

    // 4. Transfer Max Sharpe allocations into Backtest engine for 10-year period (2015-2024)
    const backtestAllocations = Object.entries(mpt.maxSharpePortfolio.weights).map(([symbol, weight]) => ({
      symbol,
      weight
    }));
    const backtest = runBacktest({
      allocations: backtestAllocations,
      initialValue: 100000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2024,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    // 5. Verify backtest performance
    assert(backtest.finalValue > 100000, '10-year backtested final balance must exceed initial $100k');
    assert(backtest.cagr > 5.0, `Expected CAGR > 5%, got ${backtest.cagr}%`);
    assert(Math.abs(backtest.maxDrawdown) > 0, 'Max Drawdown must be recorded');
    assertEqual(backtest.yearHistory.length, 10, 'Expected 10 years in historical sequence');
  });

  // Scenario 2: Retirement Wealth Preservation & Monte Carlo Stress Testing
  await runTest('T4.02', 'Scenario 2: Retirement Wealth Preservation ($1M Nest Egg, 4% Rule, 30 Years)', () => {
    // Model $1,000,000 retirement portfolio with 4% annual withdrawal ($40,000) and 2.5% inflation
    const mc = runMonteCarloSimulation({
      initialInvestment: 1000000,
      expectedAnnualReturn: 7.5,
      annualVolatility: 14.0,
      annualWithdrawal: 40000,
      inflationRate: 2.5,
      years: 30,
      simulationsCount: 1000
    });

    // Verify 30-year horizon points
    assertEqual(mc.percentilesByYear.length, 31, 'Expected 31 points (years 0..30)');

    // 10th percentile (pessimistic) must not crash into negative numbers
    for (const yr of mc.percentilesByYear) {
      assert(yr.p10 >= 0, `Year ${yr.year} p10 balance negative`);
    }

    // Median ending wealth must reflect successful long-term capital preservation
    assert(mc.medianFinalBalance > 500000, `Expected median final balance > $500k, got $${mc.medianFinalBalance}`);
    assert(mc.probabilityOfSuccess > 70, `Expected survival probability > 70%, got ${mc.probabilityOfSuccess}%`);
  });

  // Scenario 3: Quantitative Compounding & Negative Shock Audit
  await runTest('T4.03', 'Scenario 3: Quantitative Compounding ($500/mo, 25 yrs) & Negative Shock ($50k -> $28k)', () => {
    // Part A: 25-year compounding comparison
    const comp = calculateCompoundInterest({
      initialInvestment: 10000,
      monthlyContribution: 500,
      annualInterestRate: 8.0,
      years: 25
    });
    // $10k initial + $500/mo at 8% over 25 years yields ~$540,000+
    assert(comp.finalBalance > 500000, `Expected final balance > $500k, got $${comp.finalBalance}`);
    assertEqual(comp.totalPrincipal, 10000 + 500 * 300, 'Principal mismatch (should be $160,000)');

    // Part B: Negative market shock audit ($50,000 drops to $28,000 over 2 years)
    const shock = calculateCagr({
      initialValue: 50000,
      finalValue: 28000,
      years: 2
    });
    // CAGR = (28000/50000)^0.5 - 1 = (0.56)^0.5 - 1 = 0.7483 - 1 = -25.17%
    assertClose(shock.cagr, -25.17, 0.1, 'Market shock CAGR mismatch');
    assertEqual(shock.totalGain, -22000, 'Capital loss mismatch');
    assertEqual(shock.totalReturnPercent, -44.00, 'Return percent mismatch (-44%)');
    assertEqual(shock.yearlySchedule.length, 3, 'Schedule should have 3 rows (years 0, 1, 2)');
  });

  // Scenario 4: AI Copilot Strategy Exploration & Generative Widget Dispatch
  await runTest('T4.04', 'Scenario 4: AI Copilot Exploration & Generative Widget Dispatch', () => {
    // 1. Process All-Weather prompt
    const aiResponse = processAiQuery('all weather strategy');
    assert(aiResponse.text.length > 0, 'AI Assistant returned empty text');

    // 2. Validate narrative tone: zero exclamation marks
    assertNotMatches(aiResponse.text, /!/, 'AI response text contains exclamation marks');

    // 3. Verify attached backtest telemetry
    assert(aiResponse.backtestData !== undefined, 'aiResponse missing backtestData');
    const { cagr, sharpeRatio, maxDrawdown, allocations } = aiResponse.backtestData!;
    assert(cagr > 0, 'CAGR must be positive');
    assert(sharpeRatio > 0, 'Sharpe ratio must be positive');
    assert(Math.abs(maxDrawdown) > 0, 'Max Drawdown magnitude must be positive');
    assert(allocations.length >= 3, 'All weather portfolio must contain at least 3 assets');
  });

  // Scenario 5: Precision Studio Visual & Responsive Quality Audit (Full Recursive Scan)
  await runTest('T4.05', 'Scenario 5: Precision Studio Antislop & Unverified Claims Recursive Audit', () => {
    const srcFiles = walkFiles(path.resolve(ROOT, 'src'), ['.ts', '.tsx', '.css']);
    const shellFiles = [
      path.resolve(ROOT, 'index.html'),
      path.resolve(ROOT, 'public', 'brand-icon.svg')
    ];
    const allTargets = [...srcFiles, ...shellFiles];

    const bannedPatterns: [RegExp, string][] = [
      [/#00A76F/i, '#00A76F'],
      [/#2bbe85/i, '#2bbe85'],
      [/#0F141C/i, '#0F141C'],
      [/#F4F6F8/i, '#F4F6F8'],
      [/#863bff/i, '#863bff'],
      [/from-purple-/i, 'from-purple-'],
      [/from-indigo-/i, 'from-indigo-'],
      [/shadow-neon/i, 'shadow-neon'],
      [/amber-/i, 'amber-'],
      [/40\+ years/, '40+ years'],
      [/500,000\+/, '500,000+'],
      [/AI-powered/i, 'AI-powered'],
      [/GEMINI 3\.8 FLASH/i, 'GEMINI 3.8 FLASH']
    ];

    for (const filePath of allTargets) {
      assert(fs.existsSync(filePath), `Expected file missing: ${filePath}`);
      const code = fs.readFileSync(filePath, 'utf-8');
      const rel = path.relative(ROOT, filePath);
      for (const [pattern, label] of bannedPatterns) {
        assertNotMatches(code, pattern, `Found banned ${label} in ${rel}`);
      }
    }

    // Verify legacy public SVGs were deleted
    assert(!fs.existsSync(path.resolve(ROOT, 'public', 'favicon.svg')), 'public/favicon.svg must be deleted');
    assert(
      !fs.existsSync(path.resolve(ROOT, 'public', 'portfolio-metrics-lockup.svg')),
      'public/portfolio-metrics-lockup.svg must be deleted'
    );

    // Audit tailwind configuration
    const tailwind = readFileSafe('tailwind.config.js');
    assertMatches(tailwind, /#ff5f14/i, 'tailwind.config.js missing #ff5f14');
    assertMatches(tailwind, /semantic/i, 'tailwind.config.js missing semantic tokens');
    assertMatches(tailwind, /Geist/i, 'tailwind.config.js missing Geist font families');
  });

  // =========================================================================
  // SUMMARY REPORTING
  // =========================================================================
  const t1 = testResults.filter(t => t.tier === 1);
  const t2 = testResults.filter(t => t.tier === 2);
  const t3 = testResults.filter(t => t.tier === 3);
  const t4 = testResults.filter(t => t.tier === 4);

  const t1Pass = t1.filter(t => t.passed).length;
  const t2Pass = t2.filter(t => t.passed).length;
  const t3Pass = t3.filter(t => t.passed).length;
  const t4Pass = t4.filter(t => t.passed).length;

  const totalTests = testResults.length;
  const totalPassed = testResults.filter(t => t.passed).length;
  const totalFailed = testResults.filter(t => !t.passed).length;

  console.log('\n======================================================================');
  console.log('                 PORTFOLIOMETRICS E2E TEST SUMMARY                   ');
  console.log('======================================================================');
  console.log(`Tier 1: Feature Coverage ................ ${t1Pass} / ${t1.length} passed`);
  console.log(`Tier 2: Boundary & Corner Cases ......... ${t2Pass} / ${t2.length} passed`);
  console.log(`Tier 3: Cross-Feature Interactions ...... ${t3Pass} / ${t3.length} passed`);
  console.log(`Tier 4: Real-World Application Scenarios. ${t4Pass} / ${t4.length} passed`);
  console.log('----------------------------------------------------------------------');
  console.log(`Summary: Total Tests: ${totalTests} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
  console.log('======================================================================\n');

  if (totalFailed > 0) {
    console.log('FAILED TESTS DETAIL:');
    for (const r of testResults.filter(t => !t.passed)) {
      console.log(`  - [Tier ${r.tier}] ${r.id}: ${r.name}`);
      console.log(`    ${r.error}`);
    }
    console.log('\nResult: FAILED (Tests detected outstanding defects or unimplemented features)');
    process.exit(1);
  } else {
    console.log('Result: 100% PASSED (All tiers verified successfully)');
    process.exit(0);
  }
}

// Execute main suite
main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
