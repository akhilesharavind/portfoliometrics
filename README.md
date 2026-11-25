# PortfolioMetrics

PortfolioMetrics is a client-side quantitative finance web application for historical portfolio backtesting, Markowitz efficient frontier optimization, and Monte Carlo retirement simulations. It also includes parametric compound interest and CAGR calculators alongside an interactive strategy copilot.

## Prerequisites

- Node.js 18 or later
- npm 9 or later

## Setup and Run

```bash
npm install
npm run dev
```

Additional commands:

```bash
npm run build      # Type-check and build production bundle to dist/
npm run lint       # Run oxlint across source files
npm run test:e2e   # Run the 84-assertion E2E verification suite
```

## Architecture

- `src/services/` contains the client-side calculation engines (`backtestingEngine.ts`, `optimizationEngine.ts`, `monteCarloEngine.ts`, `calculatorEngine.ts`, and `aiAssistantService.ts`).
- `src/components/generative/` and `src/components/copilot/` implement interactive SVG charts and the cross-view copilot drawer synchronized via `src/context/StudioContext.tsx`.
- `src/pages/` houses the tool views, styled with Tailwind CSS (`tailwind.config.js`).
