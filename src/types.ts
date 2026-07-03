export interface GeographicLocation {
  country: string;
  state: string;
  district: string;
  block: string;
  panchayat: string;
  ward: string;
}

export type PostCategory = "Discussion" | "Civic Issue" | "Development" | "Opinion";

export type IssueStatus = "Reported" | "Under Review" | "Escalated" | "Resolved";

export type OfficialRole = 
  | "Gram Panchayat Official"
  | "Municipal Officer"
  | "Block Development Officer"
  | "District Official"
  | "MLA Office Representative"
  | "MP Office Representative"
  | "State Government Representative";

export type UserRole = "Citizen" | "Moderator" | "Administrator" | "Fact Checker" | OfficialRole;

export interface EvidenceFile {
  id: string;
  name: string;
  url: string; // Base64 or placeholder URL
  type: "image" | "video" | "document";
  mimeType: string;
  verificationStatus: "Verified Evidence" | "Partially Verified" | "Unverified" | "Misleading Evidence";
  verifiedBy?: string;
  verifiedAt?: number;
}

export interface TimelineItem {
  id: string;
  status: "Reported" | "Acknowledged" | "Investigation Started" | "Work Order Issued" | "In Progress" | "Resolved" | "Escalated";
  date: number;
  officialName: string;
  officialRole: string;
  department: string;
  message: string;
}

export interface EscalationEvent {
  level: "Ward" | "Panchayat" | "Block" | "District" | "State";
  date: number;
  reason: string;
}

export interface WarningItem {
  id: string;
  userId: string;
  level: 1 | 2 | 3 | 4; // Level 1: Warning notification, Level 2: Posting restricted, Level 3: Temporarily suspended, Level 4: Banned
  reason: string;
  description: string;
  createdAt: number;
  moderatorName: string;
  recommendedAction: string;
  isAppealed?: boolean;
  appealText?: string;
  appealStatus?: "Pending" | "Accepted" | "Rejected";
  appealDate?: number;
}

export interface AuditLogItem {
  id: string;
  action: string; // e.g. "User Warned", "Post Hidden", "Comment Removed", "User Suspended", etc.
  performedBy: string; // Moderator/Admin username
  performedByRole: UserRole;
  userIdAffected?: string;
  usernameAffected?: string;
  contentIdAffected?: string;
  contentTypeAffected?: "Post" | "Comment" | "User";
  reason: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  mobile?: string;
  role: UserRole;
  location: GeographicLocation;
  reputation: number;
  isAnonymousMode: boolean; // default display as Anonymous Citizen
  createdAt: number;
  isSuspended?: boolean;
  isBanned?: boolean;
  warnings?: WarningItem[];
  suspensionExpiresAt?: number;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: PostCategory;
  subCategory?: string; // e.g. "Roads", "Water Supply", "Electricity" for Issues
  location: GeographicLocation;
  status?: IssueStatus; // only for Civic Issues
  images?: string[];
  likesCount: number;
  likes: string[]; // uids of users who liked
  commentsCount: number;
  bookmarkedBy?: string[]; // uids of users who bookmarked
  sentiment?: "Positive" | "Negative" | "Neutral";
  sentimentConfidence?: number;
  sentimentRationale?: string;
  fakeNewsWarning?: {
    flagged: boolean;
    warningMessage?: string;
    explanation?: string;
  };
  isAnonymous: boolean;
  authorId: string;
  authorName: string;
  authorReputation: number;
  leaderId?: string; // associated political leader
  partyId?: string; // associated political party
  createdAt: number;
  
  // Moderation extensions
  isReported?: boolean;
  reportedBy?: string[]; // uids of users who reported
  moderationLabel?: "Verified" | "Under Review" | "Community Reported" | "Fact Check Pending" | "Misleading Information" | "False Information" | "Removed by Moderation";
  evidenceLink?: string;
  factCheckExplanation?: string;
  factCheckPublishedAt?: number;
  isEscalated?: boolean;
  isHidden?: boolean;

  // Advanced Civic Governance additions
  evidenceFiles?: EvidenceFile[];
  priority?: "Low" | "Medium" | "High" | "Critical";
  escalationLevel?: "Ward" | "Panchayat" | "Block" | "District" | "State";
  escalationHistory?: EscalationEvent[];
  timeline?: TimelineItem[];
  acknowledgedAt?: number;
  resolvedAt?: number;
  governmentResponses?: {
    id: string;
    officialName: string;
    officialRole: string;
    department: string;
    message: string;
    status: "Acknowledged" | "Investigation Started" | "Work Order Issued" | "In Progress" | "Resolved";
    createdAt: number;
    expectedResolutionDate?: string;
  }[];
}

export interface Comment {
  id: string;
  postId: string;
  text: string;
  isAnonymous: boolean;
  authorId: string;
  authorName: string;
  authorReputation: number;
  createdAt: number;
  
  // Moderation extensions
  isReported?: boolean;
  reportedBy?: string[];
  isHidden?: boolean;
}

export interface PoliticalLeader {
  id: string;
  name: string;
  party: string;
  partyId?: string; // associated party doc ID
  position: string; // "Gram Pradhan" | "MLAs" | "MPs" | "Chief Minister" | etc.
  constituency: string;
  term: string;
  contact?: string;
  location: Partial<GeographicLocation>;
  approvalRating: number; // 0-100%
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  issuesReported: number;
  issuesResolved: number;
  developmentCount: number;
  followers?: string[]; // array of uids
}

export interface PoliticalParty {
  id: string;
  name: string;
  abbrev: string;
  description: string;
  leader: string;
  manifesto: string;
  logo: string; // logo color class or emoji
  followers?: string[]; // uids of followers
  approvalRating: number;
  volume: number;
}

export interface Poll {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    votesCount: number;
  }[];
  location?: Partial<GeographicLocation>;
  category: string; // e.g., "Elections", "Governance", "Civic Issues"
  isMultiChoice: boolean;
  votes: { [uid: string]: string | string[] }; // user uid -> selected option id(s)
  endsAt: number;
  createdAt: number;
  authorId?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "engagement" | "status_change" | "poll_new" | "moderation";
  isRead: boolean;
  link?: string;
  createdAt: number;
}

export interface ReputationLog {
  id: string;
  userId: string;
  amount: number; // +10 for verified issue, +5 for liked post, -15 for spam flag, etc.
  reason: string;
  createdAt: number;
}
