import { UserX, Ghost, XCircle, Calendar, Inbox, TrendingDown } from "lucide-react";

const painPoints = [
  {
    icon: UserX,
    headline: "Unqualified Candidates",
    description: "67% of recruiter time wasted on candidates who don't qualify. 40% are duplicates you've already seen.",
    tag: "Time Sink",
  },
  {
    icon: XCircle,
    headline: "Bad Keyword Filters",
    description: "75% of qualified candidates get auto-rejected. Dumb keyword matching misses great talent.",
    tag: "Talent Loss",
  },
  {
    icon: Calendar,
    headline: "Scheduling Nightmare",
    description: "5-7 emails just to book one interview. Top talent gets hired elsewhere while you coordinate.",
    tag: "Delays",
  },
  {
    icon: Ghost,
    headline: "Ghosted Outreach",
    description: "85% of cold emails ignored. Generic templates and bad timing kill your response rates.",
    tag: "Ignored",
  },
  {
    icon: Inbox,
    headline: "Scattered Conversations",
    description: "Candidate messages spread across email, LinkedIn, texts. Context lost, balls dropped.",
    tag: "Chaos",
  },
  {
    icon: TrendingDown,
    headline: "Lost Candidates",
    description: "30% of good candidates drop off because they fell through the cracks. No visibility, no reminders.",
    tag: "Drop-off",
  },
];

const PainPointsSection = () => {
  return (
    <section className="pt-16 pb-8 section-gradient relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header - matching solution section style */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-hero-muted mb-4">
            The Reality
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-hero-text font-display mb-6">
            Sound{" "}
            <span className="text-gradient-primary">Familiar?</span>
          </h2>
          <p className="text-lg text-hero-muted">
            Every recruiter faces these challenges. The difference is whether you keep struggling or fix them.
          </p>
        </div>

        {/* Pain Points - 3 column grid to match solutions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="group glass-card rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <point.icon className="w-7 h-7 text-amber-500" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                  {point.tag}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-hero-text font-display mb-3">
                {point.headline}
              </h3>
              <p className="text-hero-muted leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
