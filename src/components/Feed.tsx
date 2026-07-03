import React, { useState } from "react";
import { Post, Comment, UserProfile, PostCategory, IssueStatus, EvidenceFile, TimelineItem, EscalationEvent, UserRole } from "../types";
import { INITIAL_LOCATIONS } from "../firebase";
import { 
  MessageSquare, ThumbsUp, Bookmark, Share2, AlertTriangle, 
  Search, SlidersHorizontal, PlusCircle, CheckCircle2, User, 
  HelpCircle, Sparkles, AlertCircle, FileText, Send, ArrowRight, Loader2, X, MapPin,
  Camera, Video, File, Download, Maximize2, ShieldCheck, History, Calendar, RefreshCw, Eye, ShieldAlert, BadgeCheck
} from "lucide-react";

interface FeedProps {
  currentUser: UserProfile;
  posts: Post[];
  comments: Comment[];
  onAddPost: (newPost: Post) => void;
  onAddComment: (newComment: Comment) => void;
  onLikePost: (postId: string) => void;
  onBookmarkPost: (postId: string) => void;
  onReportPost: (postId: string) => void;
  onReportComment?: (postId: string, commentId: string) => void;
  onUpdatePostStatus?: (postId: string, status: IssueStatus) => void;
  onUpdatePost?: (postId: string, updatedFields: Partial<Post>) => void;
  leadersList: { id: string; name: string }[];
  partiesList: { id: string; name: string }[];
}

export default function Feed({ 
  currentUser, posts, comments, onAddPost, onAddComment, 
  onLikePost, onBookmarkPost, onReportPost, onReportComment, onUpdatePostStatus,
  onUpdatePost,
  leadersList, partiesList
}: FeedProps) {
  // Post Creator State
  const [showCreator, setShowCreator] = useState(false);

  // Check if current user is restricted from posting (Level 2 policy restriction)
  const isPostingRestricted = currentUser.warnings?.some(w => w.level === 2 && !w.appealStatus);

  const getModerationLabelBadge = (label?: string) => {
    if (!label) return null;
    let bg = "bg-slate-100 text-slate-700 border-slate-200";
    let icon = "🔍";

    if (label === "Verified") {
      bg = "bg-emerald-100 text-emerald-800 border-emerald-200";
      icon = "✅";
    } else if (label === "Partially Verified") {
      bg = "bg-green-50 text-green-700 border-green-200";
      icon = "⚠️";
    } else if (label === "Unverified") {
      bg = "bg-amber-50 text-amber-700 border-amber-200";
      icon = "❓";
    } else if (label === "False Information" || label === "False News") {
      bg = "bg-red-100 text-red-800 border-red-200 font-bold animate-pulse";
      icon = "🚨";
    } else if (label === "Under Review") {
      bg = "bg-cyan-50 text-cyan-700 border-cyan-200";
      icon = "⚖️";
    } else if (label === "Community Reported") {
      bg = "bg-purple-100 text-purple-800 border-purple-200";
      icon = "🚩";
    } else if (label === "Removed by Moderation") {
      bg = "bg-slate-200 text-slate-800 border-slate-300 line-through";
      icon = "🚫";
    }

    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border flex items-center gap-1 ${bg}`}>
        <span>{icon}</span>
        <span>{label}</span>
      </span>
    );
  };
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PostCategory>("Discussion");
  const [subCategory, setSubCategory] = useState("General");
  const [associatedLeader, setAssociatedLeader] = useState("");
  const [associatedParty, setAssociatedParty] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(currentUser.isAnonymousMode);
  
  // Custom location for post (defaults to current user location)
  const [state, setState] = useState(currentUser.location.state);
  const [district, setDistrict] = useState(currentUser.location.district);
  const [block, setBlock] = useState(currentUser.location.block);
  const [panchayat, setPanchayat] = useState(currentUser.location.panchayat);
  const [ward, setWard] = useState(currentUser.location.ward);

  // Advanced Civic Governance additions
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [postPriority, setPostPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");

  // Auto priority assignment based on keywords
  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    const keywordsCritical = [
      "drinking water", "shortage", "hospital", "medical", "emergency", "collapse",
      "bridge collapse", "major road collapse", "safety threat", "electrocution",
      "contamination", "water shortage", "doctor failure", "public safety", "hazard", "leak"
    ];
    const isCritical = keywordsCritical.some(kw => text.toLowerCase().includes(kw));
    if (isCritical) {
      setPostPriority("Critical");
    } else {
      const keywordsHigh = ["pothole", "accident", "broken", "overflowing", "drainage", "corruption", "bribe"];
      const isHigh = keywordsHigh.some(kw => text.toLowerCase().includes(kw));
      if (isHigh) {
        setPostPriority("High");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "document") => {
    const files = e.target.files;
    if (!files) return;

    const currentCount = evidenceFiles.filter(f => f.type === type).length;
    const maxCounts = { image: 5, video: 2, document: 3 };
    if (currentCount + files.length > maxCounts[type]) {
      alert(`Maximum limit reached! You can upload up to ${maxCounts[type]} ${type}s per report.`);
      return;
    }

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newFile: EvidenceFile = {
          id: "ev_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
          name: file.name,
          url: reader.result as string,
          type: type,
          mimeType: file.type,
          verificationStatus: "Unverified"
        };
        setEvidenceFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const addMockEvidence = (type: "image" | "video" | "document") => {
    const currentCount = evidenceFiles.filter(f => f.type === type).length;
    const maxCounts = { image: 5, video: 2, document: 3 };
    if (currentCount >= maxCounts[type]) {
      alert(`Maximum limit reached! You can upload up to ${maxCounts[type]} ${type}s per report.`);
      return;
    }

    let mockFile: EvidenceFile;
    if (type === "image") {
      mockFile = {
        id: "ev_mock_img_" + Date.now() + "_" + Math.random().toString(36).substr(2, 3),
        name: `pothole_leak_${currentCount + 1}.webp`,
        url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=crop",
        type: "image",
        mimeType: "image/webp",
        verificationStatus: "Unverified"
      };
    } else if (type === "video") {
      mockFile = {
        id: "ev_mock_vid_" + Date.now() + "_" + Math.random().toString(36).substr(2, 3),
        name: `water_flooding_${currentCount + 1}.mp4`,
        url: "https://assets.mixkit.co/videos/preview/mixkit-rain-on-asphalt-1011-large.mp4",
        type: "video",
        mimeType: "video/mp4",
        verificationStatus: "Unverified"
      };
    } else {
      mockFile = {
        id: "ev_mock_doc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 3),
        name: `municipal_damage_assessment_v${currentCount + 1}.pdf`,
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        type: "document",
        mimeType: "application/pdf",
        verificationStatus: "Unverified"
      };
    }

    setEvidenceFiles(prev => [...prev, mockFile]);
  };

  const removeEvidenceFile = (id: string) => {
    setEvidenceFiles(prev => prev.filter(f => f.id !== id));
  };

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterState, setFilterState] = useState<string>("All");
  const [filterDistrict, setFilterDistrict] = useState<string>("All");
  const [filterIssueStatus, setFilterIssueStatus] = useState<string>("All");

  // AI Auditing States
  const [aiAuditing, setAiAuditing] = useState(false);
  const [aiStep, setAiStep] = useState("");
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  // Active Post for Comments Modal
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // Advanced Civic Governance updates inside comments modal
  const [govMessage, setGovMessage] = useState("");
  const [govStatus, setGovStatus] = useState<"Acknowledged" | "Investigation Started" | "Work Order Issued" | "In Progress" | "Resolved">("Acknowledged");
  const [govDept, setGovDept] = useState("");
  const [govExpectedDate, setGovExpectedDate] = useState("");
  const [zoomImgUrl, setZoomImgUrl] = useState<string | null>(null);

  // --- ADVANCED CIVIC GOVERNANCE HANDLERS ---

  const handleSimulateTime = (days: number) => {
    if (!selectedPostId || !onUpdatePost) return;
    const post = posts.find(p => p.id === selectedPostId);
    if (!post) return;

    // Simulate age by increasing simulatedDays
    const previousTimeline = post.timeline || [];
    const previousHistory = post.escalationHistory || [];
    let currentLevel = post.escalationLevel || "Ward";
    let currentStatus = post.status || "Reported";
    
    const currentOffset = (post as any).ageOffsetDays || 0;
    const nextOffset = currentOffset + days;

    const nextHistory = [...previousHistory];
    const nextTimeline = [...previousTimeline];

    // Priority speed rules
    const priority = post.priority || "Medium";
    const isCritical = priority === "Critical";

    // Thresholds
    const ackThreshold = isCritical ? 1 : 7; // days
    const panchayatThreshold = isCritical ? 3 : 15;
    const blockThreshold = isCritical ? 7 : 30;
    const districtThreshold = isCritical ? 15 : 60;

    let escalatedTo = currentLevel;

    // Evaluate progression
    if (nextOffset >= ackThreshold && currentLevel === "Ward") {
      escalatedTo = "Panchayat";
      currentStatus = "Escalated";
      nextHistory.push({
        level: "Panchayat",
        date: Date.now(),
        reason: `Automated Escalation: Issue was unacknowledged at Ward level for over ${ackThreshold} days.`
      });
      nextTimeline.push({
        id: "t_esc_panch_" + Date.now(),
        status: "Escalated",
        date: Date.now(),
        officialName: "System Escaler",
        officialRole: "Automated Workflow Manager",
        department: "Gram Panchayat",
        message: `Escalation triggered. Concern transferred to Gram Panchayat jurisdiction due to non-acknowledgement.`
      });
    }

    if (nextOffset >= panchayatThreshold && (escalatedTo === "Panchayat" || escalatedTo === "Ward")) {
      escalatedTo = "Block";
      currentStatus = "Escalated";
      nextHistory.push({
        level: "Block",
        date: Date.now(),
        reason: `Automated Escalation: Issue remained unresolved at Gram Panchayat level for over ${panchayatThreshold} days.`
      });
      nextTimeline.push({
        id: "t_esc_block_" + Date.now(),
        status: "Escalated",
        date: Date.now(),
        officialName: "System Escaler",
        officialRole: "Automated Workflow Manager",
        department: "Block Administration",
        message: `Escalation triggered. Case transferred to Block Development Officer (BDO) for immediate review.`
      });
    }

    if (nextOffset >= blockThreshold && (escalatedTo === "Block" || escalatedTo === "Panchayat" || escalatedTo === "Ward")) {
      escalatedTo = "District";
      currentStatus = "Escalated";
      nextHistory.push({
        level: "District",
        date: Date.now(),
        reason: `Automated Escalation: Issue remained unresolved at Block level for over ${blockThreshold} days.`
      });
      nextTimeline.push({
        id: "t_esc_dist_" + Date.now(),
        status: "Escalated",
        date: Date.now(),
        officialName: "System Escaler",
        officialRole: "Automated Workflow Manager",
        department: "District Magistrate Office",
        message: `Critical Escalation. Case escalated directly to the District Collector and Municipal Commissioner.`
      });
    }

    if (nextOffset >= districtThreshold && (escalatedTo === "District" || escalatedTo === "Block" || escalatedTo === "Panchayat" || escalatedTo === "Ward")) {
      escalatedTo = "State";
      currentStatus = "Escalated";
      nextHistory.push({
        level: "State",
        date: Date.now(),
        reason: `Automated Escalation: Issue remained unresolved at District level for over ${districtThreshold} days.`
      });
      nextTimeline.push({
        id: "t_esc_state_" + Date.now(),
        status: "Escalated",
        date: Date.now(),
        officialName: "State Governance Coordinator",
        officialRole: "Automated Workflow Manager",
        department: "State Urban Development",
        message: `Highest Escalation. Concern registered with State Department Secretary for urgent administrative intervention.`
      });
    }

    onUpdatePost(selectedPostId, {
      ageOffsetDays: nextOffset,
      escalationLevel: escalatedTo as any,
      escalationHistory: nextHistory,
      timeline: nextTimeline,
      status: currentStatus as any
    } as any);

    alert(`Successfully simulated +${days} days! Current total simulated age: ${nextOffset} days. Checking escalation conditions...`);
  };

  const handleVerifyEvidence = (fileId: string, status: "Verified Evidence" | "Partially Verified" | "Unverified" | "Misleading Evidence") => {
    if (!selectedPostId || !onUpdatePost) return;
    const post = posts.find(p => p.id === selectedPostId);
    if (!post || !post.evidenceFiles) return;

    const updatedFiles = post.evidenceFiles.map(f => {
      if (f.id === fileId) {
        return {
          ...f,
          verificationStatus: status,
          verifiedBy: currentUser.username,
          verifiedAt: Date.now()
        };
      }
      return f;
    });

    onUpdatePost(selectedPostId, {
      evidenceFiles: updatedFiles
    });
  };

  const handleSubmitGovernmentResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostId || !onUpdatePost) return;
    const post = posts.find(p => p.id === selectedPostId);
    if (!post) return;

    if (!govMessage.trim() || !govDept.trim()) {
      alert("Please enter a response message and your department name.");
      return;
    }

    const currentTimeline = post.timeline || [];
    const currentResponses = post.governmentResponses || [];

    const newResponseId = "gov_resp_" + Date.now();
    const newResponse = {
      id: newResponseId,
      officialName: currentUser.username,
      officialRole: currentUser.role,
      department: govDept.trim(),
      message: govMessage.trim(),
      status: govStatus,
      createdAt: Date.now(),
      expectedResolutionDate: govExpectedDate.trim() || undefined
    };

    const newTimelineItem: TimelineItem = {
      id: "t_gov_" + Date.now(),
      status: govStatus,
      date: Date.now(),
      officialName: currentUser.username,
      officialRole: currentUser.role,
      department: govDept.trim(),
      message: govMessage.trim() + (govExpectedDate ? ` [Expected Resolution: ${govExpectedDate}]` : "")
    };

    onUpdatePost(selectedPostId, {
      status: govStatus === "Resolved" ? "Resolved" : "Under Review",
      acknowledgedAt: post.acknowledgedAt || Date.now(),
      resolvedAt: govStatus === "Resolved" ? Date.now() : undefined,
      governmentResponses: [...currentResponses, newResponse],
      timeline: [...currentTimeline, newTimelineItem]
    });

    setGovMessage("");
    setGovExpectedDate("");
    alert("Official government response recorded and timeline updated successfully!");
  };

  const issueCategories = [
    "Roads", "Water Supply", "Electricity", "Drainage", "Sanitation", 
    "Public Safety", "Healthcare", "Education", "Corruption", "Other"
  ];

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPostingRestricted) {
      alert("Posting and commenting are currently restricted on your account due to active policy restrictions (Level 2 Warning). Appeal this warning in your Profile Card to restore full access.");
      return;
    }
    if (!title || !description) return;

    setAiAuditing(true);
    setModerationWarning(null);

    try {
      // Step 1: Toxicity & Content Safety Moderation
      setAiStep("Reviewing content for community safety & toxicity...");
      const modRes = await fetch("/api/ai/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${title}. ${description}` }),
      });
      const modData = await modRes.json();
      
      if (modData.flagged) {
        setModerationWarning(`Post blocked by AI Moderator: ${modData.rationale}`);
        setAiAuditing(false);
        return;
      }

      // Step 2: Real-time Sentiment Analysis
      setAiStep("Analyzing civic sentiment profile...");
      const sentRes = await fetch("/api/ai/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: description }),
      });
      const sentData = await sentRes.json();

      // Step 3: Fake News Warning Analysis
      setAiStep("Checking factual veracity and claim verification...");
      const fakeRes = await fetch("/api/ai/fake-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const fakeData = await fakeRes.json();

      // Create new post document object
      const newPost: Post = {
        id: "post_" + Date.now(),
        title,
        description,
        category,
        subCategory: category === "Civic Issue" ? subCategory : undefined,
        location: {
          country: "India",
          state,
          district,
          block,
          panchayat,
          ward
        },
        status: category === "Civic Issue" ? "Reported" : undefined,
        likesCount: 0,
        likes: [],
        commentsCount: 0,
        bookmarkedBy: [],
        sentiment: sentData.sentiment || "Neutral",
        sentimentConfidence: sentData.confidence || 0.8,
        sentimentRationale: sentData.rationale || "Balanced civic dialogue",
        fakeNewsWarning: fakeData.flagged ? {
          flagged: true,
          warningMessage: fakeData.warningMessage,
          explanation: fakeData.explanation
        } : undefined,
        isAnonymous,
        authorId: isAnonymous ? "user_demo_anonymous" : currentUser.uid,
        authorName: isAnonymous ? "Anonymous Citizen" : currentUser.username,
        authorReputation: isAnonymous ? 50 : currentUser.reputation,
        leaderId: associatedLeader || undefined,
        partyId: associatedParty || undefined,
        createdAt: Date.now(),

        // Advanced Civic Governance additions
        evidenceFiles: category === "Civic Issue" ? evidenceFiles : undefined,
        priority: category === "Civic Issue" ? postPriority : undefined,
        escalationLevel: category === "Civic Issue" ? "Ward" : undefined,
        escalationHistory: category === "Civic Issue" ? [{ level: "Ward", date: Date.now(), reason: "Issue successfully registered at Ward level." }] : undefined,
        timeline: category === "Civic Issue" ? [{
          id: "t_init_" + Date.now(),
          status: "Reported",
          date: Date.now(),
          officialName: "System Auditor",
          officialRole: "Automated Registrar",
          department: "Administrative Portal",
          message: `Civic issue reported successfully with ${postPriority} priority rating.`
        }] : undefined,
        governmentResponses: category === "Civic Issue" ? [] : undefined
      };

      onAddPost(newPost);
      
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("Discussion");
      setSubCategory("General");
      setAssociatedLeader("");
      setAssociatedParty("");
      setEvidenceFiles([]);
      setPostPriority("Medium");
      setShowCreator(false);
    } catch (err) {
      console.error("AI Post Processing failure:", err);
      // Fallback post creation to ensure offline resilience
      const fallbackPost: Post = {
        id: "post_" + Date.now(),
        title,
        description,
        category,
        subCategory: category === "Civic Issue" ? subCategory : undefined,
        location: { country: "India", state, district, block, panchayat, ward },
        status: category === "Civic Issue" ? "Reported" : undefined,
        likesCount: 0,
        likes: [],
        commentsCount: 0,
        bookmarkedBy: [],
        sentiment: "Neutral",
        sentimentConfidence: 0.5,
        sentimentRationale: "AI analysis was skipped due to offline fallback mode",
        isAnonymous,
        authorId: isAnonymous ? "user_demo_anonymous" : currentUser.uid,
        authorName: isAnonymous ? "Anonymous Citizen" : currentUser.username,
        authorReputation: isAnonymous ? 50 : currentUser.reputation,
        leaderId: associatedLeader || undefined,
        partyId: associatedParty || undefined,
        createdAt: Date.now()
      };
      onAddPost(fallbackPost);
      setShowCreator(false);
    } finally {
      setAiAuditing(false);
      setAiStep("");
    }
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPostingRestricted) {
      alert("Posting and commenting are currently restricted on your account due to active policy restrictions (Level 2 Warning). Appeal this warning in your Profile Card to restore full access.");
      return;
    }
    if (!commentText.trim() || !selectedPostId) return;

    try {
      // Moderate comment
      const modRes = await fetch("/api/ai/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText }),
      });
      const modData = await modRes.json();
      
      if (modData.flagged) {
        alert(`Comment blocked by AI Moderator: ${modData.rationale}`);
        return;
      }

      const newComment: Comment = {
        id: "comm_" + Date.now(),
        postId: selectedPostId,
        text: commentText,
        isAnonymous: currentUser.isAnonymousMode,
        authorId: currentUser.isAnonymousMode ? "user_demo_anonymous" : currentUser.uid,
        authorName: currentUser.isAnonymousMode ? "Anonymous Citizen" : currentUser.username,
        authorReputation: currentUser.isAnonymousMode ? 50 : currentUser.reputation,
        createdAt: Date.now()
      };

      onAddComment(newComment);
      setCommentText("");
    } catch (e) {
      // Fallback commentary
      const fallbackComm: Comment = {
        id: "comm_" + Date.now(),
        postId: selectedPostId,
        text: commentText,
        isAnonymous: currentUser.isAnonymousMode,
        authorId: currentUser.isAnonymousMode ? "user_demo_anonymous" : currentUser.uid,
        authorName: currentUser.isAnonymousMode ? "Anonymous Citizen" : currentUser.username,
        authorReputation: currentUser.isAnonymousMode ? 50 : currentUser.reputation,
        createdAt: Date.now()
      };
      onAddComment(fallbackComm);
      setCommentText("");
    }
  };

  // Filter logic
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === "All" || post.category === filterCategory;
    const matchesState = filterState === "All" || post.location.state === filterState;
    const matchesDistrict = filterDistrict === "All" || post.location.district === filterDistrict;
    const matchesStatus = filterIssueStatus === "All" || post.status === filterIssueStatus;

    // Filter out hidden posts unless user is a Moderator, Admin, or Fact Checker
    const isPrivileged = currentUser.role === "Moderator" || currentUser.role === "Administrator" || currentUser.role === "Fact Checker";
    const matchesHidden = !post.isHidden || isPrivileged;

    return matchesSearch && matchesCategory && matchesState && matchesDistrict && matchesStatus && matchesHidden;
  });

  const getCategoryColor = (cat: PostCategory) => {
    switch (cat) {
      case "Civic Issue": return "bg-rose-50 border-rose-100 text-rose-700";
      case "Development": return "bg-emerald-50 border-emerald-100 text-emerald-700";
      case "Opinion": return "bg-amber-50 border-amber-100 text-amber-700";
      default: return "bg-blue-50 border-blue-100 text-blue-700";
    }
  };

  const getStatusBadgeColor = (stat: IssueStatus) => {
    switch (stat) {
      case "Resolved": return "bg-emerald-500 text-white";
      case "Escalated": return "bg-red-500 text-white";
      case "Under Review": return "bg-amber-500 text-white";
      default: return "bg-slate-400 text-white";
    }
  };

  const getSentimentIcon = (sent: string) => {
    switch (sent) {
      case "Positive": return "🟢";
      case "Negative": return "🔴";
      default: return "🟡";
    }
  };

  const isPrivileged = currentUser.role === "Moderator" || currentUser.role === "Administrator" || currentUser.role === "Fact Checker";
  const activeComments = comments.filter(c => c.postId === selectedPostId && (!c.isHidden || isPrivileged));
  const districts = INITIAL_LOCATIONS.districts[state] || [];
  const blocks = INITIAL_LOCATIONS.blocks[district] || [];
  const panchayats = INITIAL_LOCATIONS.panchayats[block] || [];

  return (
    <div className="space-y-6" id="social-feed-container">
      {/* Search and Filters Hub */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search posts, complaints, development summaries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 focus:bg-white"
            />
          </div>
          <button 
            onClick={() => setShowCreator(true)}
            className="bg-primary-600 text-white px-4 py-2.5 rounded-xl font-display font-medium text-sm flex items-center gap-1.5 hover:bg-primary-700 transition"
            id="create-new-post-trigger"
          >
            <PlusCircle className="w-4 h-4" />
            Create Post
          </button>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-400">Filters:</span>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Discussion">Discussions</option>
            <option value="Civic Issue">Civic Issues</option>
            <option value="Development">Development Works</option>
            <option value="Opinion">Opinions</option>
          </select>

          <select
            value={filterState}
            onChange={(e) => {
              setFilterState(e.target.value);
              setFilterDistrict("All");
            }}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="All">All States</option>
            {INITIAL_LOCATIONS.states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {filterState !== "All" && (
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="All">All Districts</option>
              {(INITIAL_LOCATIONS.districts[filterState] || []).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          {filterCategory === "Civic Issue" && (
            <select
              value={filterIssueStatus}
              onChange={(e) => setFilterIssueStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none animate-fade-in"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Under Review">Under Review</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
            </select>
          )}
        </div>
      </div>

      {/* AI Auditing Radar Overlay */}
      {aiAuditing && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center animate-pulse gap-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <div>
            <h4 className="font-display font-bold text-slate-800 flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-orange-500 animate-bounce" />
              Gemini AI Civic Audit Active
            </h4>
            <p className="text-xs text-slate-500 mt-1">{aiStep}</p>
          </div>
        </div>
      )}

      {/* Moderation Warnings Banner */}
      {moderationWarning && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-sm">Post Safety Violation</h5>
            <p className="text-xs text-red-700 mt-1">{moderationWarning}</p>
            <button 
              onClick={() => setModerationWarning(null)}
              className="text-xs font-semibold underline text-red-800 mt-2 hover:text-red-900 block"
            >
              Dismiss Warning
            </button>
          </div>
        </div>
      )}

      {/* Creator Panel */}
      {showCreator && !aiAuditing && (
        <form onSubmit={handleCreatePost} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in" id="post-creation-form">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-display font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-500" />
              Write Citizen Post & Run AI Safety Check
            </h4>
            <button 
              type="button" 
              onClick={() => setShowCreator(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Post Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PostCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="Discussion">General Discussion</option>
                <option value="Civic Issue">Civic Issue Report</option>
                <option value="Development">Development Report</option>
                <option value="Opinion">Opinion Post</option>
              </select>
            </div>

            {category === "Civic Issue" && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Issue Sub-Category</label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  {issueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Post Title</label>
            <input
              type="text"
              placeholder="Be descriptive (e.g. 'Broken water mains flooding Block D streets')"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Detailed Description</label>
            <textarea
              placeholder="State your experience, location, dates, and what corrective action is expected from political representatives..."
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 h-28 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Associate political Leader</label>
              <select
                value={associatedLeader}
                onChange={(e) => setAssociatedLeader(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <option value="">None / Not Applicable</option>
                {leadersList.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Associate political Party</label>
              <select
                value={associatedParty}
                onChange={(e) => setAssociatedParty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <option value="">None / Not Applicable</option>
                {partiesList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location for post overrides */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
            <span className="font-bold text-slate-600 block mb-2">Scope of Post Jurisdiction</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">State</label>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setDistrict("");
                    setBlock("");
                    setPanchayat("");
                  }}
                  className="w-full p-1 bg-white border border-slate-200 rounded text-[11px]"
                >
                  <option value="">Select State</option>
                  {INITIAL_LOCATIONS.states.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">District</label>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setBlock("");
                    setPanchayat("");
                  }}
                  disabled={!state}
                  className="w-full p-1 bg-white border border-slate-200 rounded text-[11px] disabled:opacity-55"
                >
                  <option value="">Select District</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Block/Tehsil</label>
                <select
                  value={block}
                  onChange={(e) => {
                    setBlock(e.target.value);
                    setPanchayat("");
                  }}
                  disabled={!district}
                  className="w-full p-1 bg-white border border-slate-200 rounded text-[11px] disabled:opacity-55"
                >
                  <option value="">Select Block</option>
                  {blocks.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Priority & Visual Evidence Uploads (For Civic Issues) */}
          {category === "Civic Issue" && (
            <div className="border-t border-slate-100 pt-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-xs font-bold text-slate-700">Issue Priority Classification</span>
                  <p className="text-[10px] text-slate-400">Classified automatically based on safety and hazard keywords</p>
                </div>
                <select
                  value={postPriority}
                  onChange={(e) => setPostPriority(e.target.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border focus:outline-none ${
                    postPriority === "Critical" ? "bg-red-50 text-red-700 border-red-200" :
                    postPriority === "High" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    postPriority === "Medium" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">🚨 Critical Priority (Faster Escalation)</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-bold text-slate-700">Attach Verified Visual Evidence</span>
                  <span className="text-[10px] text-slate-400 font-mono">Limits: 5 Images, 2 Videos, 3 Docs</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {/* Photos Upload */}
                  <div className="bg-slate-50 hover:bg-slate-100/75 border border-dashed border-slate-200 rounded-xl p-2.5 text-center transition flex flex-col justify-between h-24">
                    <div className="flex flex-col items-center">
                      <Camera className="w-5 h-5 text-slate-400 mb-0.5" />
                      <span className="text-[10px] font-bold text-slate-600">📷 PHOTOS (Max 5)</span>
                      <span className="text-[9px] text-slate-400">JPG, PNG, WEBP</span>
                    </div>
                    <div className="flex justify-center gap-1.5 mt-1.5">
                      <label className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-[9px] px-2 py-1 rounded font-bold cursor-pointer transition">
                        Select
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={(e) => handleFileChange(e, "image")} 
                          className="hidden" 
                        />
                      </label>
                      <button 
                        type="button"
                        onClick={() => addMockEvidence("image")}
                        className="bg-primary-50 hover:bg-primary-100 border border-primary-100 text-primary-700 text-[9px] px-2 py-1 rounded font-bold transition"
                      >
                        Mock +
                      </button>
                    </div>
                  </div>

                  {/* Videos Upload */}
                  <div className="bg-slate-50 hover:bg-slate-100/75 border border-dashed border-slate-200 rounded-xl p-2.5 text-center transition flex flex-col justify-between h-24">
                    <div className="flex flex-col items-center">
                      <Video className="w-5 h-5 text-slate-400 mb-0.5" />
                      <span className="text-[10px] font-bold text-slate-600">🎥 VIDEOS (Max 2)</span>
                      <span className="text-[9px] text-slate-400 font-sans">MP4, MOV</span>
                    </div>
                    <div className="flex justify-center gap-1.5 mt-1.5">
                      <label className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-[9px] px-2 py-1 rounded font-bold cursor-pointer transition">
                        Select
                        <input 
                          type="file" 
                          multiple 
                          accept="video/*" 
                          onChange={(e) => handleFileChange(e, "video")} 
                          className="hidden" 
                        />
                      </label>
                      <button 
                        type="button"
                        onClick={() => addMockEvidence("video")}
                        className="bg-primary-50 hover:bg-primary-100 border border-primary-100 text-primary-700 text-[9px] px-2 py-1 rounded font-bold transition"
                      >
                        Mock +
                      </button>
                    </div>
                  </div>

                  {/* Documents Upload */}
                  <div className="bg-slate-50 hover:bg-slate-100/75 border border-dashed border-slate-200 rounded-xl p-2.5 text-center transition flex flex-col justify-between h-24">
                    <div className="flex flex-col items-center">
                      <FileText className="w-5 h-5 text-slate-400 mb-0.5" />
                      <span className="text-[10px] font-bold text-slate-600">📄 DOCUMENTS (Max 3)</span>
                      <span className="text-[9px] text-slate-400">PDF, Supporting Files</span>
                    </div>
                    <div className="flex justify-center gap-1.5 mt-1.5">
                      <label className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-[9px] px-2 py-1 rounded font-bold cursor-pointer transition">
                        Select
                        <input 
                          type="file" 
                          multiple 
                          accept=".pdf,.doc,.docx,application/pdf" 
                          onChange={(e) => handleFileChange(e, "document")} 
                          className="hidden" 
                        />
                      </label>
                      <button 
                        type="button"
                        onClick={() => addMockEvidence("document")}
                        className="bg-primary-50 hover:bg-primary-100 border border-primary-100 text-primary-700 text-[9px] px-2 py-1 rounded font-bold transition"
                      >
                        Mock +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Evidence Files List */}
                {evidenceFiles.length > 0 && (
                  <div className="bg-slate-50 p-2 border border-slate-100 rounded-xl space-y-1.5 max-h-40 overflow-y-auto mt-2">
                    {evidenceFiles.map(f => (
                      <div key={f.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 text-[11px]">
                        <div className="flex items-center gap-2 truncate">
                          {f.type === "image" && <Camera className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                          {f.type === "video" && <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                          {f.type === "document" && <File className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                          <span className="font-medium text-slate-700 truncate">{f.name}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded shrink-0 uppercase tracking-wider font-mono">
                            {f.type}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEvidenceFile(f.id)}
                          className="text-slate-400 hover:text-red-500 p-1 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium">Post as Anonymous Citizen</label>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-emerald-700 transition"
              id="submit-post-btn"
            >
              Analyze & Publish
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Posts Feed */}
      <div className="space-y-4" id="post-items-feed">
        {filteredPosts.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center shadow-sm">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-display font-medium text-slate-600 text-sm">No discussions or issue reports found.</p>
            <p className="text-xs text-slate-400 mt-1">Try broadening your administrative location filters or create the first post!</p>
          </div>
        ) : (
          filteredPosts.map(post => {
            const isLiked = post.likes.includes(currentUser.uid);
            const isBookmarked = post.bookmarkedBy?.includes(currentUser.uid);

            return (
              <div 
                key={post.id} 
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
                id={`post-card-${post.id}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {post.authorName}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Reputation: {post.authorReputation} pts • {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    {/* Moderation Label Badge */}
                    {getModerationLabelBadge(post.moderationLabel)}

                    {/* Category */}
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getCategoryColor(post.category)}`}>
                      {post.category} {post.subCategory ? `• ${post.subCategory}` : ""}
                    </span>

                    {/* Issue Status */}
                    {post.category === "Civic Issue" && post.status && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${getStatusBadgeColor(post.status)}`}>
                        {post.status}
                      </span>
                    )}

                    {/* Priority, Escalation Level & Evidence Badges */}
                    {post.category === "Civic Issue" && post.priority && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-0.5 border ${
                        post.priority === "Critical" ? "bg-red-100 text-red-800 border-red-200 animate-pulse" :
                        post.priority === "High" ? "bg-amber-100 text-amber-800 border-amber-200" :
                        post.priority === "Medium" ? "bg-blue-100 text-blue-800 border-blue-200" :
                        "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {post.priority} Priority
                      </span>
                    )}

                    {post.category === "Civic Issue" && post.escalationLevel && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded-full">
                        🏛️ {post.escalationLevel} Level
                      </span>
                    )}

                    {post.category === "Civic Issue" && post.evidenceFiles && post.evidenceFiles.length > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-teal-100 text-teal-800 border border-teal-200 rounded-full flex items-center gap-1">
                        📎 {post.evidenceFiles.length} Evidence
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-2 mb-4">
                  <h4 className="font-display font-bold text-slate-900 text-base leading-snug">
                    {post.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {post.description}
                  </p>
                </div>

                {/* AI Warning Banner (Fake News Check) */}
                {post.fakeNewsWarning?.flagged && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs flex gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase text-[10px] tracking-wider block text-amber-800">
                        {post.fakeNewsWarning.warningMessage || "Gemini Fact-Check Advisory"}
                      </span>
                      <p className="text-amber-700 mt-0.5 font-sans leading-relaxed">{post.fakeNewsWarning.explanation}</p>
                    </div>
                  </div>
                )}

                {/* Official Fact-Check Report */}
                {post.moderationLabel && (post.factCheckExplanation || post.evidenceLink) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 mb-1.5 text-slate-800 font-bold">
                      <FileText className="w-4 h-4 text-primary-600" />
                      <span>OFFICIAL GOVERNANCE FACT-CHECK REPORT</span>
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-mono font-medium">
                        Verified Report
                      </span>
                    </div>
                    {post.factCheckExplanation && (
                      <p className="text-slate-600 leading-relaxed font-sans mb-1.5">
                        {post.factCheckExplanation}
                      </p>
                    )}
                    {post.evidenceLink && (
                      <a
                        href={post.evidenceLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 font-bold hover:underline inline-flex items-center gap-0.5 text-[10px]"
                      >
                        🔗 Review Verified Fact Check Evidence
                      </a>
                    )}
                  </div>
                )}

                {/* Jurisdiction Location Scope */}
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400 border-t border-slate-50 pt-2.5 mb-3.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium">Scope:</span>
                  <span className="font-semibold text-slate-600">{post.location.state}</span>
                  {post.location.district && (
                    <>
                      <span className="text-slate-300">/</span>
                      <span className="font-semibold text-slate-600">{post.location.district}</span>
                    </>
                  )}
                  {post.location.block && (
                    <>
                      <span className="text-slate-300">/</span>
                      <span className="font-semibold text-slate-600">{post.location.block}</span>
                    </>
                  )}
                  {post.location.panchayat && (
                    <>
                      <span className="text-slate-300">/</span>
                      <span className="font-semibold text-slate-600 truncate max-w-[150px]">{post.location.panchayat}</span>
                    </>
                  )}
                  {post.location.ward && (
                    <>
                      <span className="text-slate-300">/</span>
                      <span className="font-semibold text-slate-600">{post.location.ward}</span>
                    </>
                  )}
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-4 text-xs">
                    {/* Likes */}
                    <button 
                      onClick={() => onLikePost(post.id)}
                      className={`flex items-center gap-1 font-semibold transition ${
                        isLiked ? "text-primary-600 scale-105" : "text-slate-500 hover:text-primary-600"
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-primary-600" : ""}`} />
                      {post.likesCount}
                    </button>

                    {/* Comments */}
                    <button 
                      onClick={() => {
                        setSelectedPostId(post.id);
                        setCommentText("");
                      }}
                      className="flex items-center gap-1 font-semibold text-slate-500 hover:text-blue-600 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {comments.filter(c => c.postId === post.id).length}
                    </button>

                    {/* Bookmarks */}
                    <button 
                      onClick={() => onBookmarkPost(post.id)}
                      className={`flex items-center gap-1 font-semibold transition ${
                        isBookmarked ? "text-amber-500 scale-105" : "text-slate-500 hover:text-amber-500"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-500" : ""}`} />
                      {isBookmarked ? "Bookmarked" : "Bookmark"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    {/* Sentiment Tag */}
                    {post.sentiment && (
                      <div 
                        className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-help relative group"
                        title={post.sentimentRationale}
                      >
                        <span className="text-[10px]">Sentiment: {getSentimentIcon(post.sentiment)}</span>
                        <span className="font-bold text-slate-700 text-[10px]">{post.sentiment}</span>
                        
                        {/* Hover Tooltip Details */}
                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-900 text-white text-[11px] p-2.5 rounded-xl shadow-xl hidden group-hover:block z-10 font-sans leading-relaxed pointer-events-none">
                          <span className="font-bold block mb-1">Gemini AI Audit Metrics:</span>
                          <p className="text-slate-300">{post.sentimentRationale}</p>
                          <span className="text-slate-400 text-[9px] block mt-1">Confidence Score: {(post.sentimentConfidence! * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/#post_${post.id}`);
                        alert("Reference Link copied to clipboard!");
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition"
                      title="Share Reference"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => {
                        onReportPost(post.id);
                        alert("Thank you. Post flagged for AI and moderator verification.");
                      }}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-full transition"
                      title="Report Inappropriate"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inline Comments Overlay Drawer */}
      {selectedPostId && (() => {
        const activePost = posts.find(p => p.id === selectedPostId);
        const isPrivileged = currentUser.role === "Moderator" || currentUser.role === "Administrator" || currentUser.role === "Fact Checker";
        const isOfficialRole = (role: string) => [
          "Gram Panchayat Official", "Municipal Officer", "Block Development Officer", 
          "District Official", "MLA Office Representative", "MP Office Representative", 
          "State Government Representative"
        ].includes(role);

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="comments-drawer-backdrop">
            <div className={`bg-white rounded-2xl ${activePost?.category === "Civic Issue" ? "max-w-4xl" : "max-w-xl"} w-full border border-slate-100 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden`} id="comments-modal-container">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h4 className="font-display font-semibold text-slate-800 text-sm">
                    {activePost?.category === "Civic Issue" ? "🏛️ Civic Accountability & Concern Portal" : "Citizen Discussion Thread"}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {activePost?.category === "Civic Issue" ? "Review evidence logs, administrative trackings, and official government releases" : "Join the discussion with other registered and anonymous voices"}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedPostId(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Split layout for Civic Issues vs Standard Discussions */}
              {activePost?.category === "Civic Issue" ? (
                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-slate-150 min-h-0 bg-slate-50/20">
                  {/* Left Column: Governance, Escalations, Evidence, official updates (7/12 cols) */}
                  <div className="md:col-span-7 overflow-y-auto p-4 space-y-4 border-r border-slate-100">
                    
                    {/* Original Post Recap */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Reported Concern Details</span>
                      <h5 className="font-bold text-slate-800 text-xs">{activePost.title}</h5>
                      <p className="text-slate-600 text-xs font-sans whitespace-pre-wrap leading-relaxed">{activePost.description}</p>
                    </div>

                    {/* Issue Status & Scope */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Jurisdiction Scope</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getStatusBadgeColor(activePost.status || "Reported")}`}>
                          {activePost.status || "Reported"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 bg-slate-50 p-2.5 rounded-lg text-[11px] font-sans">
                        <div><span className="text-slate-400">State:</span> <span className="font-bold text-slate-700">{activePost.location.state || "National"}</span></div>
                        <div><span className="text-slate-400">District:</span> <span className="font-bold text-slate-700">{activePost.location.district || "Any"}</span></div>
                        {activePost.location.block && <div><span className="text-slate-400">Block:</span> <span className="font-bold text-slate-700">{activePost.location.block}</span></div>}
                        {activePost.location.panchayat && <div><span className="text-slate-400">Panchayat:</span> <span className="font-bold text-slate-700">{activePost.location.panchayat}</span></div>}
                        {activePost.location.ward && <div><span className="text-slate-400">Ward:</span> <span className="font-bold text-slate-700">No. {activePost.location.ward}</span></div>}
                      </div>
                    </div>

                    {/* Progressive Escalation Level Tracker */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs space-y-3">
                      <span className="block text-xs font-bold text-slate-700">🏛️ Administrative Escalation Level</span>
                      
                      {/* Line visual tracker */}
                      <div className="grid grid-cols-5 text-center relative pt-4 pb-2">
                        <div className="absolute top-[25px] left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0"></div>
                        
                        {/* Active purple highlight bar up to current level */}
                        {(() => {
                          const levels = ["Ward", "Panchayat", "Block", "District", "State"];
                          const currentIndex = levels.indexOf(activePost.escalationLevel || "Ward");
                          const percentages = ["0%", "25%", "50%", "75%", "100%"];
                          return (
                            <div 
                              className="absolute top-[25px] left-[10%] h-0.5 bg-purple-500 transition-all duration-300 -z-0" 
                              style={{ width: `calc(${percentages[currentIndex]} * 0.8)` }}
                            />
                          );
                        })()}

                        {["Ward", "Panchayat", "Block", "District", "State"].map((lvl) => {
                          const levels = ["Ward", "Panchayat", "Block", "District", "State"];
                          const activeLvl = activePost.escalationLevel || "Ward";
                          const isCurrent = lvl === activeLvl;
                          const isPassed = levels.indexOf(lvl) <= levels.indexOf(activeLvl);
                          
                          return (
                            <div key={lvl} className="flex flex-col items-center relative z-10">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition ${
                                isCurrent ? "bg-purple-600 text-white border-purple-600 shadow-sm" :
                                isPassed ? "bg-purple-100 text-purple-700 border-purple-300" :
                                "bg-slate-50 text-slate-400 border-slate-200"
                              }`}>
                                {levels.indexOf(lvl) + 1}
                              </div>
                              <span className={`text-[9px] font-bold mt-1 block truncate w-full ${
                                isCurrent ? "text-purple-700 font-extrabold" : isPassed ? "text-slate-700 font-medium" : "text-slate-400"
                              }`}>{lvl}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Escalate simulation sandbox tools */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-600">Time-Forward Simulator</span>
                          <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            Age: {(activePost as any).ageOffsetDays || 0} Days
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleSimulateTime(7)}
                            className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-[10px] font-bold py-1 px-2 rounded-lg transition"
                          >
                            Fast-Forward +7 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSimulateTime(15)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold py-1 px-2 rounded-lg transition"
                          >
                            Fast-Forward +15 Days
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-tight">
                          Critical priority issues escalate after 1, 3, 7, and 15 days of silence.
                          Other priorities escalate after 7, 15, 30, and 60 days.
                        </p>
                      </div>

                      {/* Escalation history log list */}
                      {activePost.escalationHistory && activePost.escalationHistory.length > 0 && (
                        <div className="space-y-1.5 border-t border-slate-50 pt-2">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escalation Audit History</span>
                          <div className="space-y-1 max-h-24 overflow-y-auto text-[10px]">
                            {activePost.escalationHistory.map((h, index) => (
                              <div key={index} className="bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-600 leading-snug">
                                <span className="font-bold text-purple-700">Tier: {h.level}</span>
                                <span className="text-slate-400 font-mono text-[9px] float-right">{new Date(h.date).toLocaleDateString()}</span>
                                <p className="text-slate-500 mt-0.5">{h.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Verified Visual Evidence Gallery */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs space-y-3">
                      <span className="block text-xs font-bold text-slate-700 font-display">📎 Citizens Visual Evidence Gallery</span>
                      
                      {!activePost.evidenceFiles || activePost.evidenceFiles.length === 0 ? (
                        <div className="text-center py-5 text-slate-400 italic text-[11px] bg-slate-50 rounded-xl">
                          No visual evidence attached to this civic report. Use the post creation panel to report with images.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {activePost.evidenceFiles.map(file => {
                              const isImg = file.type === "image";
                              const isVid = file.type === "video";
                              const isDoc = file.type === "document";

                              return (
                                <div key={file.id} className="relative group border border-slate-100 rounded-lg overflow-hidden bg-slate-50 flex flex-col justify-between p-2 text-center shadow-3xs">
                                  {/* Media Preview / Icon */}
                                  <div className="h-20 flex items-center justify-center bg-slate-100 rounded mb-1.5 overflow-hidden">
                                    {isImg && (
                                      <img 
                                        src={file.url} 
                                        alt={file.name} 
                                        className="object-cover w-full h-full cursor-pointer hover:scale-105 transition"
                                        onClick={() => setZoomImgUrl(file.url)}
                                      />
                                    )}
                                    {isVid && (
                                      <video className="w-full h-full object-cover">
                                        <source src={file.url} type="video/mp4" />
                                      </video>
                                    )}
                                    {isDoc && (
                                      <FileText className="w-8 h-8 text-orange-400" />
                                    )}
                                  </div>

                                  {/* Details & Verification status */}
                                  <div className="text-[10px] space-y-1">
                                    <p className="font-bold text-slate-700 truncate" title={file.name}>{file.name}</p>
                                    
                                    {/* Verification status pill */}
                                    <span className={`block text-[8px] font-bold px-1.5 py-0.5 rounded font-sans uppercase tracking-wider ${
                                      file.verificationStatus === "Verified Evidence" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                      file.verificationStatus === "Misleading Evidence" ? "bg-red-50 text-red-700 border border-red-100" :
                                      file.verificationStatus === "Partially Verified" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                      "bg-slate-100 text-slate-600 border border-slate-200"
                                    }`}>
                                      {file.verificationStatus || "Unverified"}
                                    </span>

                                    {/* Action button */}
                                    {isDoc && (
                                      <a 
                                        href={file.url} 
                                        download 
                                        className="block bg-orange-50 hover:bg-orange-100 border border-orange-100 text-orange-700 text-[9px] py-0.5 rounded font-bold transition mt-1"
                                      >
                                        Download PDF
                                      </a>
                                    )}
                                    {isVid && (
                                      <button 
                                        type="button"
                                        onClick={() => alert(`Opening video feedback player for: ${file.name}`)}
                                        className="block w-full bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 text-[9px] py-0.5 rounded font-bold transition mt-1"
                                      >
                                        Play Video
                                      </button>
                                    )}
                                  </div>

                                  {/* Privileged Verification Actions (Moderators & Admins) */}
                                  {isPrivileged && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                                      <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-wider block">Verify Media</span>
                                      <div className="grid grid-cols-2 gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleVerifyEvidence(file.id, "Verified Evidence")}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-bold py-0.5 px-1 rounded transition"
                                        >
                                          Verify
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleVerifyEvidence(file.id, "Misleading Evidence")}
                                          className="bg-red-600 hover:bg-red-700 text-white text-[8px] font-bold py-0.5 px-1 rounded transition"
                                        >
                                          False
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Government Official Response Panel */}
                    {isOfficialRole(currentUser.role) && (
                      <form onSubmit={handleSubmitGovernmentResponse} className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs space-y-3 bg-gradient-to-br from-blue-50/20 to-indigo-50/10">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-blue-800 flex items-center gap-1">
                            🏛️ Verified Government Response Panel
                          </span>
                          <span className="text-[8px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                            Official Mode
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Government Department</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Dept of Public Works" 
                              value={govDept}
                              onChange={(e) => setGovDept(e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded focus:outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Response Type Status</label>
                            <select
                              value={govStatus}
                              onChange={(e) => setGovStatus(e.target.value as any)}
                              className="w-full p-1.5 border border-slate-200 rounded focus:outline-none bg-white font-semibold"
                            >
                              <option value="Acknowledged">Acknowledged</option>
                              <option value="Investigation Started">Investigation Started</option>
                              <option value="Work Order Issued">Work Order Issued</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved (Close Case)</option>
                            </select>
                          </div>
                        </div>

                        <div className="text-xs">
                          <label className="block text-[10px] text-slate-500 mb-0.5">Expected Resolution Date (Optional)</label>
                          <input 
                            type="date" 
                            value={govExpectedDate}
                            onChange={(e) => setGovExpectedDate(e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded focus:outline-none"
                          />
                        </div>

                        <div className="text-xs">
                          <label className="block text-[10px] text-slate-500 mb-0.5">Official Response Statement</label>
                          <textarea 
                            placeholder="Provide detailed administrative updates, expected steps, budgetary approvals, or work completion logs..."
                            value={govMessage}
                            onChange={(e) => setGovMessage(e.target.value)}
                            className="w-full h-16 p-1.5 border border-slate-200 rounded focus:outline-none"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1"
                        >
                          Publish Official Response
                        </button>
                      </form>
                    )}

                    {/* Comprehensive Response Timeline */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs space-y-3">
                      <span className="block text-xs font-bold text-slate-700">📊 Accountability Timeline Tracker</span>
                      
                      {!activePost.timeline || activePost.timeline.length === 0 ? (
                        <div className="text-center py-5 text-slate-400 italic text-[11px] bg-slate-50 rounded-xl">
                          No timeline events logged yet.
                        </div>
                      ) : (
                        <div className="relative pl-3.5 border-l border-slate-200 space-y-4 text-[11px] mt-2">
                          {activePost.timeline.map((event) => (
                            <div key={event.id} className="relative">
                              {/* Dot icon */}
                              <div className="absolute -left-[19.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-600 border-2 border-white ring-2 ring-purple-100"></div>
                              
                              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                                    {event.status}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {new Date(event.date).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-slate-600 font-medium mt-1 font-sans">{event.message}</p>
                                
                                <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400 font-semibold font-mono">
                                  <span>Dept: {event.department}</span>
                                  <span>•</span>
                                  <span>Logger: {event.officialName} ({event.officialRole})</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Citizen Discussion Section (5/12 cols) */}
                  <div className="md:col-span-5 flex flex-col max-h-[60vh] md:max-h-none overflow-hidden">
                    <div className="p-3 bg-slate-100 border-b border-slate-200 text-center shrink-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Citizen Public Discussion</span>
                    </div>
                    {/* Comments list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20">
                      {activeComments.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 italic text-[11px]">
                          No comments yet. Write the first voice below!
                        </div>
                      ) : (
                        activeComments.map(comm => (
                          <div key={comm.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs space-y-1 relative group text-xs">
                            <div className="flex justify-between text-[10px] font-bold text-slate-700">
                              <span className="flex items-center gap-1">
                                {comm.authorName}
                                {comm.isHidden && <span className="text-[7px] bg-red-100 text-red-700 px-1 py-0.2 rounded uppercase">Removed</span>}
                              </span>
                              <span className="text-slate-400 font-mono text-[9px]">Rep: {comm.authorReputation} pts</span>
                            </div>
                            <p className={`text-[11px] text-slate-600 leading-relaxed font-sans ${comm.isHidden ? "line-through text-slate-400" : ""}`}>{comm.text}</p>
                            
                            {/* Report comment option */}
                            {!comm.isReported && !comm.isHidden && (
                              <div className="absolute right-1.5 bottom-1 opacity-0 group-hover:opacity-100 transition duration-150">
                                <button
                                  type="button"
                                  onClick={() => onReportComment ? onReportComment(selectedPostId, comm.id) : alert("Comment reported")}
                                  className="text-[8px] text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-slate-50 transition"
                                >
                                  Report
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* General non-Civic Issue Discussion Thread */
                <>
                  {/* Original Post Recap */}
                  <div className="p-4 bg-primary-50/40 border-b border-slate-100 text-xs">
                    <span className="text-slate-400 font-bold block mb-1">ORIGINAL CONCERN:</span>
                    <p className="font-bold text-slate-800 text-xs truncate">
                      {posts.find(p => p.id === selectedPostId)?.title}
                    </p>
                    <p className="text-slate-600 line-clamp-2 mt-1 font-sans">
                      {posts.find(p => p.id === selectedPostId)?.description}
                    </p>
                  </div>

                  {/* Comments List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
                    {activeComments.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 italic text-xs">
                        No comments yet. Write the first constructive voice below!
                      </div>
                    ) : (
                      activeComments.map(comm => (
                        <div key={comm.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs space-y-1 relative group">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              {comm.authorName}
                              {comm.isHidden && (
                                <span className="text-[8px] bg-red-100 text-red-700 px-1 py-0.2 rounded uppercase tracking-wider font-bold">
                                  Removed
                                </span>
                              )}
                              {comm.isReported && (
                                <span className="text-[8px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded uppercase tracking-wider font-bold">
                                  Reported
                                </span>
                              )}
                            </span>
                            <span className="text-slate-400 font-mono text-[9px]">
                              Rep: {comm.authorReputation} pts • {new Date(comm.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className={`text-xs text-slate-600 leading-relaxed font-sans ${comm.isHidden ? "line-through text-slate-400" : ""}`}>{comm.text}</p>
                          
                          {!comm.isReported && !comm.isHidden && (
                            <div className="absolute right-2 bottom-1.5 opacity-0 group-hover:opacity-100 transition duration-150">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onReportComment) {
                                    onReportComment(selectedPostId, comm.id);
                                  } else {
                                    alert("Comment has been flagged for moderation review.");
                                  }
                                }}
                                className="text-[9px] text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-slate-50 transition"
                                title="Report Comment"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Report
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* Post comment form */}
              <form onSubmit={handleAddCommentSubmit} className="p-4 border-t border-slate-100 flex gap-2 bg-white shrink-0">
                <input
                  type="text"
                  placeholder={currentUser.isAnonymousMode ? "Write comments anonymously..." : "Write a constructive public voice..."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary-600 focus:bg-white"
                  required
                />
                <button 
                  type="submit"
                  className="bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-primary-700 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Comment
                </button>
              </form>
            </div>
          </div>
        );
      })()}
      {/* Visual Image Zoom Overlay Modal */}
      {zoomImgUrl && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setZoomImgUrl(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomImgUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-200 text-xs font-bold font-mono bg-black/40 px-3 py-1.5 rounded-full flex items-center gap-1"
            >
              ✕ Close Preview
            </button>
            <img 
              src={zoomImgUrl} 
              alt="Enlarged evidence log" 
              className="object-contain max-w-full max-h-[80vh] rounded-lg shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
