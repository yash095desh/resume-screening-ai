const showcaseItems = [
  {
    painPoint: "Drowning in unqualified applicants?",
    title: "AI Finds Only Candidates Who Fit",
    description: "Stop wasting hours on bad resumes. AI pre-filters and ranks candidates so you only see people worth your time. Auto-deduplication across platforms included.",
    image: "/sourcing.png",
    features: ["Only qualified matches surface", "Auto-deduplication built in", "Skills & experience pre-verified"],
  },
  {
    painPoint: "Keyword systems rejecting good candidates?",
    title: "Screening That Understands Context",
    description: "Our AI reads between the lines - not just keywords. It understands career progression, skill transferability, and actual role fit.",
    image: "/screening-analysis.png",
    features: ["Context-aware evaluation", "No more keyword gaming", "True skill assessment"],
    reverse: true,
  },
  {
    painPoint: "Scheduling interviews = endless back-and-forth?",
    title: "Interviews Run Without You",
    description: "AI conducts voice interviews 24/7. Candidates pick their time, answer naturally, and you get scored transcripts - zero calendar coordination.",
    image: "/interview-transcript.png",
    features: ["Zero scheduling needed", "Full conversation transcripts", "AI-scored insights ready"],
  },
  {
    painPoint: "85% of your outreach gets ignored?",
    title: "Emails That Actually Get Responses",
    description: "Personalized sequences, smart timing, automatic follow-ups. Stop being another ignored message in the inbox.",
    image: "/email-templates.png",
    features: ["Personalization that works", "Perfect timing automation", "Persistent follow-up sequences"],
    reverse: true,
  },
  {
    painPoint: "Candidates falling through the cracks?",
    title: "Never Lose Track Again",
    description: "Visual pipeline shows exactly where everyone stands. Automated reminders ensure no candidate waits too long or gets forgotten.",
    image: "/pipeline.png",
    features: ["Complete visibility", "Automated reminders", "No candidate left behind"],
  },
];

const ProductShowcase = () => {
  return (
    <section id="product" className="py-24 section-dark relative">
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-hero-muted mb-4">
            See It In Action
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-hero-text font-display mb-6">
            Your Problems,{" "}
            <span className="text-gradient-primary">Solved</span>
          </h2>
          <p className="text-lg text-hero-muted">
            See exactly how each tool eliminates the frustrations you deal with every day.
          </p>
        </div>

        {/* Showcase Items */}
        <div className="space-y-24">
          {showcaseItems.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col ${item.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}
            >
              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <p className="text-landing-destructive font-medium mb-2">
                  {item.painPoint}
                </p>
                <h3 className="text-2xl md:text-3xl font-bold text-hero-text font-display mb-4">
                  {item.title}
                </h3>
                <p className="text-lg text-hero-muted mb-6">
                  {item.description}
                </p>
                <ul className="space-y-3">
                  {item.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 justify-center lg:justify-start">
                      <span className="w-5 h-5 rounded-full bg-landing-primary/20 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-landing-primary" />
                      </span>
                      <span className="text-hero-muted">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Screenshot */}
              <div className="flex-1 w-full">
                <div className="glass-card rounded-2xl p-2 glow-primary">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
