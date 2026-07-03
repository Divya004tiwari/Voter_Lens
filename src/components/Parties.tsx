import React, { useState } from "react";
import { PoliticalParty, UserProfile } from "../types";
import { 
  Building, Star, Search, FileText, Sparkles, 
  MessageSquare, Users, Award, Landmark, ChevronRight 
} from "lucide-react";

interface PartiesProps {
  currentUser: UserProfile;
  parties: PoliticalParty[];
  onFollowParty: (partyId: string) => void;
}

export default function Parties({ currentUser, parties, onFollowParty }: PartiesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>("party_bjp");

  const filteredParties = parties.filter(party => 
    party.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    party.abbrev.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="parties-page-container">
      {/* Header filter */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5">
          <Landmark className="w-5 h-5 text-primary-600" />
          Political Parties & Manifesto Directory
        </h3>
        
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search parties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary-600 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Parties List */}
        <div className="md:col-span-1 space-y-3">
          {filteredParties.map(party => {
            const isFollowing = party.followers?.includes(currentUser.uid);
            const isSelected = selectedPartyId === party.id;

            return (
              <div
                key={party.id}
                onClick={() => setSelectedPartyId(party.id)}
                className={`p-4 rounded-2xl border transition duration-200 cursor-pointer flex justify-between items-center ${
                  isSelected 
                    ? "bg-primary-50/50 border-primary-200 shadow-sm" 
                    : "bg-white border-slate-100 hover:border-slate-300"
                }`}
                id={`party-item-${party.id}`}
              >
                <div className="flex gap-3 items-center">
                  <div className={`w-10 h-10 rounded-xl ${party.logo} flex items-center justify-center text-white font-extrabold font-display`}>
                    {party.abbrev.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-slate-900 text-sm">{party.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Abbrev: {party.abbrev}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFollowParty(party.id);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-0.5 transition ${
                      isFollowing 
                        ? "bg-primary-600 text-white" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Star className={`w-3 h-3 ${isFollowing ? "fill-white" : ""}`} />
                    Follow
                  </button>
                  <span className="text-[11px] font-bold text-primary-600">{party.approvalRating}% approval</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Party Details Panel */}
        <div className="md:col-span-2">
          {selectedPartyId ? (() => {
            const party = parties.find(p => p.id === selectedPartyId);
            if (!party) return null;

            const isFollowing = party.followers?.includes(currentUser.uid);

            return (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in" id="party-details-panel">
                <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                  <div className="flex gap-4 items-center">
                    <div className={`w-14 h-14 rounded-2xl ${party.logo} flex items-center justify-center text-white font-extrabold text-xl font-display shadow-sm`}>
                      {party.abbrev}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-bold text-slate-900">{party.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">National Party Leader: <span className="font-bold text-slate-800">{party.leader}</span></p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discussion Volume Index</span>
                    <span className="text-xl font-display font-extrabold text-slate-800 block mt-1">{party.volume} units</span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                      <Users className="w-3.5 h-3.5" />
                      {party.followers?.length || 0} Following
                    </span>
                  </div>
                </div>

                {/* Party Manifesto */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <h4 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5 text-blue-600" />
                    2024 Election Manifesto & Directives
                  </h4>
                  <p>{party.manifesto}</p>
                </div>

                {/* General Information */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historical Context & Ethos</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{party.description}</p>
                </div>

                {/* Popularity Metrics Meter */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Social Feed Alignment</h4>
                  
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between font-bold text-slate-700 mb-1">
                        <span>Approval Rating on VoterLens</span>
                        <span>{party.approvalRating}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${party.approvalRating}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-3 text-center">
                      <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                        <span className="font-semibold text-emerald-800">Support Ratio</span>
                        <span className="block font-bold text-emerald-900 text-lg mt-0.5">64%</span>
                      </div>
                      <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                        <span className="font-semibold text-amber-800">Neutral dialogue</span>
                        <span className="block font-bold text-amber-900 text-lg mt-0.5">22%</span>
                      </div>
                      <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                        <span className="font-semibold text-rose-800">Critical voice</span>
                        <span className="block font-bold text-rose-900 text-lg mt-0.5">14%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm h-full flex flex-col justify-center items-center">
              <Building className="w-12 h-12 text-slate-200 mb-3" />
              <h4 className="font-display font-semibold text-slate-700 text-base">Select a Political Party</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Select any party profile to review their national leader offices, election manifestos, public volume index, and visual sentiment meters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
