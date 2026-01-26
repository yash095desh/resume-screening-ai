import { Linkedin, Twitter, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="section-dark py-16 relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <img
                src="/logo.png"
                alt="RecruitKar"
                className="h-14 md:h-16 w-auto object-contain"
              />
            </div>
            <p className="text-hero-muted max-w-sm mb-6">
              The all-in-one AI hiring platform. Source, screen, outreach, and interview - all in one place.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-lg glass-card flex items-center justify-center text-hero-muted hover:text-hero-text transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg glass-card flex items-center justify-center text-hero-muted hover:text-hero-text transition-colors">
                <Twitter size={20} />
              </a>
              <a href="mailto:info@recruitkar.com" className="w-10 h-10 rounded-lg glass-card flex items-center justify-center text-hero-muted hover:text-hero-text transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-hero-text font-semibold mb-4 font-display">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-hero-muted hover:text-hero-text transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="text-hero-muted hover:text-hero-text transition-colors">How It Works</a></li>
              <li><a href="#pricing" className="text-hero-muted hover:text-hero-text transition-colors">Pricing</a></li>
              <li><a href="#testimonials" className="text-hero-muted hover:text-hero-text transition-colors">Testimonials</a></li>
              <li><a href="mailto:info@recruitkar.com" className="text-hero-muted hover:text-hero-text transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-hero-muted/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-hero-muted text-sm">
            © 2026 RecruitKar. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-hero-muted hover:text-hero-text transition-colors">Privacy Policy</a>
            <a href="#" className="text-hero-muted hover:text-hero-text transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
