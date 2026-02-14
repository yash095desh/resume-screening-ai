"use client";

import { useState, useRef } from "react";
import { Play, Pause, Maximize2 } from "lucide-react";

const VideoShowcase = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  return (
    <section id="demo" className="py-24 section-medium relative overflow-hidden scroll-mt-20">
      {/* Background glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-landing-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-landing-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-hero-muted mb-4">
            Product Demo
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-hero-text font-display mb-6">
            See RecruitKar{" "}
            <span className="text-gradient-primary">In Action</span>
          </h2>
          <p className="text-lg text-hero-muted">
            Watch how recruiters hire 3x faster with AI-powered sourcing,
            screening, interviews, and outreach — all in one platform.
          </p>
        </div>

        {/* Video Player */}
        <div className="max-w-5xl mx-auto">
          <div className="glass-card rounded-2xl p-2 glow-primary">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-slate-700/50 rounded-md px-3 py-1 text-xs text-slate-400 text-center max-w-xs mx-auto">
                    recruitkar.com
                  </div>
                </div>
                <button
                  onClick={handleFullscreen}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Video Container */}
              <div className="relative group cursor-pointer" onClick={togglePlay}>
                <video
                  ref={videoRef}
                  src="/recruitkar_feature_video.mp4"
                  className="w-full aspect-video object-cover"
                  playsInline
                  preload="metadata"
                  onEnded={handleVideoEnd}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                />

                {/* Play/Pause Overlay */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    isPlaying
                      ? "opacity-0 group-hover:opacity-100"
                      : "opacity-100"
                  }`}
                >
                  {/* Dimming backdrop when not playing */}
                  {!isPlaying && (
                    <div className="absolute inset-0 bg-black/30" />
                  )}
                  <div className="relative z-10 w-20 h-20 rounded-full bg-landing-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-landing-primary/25 hover:scale-110 transition-transform duration-200">
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Duration hint */}
          <p className="text-center text-sm text-hero-muted mt-4">
            Quick walkthrough of the complete platform
          </p>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-landing-primary to-landing-accent text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </a>
        </div>
      </div>
    </section>
  );
};

export default VideoShowcase;
