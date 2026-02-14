import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import PainPointsSection from "@/components/landing/PainPointsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ProductShowcase from "@/components/landing/ProductShowcase";
import VideoShowcase from "@/components/landing/VideoShowcase";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'Hire better candidates faster with AI. Automate resume screening, LinkedIn sourcing, AI voice interviews, and email outreach. Stop fighting your hiring process.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <PainPointsSection />
      <FeaturesSection />
      <ProductShowcase />
      <VideoShowcase />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
