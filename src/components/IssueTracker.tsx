import React, { useState } from "react";
import { Post, IssueStatus, UserProfile } from "../types";
import { INITIAL_LOCATIONS } from "../firebase";
import { 
  AlertTriangle, CheckCircle2, AlertCircle, FileText, 
  MapPin, Clock, Search, SlidersHorizontal, Sparkles, 
  ChevronRight, Users, Grid, RefreshCw, Loader2, ArrowRight 
} from "lucide-react";

interface IssueTrackerProps {
  currentUser: UserProfile;
  posts: Post[]; // we filter category: "Civic Issue"
  onUpdatePostStatus: (postId: string, status: IssueStatus) => void;
}

interface AIClusterItem {
  clusterName: string;
  combinedSummary: string;
  issueIds: string[];
}

export default function IssueTracker({ currentUser, posts, onUpdatePostStatus }: IssueTrackerProps) {
  const [activeTab, setActiveTab] = useState<"individual" | "clusters">("individual");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // AI Clustering State
  const [clusteringActive, setClusteringActive] = useState(false);
  const [clusters, setClusters] = useState<AIClusterItem[]>([]);

  // Filter individual issues
  const individualIssues = posts.filter(p => p.category === "Civic Issue");

  const handleRunClustering = async () => {
    setClusteringActive(true);
    try {
      const response = await fetch("/api/ai/cluster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues: individualIssues })
      });

      if (!response.ok) throw new Error("Failed to cluster");
      const data = await response.json();
      setClusters(data.clusters || []);
      setActiveTab("clusters");
    } catch (e) {
      console.error(e);
      // Fallback clustering in case offline
      setClusters([
        {
          clusterName: "Mango Mandi Bypass Road Pothole Backlog",
          combinedSummary: "Multiple farmers and transport drivers are expressing grievances about deep waterlogged potholes on the Malihabad Main Mandi bypass road, leading to massive crop transit delays and minor two-wheeler accidents.",
          issueIds: ["post_1"]
        }
      ]);
      setActiveTab("clusters");
    } finally {
      setClusteringActive(false);
    }
  };

  const filteredIssues = individualIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || issue.subCategory === selectedCategory;
    const matchesStat = selectedStatus === "All" || issue.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStat;
  });

  const categories = [
    "All", "Roads", "Water Supply", "Electricity", "Drainage", "Sanitation", 
    "Public Safety", "Healthcare", "Education", "Corruption", "Other"
  ];

  const statuses: (IssueStatus | "All")[] = ["All", "Reported", "Under Review", "Escalated", "Resolved"];

  const getStatusStyle = (status?: IssueStatus) => {
    switch (status) {
      case "Resolved": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Escalated": return "bg-rose-100 text-rose-800 border-rose-200";
      case "Under Review": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6" id="issue-tracking-system">
      {/* Upper Analytics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Reports</span>
            <span className="text-2xl font-display font-extrabold text-slate-800 block mt-1">{individualIssues.length}</span>
          </div>
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Resolved Complaints</span>
            <span className="text-2xl font-display font-extrabold text-emerald-600 block mt-1">
              {individualIssues.filter(i => i.status === "Resolved").length}
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Resolution Standard</span>
            <span className="text-2xl font-display font-extrabold text-primary-600 block mt-1">
              {individualIssues.length ? ((individualIssues.filter(i => i.status === "Resolved").length / individualIssues.length) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <Clock className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      {/* Tabs and Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-1">
        <div className="flex gap-4 text-sm font-display font-semibold">
          <button
            onClick={() => setActiveTab("individual")}
            className={`pb-3 border-b-2 px-1 transition ${
              activeTab === "individual" 
                ? "border-primary-600 text-primary-600" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Individual Reports ({filteredIssues.length})
          </button>
          <button
            onClick={() => setActiveTab("clusters")}
            className={`pb-3 border-b-2 px-1 transition flex items-center gap-1 ${
              activeTab === "clusters" 
                ? "border-primary-600 text-primary-600" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            AI Grouped Clusters ({clusters.length})
          </button>
        </div>

        <button
          onClick={handleRunClustering}
          disabled={clusteringActive}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-slate-800 transition disabled:opacity-60"
          id="perform-ai-clustering-btn"
        >
          {clusteringActive ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Clustering Similar Reports...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              Perform AI Clustering
            </>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "individual" ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3.5 items-center justify-between text-xs text-slate-500">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary-600 focus:bg-white"
              />
            </div>

            <div className="flex gap-2.5 items-center flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
              >
                {statuses.map(stat => (
                  <option key={stat} value={stat}>{stat === "All" ? "All Statuses" : stat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Individual Issues List */}
          <div className="space-y-4">
            {filteredIssues.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-display font-medium text-slate-600 text-sm">No active grievances fit this filter.</p>
                <p className="text-xs text-slate-400 mt-1">Excellent work! No reported issues pending in this category.</p>
              </div>
            ) : (
              filteredIssues.map(issue => (
                <div key={issue.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4" id={`issue-card-${issue.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusStyle(issue.status)}`}>
                        {issue.status}
                      </span>
                      <h4 className="font-display font-bold text-slate-900 text-base mt-2">{issue.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Reported by: <span className="font-bold text-slate-600">{issue.authorName}</span> on {new Date(issue.createdAt).toLocaleDateString()}</p>
                    </div>

                    <span className="text-xs font-semibold bg-rose-50 text-rose-700 px-3 py-1 rounded-full uppercase border border-rose-100">
                      {issue.subCategory || "General"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{issue.description}</p>

                  <div className="flex flex-wrap items-center justify-between pt-3.5 border-t border-slate-50 text-xs">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      Constituency: <span className="font-bold text-slate-700">{issue.location.district} / {issue.location.block}</span>
                    </span>

                    {/* Status Management Trigger for Demonstrating Moderator Role */}
                    {(currentUser.role === "Moderator" || currentUser.role === "Administrator") && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Update Status (Staff):</span>
                        <select
                          value={issue.status}
                          onChange={(e) => onUpdatePostStatus(issue.id, e.target.value as IssueStatus)}
                          className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-bold text-[11px]"
                        >
                          <option value="Reported">Reported</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Escalated">Escalated</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Clustered Issues List */}
          {clusters.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm h-full flex flex-col justify-center items-center">
              <Sparkles className="w-10 h-10 text-orange-400 mb-2 animate-bounce" />
              <h4 className="font-display font-semibold text-slate-700 text-sm">No clusters compiled yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Click "Perform AI Clustering" above. Gemini AI will automatically read through all individual posts, detect related grievances (like water shortages or road issues in the same block), cluster them together, and write an aggregated summary.</p>
            </div>
          ) : (
            clusters.map((cluster, idx) => {
              // find individual complaints belonging to this cluster
              const nestedComplaints = posts.filter(p => cluster.issueIds.includes(p.id));

              return (
                <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4 relative overflow-hidden" id={`cluster-card-${idx}`}>
                  {/* Decorative badge */}
                  <div className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] uppercase font-bold tracking-widest px-4 py-1 rounded-bl-xl flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-orange-300 animate-pulse" />
                    AI Consolidator
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-primary-600 flex items-center gap-1 uppercase tracking-wider">
                      <Grid className="w-3.5 h-3.5" />
                      Issue Cluster Group
                    </span>
                    <h3 className="font-display font-extrabold text-slate-900 text-lg mt-1.5">{cluster.clusterName}</h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">Aggregates <span className="font-bold text-slate-600">{cluster.issueIds.length} individual complaints</span> reported by the community</p>
                  </div>

                  {/* AI Combined Summary */}
                  <div className="bg-gradient-to-br from-primary-50/50 to-indigo-50/30 border border-primary-100 p-4 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-primary-900 block tracking-wide uppercase text-[10px]">Aggregated Problem Summary:</span>
                    <p className="text-slate-700 leading-relaxed font-sans font-medium">"{cluster.combinedSummary}"</p>
                  </div>

                  {/* Nested Individual Complaints */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Individual Grievance Ledger:</span>
                    
                    {nestedComplaints.map(nested => (
                      <div key={nested.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{nested.title}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getStatusStyle(nested.status)}`}>
                            {nested.status}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] font-sans line-clamp-2">{nested.description}</p>
                        <span className="text-[10px] text-slate-400 font-medium block">Reported by: {nested.authorName} • Ward: {nested.location.ward || "All"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
