import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface SelectedPlanModalData {
  name: string;
  price: number;
  currency: string;
  cycle: string;
  features: string[];
}

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
  const [selectedPlanModal, setSelectedPlanModal] = useState<SelectedPlanModalData | null>(null);
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);

  const currSymbol = currency === 'USD' ? '$' : '€';
  const multiplier = currency === 'USD' ? 1 : 0.92;

  // Handle Escape key to dismiss dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPlanModal) {
        setSelectedPlanModal(null);
        setCheckoutConfirmed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlanModal]);

  const plans = [
    {
      name: 'Free',
      priceMonthly: 0,
      priceYearly: 0,
      description: 'Historical backtesting and core portfolio modeling.',
      features: [
        'Historical backtesting across global assets',
        'Markowitz modern portfolio optimization',
        'Monte Carlo risk simulations (1,000 trials)',
        'CAGR and compound interest calculators',
        'Full popular portfolio library access',
        'Local client-side execution'
      ],
      cta: 'Active Plan (Included)',
      highlighted: false
    },
    {
      name: 'Pro',
      priceMonthly: Math.round(12 * multiplier),
      priceYearly: Math.round(9.6 * multiplier),
      description: 'Advanced analytics and automated research reporting.',
      features: [
        'Everything in Free',
        'Automated AI Insights generation',
        'Extended Monte Carlo (5,000 trials)',
        'Custom factor regression analysis',
        'High-resolution PDF report export',
        'Unlimited saved custom portfolios'
      ],
      cta: 'Subscribe to Pro Tier',
      highlighted: true
    },
    {
      name: 'Institutional',
      priceMonthly: Math.round(39 * multiplier),
      priceYearly: Math.round(31.2 * multiplier),
      description: 'Multi-seat access for RIAs, family offices, and research teams.',
      features: [
        'Everything in Pro',
        'Quantitative REST API access',
        'Custom benchmark and CSV asset ingestion',
        'Team workspaces and permission roles',
        'Dedicated quantitative support'
      ],
      cta: 'Contact Enterprise Sales',
      highlighted: false
    }
  ];

  const handlePlanSelect = (plan: typeof plans[0]) => {
    const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
    setSelectedPlanModal({
      name: plan.name,
      price,
      currency: currSymbol,
      cycle: billingCycle,
      features: plan.features
    });
    setCheckoutConfirmed(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-1">
        <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-graphite-lightMuted dark:text-graphite-muted">
          <span className="text-primary font-semibold">[SPECS]</span>
          <span>/</span>
          <span>COMPUTE &amp; EXPORT TIERS</span>
        </div>
        <h1 className="text-3xl font-medium tracking-tight text-graphite-lightText dark:text-graphite-text">
          Infrastructure access &amp; pricing
        </h1>
        <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary">
          Open core quantitative simulation with optional extended compute and automated report features.
        </p>

        {/* Toggles */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <div className="inline-flex p-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] text-xs">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-[5px] transition-colors font-medium ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-graphite-card text-graphite-lightText dark:text-graphite-text shadow-sm'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-[5px] transition-colors font-medium ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-graphite-card text-graphite-lightText dark:text-graphite-text shadow-sm'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary'
              }`}
            >
              Annual (20% savings)
            </button>
          </div>

          <div className="inline-flex p-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] text-xs">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`min-h-[44px] px-3 py-1.5 rounded-[5px] transition-colors font-medium ${
                currency === 'USD'
                  ? 'bg-white dark:bg-graphite-card text-graphite-lightText dark:text-graphite-text shadow-sm'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary'
              }`}
            >
              USD
            </button>
            <button
              type="button"
              onClick={() => setCurrency('EUR')}
              className={`min-h-[44px] px-3 py-1.5 rounded-[5px] transition-colors font-medium ${
                currency === 'EUR'
                  ? 'bg-white dark:bg-graphite-card text-graphite-lightText dark:text-graphite-text shadow-sm'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary'
              }`}
            >
              EUR
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const price = billingCycle === 'monthly' ? p.priceMonthly : p.priceYearly;

          return (
            <div
              key={p.name}
              className={`flex flex-col justify-between p-6 rounded-xl bg-white dark:bg-graphite-card border transition-colors ${
                p.highlighted
                  ? 'border-primary dark:border-primary shadow-sm'
                  : 'border-black/[0.08] dark:border-white/[0.08]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-graphite-lightText dark:text-graphite-text">{p.name}</h3>
                  {p.highlighted && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">Standard</span>
                  )}
                </div>
                <p className="text-xs text-graphite-lightMuted dark:text-graphite-muted mt-1 mb-5">{p.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular">{currSymbol}{price}</span>
                  <span className="text-xs text-graphite-lightMuted dark:text-graphite-muted">/ month</span>
                </div>

                <ul className="space-y-2.5 mb-8 text-xs text-graphite-lightSecondary dark:text-graphite-secondary">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check aria-hidden="true" className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handlePlanSelect(p)}
                className={`w-full py-2.5 px-3 min-h-[44px] rounded-md text-xs font-medium transition-colors ${
                  p.highlighted
                    ? 'bg-primary hover:bg-primary-hover text-white'
                    : 'bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-graphite-lightText dark:text-graphite-text'
                }`}
              >
                {p.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Accessible Plan Confirmation Dialog Modal */}
      {selectedPlanModal && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="pricing-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => { setSelectedPlanModal(null); setCheckoutConfirmed(false); }}
        >
          <div 
            className="w-full max-w-md rounded-xl bg-white dark:bg-graphite-card border border-black/[0.1] dark:border-white/[0.1] p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
              <h2 id="pricing-dialog-title" className="text-sm font-medium text-graphite-lightText dark:text-graphite-text">
                {selectedPlanModal.name === 'Free' ? 'Free Tier Details' : `Confirm ${selectedPlanModal.name} Plan`}
              </h2>
              <button
                type="button"
                onClick={() => { setSelectedPlanModal(null); setCheckoutConfirmed(false); }}
                aria-label="Close dialog"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md text-graphite-lightMuted dark:text-graphite-muted hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors"
              >
                <X aria-hidden="true" className="w-4 h-4" />
              </button>
            </div>

            {checkoutConfirmed ? (
              <div className="space-y-4 py-2">
                <div className="p-3.5 rounded-lg bg-semantic-positive/10 border border-semantic-positive/20 text-xs text-semantic-positive">
                  <div className="font-medium">Plan selected successfully</div>
                  <p className="mt-1 text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary">
                    Your account workspace is configured for the {selectedPlanModal.name} tier. You have immediate access to full quantitative modeling capabilities.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedPlanModal(null); setCheckoutConfirmed(false); }}
                  className="w-full py-2.5 px-4 min-h-[44px] rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
                >
                  Return to PortfolioMetrics
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between p-3.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                  <div>
                    <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">
                      {selectedPlanModal.name} Plan ({selectedPlanModal.cycle})
                    </div>
                    <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5">
                      Billed {selectedPlanModal.cycle === 'monthly' ? 'monthly' : 'annually'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular">
                      {selectedPlanModal.currency}{selectedPlanModal.price}
                    </span>
                    <span className="text-xs text-graphite-lightMuted dark:text-graphite-muted">/mo</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-graphite-lightMuted dark:text-graphite-muted uppercase tracking-wider">
                    Included capabilities:
                  </div>
                  <ul className="space-y-1 text-xs text-graphite-lightSecondary dark:text-graphite-secondary">
                    {selectedPlanModal.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check aria-hidden="true" className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedPlanModal(null); setCheckoutConfirmed(false); }}
                    className="flex-1 py-2.5 px-3 min-h-[44px] rounded-md bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-graphite-lightSecondary dark:text-graphite-secondary text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutConfirmed(true)}
                    className="flex-1 py-2.5 px-3 min-h-[44px] rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
                  >
                    Confirm Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
