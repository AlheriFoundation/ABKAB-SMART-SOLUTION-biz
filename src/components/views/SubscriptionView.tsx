import React, { useState } from 'react';
import { Crown, Check, Sparkles, Shield, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatNaira } from '../../utils/formatters';

interface Plan {
  id: 'starter' | 'growth' | 'pro';
  name: string;
  price: number;
  period: string;
  tagline: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    price: 0,
    period: 'Free Forever',
    tagline: 'Best for solo traders & new small kiosks',
    features: [
      'Up to 30 inventory products',
      'Record sales & generate receipts',
      'Basic expense tracker',
      '1 Staff / Cashier account',
      'Standard receipt templates',
    ],
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    price: 15000,
    period: 'per month',
    tagline: 'Ideal for expanding retail stores & supermarkets',
    popular: true,
    features: [
      'Unlimited products & stock tracking',
      'Unlimited sales & official receipts',
      'Low-stock threshold alerts',
      'Up to 5 Staff & Role management',
      'Certified Profit & Loss statements',
      'VAT 7.5% commercial invoices',
      'Customer & Supplier credit ledger',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Enterprise',
    price: 35000,
    period: 'per month',
    tagline: 'For wholesale distributors & multi-store enterprises',
    features: [
      'Everything in Growth Plan',
      'Multi-business branch management',
      'Unlimited staff & cashier accounts',
      'Advanced cost valuation analytics',
      'Custom branded invoice templates',
      'Priority WhatsApp onboarding support',
      'Direct data export & backup',
    ],
  },
];

export const SubscriptionView: React.FC = () => {
  const { activeBusiness, updateActiveBusiness, isDemoMode, isSuperAdmin } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentPlanId = activeBusiness?.plan || 'growth';

  const handleSimulateUpgrade = async () => {
    if (!selectedPlan) return;
    setUpgrading(true);
    setErrorMsg(null);

    // In production, normal clients are prevented by Firestore rules from modifying plan/planStatus
    if (!isDemoMode && !isSuperAdmin) {
      setErrorMsg(
        'Server-Side Payment Enforcement: Subscription upgrades require verified payment gateway webhooks (Paystack / Flutterwave). Client-side attempts are rejected by Cloud Firestore security rules.'
      );
      setUpgrading(false);
      return;
    }

    try {
      await updateActiveBusiness({
        plan: selectedPlan.id,
        planStatus: 'active',
      });
      setSuccessMsg(`Your subscription has been updated to ${selectedPlan.name}!`);
      setSelectedPlan(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg('Subscription update blocked by database security rules.');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <Crown size={24} className="text-[#D8B45A]" />
          <span>Subscription & SaaS Plans</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Flexible pricing built for Nigerian businesses. Scale your operations with ABKAB BizManager.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center space-x-2 animate-in fade-in">
          <Check size={18} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center space-x-2 animate-in fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Current plan banner */}
      <div className="bg-[#10294B] text-white p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm border border-[#1b3e70]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D8B45A] text-[#10294B]">
              Active Subscription
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                activeBusiness?.planStatus === 'active'
                  ? 'bg-emerald-500 text-white'
                  : activeBusiness?.planStatus === 'trial'
                  ? 'bg-blue-500 text-white'
                  : 'bg-rose-500 text-white'
              }`}
            >
              Status: {activeBusiness?.planStatus?.toUpperCase() || 'ACTIVE'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold mt-1">
            {activeBusiness?.plan === 'pro'
              ? 'Pro Enterprise'
              : activeBusiness?.plan === 'starter'
              ? 'Starter Plan'
              : 'Growth Plan'}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Registered Business: <span className="text-white font-semibold">{activeBusiness?.name}</span>
          </p>
        </div>

        <div className="flex flex-col sm:items-end space-y-1.5">
          <p className="text-xs text-slate-300">Test Subscription Status:</p>
          <div className="flex items-center space-x-1.5 bg-[#0d223f] p-1 rounded-lg border border-[#1e447b]">
            <button
              onClick={() => updateActiveBusiness({ planStatus: 'active' })}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                activeBusiness?.planStatus === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => updateActiveBusiness({ planStatus: 'trial' })}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                activeBusiness?.planStatus === 'trial'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Trial
            </button>
            <button
              onClick={() => updateActiveBusiness({ planStatus: 'expired' })}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                activeBusiness?.planStatus === 'expired'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Expired
            </button>
          </div>
        </div>
      </div>

      {/* Warning banner when subscription is expired */}
      {activeBusiness?.planStatus === 'expired' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm flex items-start space-x-3 shadow-xs">
          <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Subscription Expired / Payment Required</p>
            <p className="text-xs text-rose-700 mt-0.5">
              Your business subscription for <strong>{activeBusiness?.name}</strong> has expired. Unpaid or expired accounts are restricted from generating new sales transactions and issuing commercial invoices. Please renew your plan below to restore operations.
            </p>
          </div>
        </div>
      )}

      {/* Pricing Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {PLANS.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 flex flex-col justify-between transition relative ${
                plan.popular
                  ? 'bg-white border-2 border-[#D8B45A] shadow-xl'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#D8B45A] text-[#10294B] text-[10px] font-extrabold uppercase rounded-full shadow-xs tracking-wide">
                  Most Popular for SMBs
                </div>
              )}

              <div>
                <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.tagline}</p>

                <div className="my-5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#10294B]">
                    {plan.price === 0 ? 'Free' : formatNaira(plan.price)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">/{plan.period}</span>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Included Capabilities:
                  </p>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-slate-700">
                      <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold cursor-default"
                  >
                    Current Active Tier
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="w-full py-2.5 rounded-xl bg-[#10294B] hover:bg-[#15345d] text-white text-xs font-bold transition shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <span>Upgrade to {plan.name}</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Simulation Modal (Zero card charges) */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#10294B] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown size={18} className="text-[#D8B45A]" />
                <h3 className="text-sm font-bold">Confirm Plan Subscription</h3>
              </div>
              <button onClick={() => setSelectedPlan(null)} className="text-slate-300 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#faf4e6] border border-[#f0dca5] text-xs text-[#10294B]">
                <p className="font-bold">Zero-Risk Simulation</p>
                <p className="mt-1">
                  In compliance with safety rules, no real debit card will be charged. This will simulate instantaneous activation on your business account.
                </p>
              </div>

              {/* Supported Nigerian Payment Gateways */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Supported Payment Channels (Nigeria):
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                      P
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-[11px]">Paystack</p>
                      <p className="text-[9px] text-slate-500">Cards, Apple Pay, Transfer</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-[10px]">
                      F
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-[11px]">Flutterwave</p>
                      <p className="text-[9px] text-slate-500">Bank Transfer, USSD, Cards</p>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-800">Corporate Wire Transfer:</span> Transfer directly to ABKAB Smart Solution Ltd corporate account. Contact support for instant activation.
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Selected Tier:</span>
                  <span className="font-bold text-slate-900">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Recurring Amount:</span>
                  <span className="font-bold text-slate-900">
                    {selectedPlan.price === 0 ? 'Free' : formatNaira(selectedPlan.price)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Business:</span>
                  <span className="font-medium text-slate-900">{activeBusiness?.name}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSimulateUpgrade}
                  disabled={upgrading}
                  className="px-5 py-2.5 bg-[#10294B] text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {upgrading ? 'Activating...' : `Activate ${selectedPlan.name}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
