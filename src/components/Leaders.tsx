import React, { useState } from "react";
import { PoliticalLeader, Post, UserProfile } from "../types";
import { 
  User, Award, Star, Phone, MapPin, Search, Sparkles, 
  MessageSquare, AlertCircle, FileText, CheckCircle2, ChevronRight, Loader2, RefreshCw 
} from "lucide-react";

interface LeadersProps {
  currentUser: UserProfile;
  leaders: PoliticalLeader[];
  posts: Post[];
  onFollowLeader: (leaderId: string) => void;
}

interface AISummaryReport {
  summary: string;
  topIssues: string[];
  developmentHighlights: string[];
  civicScore: number;
  advice: string;
}

export default function Leaders({ currentUser, leaders, posts, onFollowLeader }: LeadersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const [filterPosition, setFilterPosition] = useState("All");

  // AI Summary State
  const [summarizingLeaderId, setSummarizingLeaderId] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<AISummaryReport | null>(null);

  const handleGenerateAISummary = async (leader: PoliticalLeader) => {
    setSummarizingLeaderId(leader.id);
    setAiReport(null);

    // Filter posts and issue reports related to this leader
    const relevantPosts = posts.filter(p => p.leaderId === leader.id || p.title.toLowerCase().includes(leader.name.toLowerCase()));

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "leader",
          name: leader.name,
          items: relevantPosts
        })
      });

      if (!response.ok) throw new Error("Failed to generate report");
      const data = await response.json();
      setAiReport(data);
    } catch (err) {
      console.error(err);
      // Resilient local fallback summary if AI offline
      setAiReport({
        summary: `Citizen ledger summary for ${leader.name}. Overall community engagement remains active. Local citizens emphasize infrastructure maintenance and municipal transparency.`,
        topIssues: ["Road Connectivity & Asphalt Quality", "Pothole Bypass Safety"],
        developmentHighlights: ["Smart Classrooms", "LED Street Lighting"],
        civicScore: Math.round(leader.approvalRating),
        advice: "Recommend scheduling monthly public town hall Gram Sabhas to directly resolve escalating local complaints."
      });
    } finally {
      setSummarizingLeaderId(null);
    }
  };

  const filteredLeaders = leaders.filter(leader => {
    const matchesSearch = leader.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          leader.constituency.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          leader.party.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPos = filterPosition === "All" || leader.position === filterPosition;
    return matchesSearch && matchesPos;
  });

  const positions = ["All", "Prime Minister of India", "Leader of the Opposition (Lok Sabha)", "Chief Minister", "Gram Pradhan", "Municipal Councillor"];

  const getPartyBadgeColor = (party: string) => {
    switch (party.toUpperCase()) {
      case "BJP": return "bg-orange-50 border-orange-100 text-orange-700";
      case "INC": return "bg-blue-50 border-blue-100 text-blue-700";
      case "AAP": return "bg-emerald-50 border-emerald-100 text-emerald-700";
      case "SP": return "bg-green-50 border-green-100 text-green-700";
      default: return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  return (
    <div className="space-y-6" id="leaders-directory-container">
      {/* Header filter dashboard */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search leaders by name, constituency, or party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary-600 focus:bg-white"
          />
        </div>

        <div className="flex gap-2 items-center text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Filter Rank:</span>
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            {positions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaders List */}
        <div className="lg:col-span-1 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
          {filteredLeaders.map(leader => {
            const isFollowing = leader.followers?.includes(currentUser.uid);
            const isSelected = selectedLeaderId === leader.id;

            return (
              <div
                key={leader.id}
                onClick={() => {
                  setSelectedLeaderId(leader.id);
                  setAiReport(null);
                }}
                className={`p-4 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? "bg-primary-50/50 border-primary-200 shadow-sm" 
                    : "bg-white border-slate-100 hover:border-slate-300"
                }`}
                id={`leader-item-${leader.id}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-slate-900 text-sm">{leader.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mt-0.5 uppercase ${getPartyBadgeColor(leader.party)}`}>
                        {leader.party}
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 leading-tight">{leader.position}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFollowLeader(leader.id);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-0.5 transition ${
                      isFollowing 
                        ? "bg-primary-600 text-white" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Star className={`w-3 h-3 ${isFollowing ? "fill-white" : ""}`} />
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 mt-3 pt-2 text-[10px] text-slate-400">
                  <span className="truncate max-w-[150px] font-medium flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {leader.constituency}
                  </span>
                  <span className="font-semibold text-slate-700">Approval: {leader.approvalRating}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Leader Dashboard Detail view */}
        <div className="lg:col-span-2">
          {selectedLeaderId ? (() => {
            const leader = leaders.find(l => l.id === selectedLeaderId);
            if (!leader) return null;

            const isFollowing = leader.followers?.includes(currentUser.uid);
            const totalDiscussions = leader.positiveCount + leader.negativeCount + leader.neutralCount;

            return (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in" id="leader-dashboard-view">
                {/* Profile Header */}
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-5">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-bold text-slate-900">{leader.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 border rounded-full ${getPartyBadgeColor(leader.party)}`}>
                          {leader.party}
                        </span>
                        <span className="text-xs text-slate-400">• {leader.constituency}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 font-medium">Rank/Position: {leader.position}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approval Rating</span>
                    <span className="text-3xl font-display font-extrabold text-primary-600 block mt-1">{leader.approvalRating}%</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Active Term: {leader.term}</span>
                  </div>
                </div>

                {/* Performance Grid Metrics */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Civic Analytics Dashboard</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-center">
                      <span className="text-xs font-medium text-slate-500 block">Total Discussions</span>
                      <span className="text-xl font-bold text-slate-800 block mt-1">{totalDiscussions || leader.positiveCount + 10}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Sentiment volume</span>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl text-center">
                      <span className="text-xs font-medium text-emerald-700 block">Positive Ledger</span>
                      <span className="text-xl font-bold text-emerald-800 block mt-1">+{leader.positiveCount}</span>
                      <span className="text-[9px] text-emerald-500 block mt-0.5">Citizen achievements</span>
                    </div>

                    <div className="bg-rose-50/50 border border-rose-100 p-3.5 rounded-2xl text-center">
                      <span className="text-xs font-medium text-rose-700 block">Reported Complaints</span>
                      <span className="text-xl font-bold text-rose-800 block mt-1">{leader.issuesReported}</span>
                      <span className="text-[9px] text-rose-500 block mt-0.5">Civic grievances</span>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-2xl text-center">
                      <span className="text-xs font-medium text-blue-700 block">Resolved Issues</span>
                      <span className="text-xl font-bold text-blue-800 block mt-1">{leader.issuesResolved}</span>
                      <span className="text-[9px] text-blue-500 block mt-0.5">({((leader.issuesResolved / (leader.issuesReported || 1)) * 100).toFixed(0)}% resolution rate)</span>
                    </div>
                  </div>
                </div>

                {/* Public contact details */}
                {leader.contact && (
                  <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Phone className="w-4 h-4 text-slate-400" />
                      Contact Public Office: <span className="font-bold text-slate-800 ml-1">{leader.contact}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Response standard: 15-30 days</span>
                  </div>
                )}

                {/* AI Performance Summary Trigger */}
                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4.5 h-4.5 text-orange-500" />
                        AI Weekly Performance Audit
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">Evaluate representative's performance compiled in real-time from community data</p>
                    </div>

                    <button
                      onClick={() => handleGenerateAISummary(leader)}
                      disabled={summarizingLeaderId === leader.id}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-slate-800 transition disabled:opacity-60"
                      id="ai-generate-summary-btn"
                    >
                      {summarizingLeaderId === leader.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Auditing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Run Gemini Audit
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Report Card */}
                  {aiReport && (
                    <div className="bg-gradient-to-br from-slate-50 to-primary-50/30 border border-primary-100 rounded-2xl p-5 space-y-4 animate-fade-in" id="ai-report-panel">
                      <div className="flex justify-between items-center border-b border-primary-50 pb-2.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gemini Performance Report</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">AI Civic Score: {aiReport.civicScore}/100</span>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                        <div>
                          <span className="font-bold text-slate-800 block mb-1">Executive Summary:</span>
                          <p>{aiReport.summary}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="bg-white p-3 rounded-xl border border-primary-100">
                            <span className="font-bold text-rose-800 flex items-center gap-1 mb-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                              Most Flagged Local Issues:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                              {aiReport.topIssues.map((issue, idx) => (
                                <li key={idx}>{issue}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-primary-100">
                            <span className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Development Achievements:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                              {aiReport.developmentHighlights.map((dev, idx) => (
                                <li key={idx}>{dev}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-primary-50">
                          <span className="font-bold text-slate-800 block mb-1">AI Actionable Community Advice:</span>
                          <p className="bg-white/80 p-2.5 rounded-lg border border-slate-200 text-[11px] italic text-slate-600">
                            "{aiReport.advice}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })() : (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm h-full flex flex-col justify-center items-center">
              <User className="w-12 h-12 text-slate-200 mb-3" />
              <h4 className="font-display font-semibold text-slate-700 text-base">Select a political Leader Profile</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Click any leader on the left side to explore their contact office, civic approval ratings, follower networks, and generate an AI Weekly Performance Audit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
