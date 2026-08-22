import React from 'react';
import { Building2, Shield, Award, HeartHandshake } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0a1d37] text-slate-300 border-t border-slate-800 text-xs py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800">
          {/* Col 1 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-[#0f2e5a] flex items-center justify-center text-amber-400 font-bold border border-blue-900">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="font-bold text-white text-sm">Sahakar Gig Platform</div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cooperative-owned digital service marketplace empowering Labour Cooperative Federations and Societies across India.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Institutional Governance
            </div>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>Ministry of Cooperation, Govt of India</li>
              <li>National Council for Cooperative Training (NCCT)</li>
              <li>State Labour Cooperative Federations</li>
              <li>Primary Labour Cooperative Societies</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Worker Protection Pillars
            </div>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>• Fair Work Allocation (Fatigue Prevention)</li>
              <li>• NCCT Verified Skills & Badges</li>
              <li>• Transparent Net Wage Ledger (95% Payout)</li>
              <li>• Demo Accidental & Distress Welfare Fund</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Hackathon Prototype Notice
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700 text-[10px] text-slate-300 leading-normal">
              <strong>Smart India Hackathon 2026 (SIH26089)</strong>
              <br />
              All data (workers, societies, certificates, welfare records, transactions) are strictly simulated demo entities with no real-world government records created.
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 pt-2">
          <div>
            © 2026 Cooperative Gig Services Platform. Developed for SIH2026 Problem Statement SIH26089.
          </div>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <span>Built with React, Express & Leaflet</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">Cooperative Digital Infrastructure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
