import { Star, Quote, User } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    role: "Head of Talent Acquisition",
    company: "Immigrant Networks",
    content: "We used to juggle 4 different tools for recruiting. RecruitKar replaced them all. The AI interviewer alone saved us 15 hours per week.",
    metric: "75% less time sourcing",
  },
  {
    name: "James K.",
    role: "Senior Technical Recruiter",
    company: "AVL",
    content: "The unified inbox is a game-changer. All candidate emails, tracking, and scheduling in one place. No more switching between tools.",
    metric: "3x response rate",
  },
  {
    name: "Maria L.",
    role: "VP of People Operations",
    company: "Hypergrow",
    content: "The AI voice interviews run 24/7. Candidates can interview on their schedule, and we get detailed insights without lifting a finger.",
    metric: "60% faster hiring",
  },
  {
    name: "David R.",
    role: "Recruiting Manager",
    company: "WoT",
    content: "Finally, one platform that handles the entire hiring cycle. From sourcing to screening to interviews - it's all connected.",
    metric: "40% more hires",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 section-medium relative">
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-hero-muted mb-4">
            Trusted by Recruiters
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-hero-text font-display mb-6">
            Why Recruiters Choose{" "}
            <span className="text-gradient-primary">Us</span>
          </h2>
          <p className="text-lg text-hero-muted">
            Join recruiters who&apos;ve simplified their hiring workflow with one unified platform.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-8 relative group hover:border-landing-primary/30 transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="w-12 h-12 text-landing-primary" />
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-hero-text text-lg leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Metric Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-landing-primary/10 text-landing-primary text-sm font-medium mb-6">
                {testimonial.metric}
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-landing-primary" />
                </div>
                <div>
                  <div className="font-semibold text-hero-text font-display">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-hero-muted">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Banner */}
        <div className="mt-16 glass-card rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "6-in-1", label: "Tools Replaced" },
              { value: "75%", label: "Time Saved" },
              { value: "24/7", label: "AI Interviews" },
              { value: "3x", label: "Faster Hiring" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold text-gradient-primary font-display mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-hero-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
