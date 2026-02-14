"use client";

import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/hooks";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="RecruitKar"
              className="h-12 md:h-14 w-auto object-contain"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-hero-muted hover:text-hero-text transition-colors">Features</a>
            <a href="#demo" className="text-hero-muted hover:text-hero-text transition-colors">Demo</a>
            <a href="#how-it-works" className="text-hero-muted hover:text-hero-text transition-colors">How it Works</a>
            <a href="#pricing" className="text-hero-muted hover:text-hero-text transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {!isLoaded ? (
              <div className="w-48 h-10" />
            ) : isSignedIn ? (
              <Link href="/dashboard">
                <Button variant="hero" size="lg">
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-hero-muted hover:text-hero-text">
                    Log in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="hero" size="lg">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-hero-text"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 flex flex-col gap-4">
            <a href="#features" className="text-hero-muted hover:text-hero-text transition-colors py-2">Features</a>
            <a href="#demo" className="text-hero-muted hover:text-hero-text transition-colors py-2">Demo</a>
            <a href="#how-it-works" className="text-hero-muted hover:text-hero-text transition-colors py-2">How it Works</a>
            <a href="#pricing" className="text-hero-muted hover:text-hero-text transition-colors py-2">Pricing</a>
            <div className="flex flex-col gap-3 pt-4 border-t border-hero-muted/20">
              {!isLoaded ? (
                <div className="w-full h-10" />
              ) : isSignedIn ? (
                <Link href="/dashboard">
                  <Button variant="hero" size="lg" className="w-full">
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button variant="ghost" className="text-hero-muted hover:text-hero-text justify-start w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button variant="hero" size="lg" className="w-full">
                      Get Started Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
