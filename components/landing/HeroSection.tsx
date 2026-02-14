"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="hero-gradient min-h-screen relative overflow-hidden flex items-center mt-4">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-landing-primary/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-landing-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
            <span className="w-2 h-2 bg-landing-accent rounded-full animate-pulse" />
            <span className="text-sm text-hero-muted">Stop Fighting Your Hiring Process</span>
          </div>

          {/* Main Headline */}
          <h1 className="animate-fade-up-delay-1 text-4xl md:text-6xl lg:text-7xl font-bold text-hero-text font-display leading-tight mb-6">
            Hire Better Candidates.{" "}
            <span className="text-gradient-primary">Faster.</span>{" "}
            Without the Chaos.
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up-delay-2 text-lg md:text-xl text-hero-muted max-w-2xl mx-auto mb-10">
            No more unqualified applicants, scheduling nightmares, or candidates falling through cracks. AI handles the grind so you can focus on hiring.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href="mailto:info@recruitkar.com">
              <Button variant="gradient" size="xl" className="w-full sm:w-auto">
                Get in Touch
                <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
            <a href="#demo">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </a>
          </div>

          {/* Stats - Problem-focused */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: "67%", label: "Less Time on Bad Resumes" },
              { value: "0", label: "Scheduling Emails" },
              { value: "3x", label: "Faster Time-to-Hire" },
              { value: "0%", label: "Candidates Lost to Cracks" },
            ].map((stat, index) => (
              <div key={index} className="glass-card rounded-2xl p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient-primary font-display">
                  {stat.value}
                </div>
                <div className="text-sm text-hero-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
