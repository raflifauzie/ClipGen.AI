import { useState } from 'react';

import { CREDIT_PACKS, PLANS } from '../constants';
import { videosPerPack } from '../utils/credits';
import { Modal } from './Modal';

interface PricingModalProps {
  onClose: () => void;
}

type PricingTab = 'subscribe' | 'topup';

export function PricingModal({ onClose }: PricingModalProps) {
  const [pricingTab, setPricingTab] = useState<PricingTab>('subscribe');
  const [activePlanIndex, setActivePlanIndex] = useState(1);
  const [activePackIndex, setActivePackIndex] = useState(1);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const currentPlan = PLANS[activePlanIndex] ?? PLANS[0];
  const currentPack = CREDIT_PACKS[activePackIndex] ?? CREDIT_PACKS[0];

  const previousPlan = (): void =>
    setActivePlanIndex((current) => (current - 1 + PLANS.length) % PLANS.length);
  const nextPlan = (): void => setActivePlanIndex((current) => (current + 1) % PLANS.length);
  const previousPack = (): void =>
    setActivePackIndex((current) => (current - 1 + CREDIT_PACKS.length) % CREDIT_PACKS.length);
  const nextPack = (): void => setActivePackIndex((current) => (current + 1) % CREDIT_PACKS.length);

  return (
    <Modal title="Pricing & Security" onClose={onClose} maxWidth={560}>
      <p className="panel-description">Secure-first video generation for teams and enterprises.</p>

      <div className="pricing-main-tabs" role="tablist" aria-label="Pricing type">
        <button
          type="button"
          role="tab"
          aria-selected={pricingTab === 'subscribe'}
          className={`main-tab-btn ${pricingTab === 'subscribe' ? 'active' : ''}`}
          onClick={() => setPricingTab('subscribe')}
        >
          Subscribe
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pricingTab === 'topup'}
          className={`main-tab-btn ${pricingTab === 'topup' ? 'active' : ''}`}
          onClick={() => setPricingTab('topup')}
        >
          Pay As You Go
        </button>
      </div>

      {pricingTab === 'subscribe' ? (
        <>
          <div className="billing-toggle">
            <button
              type="button"
              className={`toggle-option ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
              aria-pressed={billingCycle === 'monthly'}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`toggle-option ${billingCycle === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('yearly')}
              aria-pressed={billingCycle === 'yearly'}
            >
              Yearly <span className="discount-badge">-25%</span>
            </button>
          </div>

          <div className="pricing-slider">
            <button type="button" className="slider-arrow left" onClick={previousPlan} aria-label="Previous plan">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="slider-content">
              <div className="pricing-option active">
                <div className="option-header">
                  <div>
                    <span className="plan-name">{currentPlan.name}</span>
                    <div className="plan-subheading">{currentPlan.subheading}</div>
                  </div>
                  <span className="plan-price">
                    ${billingCycle === 'monthly' ? currentPlan.price.monthly : currentPlan.price.yearly}
                    <span className="period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </span>
                </div>

                <p className="plan-desc">{currentPlan.description}</p>

                <div className="option-features">
                  {currentPlan.features.map((feature) => (
                    <div className="feature-item" key={feature}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button type="button" className="slider-arrow right" onClick={nextPlan} aria-label="Next plan">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <div className="pricing-slider">
          <button type="button" className="slider-arrow left" onClick={previousPack} aria-label="Previous credit pack">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="slider-content">
            <div className="pricing-option active credit-pack-card">
              <div className="pack-header">
                <span className="pack-label">{currentPack.label}</span>
                <span className="pack-price">${currentPack.price}</span>
              </div>

              <div className="credit-amount-display">
                <span className="amount-text">{currentPack.credits.toLocaleString()} Credits</span>
              </div>

              <div className="pack-details">
                <p>One-time purchase. AES-256 secure checkout.</p>
                <div className="video-estimate">≈ {videosPerPack(currentPack.credits)} standard videos</div>
              </div>
            </div>
          </div>

          <button type="button" className="slider-arrow right" onClick={nextPack} aria-label="Next credit pack">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      <p className="modal-note">
        Checkout is not connected yet. This build runs on your own Google AI key, so no payment is taken here.
        Enabling billing needs a backend with payment processing.
      </p>

      <button type="button" className="btn-text close-mobile-btn" onClick={onClose}>
        Maybe Later
      </button>
    </Modal>
  );
}
