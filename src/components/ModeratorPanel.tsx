import React, { useState } from "react";
import { Post, Comment, UserProfile, UserRole, WarningItem, AuditLogItem } from "../types";
import { 
  Shield, AlertTriangle, Trash2, CheckCircle2, ShieldAlert, Sparkles, 
  MessageSquare, Search, User, Filter, AlertCircle, RefreshCw, Scale, 
  Check, X, FileText, Ban, UserCheck, ShieldCheck, HelpCircle, EyeOff, 
  Eye, ArrowUpRight, Award, PlusCircle, AlertOctagon, CheckSquare, ListFilter, Users
} from "lucide-react";

interface ModeratorProps {
  currentUser: UserProfile;
  posts: Post[];
  comments: Comment[];
  allUsers: UserProfile[];
  auditLogs: AuditLogItem[];
  onUpdateUser: (userId: string, updatedFields: Partial<UserProfile>) => void;
  onUpdatePost: (postId: string, updatedFields: Partial<Post>) => void;
  onUpdateComment: (postId: string, commentId: string, updatedFields: Partial<Comment>) => void;
  onAddAuditLog: (log: Omit<AuditLogItem, "id" | "createdAt">) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onIssueWarning: (userId: string, level: 1 | 2 | 3 | 4, reason: string, description: string, recommendedAction: string) => void;
  onResolveAppeal: (userId: string, warningId: string, status: "Accepted" | "Rejected") => void;
}

type AdminTab = "content" | "users" | "factcheck" | "appeals" | "auditlogs";

export default function ModeratorPanel({ 
  currentUser, posts, comments, allUsers, auditLogs,
  onUpdateUser, onUpdatePost, onUpdateComment, onAddAuditLog,
  onDeletePost, onDeleteComment, onIssueWarning, onResolveAppeal
}: ModeratorProps) {
  
  const [activeTab, setActiveTab] = useState<AdminTab>("content");
  
  // Search & Filter state
  const [userSearch, setUserSearch] = useState("");
  const [userFilterRole, setUserFilterRole] = useState<string>("All");
  const [userFilterStatus, setUserFilterStatus] = useState<string>("All");
  
  const [contentSearch, setContentSearch] = useState("");
  const [contentFilterType, setContentFilterType] = useState<"All" | "Post" | "Comment">("All");
  const [contentFilterStatus, setContentFilterStatus] = useState<"All" | "Reported" | "Hidden" | "Escalated">("All");

  const [auditSearch, setAuditSearch] = useState("");

  // Warning Modal / State
  const [selectedUserForWarning, setSelectedUserForWarning] = useState<UserProfile | null>(null);
  const [warningLevel, setWarningLevel] = useState<1 | 2 | 3 | 4>(1);
  const [warningReason, setWarningReason] = useState("Spam");
  const [warningDescription, setWarningDescription] = useState("");
  const [warningRecAction, setWarningRecAction] = useState("");

  // Fact-Check Form State
  const [selectedPostForFactCheck, setSelectedPostForFactCheck] = useState<Post | null>(null);
  const [fcLabel, setFcLabel] = useState<"Verified" | "Partially Verified" | "Unverified" | "False Information">("Verified");
  const [fcEvidence, setFcEvidence] = useState("");
  const [fcExplanation, setFcExplanation] = useState("");

  // Guard access
  if (currentUser.role === "Citizen") {
    return (
      <div className="bg-red-50 border border-red-150 rounded-2xl p-8 text-center text-red-900" id="mod-denied-panel">
        <ShieldAlert className="w-14 h-14 text-red-600 mx-auto mb-3" />
        <h4 className="font-display font-bold text-xl">Administrative Access Restricted</h4>
        <p className="text-sm text-red-700 mt-2 max-w-md mx-auto leading-relaxed">
          Your current account role is set as <strong>Citizen</strong>. To explore content moderation metrics, click <strong>Configure Identity</strong> on the Citizen Card on the left and select Moderator, Fact Checker, or Administrator.
        </p>
      </div>
    );
  }

  // Filter content items
  const reportedPosts = posts.filter(p => p.isReported || p.fakeNewsWarning?.flagged || p.isEscalated || p.isHidden);
  const reportedComments = comments.filter(c => c.isReported || c.isHidden);

  // Users List filtering
  const filteredUsers = allUsers.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userFilterRole === "All" || u.role === userFilterRole;
    
    let matchStatus = true;
    if (userFilterStatus === "Suspended") matchStatus = !!u.isSuspended;
    else if (userFilterStatus === "Banned") matchStatus = !!u.isBanned;
    else if (userFilterStatus === "Active") matchStatus = !u.isSuspended && !u.isBanned;

    return matchSearch && matchRole && matchStatus;
  });

  // Appeals list
  const allAppealingUsers = allUsers.filter(u => u.warnings?.some(w => w.appealStatus === "Pending"));
  const pendingAppealsList = allAppealingUsers.flatMap(u => 
    (u.warnings || [])
      .filter(w => w.appealStatus === "Pending")
      .map(w => ({ user: u, warning: w }))
  );

  // Content moderation list (merged reported posts & comments)
  const contentItemsList = [
    ...reportedPosts.map(p => ({
      id: p.id,
      type: "Post" as const,
      authorName: p.authorName,
      authorId: p.authorId,
      title: p.title,
      text: p.description,
      createdAt: p.createdAt,
      isReported: !!p.isReported,
      isHidden: !!p.isHidden,
      isEscalated: !!p.isEscalated,
      label: p.moderationLabel,
      fakeNewsWarning: p.fakeNewsWarning
    })),
    ...reportedComments.map(c => ({
      id: c.id,
      postId: c.postId,
      type: "Comment" as const,
      authorName: c.authorName,
      authorId: c.authorId,
      title: `Comment on Post #${c.postId.substring(0, 5)}`,
      text: c.text,
      createdAt: c.createdAt,
      isReported: !!c.isReported,
      isHidden: !!c.isHidden,
      isEscalated: false,
      label: undefined,
      fakeNewsWarning: undefined
    }))
  ].filter(item => {
    const matchSearch = item.title.toLowerCase().includes(contentSearch.toLowerCase()) || item.text.toLowerCase().includes(contentSearch.toLowerCase());
    const matchType = contentFilterType === "All" || item.type === contentFilterType;
    
    let matchStatus = true;
    if (contentFilterStatus === "Reported") matchStatus = item.isReported;
    else if (contentFilterStatus === "Hidden") matchStatus = item.isHidden;
    else if (contentFilterStatus === "Escalated") matchStatus = item.isEscalated;

    return matchSearch && matchType && matchStatus;
  });

  // Submit Policy Warning
  const handleIssueWarningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForWarning) return;

    onIssueWarning(
      selectedUserForWarning.uid,
      warningLevel,
      warningReason,
      warningDescription.trim(),
      warningRecAction.trim() || "Compliance with community guidelines."
    );

    alert(`Level ${warningLevel} Policy Warning officially recorded for ${selectedUserForWarning.username}.`);
    
    // Reset state
    setSelectedUserForWarning(null);
    setWarningDescription("");
    setWarningRecAction("");
    setWarningLevel(1);
    setWarningReason("Spam");
  };

  // Submit Fact Check Report
  const handleFactCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostForFactCheck) return;

    // Update Post
    onUpdatePost(selectedPostForFactCheck.id, {
      moderationLabel: fcLabel,
      evidenceLink: fcEvidence.trim() || undefined,
      factCheckExplanation: fcExplanation.trim() || undefined,
      factCheckPublishedAt: Date.now(),
      isReported: false // Clear reports count as resolved
    });

    // Record Audit Log
    onAddAuditLog({
      action: `Fact-Check Published (${fcLabel})`,
      performedBy: currentUser.username,
      performedByRole: currentUser.role,
      contentIdAffected: selectedPostForFactCheck.id,
      contentTypeAffected: "Post",
      reason: `Assigned label "${fcLabel}". Explanation: ${fcExplanation.substring(0, 60)}...`
    });

    alert(`Official Governance Fact-Check published successfully for: "${selectedPostForFactCheck.title.substring(0, 30)}..."`);
    setSelectedPostForFactCheck(null);
    setFcEvidence("");
    setFcExplanation("");
  };

  // Quick Action: Hide/Unhide Content
  const toggleHideContent = (item: any) => {
    const nextHidden = !item.isHidden;
    if (item.type === "Post") {
      onUpdatePost(item.id, { 
        isHidden: nextHidden,
        moderationLabel: nextHidden ? "Removed by Moderation" : undefined
      });
    } else {
      onUpdateComment(item.postId, item.id, { isHidden: nextHidden });
    }

    onAddAuditLog({
      action: nextHidden ? "Content Hidden" : "Content Restored",
      performedBy: currentUser.username,
      performedByRole: currentUser.role,
      contentIdAffected: item.id,
      contentTypeAffected: item.type,
      reason: nextHidden ? "Flagged for violation of local safety rules." : "Moderation audit cleared content."
    });

    alert(`Content marked as ${nextHidden ? "HIDDEN" : "ACTIVE"}.`);
  };

  // Quick Action: Delete Content Fully
  const deleteContent = (item: any) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${item.type}? This action is irreversible.`)) {
      return;
    }

    if (item.type === "Post") {
      onDeletePost(item.id);
    } else {
      onDeleteComment(item.postId, item.id);
    }

    onAddAuditLog({
      action: "Content Deleted",
      performedBy: currentUser.username,
      performedByRole: currentUser.role,
      contentIdAffected: item.id,
      contentTypeAffected: item.type,
      reason: "Severe community standards breach (manual mod override)."
    });

    alert("Content deleted permanently from the database.");
  };

  // Clear Report / Keep Content
  const clearReports = (item: any) => {
    if (item.type === "Post") {
      onUpdatePost(item.id, { isReported: false, isEscalated: false, moderationLabel: undefined });
    } else {
      onUpdateComment(item.postId, item.id, { isReported: false });
    }

    onAddAuditLog({
      action: "Flags Cleared",
      performedBy: currentUser.username,
      performedByRole: currentUser.role,
      contentIdAffected: item.id,
      contentTypeAffected: item.type,
      reason: "Reports audited and dismissed. Verified safe."
    });

    alert("Community flags cleared. Content approved.");
  };

  // Quick Action: Change User Status (Restore / Suspend / Ban)
  const changeUserStatus = (user: UserProfile, action: "Restore" | "Suspend" | "Ban") => {
    if (action === "Restore") {
      onUpdateUser(user.uid, { isSuspended: false, isBanned: false });
      onAddAuditLog({
        action: "Account Restored",
        performedBy: currentUser.username,
        performedByRole: currentUser.role,
        userIdAffected: user.uid,
        usernameAffected: user.username,
        reason: "Manual review of account compliance. Full access returned."
      });
      alert(`Account of ${user.username} successfully restored to active status.`);
    } else if (action === "Suspend") {
      onIssueWarning(user.uid, 3, "Suspension", "Temporary account restriction due to repeated warning accumulations.", "Cease guideline violations.");
      alert(`Account of ${user.username} temporarily suspended.`);
    } else if (action === "Ban") {
      onIssueWarning(user.uid, 4, "Permanent Ban", "Severe platform rules and safety standards breach.", "Account termination.");
      alert(`Account of ${user.username} permanently banned.`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="moderator-control-hub">
      {/* Upper banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500 fill-red-500/20" />
            Platform Governance Desk
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Democratic speech accountability console. Audit claims, address reports, publish verified fact-checks, and manage user policy compliance.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto font-mono">
          <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE: {currentUser.role}
          </span>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("content")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "content" 
              ? "border-slate-900 text-slate-900" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Content Moderation Queue
          {reportedPosts.length + reportedComments.length > 0 && (
            <span className="bg-red-100 text-red-700 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">
              {reportedPosts.length + reportedComments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "users" 
              ? "border-slate-900 text-slate-900" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Users className="w-4 h-4" />
          User Account Registry
        </button>

        <button
          onClick={() => setActiveTab("factcheck")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "factcheck" 
              ? "border-slate-900 text-slate-900" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Fact Checking Bureau
          {posts.filter(p => p.fakeNewsWarning?.flagged && !p.moderationLabel).length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded animate-pulse">
              {posts.filter(p => p.fakeNewsWarning?.flagged && !p.moderationLabel).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("appeals")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "appeals" 
              ? "border-slate-900 text-slate-900" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Scale className="w-4 h-4" />
          Appeals Board
          {pendingAppealsList.length > 0 && (
            <span className="bg-amber-100 text-amber-800 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">
              {pendingAppealsList.length}
            </span>
          )}
        </button>

        {currentUser.role === "Administrator" && (
          <button
            onClick={() => setActiveTab("auditlogs")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === "auditlogs" 
                ? "border-slate-900 text-slate-900" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileText className="w-4 h-4" />
            Audit Logs
          </button>
        )}
      </div>

      {/* Content queue panel */}
      {activeTab === "content" && (
        <div className="space-y-4" id="content-queue-tab">
          {/* Header search bar */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-wrap gap-3.5 items-center justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reported claims, posts, or comments..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 focus:bg-white transition"
              />
            </div>

            <div className="flex gap-2.5 items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <ListFilter className="w-3.5 h-3.5" /> Filter Queue:
              </span>
              <select
                value={contentFilterType}
                onChange={(e) => setContentFilterType(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="Post">Posts Only</option>
                <option value="Comment">Comments Only</option>
              </select>

              <select
                value={contentFilterStatus}
                onChange={(e) => setContentFilterStatus(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Reported">Reported</option>
                <option value="Hidden">Hidden</option>
                <option value="Escalated">Escalated</option>
              </select>
            </div>
          </div>

          {/* Cards List */}
          {contentItemsList.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-display font-medium text-slate-700 text-sm">All clear! No pending reported content fits these filters.</p>
              <p className="text-xs text-slate-400 mt-1">Community posts and discussions are safe and compliant with active policy guidelines.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {contentItemsList.map(item => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3" id={`queue-item-${item.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider ${item.type === "Post" ? "bg-indigo-50 text-indigo-700" : "bg-teal-50 text-teal-700"}`}>
                          {item.type}
                        </span>
                        <h5 className="font-display font-bold text-slate-900 text-sm leading-snug">{item.title}</h5>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Author: <span className="font-semibold text-slate-600">{item.authorName}</span> • Date: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-1.5">
                      {item.isReported && (
                        <span className="text-[9px] bg-purple-100 border border-purple-200 text-purple-800 px-2.5 py-0.5 rounded-full font-bold uppercase font-mono flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Flagged
                        </span>
                      )}
                      {item.isHidden && (
                        <span className="text-[9px] bg-red-100 border border-red-200 text-red-800 px-2.5 py-0.5 rounded-full font-bold uppercase font-mono flex items-center gap-0.5">
                          <EyeOff className="w-2.5 h-2.5" /> Hidden
                        </span>
                      )}
                      {item.isEscalated && (
                        <span className="text-[9px] bg-pink-100 border border-pink-200 text-pink-800 px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">
                          ⚡ Escalated to Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-sans leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{item.text}"
                  </p>

                  {item.fakeNewsWarning && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-amber-800 flex items-center gap-1 text-[10px] uppercase font-mono">
                        ⚠️ Automated AI Misinformation Advisory:
                      </span>
                      <p className="text-slate-600 font-sans leading-relaxed">{item.fakeNewsWarning.explanation}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400 italic">
                      Verify following safety principles before overriding speech
                    </span>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => clearReports(item)}
                        className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-emerald-100 transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Clear Flags / Safe
                      </button>

                      <button
                        onClick={() => toggleHideContent(item)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 ${
                          item.isHidden 
                            ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200" 
                            : "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100"
                        }`}
                      >
                        {item.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {item.isHidden ? "Unhide Content" : "Hide from Feed"}
                      </button>

                      {item.type === "Post" && !item.isEscalated && (
                        <button
                          onClick={() => {
                            onUpdatePost(item.id, { isEscalated: true });
                            onAddAuditLog({
                              action: "Post Escalated",
                              performedBy: currentUser.username,
                              performedByRole: currentUser.role,
                              contentIdAffected: item.id,
                              contentTypeAffected: "Post",
                              reason: "Escalated for senior admin review."
                            });
                            alert("Post escalated to the Super Administrator.");
                          }}
                          className="bg-pink-50 text-pink-800 border border-pink-200 px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-pink-100 transition flex items-center gap-1"
                        >
                          ⚡ Escalate
                        </button>
                      )}

                      <button
                        onClick={() => deleteContent(item)}
                        className="bg-red-50 text-red-800 border border-red-200 p-1.5 rounded-xl hover:bg-red-100 transition"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User accounts desk */}
      {activeTab === "users" && (
        <div className="space-y-4" id="users-tab">
          {/* Filters header */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-wrap gap-3.5 items-center justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search registered accounts by username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 focus:bg-white transition"
              />
            </div>

            <div className="flex gap-2.5 items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>
              <select
                value={userFilterRole}
                onChange={(e) => setUserFilterRole(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="All">All Roles</option>
                <option value="Citizen">Citizen Only</option>
                <option value="Moderator">Moderator Only</option>
                <option value="Fact Checker">Fact Checker Only</option>
                <option value="Administrator">Administrator Only</option>
              </select>

              <select
                value={userFilterStatus}
                onChange={(e) => setUserFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Suspended">Suspended Only</option>
                <option value="Banned">Banned Only</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px] font-mono">
                    <th className="p-4">Citizen Identity</th>
                    <th className="p-4">Governance Role</th>
                    <th className="p-4 text-center">Reputation</th>
                    <th className="p-4 text-center">Warnings</th>
                    <th className="p-4">Policy Compliance</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map(user => {
                    const warningCount = user.warnings?.length || 0;
                    let complianceState = "Active / Healthy";
                    let complianceColor = "text-emerald-600 bg-emerald-50 border-emerald-100";

                    if (user.isBanned) {
                      complianceState = "Permanently Banned";
                      complianceColor = "text-red-700 bg-red-50 border-red-150 font-bold animate-pulse";
                    } else if (user.isSuspended) {
                      complianceState = "Temporarily Suspended";
                      complianceColor = "text-amber-800 bg-amber-50 border-amber-100";
                    } else if (warningCount > 0) {
                      complianceState = `Level ${user.warnings![warningCount - 1].level} Restricted`;
                      complianceColor = "text-amber-600 bg-amber-50/50 border-amber-100/50";
                    }

                    return (
                      <tr key={user.uid} className="hover:bg-slate-50/50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">{user.username}</span>
                              <span className="text-[10px] text-slate-400 block">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {currentUser.role === "Administrator" ? (
                            <select
                              value={user.role}
                              onChange={(e) => {
                                const newRole = e.target.value as UserRole;
                                onUpdateUser(user.uid, { role: newRole });
                                onAddAuditLog({
                                  action: "Role Assigned",
                                  performedBy: currentUser.username,
                                  performedByRole: currentUser.role,
                                  userIdAffected: user.uid,
                                  usernameAffected: user.username,
                                  reason: `Changed role to ${newRole}`
                                });
                                alert(`Successfully assigned "${newRole}" role to ${user.username}.`);
                              }}
                              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium focus:outline-none"
                            >
                              <option value="Citizen">Citizen</option>
                              <option value="Moderator">Moderator</option>
                              <option value="Fact Checker">Fact Checker</option>
                              <option value="Administrator">Administrator</option>
                            </select>
                          ) : (
                            <span className="font-semibold px-2 py-1 bg-slate-100 rounded text-slate-600 border text-[10px]">
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-slate-700">
                          {user.reputation} pts
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold font-mono ${warningCount > 0 ? "bg-red-50 text-red-600 border border-red-100" : "text-slate-400"}`}>
                            {warningCount}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${complianceColor}`}>
                            {complianceState}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => setSelectedUserForWarning(user)}
                              className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-800 transition flex items-center gap-1"
                              title="Issue Warning"
                            >
                              <AlertCircle className="w-3 h-3" /> Warn User
                            </button>

                            {user.isSuspended || user.isBanned ? (
                              <button
                                onClick={() => changeUserStatus(user, "Restore")}
                                className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1.5 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition"
                              >
                                Restore
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => changeUserStatus(user, "Suspend")}
                                  className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1.5 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition"
                                  title="Temporary Suspension"
                                >
                                  Suspend
                                </button>
                                <button
                                  onClick={() => changeUserStatus(user, "Ban")}
                                  className="bg-red-50 text-red-800 border border-red-200 px-2 py-1.5 rounded-lg text-[10px] font-bold hover:bg-red-100 transition"
                                  title="Permanent Ban"
                                >
                                  Ban
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warning form modal */}
          {selectedUserForWarning && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    Issue Guidelines Warning for: {selectedUserForWarning.username}
                  </h4>
                  <button onClick={() => setSelectedUserForWarning(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleIssueWarningSubmit} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 uppercase tracking-wide text-[10px]">Warning Level</label>
                      <select
                        value={warningLevel}
                        onChange={(e) => setWarningLevel(Number(e.target.value) as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                      >
                        <option value="1">Level 1 - Warn-Alert Letter</option>
                        <option value="2">Level 2 - Posting Restrictions</option>
                        <option value="3">Level 3 - Temporary Suspension</option>
                        <option value="4">Level 4 - Permanent Account Ban</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 uppercase tracking-wide text-[10px]">Reason Type</label>
                      <select
                        value={warningReason}
                        onChange={(e) => setWarningReason(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                      >
                        <option value="Spam">Promotional Spam</option>
                        <option value="Misinformation">Misleading Information / Fake News</option>
                        <option value="Hate Speech">Hate Speech & Abuse</option>
                        <option value="Threats & Harassment">Threats & Harassment</option>
                        <option value="Defamation">Defamation / Libel</option>
                        <option value="Other">Other Standards Violation</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-1 uppercase tracking-wide text-[10px]">Detailed Evidence Description</label>
                    <textarea
                      placeholder="Specify the guidelines violations details, links to offending posts, or logs..."
                      rows={3}
                      value={warningDescription}
                      onChange={(e) => setWarningDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-sans"
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-1 uppercase tracking-wide text-[10px]">Recommended Action</label>
                    <input
                      type="text"
                      placeholder="e.g. Cease comment spam on development threads"
                      value={warningRecAction}
                      onChange={(e) => setWarningRecAction(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none font-sans"
                      required
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForWarning(null)}
                      className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition"
                    >
                      Issue Policy Warning
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fact-checking desk */}
      {activeTab === "factcheck" && (
        <div className="space-y-4" id="factchecking-desk">
          <div className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-wrap gap-2 justify-between items-center">
            <div>
              <h4 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Specialist Fact Checking Dashboard
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Filter claims flagged as false, unverified or suspicious by AI model or user audits.</p>
            </div>
            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              Role: {currentUser.role}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3.5">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fact-Check Pending Queue ({posts.filter(p => p.isReported || p.fakeNewsWarning?.flagged).length})</h5>
              
              {posts.filter(p => p.isReported || p.fakeNewsWarning?.flagged).length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center shadow-xs">
                  <CheckSquare className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-display font-medium text-slate-600 text-xs">Queue Clear! No claims are currently marked as unverified or suspicious.</p>
                </div>
              ) : (
                posts.filter(p => p.isReported || p.fakeNewsWarning?.flagged).map(post => (
                  <div 
                    key={post.id} 
                    className={`bg-white border rounded-2xl p-4 shadow-2xs space-y-2.5 transition cursor-pointer ${
                      selectedPostForFactCheck?.id === post.id ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-200 hover:border-indigo-400"
                    }`}
                    onClick={() => {
                      setSelectedPostForFactCheck(post);
                      setFcLabel(post.moderationLabel as any || "Verified");
                      setFcEvidence(post.evidenceLink || "");
                      setFcExplanation(post.factCheckExplanation || "");
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <h6 className="font-display font-bold text-slate-800 text-xs leading-snug">{post.title}</h6>
                      <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase text-slate-500 font-mono">
                        {post.category}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] font-sans line-clamp-2">"{post.description}"</p>
                    {post.fakeNewsWarning && (
                      <div className="p-2.5 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-100">
                        <span className="font-bold">AI Flag Rationale:</span> {post.fakeNewsWarning.explanation}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] text-indigo-600 font-bold pt-1 border-t border-slate-50">
                      <span>Click to Select & Fact-Check Claim</span>
                      <span className="font-mono text-slate-400 text-[9px] font-medium">By: {post.authorName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 sticky top-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">
                  Fact-Check Publisher
                </span>

                {selectedPostForFactCheck ? (
                  <form onSubmit={handleFactCheckSubmit} className="space-y-4 text-xs">
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-1">
                      <span className="text-[9px] text-indigo-700 font-bold uppercase font-mono">Selected Claim</span>
                      <p className="font-bold text-slate-800 text-xs truncate">{selectedPostForFactCheck.title}</p>
                      <p className="text-slate-500 text-[11px] line-clamp-2">"{selectedPostForFactCheck.description}"</p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-500 mb-1 uppercase tracking-wide text-[10px]">Verification Status</label>
                      <select
                        value={fcLabel}
                        onChange={(e) => setFcLabel(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none"
                      >
                        <option value="Verified">Verified Truthful</option>
                        <option value="Partially Verified">Partially Verified</option>
                        <option value="Unverified">Unverified Claim</option>
                        <option value="False Information">False Information</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-500 mb-1 uppercase tracking-wide text-[10px]">Evidence URL (External Link)</label>
                      <input
                        type="url"
                        placeholder="https://officialnews.in/article-report"
                        value={fcEvidence}
                        onChange={(e) => setFcEvidence(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-sans"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-500 mb-1 uppercase tracking-wide text-[10px]">Factcheck Explanation & Citation</label>
                      <textarea
                        placeholder="State clearly why this claim is verified or false. Provide context and citation sources..."
                        rows={5}
                        value={fcExplanation}
                        onChange={(e) => setFcExplanation(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-sans leading-relaxed"
                        required
                      ></textarea>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPostForFactCheck(null)}
                        className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 rounded-lg hover:bg-slate-200 transition"
                      >
                        Deselect
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 transition"
                      >
                        Publish Report
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-10 text-slate-400 italic">
                    <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    Select a post from the pending queue to publish an official fact-check audit.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appeals queue panel */}
      {activeTab === "appeals" && (
        <div className="space-y-4" id="appeals-tab">
          <div className="bg-white border border-slate-100 p-4 rounded-2xl">
            <h4 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-500" />
              Guidelines Appeals desk
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Citizens can appeal against warning notification letters, posting suspensions, or temporary restrictions.</p>
          </div>

          {pendingAppealsList.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-display font-medium text-slate-700 text-xs">Appeals board queue is currently empty.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Compliance reviews are fully up-to-date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingAppealsList.map(({ user, warning }) => (
                <div key={warning.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between" id={`appeal-card-${warning.id}`}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <div>
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-mono">
                          LEVEL {warning.level} WARNING
                        </span>
                        <h5 className="font-display font-bold text-slate-800 text-xs mt-1">Claim: {warning.reason}</h5>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">
                        Issued: {new Date(warning.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 font-sans space-y-1.5">
                      <p><strong className="text-slate-500">Violator Name:</strong> {user.username} ({user.email})</p>
                      <p><strong className="text-slate-500">Original Charge Description:</strong> {warning.description}</p>
                      <div className="p-3 bg-indigo-50/50 border border-indigo-100 text-indigo-900 rounded-xl mt-2 font-medium">
                        <strong className="block text-[9px] text-indigo-700 uppercase font-mono mb-1">Citizen Appeal Explanation Statement:</strong>
                        "{warning.appealText}"
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => {
                        onResolveAppeal(user.uid, warning.id, "Accepted");
                        alert("Appeal Accepted. Restriction was fully cleared and warning has been voided.");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-1 transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept Appeal (Void Warning)
                    </button>
                    <button
                      onClick={() => {
                        onResolveAppeal(user.uid, warning.id, "Rejected");
                        alert("Appeal Rejected. Guidelines policy decision upheld.");
                      }}
                      className="bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 font-bold px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-1 transition"
                    >
                      <X className="w-3.5 h-3.5" /> Reject Appeal (Uphold Charge)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit logs timeline desk */}
      {activeTab === "auditlogs" && currentUser.role === "Administrator" && (
        <div className="space-y-4" id="audit-logs-desk">
          <div className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-wrap gap-2 items-center justify-between">
            <div>
              <h4 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Administrative Action Registry Logs
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Chronological audit ledger of all staff actions, warning distributions, and account suspensions. Only administrators can view this registry.</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px] font-mono">
                    <th className="p-4">Staff / Executive Officer</th>
                    <th className="p-4">Administrative Action</th>
                    <th className="p-4">Target Affected</th>
                    <th className="p-4">Evidence Rationale / Context</th>
                    <th className="p-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {auditLogs
                    .filter(log => 
                      log.action.toLowerCase().includes(auditSearch.toLowerCase()) || 
                      log.performedBy.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      log.reason.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      log.usernameAffected?.toLowerCase().includes(auditSearch.toLowerCase())
                    )
                    .map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 block text-xs">{log.performedBy}</span>
                            <span className="text-[8px] bg-indigo-50 text-indigo-800 border border-indigo-100 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                              {log.performedByRole}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">
                          {log.action}
                        </td>
                        <td className="p-4 font-medium text-slate-500">
                          {log.usernameAffected ? (
                            <span>👤 {log.usernameAffected}</span>
                          ) : log.contentIdAffected ? (
                            <span>📄 Content #{log.contentIdAffected.substring(0, 8)}</span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="p-4 font-sans leading-relaxed text-slate-500 max-w-[280px] truncate" title={log.reason}>
                          {log.reason}
                        </td>
                        <td className="p-4 text-right text-slate-400 font-mono text-[10px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
