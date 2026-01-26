import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const CTASection = () => {
  return (
    <section className="py-24 section-medium relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto glass-card rounded-3xl p-12 md:p-16 text-center relative overflow-hidden border border-landing-primary/20">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-landing-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-landing-accent/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-hero-text font-display mb-6">
              Ready to End the{" "}
              <span className="text-gradient-primary">Hiring Chaos?</span>
            </h2>
            <p className="text-lg text-hero-muted max-w-2xl mx-auto mb-10">
              No more wasted hours on unqualified candidates. No more scheduling nightmares. No more losing top talent to slow processes. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button variant="gradient" size="xl">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="heroOutline" size="xl">
                Book a Demo
              </Button>
            </div>
            <p className="text-sm text-hero-muted mt-6">
              No credit card required  ·  14-day free trial  ·  Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
