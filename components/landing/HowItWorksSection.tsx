import { Search, FileCheck, Mail, Mic, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Quality Candidates Only",
    oldWay: "Hours spent on unqualified resumes",
    description: "AI finds and ranks candidates who actually match. Duplicates are auto-filtered. You see only people worth your time.",
  },
  {
    icon: FileCheck,
    step: "02",
    title: "Contextual Screening",
    oldWay: "Keywords reject great candidates",
    description: "AI understands context - career progression, skill fit, seniority match. No more losing talent to dumb filters.",
  },
  {
    icon: Mail,
    step: "03",
    title: "Outreach That Works",
    oldWay: "85% of cold emails ignored",
    description: "Personalized sequences with smart timing. Auto follow-ups ensure you stay visible. Watch response rates climb.",
  },
  {
    icon: Mic,
    step: "04",
    title: "Interviews Without Scheduling",
    oldWay: "Endless back-and-forth for one meeting",
    description: "AI conducts voice interviews 24/7. Candidates choose their time. You get scored insights, not calendar nightmares.",
  },
  {
    icon: CheckCircle2,
    step: "05",
    title: "Hire Before Competitors",
    oldWay: "Best candidates gone in 10 days",
    description: "Move fast with AI-powered insights. Compare candidates instantly. Make confident decisions while others are still scheduling.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 section-light relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-hero-muted mb-4">
            The Better Way
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-hero-text font-display mb-6">
            From Frustration to{" "}
            <span className="text-gradient-primary">First Hire</span>
          </h2>
          <p className="text-lg text-hero-muted">
            Every step eliminates a pain point. No more wasted hours, lost candidates, or hiring delays.
          </p>
        </div>

        {/* Timeline style layout */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative flex gap-6 pb-12 last:pb-0">
              {/* Timeline line */}
              {index < steps.length - 1 && (
                <div className="absolute left-7 top-14 w-px h-full bg-gradient-to-b from-landing-primary/50 to-landing-accent/50" />
              )}

              {/* Step number */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-landing-primary to-landing-accent flex items-center justify-center relative z-10">
                  <step.icon className="w-7 h-7 text-landing-primary-foreground" />
                </div>
              </div>

              {/* Content */}
              <div className="glass-card rounded-2xl p-6 flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-landing-primary">Step {step.step}</span>
                  <span className="text-xs text-landing-destructive/70 line-through">{step.oldWay}</span>
                </div>
                <h3 className="text-xl font-semibold text-hero-text font-display mb-2">
                  {step.title}
                </h3>
                <p className="text-hero-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom callout */}
        <div className="mt-12 text-center">
          <p className="text-hero-muted">
            Average time to first hire: <span className="text-landing-primary font-semibold">2 weeks</span> (vs. industry average of 6+ weeks)
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
