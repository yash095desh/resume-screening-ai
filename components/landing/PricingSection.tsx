import { Button } from "@/components/ui/button";
import { Check, Zap, Building2, Crown } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    icon: Zap,
    price: "3,999",
    period: "per month",
    description: "Perfect for solo recruiters getting started with AI hiring.",
    features: [
      "AI Sourcing (500 searches/mo)",
      "Resume Screening",
      "Basic Email Automation",
      "Unified Inbox",
      "Email Support",
    ],
    cta: "Start Free Trial",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Professional",
    icon: Building2,
    price: "7,999",
    period: "per month",
    description: "Full hiring cycle automation for growing teams.",
    features: [
      "Unlimited AI Sourcing",
      "Advanced Screening & Scoring",
      "AI Voice Interviewer",
      "Email Automation Sequences",
      "Unified Inbox + Scheduling",
      "Team Collaboration (5 seats)",
      "Priority Support",
    ],
    cta: "Start Free Trial",
    variant: "gradient" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    icon: Crown,
    price: "Custom",
    period: "contact us",
    description: "Custom solutions for large recruiting teams.",
    features: [
      "Everything in Professional",
      "Unlimited Team Members",
      "Custom AI Interview Scripts",
      "ATS/HRIS Integrations",
      "Dedicated Account Manager",
      "SSO & Advanced Security",
      "Custom Contracts",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false,
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
            Pay less than what you'd spend on just one competitor tool. Get all 5 features included.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "glass-card border-2 border-landing-primary/50 scale-105"
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-landing-primary/20 to-landing-accent/20 flex items-center justify-center">
                  <plan.icon className="w-6 h-6 text-landing-primary" />
                </div>
                <h3 className="text-xl font-bold text-hero-text font-display">
                  {plan.name}
                </h3>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  {plan.price !== "Custom" && (
                    <span className="text-hero-muted text-xl">₹</span>
                  )}
                  <span className="text-4xl font-bold text-hero-text font-display">
                    {plan.price}
                  </span>
                </div>
                <span className="text-sm text-hero-muted">{plan.period}</span>
              </div>

              {/* Description */}
              <p className="text-hero-muted mb-6">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-landing-primary flex-shrink-0 mt-0.5" />
                    <span className="text-hero-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link href="/sign-up">
                <Button
                  variant={plan.variant}
                  size="xl"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison note */}
        <div className="mt-16 text-center glass-card rounded-2xl p-6 max-w-2xl mx-auto">
          <p className="text-hero-muted">
            <span className="text-landing-primary font-semibold">Compare:</span> Competitors charge ₹14,000+ for just sourcing, ₹8,000+ for email automation, and ₹16,000+ for AI interviews separately.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
