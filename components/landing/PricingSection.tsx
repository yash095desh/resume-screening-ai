'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check, Zap, Building2, Crown, Sparkles, Rocket, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth/hooks";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    icon: Sparkles,
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    annualTotalPrice: 0,
    credits: 200,
    period: "forever",
    description: "Get started with AI-powered hiring at no cost.",
    features: [
      "200 unified credits/month",
      "Screen up to 200 resumes",
      "Source up to 33 candidates",
      "1 AI voice interview",
      "Email outreach included",
      "Community support",
    ],
    ctaLoggedOut: "Get Started Free",
    ctaLoggedIn: "Current Plan",
    popular: false,
    slug: "free",
    annualSlug: "free",
  },
  {
    name: "Starter",
    icon: Zap,
    monthlyPrice: 999,
    annualMonthlyPrice: 849,
    annualTotalPrice: 10188,
    credits: 400,
    period: "per month",
    description: "Perfect for solo recruiters getting started with AI hiring.",
    features: [
      "400 unified credits/month",
      "Screen up to 400 resumes",
      "Source up to 66 candidates",
      "2 AI voice interviews",
      "Unlimited email sequences",
      "Priority email support",
    ],
    ctaLoggedOut: "Get Started",
    ctaLoggedIn: "Upgrade to Starter",
    popular: false,
    slug: "starter",
    annualSlug: "starter-annual",
  },
  {
    name: "Growth",
    icon: Rocket,
    monthlyPrice: 2499,
    annualMonthlyPrice: 2124,
    annualTotalPrice: 25488,
    credits: 1500,
    period: "per month",
    description: "For growing teams scaling their recruitment pipeline.",
    features: [
      "1,500 unified credits/month",
      "Screen up to 1,500 resumes",
      "Source up to 250 candidates",
      "10 AI voice interviews",
      "Unused credits carry over",
      "Priority support + onboarding",
    ],
    ctaLoggedOut: "Get Started",
    ctaLoggedIn: "Upgrade to Growth",
    popular: true,
    slug: "growth",
    annualSlug: "growth-annual",
  },
  {
    name: "Pro",
    icon: Building2,
    monthlyPrice: 6999,
    annualMonthlyPrice: 5949,
    annualTotalPrice: 71388,
    credits: 5000,
    period: "per month",
    description: "Full hiring cycle automation for professional teams.",
    features: [
      "5,000 unified credits/month",
      "Screen up to 5,000 resumes",
      "Source up to 833 candidates",
      "34 AI voice interviews",
      "Unused credits carry over",
      "Dedicated account manager",
    ],
    ctaLoggedOut: "Get Started",
    ctaLoggedIn: "Upgrade to Pro",
    popular: false,
    slug: "pro",
    annualSlug: "pro-annual",
  },
  {
    name: "Enterprise",
    icon: Crown,
    monthlyPrice: 17999,
    annualMonthlyPrice: 15299,
    annualTotalPrice: 183588,
    credits: 15000,
    period: "per month",
    description: "Maximum capacity for high-volume recruiting operations.",
    features: [
      "15,000 unified credits/month",
      "Screen up to 15,000 resumes",
      "Source up to 2,500 candidates",
      "103 AI voice interviews",
      "Unused credits carry over",
      "Custom onboarding + SLA",
    ],
    ctaLoggedOut: "Get Started",
    ctaLoggedIn: "Upgrade to Enterprise",
    popular: false,
    slug: "enterprise",
    annualSlug: "enterprise-annual",
  },
];

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-IN').format(amount);
};

const PricingSection = () => {
  const { isSignedIn } = useAuth();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section id="pricing" className="py-24 section-light relative overflow-hidden scroll-mt-20">
      {/* Background elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-landing-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-landing-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-hero-muted mb-4">
            Simple Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-hero-text font-display mb-6">
            One Platform.{" "}
            <span className="text-gradient-primary">Affordable Pricing.</span>
          </h2>
          <p className="text-lg text-hero-muted">
            Pay less than what you&apos;d spend on just one competitor tool. Get all 4 features included.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billing === 'monthly'
                ? 'glass-card border border-landing-primary/50 text-hero-text'
                : 'text-hero-muted hover:text-hero-text'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              billing === 'annual'
                ? 'glass-card border border-landing-primary/50 text-hero-text'
                : 'text-hero-muted hover:text-hero-text'
            }`}
          >
            Annual
            <span className="px-2 py-0.5 rounded-full bg-landing-primary/20 text-landing-primary text-xs font-semibold">
              Save 15%
            </span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5 max-w-7xl mx-auto">
          {PLANS.map((plan) => {
            const isFreePlan = plan.slug === "free";
            const price = billing === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice;
            const slug = billing === 'annual' && !isFreePlan ? plan.annualSlug : plan.slug;

            const href = isSignedIn
              ? isFreePlan
                ? "/dashboard"
                : `/settings/billing?plan=${slug}`
              : "/sign-up";

            return (
              <div
                key={plan.slug}
                className={`relative rounded-2xl p-5 flex flex-col ${
                  plan.popular
                    ? "glass-card border-2 border-landing-primary/50 lg:scale-105"
                    : "glass-card"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-linear-to-r from-landing-primary to-landing-accent text-white text-sm font-medium whitespace-nowrap">
                      Best Value
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-br from-landing-primary/20 to-landing-accent/20 flex items-center justify-center">
                    <plan.icon className="w-4 h-4 text-landing-primary" />
                  </div>
                  <h3 className="text-base font-bold text-hero-text font-display">
                    {plan.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-hero-muted text-base">₹</span>
                    <span className="text-2xl font-bold text-hero-text font-display">
                      {formatPrice(price)}
                    </span>
                  </div>
                  <span className="text-xs text-hero-muted">
                    {isFreePlan ? 'forever' : billing === 'annual' ? '/mo, billed annually' : 'per month'}
                  </span>
                  {billing === 'annual' && !isFreePlan && (
                    <p className="text-xs text-hero-muted mt-0.5">
                      ₹{formatPrice(plan.annualTotalPrice)}/year
                    </p>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-hero-muted mb-4">{plan.description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-landing-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-hero-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {isSignedIn && isFreePlan ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full mt-auto"
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Link href={href}>
                    <Button
                      variant={plan.popular ? "gradient" as any : "outline"}
                      size="lg"
                      className="w-full mt-auto"
                    >
                      {isSignedIn ? plan.ctaLoggedIn : plan.ctaLoggedOut}
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Plan CTA */}
        <div className="mt-10 max-w-3xl mx-auto glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-hero-text">Need a custom plan?</h4>
            <p className="text-sm text-hero-muted mt-1">
              Looking for volume pricing, dedicated support, or a plan tailored to your team? We&apos;ll build one for you.
            </p>
          </div>
          <a href="mailto:info@recruitkar.com">
            <Button variant="outline" className="shrink-0">
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </a>
        </div>

        {/* Buy Credits Note */}
        <div className="mt-12 text-center">
          <p className="text-hero-muted mb-4">
            Need more credits? Buy any amount instantly from your dashboard starting at ₹5/credit. Unused credits carry over every month.
          </p>
        </div>

        {/* Comparison note */}
        <div className="mt-8 text-center glass-card rounded-2xl p-6 max-w-2xl mx-auto">
          <p className="text-hero-muted">
            <span className="text-landing-primary font-semibold">Compare:</span> Competitors charge ₹14,000+ for just sourcing, ₹8,000+ for email automation, and ₹16,000+ for AI interviews separately.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
