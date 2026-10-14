'use client';

import React from 'react';
import {
  HeroSection,
  HowItWorksSection,
  AdapterMatrixSection,
  ValuePropositionSection,
  KpiSimulatorSection,
  DataProvenanceSection,
  BackgroundDecorations,
} from '@/components/home/sections';

export default function LandingPage() {
  return (
    <>
      {/* Background Decorative Grid and Solar Horizon Sweep */}
      <BackgroundDecorations />

      {/* Main Landing Sections */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-12 py-10 sm:py-16 flex flex-col items-center text-center">
        <HeroSection />
        <HowItWorksSection />
        <AdapterMatrixSection />
        <ValuePropositionSection />
        <KpiSimulatorSection />
        <DataProvenanceSection />
      </div>
    </>
  );
}
