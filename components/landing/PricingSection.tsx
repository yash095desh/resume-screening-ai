'use client';

import { Button } from "@/components/ui/button";
import { Check, Zap, Building2, Crown, Sparkles } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    icon: Sparkles,
    price: "0",
    period: "forever",
    description: "Get started with AI-powered hiring at no cost.",
    features: [
      "10 LinkedIn sourcing credits/mo",
      "25 Resume screening credits/mo",
      "25 AI Interview credits/mo",
      "100 Email outreach credits/mo",
      "Basic email support",
    ],
    cta: "Get Started Free",
    variant: "outline" as const,
    popular: false,
    slug: "free",
  },
  {
    name: "Starter",
    icon: Zap,
    price: "1,499",
    period: "per month",
    description: "Perfect for solo recruiters getting started with AI hiring.",
    features: [
      "25 LinkedIn sourcing credits/mo",
      "50 Resume screening credits/mo",
      "50 AI Interview credits/mo",
      "200 Email outreach credits/mo",
      "Priority email support",
    ],
    cta: "Start Free Trial",
    variant: "outline" as const,
    popular: false,
    slug: "starter",
  },
  {
    name: "Pro",
    icon: Building2,
    price: "3,499",
    period: "per month",
    description: "Full hiring cycle automation for growing teams.",
    features: [
      "75 LinkedIn sourcing credits/mo",
      "150 Resume screening credits/mo",
      "150 AI Interview credits/mo",
      "500 Email outreach credits/mo",
      "Priority support + onboarding",
    ],
    cta: "Start Free Trial",
    variant: "gradient" as const,
    popular: true,
    slug: "pro",
  },
  {
    name: "Max",
    icon: Crown,
    price: "5,999",
    period: "per month",
    description: "Maximum credits for high-volume recruiting teams.",
    features: [
      "150 LinkedIn sourcing credits/mo",
      "300 Resume screening credits/mo",
      "300 AI Interview credits/mo",
      "1,000 Email outreach credits/mo",
      "Dedicated account manager",
    ],
    cta: "Start Free Trial",
    variant: "outline" as const,
    popular: false,
    slug: "max",
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 section-light relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-landing-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-landing-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
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

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? "glass-card border-2 border-landing-primary/50 lg:scale-105"
                  : "glass-card"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-landing-primary to-landing-accent text-white text-sm font-medium">
                    Best Value
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-landing-primary/20 to-landing-accent/20 flex items-center justify-center">
                  <plan.icon className="w-5 h-5 text-landing-primary" />
                </div>
                <h3 className="text-lg font-bold text-hero-text font-display">
                  {plan.name}
                </h3>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-hero-muted text-lg">₹</span>
                  <span className="text-3xl font-bold text-hero-text font-display">
                    {plan.price}
                  </span>
                </div>
                <span className="text-sm text-hero-muted">{plan.period}</span>
              </div>

              {/* Description */}
              <p className="text-sm text-hero-muted mb-6">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-landing-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-hero-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link href="/sign-up">
                <Button
                  variant={plan.variant}
                  size="lg"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Credit Packs Note */}
        <div className="mt-12 text-center">
          <p className="text-hero-muted mb-4">
            Need more credits? Purchase additional credit packs anytime from your dashboard.
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
