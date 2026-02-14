import { Search, FileCheck, Mic, Mail, Inbox, Columns3 } from "lucide-react";

const solutions = [
  {
    icon: Search,
    title: "AI Sourcing",
    description: "Smart candidate discovery that finds people who actually match. No more wading through unqualified resumes or duplicates.",
    highlight: "67% less time wasted",
    gradient: "from-blue-500 to-cyan-500",
    iconColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: FileCheck,
    title: "AI Resume Analysis",
    description: "Context-aware screening that understands career progression. Great candidates never get auto-rejected by dumb keywords again.",
    highlight: "75% more qualified hires",
    gradient: "from-violet-500 to-purple-500",
    iconColor: "text-violet-400",
    bgColor: "bg-violet-500/10",
  },
  {
    icon: Mic,
    title: "AI Voice Interviewer",
    description: "24/7 automated interviews candidates take on their schedule. You get scored insights and transcripts, zero calendar chaos.",
    highlight: "Zero scheduling emails",
    gradient: "from-emerald-500 to-teal-500",
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Mail,
    title: "Email Automation",
    description: "Personalized outreach with smart timing and auto follow-ups. Stop being another ignored message in the inbox.",
    highlight: "3x better responses",
    gradient: "from-orange-500 to-amber-500",
    iconColor: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Inbox,
    title: "Unified Inbox",
    description: "All candidate conversations in one place—email, LinkedIn, texts. Never lose context or drop the ball again.",
    highlight: "100% message visibility",
    gradient: "from-pink-500 to-rose-500",
    iconColor: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Columns3,
    title: "Candidate Pipeline",
    description: "Visual tracking with automated reminders ensures no candidate falls through the cracks. Stay organized effortlessly.",
    highlight: "0% candidates lost",
    gradient: "from-indigo-500 to-blue-500",
    iconColor: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 section-medium relative overflow-hidden scroll-mt-20">
      {/* Background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-landing-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-landing-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-landing-primary mb-4">
            The Solutions
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-hero-text font-display mb-6">
            Everything You Need to{" "}
            <span className="text-gradient-primary">Hire Smarter</span>
          </h2>
          <p className="text-lg text-hero-muted">
            Six powerful tools working together. One seamless platform. Zero chaos.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <div
                key={index}
                className="group relative rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 p-8 hover:border-white/20 transition-all duration-500 hover:-translate-y-2"
              >
                {/* Colored glow on hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${solution.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl`} />

                {/* Decorative corner accent */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${solution.gradient} opacity-[0.07] rounded-tr-3xl rounded-bl-full`} />

                {/* Icon with gradient border */}
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${solution.gradient} p-[1px] mb-6`}>
                  <div className="w-full h-full rounded-2xl bg-background/90 flex items-center justify-center group-hover:bg-background/70 transition-colors duration-300">
                    <Icon className={`w-8 h-8 ${solution.iconColor}`} />
                  </div>
                </div>

                {/* Highlight badge */}
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold mb-4 bg-gradient-to-r ${solution.gradient} text-white`}>
                  {solution.highlight}
                </div>

                <h3 className="text-xl font-bold text-hero-text font-display mb-3 group-hover:text-white transition-colors duration-300">
                  {solution.title}
                </h3>

                <p className="text-hero-muted leading-relaxed">
                  {solution.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
