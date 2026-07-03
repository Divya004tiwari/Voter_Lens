import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  addDoc 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { PoliticalLeader, PoliticalParty, Poll, Post } from "./types";

// Firebase credentials from /firebase-applet-config.json
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
let db: any;
let auth: any;
let firebaseEnabled = false;

try {

  app = initializeApp(firebaseConfig);
  // Custom database ID is required as per config
  // const dbId = firebaseConfig.firestoreDatabaseId;
  // if (dbId && dbId !== "(default)") {
  //   db = getFirestore(app, dbId);
  // } else {
  //   db = getFirestore(app);
  // }
  db = getFirestore(app);
  auth = getAuth(app);
  firebaseEnabled = true;
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed, falling back to local storage engine:", error);
}

export { app, db, auth, firebaseEnabled };

// --- COMPREHENSIVE SEED DATA FOR INDIA'S ADMINISTRATIVE HIERARCHY ---

export const INITIAL_LOCATIONS = {
  states: ["Uttar Pradesh", "Maharashtra", "Bihar", "Karnataka", "Delhi", "Tamil Nadu"],
  districts: {
    "Uttar Pradesh": ["Lucknow", "Varanasi", "Kanpur", "Gorakhpur"],
    "Maharashtra": ["Mumbai City", "Pune", "Nagpur", "Thane"],
    "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
    "Karnataka": ["Bengaluru Urban", "Mysuru", "Hubli", "Mangaluru"],
    "Delhi": ["New Delhi", "Central Delhi", "South Delhi", "North Delhi"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"]
  } as Record<string, string[]>,
  blocks: {
    "Lucknow": ["Malihabad", "Bakshi Ka Talab", "Kakori", "Chinhat"],
    "Varanasi": ["Kashi", "Pindra", "Harahua", "Cholapur"],
    "Mumbai City": ["Colaba", "Dharavi", "Bandra", "Andheri"],
    "Bengaluru Urban": ["Yelahanka", "Kengeri", "K.R. Puram", "Begur"],
    "New Delhi": ["Chanakyapuri", "Connaught Place", "Karol Bagh", "Dwarka"],
    "Chennai": ["Adyar", "Mylapore", "Teynampet", "Anna Nagar"]
  } as Record<string, string[]>,
  panchayats: {
    "Malihabad": ["Panchayat Khalispur", "Panchayat Kasmandi", "Panchayat Jindaur", "Malihabad Town Municipality"],
    "Bakshi Ka Talab": ["Panchayat Itaunja", "Panchayat Bargadi", "Panchayat Kathvara"],
    "Colaba": ["Ward 225 Navy Nagar", "Ward 226 Cuffe Parade", "Colaba Municipal Association"],
    "Yelahanka": ["Yelahanka Ward 4", "Panchayat Allalasandra", "Panchayat Kogilu"]
  } as Record<string, string[]>
};

export const INITIAL_PARTIES: PoliticalParty[] = [
  {
    id: "party_bjp",
    name: "Bharatiya Janata Party",
    abbrev: "BJP",
    description: "Centrist-right political party emphasizing national security, robust digital infrastructure, cultural heritage, and commercial development across India.",
    leader: "Jagat Prakash Nadda",
    manifesto: "Focuses on 'Viksit Bharat' (Developed India) by 2047, infrastructure expansion, digital governance, welfare schemes for farmers, and promoting local manufacturing (Make in India).",
    logo: "bg-orange-500",
    followers: ["user_demo_1", "user_demo_3"],
    approvalRating: 68,
    volume: 1240
  },
  {
    id: "party_inc",
    name: "Indian National Congress",
    abbrev: "INC",
    description: "Centrist-left social-democratic political party advocating inclusive development, social justice, secular values, and robust safety nets for marginalized communities.",
    leader: "Mallikarjun Kharge",
    manifesto: "Emphasizes 'Nyay' (Justice) schemes, youth employment guarantees, farmers' minimum support prices (MSP), decentralization of administrative power, and federal harmony.",
    logo: "bg-blue-600",
    followers: ["user_demo_2"],
    approvalRating: 54,
    volume: 980
  },
  {
    id: "party_aap",
    name: "Aam Aadmi Party",
    abbrev: "AAP",
    description: "Focuses heavily on anti-corruption, free basic utilities, massive investments in state education and public healthcare clinics (Mohalla Clinics).",
    leader: "Arvind Kejriwal",
    manifesto: "Proposes clean politics, 'Delhi model' education and health systems nationwide, decentralized local committees (Mohalla Sabhas), and environment-friendly green transport.",
    logo: "bg-emerald-600",
    followers: ["user_demo_4"],
    approvalRating: 58,
    volume: 520
  },
  {
    id: "party_sp",
    name: "Samajwadi Party",
    abbrev: "SP",
    description: "Democratic-socialist regional party with primary influence in Uttar Pradesh, focusing on minority rights, farmers' benefits, and backward class development.",
    leader: "Akhilesh Yadav",
    manifesto: "Socio-economic equality, rural electrification, advanced irrigation, distributing laptops/smart devices to high-achieving rural youth, and expansion of expressways.",
    logo: "bg-green-600",
    followers: [],
    approvalRating: 46,
    volume: 410
  }
];

export const INITIAL_LEADERS: PoliticalLeader[] = [
  {
    id: "leader_narendra_modi",
    name: "Narendra Modi",
    party: "BJP",
    partyId: "party_bjp",
    position: "Prime Minister of India",
    constituency: "Varanasi (UP) MP Seat",
    term: "2024 - 2029",
    contact: "pmindia.gov.in / connect@pmo.nic.in",
    location: { country: "India", state: "Uttar Pradesh", district: "Varanasi" },
    approvalRating: 74,
    positiveCount: 154,
    negativeCount: 42,
    neutralCount: 20,
    issuesReported: 95,
    issuesResolved: 72,
    developmentCount: 110,
    followers: ["user_demo_1", "user_demo_2", "user_demo_3"]
  },
  {
    id: "leader_rahul_gandhi",
    name: "Rahul Gandhi",
    party: "INC",
    partyId: "party_inc",
    position: "Leader of the Opposition (Lok Sabha)",
    constituency: "Rae Bareli (UP) MP Seat",
    term: "2024 - 2029",
    contact: "office@rahulgandhi.in",
    location: { country: "India", state: "Uttar Pradesh" },
    approvalRating: 59,
    positiveCount: 110,
    negativeCount: 65,
    neutralCount: 15,
    issuesReported: 40,
    issuesResolved: 25,
    developmentCount: 45,
    followers: ["user_demo_2", "user_demo_4"]
  },
  {
    id: "leader_yogi_adityanath",
    name: "Yogi Adityanath",
    party: "BJP",
    partyId: "party_bjp",
    position: "Chief Minister",
    constituency: "Gorakhpur Urban MLA Seat",
    term: "2022 - 2027",
    contact: "cmup@nic.in",
    location: { country: "India", state: "Uttar Pradesh", district: "Gorakhpur" },
    approvalRating: 71,
    positiveCount: 95,
    negativeCount: 34,
    neutralCount: 12,
    issuesReported: 120,
    issuesResolved: 94,
    developmentCount: 88,
    followers: ["user_demo_1", "user_demo_3"]
  },
  {
    id: "leader_arvind_kejriwal",
    name: "Arvind Kejriwal",
    party: "AAP",
    partyId: "party_aap",
    position: "National Convenor / Former Delhi CM",
    constituency: "New Delhi MLA Seat",
    term: "2020 - 2025",
    contact: "delhicm@nic.in",
    location: { country: "India", state: "Delhi", district: "New Delhi" },
    approvalRating: 62,
    positiveCount: 68,
    negativeCount: 28,
    neutralCount: 10,
    issuesReported: 75,
    issuesResolved: 58,
    developmentCount: 42,
    followers: ["user_demo_4"]
  },
  {
    id: "leader_ram_lal_pradhan",
    name: "Ram Lal Yadav",
    party: "SP",
    partyId: "party_sp",
    position: "Gram Pradhan",
    constituency: "Panchayat Khalispur",
    term: "2021 - 2026",
    contact: "ramlal.khalispur@gmail.com",
    location: { country: "India", state: "Uttar Pradesh", district: "Lucknow", block: "Malihabad", panchayat: "Panchayat Khalispur" },
    approvalRating: 52,
    positiveCount: 24,
    negativeCount: 18,
    neutralCount: 8,
    issuesReported: 32,
    issuesResolved: 19,
    developmentCount: 12,
    followers: ["user_demo_1"]
  },
  {
    id: "leader_priya_sharma",
    name: "Priya Sharma",
    party: "Independent",
    position: "Municipal Councillor",
    constituency: "Malihabad Ward 4",
    term: "2022 - 2027",
    contact: "priya.ward4@gmail.com",
    location: { country: "India", state: "Uttar Pradesh", district: "Lucknow", block: "Malihabad", panchayat: "Malihabad Town Municipality", ward: "Ward 4" },
    approvalRating: 64,
    positiveCount: 18,
    negativeCount: 6,
    neutralCount: 4,
    issuesReported: 15,
    issuesResolved: 11,
    developmentCount: 8,
    followers: ["user_demo_3"]
  }
];

export const INITIAL_POLLS: Poll[] = [
  {
    id: "poll_1",
    question: "Which sector requires the most urgent administrative intervention in Malihabad Block, Lucknow?",
    options: [
      { id: "opt_1", text: "Pothole-free Rural Roads & Highways", votesCount: 142 },
      { id: "opt_2", text: "24/7 Clean Drinking Water Supply Connection", votesCount: 185 },
      { id: "opt_3", text: "Frequent Power Outages & Smart Meter Billing", votesCount: 96 },
      { id: "opt_4", text: "Government School Infrastructure & Faculty", votesCount: 64 }
    ],
    category: "Civic Issues",
    isMultiChoice: false,
    endsAt: Date.now() + 86400000 * 15, // 15 days out
    createdAt: Date.now() - 86400000 * 2,
    votes: {
      "user_demo_1": "opt_2",
      "user_demo_2": "opt_1",
      "user_demo_3": "opt_2",
      "user_demo_4": "opt_3"
    },
    location: { country: "India", state: "Uttar Pradesh", district: "Lucknow", block: "Malihabad" }
  },
  {
    id: "poll_2",
    question: "Do you approve of the overall development work carried out by your Member of Parliament (MP) in Varanasi this past year?",
    options: [
      { id: "opt_y", text: "Strongly Approve (Highly satisfied with infrastructure & cleanliness)", votesCount: 320 },
      { id: "opt_m", text: "Moderately Approve (Good progress but some local issues persist)", votesCount: 145 },
      { id: "opt_n", text: "Disapprove (Unhappy with localized road, drainage conditions)", votesCount: 88 }
    ],
    category: "Governance",
    isMultiChoice: false,
    endsAt: Date.now() + 86400000 * 10,
    createdAt: Date.now() - 86400000 * 4,
    votes: {
      "user_demo_1": "opt_y",
      "user_demo_3": "opt_y",
      "user_demo_2": "opt_n"
    },
    location: { country: "India", state: "Uttar Pradesh", district: "Varanasi" }
  },
  {
    id: "poll_3",
    question: "Should digital safety education and fake-news warning panels be taught in standard state school curricula?",
    options: [
      { id: "opt_yes", text: "Yes, it protects our elders and children from digital scams & riot rumors", votesCount: 245 },
      { id: "opt_no", text: "No, standard subjects like Math and Sciences are more important right now", votesCount: 42 }
    ],
    category: "Elections",
    isMultiChoice: false,
    endsAt: Date.now() + 86400000 * 30,
    createdAt: Date.now() - 86400000 * 1,
    votes: {
      "user_demo_1": "opt_yes",
      "user_demo_4": "opt_yes"
    },
    location: { country: "India" }
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: "post_1",
    title: "Major Potholes on Malihabad Main Mandi Bypass Road causing severe traffic bottlenecks",
    description: "The main bypass road leading to the mango mandi in Malihabad is covered in deep potholes since the last pre-monsoon shower. Heavily loaded trucks are getting stuck, causing hours of delay for farmers. This directly impacts our crop revenues! We need our local MLA and Municipal Councillor to inspect this immediately.",
    category: "Civic Issue",
    subCategory: "Roads",
    location: {
      country: "India",
      state: "Uttar Pradesh",
      district: "Lucknow",
      block: "Malihabad",
      panchayat: "Malihabad Town Municipality",
      ward: "Ward 4"
    },
    status: "Reported",
    likesCount: 24,
    likes: ["user_demo_1", "user_demo_3", "user_demo_4"],
    commentsCount: 3,
    bookmarkedBy: ["user_demo_1"],
    sentiment: "Negative",
    sentimentConfidence: 0.95,
    sentimentRationale: "The post expresses frustration regarding deep potholes affecting local farmers' transportation and livelihood.",
    isAnonymous: false,
    authorId: "user_demo_1",
    authorName: "Ankit Singh",
    authorReputation: 120,
    createdAt: Date.now() - 86400000 * 1.5
  },
  {
    id: "post_2",
    title: "New Smart Digital Classroom launched at Panchayat Primary School, Khalispur!",
    description: "Extremely proud to share that the Gram Panchayat in collaboration with corporate CSR has launched a state-of-the-art interactive smart classroom today! Children are excited to learn through rich educational videos. Kudos to our Gram Pradhan Ram Lal Yadav for enabling this leap in rural education.",
    category: "Development",
    subCategory: "Education",
    location: {
      country: "India",
      state: "Uttar Pradesh",
      district: "Lucknow",
      block: "Malihabad",
      panchayat: "Panchayat Khalispur",
      ward: ""
    },
    likesCount: 42,
    likes: ["user_demo_1", "user_demo_2", "user_demo_3"],
    commentsCount: 2,
    sentiment: "Positive",
    sentimentConfidence: 0.98,
    sentimentRationale: "The author is proud and excited about a smart digital classroom launch, praising local leaders.",
    isAnonymous: false,
    authorId: "user_demo_3",
    authorName: "Ramesh Kumar Mandi",
    authorReputation: 195,
    leaderId: "leader_ram_lal_pradhan",
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "post_3",
    title: "Allegations of unauthorized toll collections near NH-24 Bypass checkpost",
    description: "Several drivers entering Lucknow from the west bypass are reporting being stopped by unidentified groups demanding 'local road maintenance fees' of ₹200. No receipt is being handed over. This is highly illegal and seems like active local extortion. Police and district authorities please look into this on priority!",
    category: "Discussion",
    location: {
      country: "India",
      state: "Uttar Pradesh",
      district: "Lucknow",
      block: "Chinhat",
      panchayat: "",
      ward: ""
    },
    likesCount: 15,
    likes: ["user_demo_2"],
    commentsCount: 1,
    fakeNewsWarning: {
      flagged: true,
      warningMessage: "UNVERIFIED CLAIMS OF ILLEGAL EXTORION",
      explanation: "This post alleges active financial extortion near a national highway checkpost. No police FIR or official journalistic reports have validated this claim yet. Read critically."
    },
    isAnonymous: true,
    authorId: "user_demo_anonymous",
    authorName: "Anonymous Citizen",
    authorReputation: 50,
    createdAt: Date.now() - 86400000 * 0.5
  }
];

export const INITIAL_COMMENTS = [
  {
    id: "comm_1",
    postId: "post_1",
    text: "I passed through this bypass yesterday. It is indeed extremely dangerous, especially for two-wheelers. Hoping for quick action.",
    isAnonymous: false,
    authorId: "user_demo_2",
    authorName: "Pooja Trivedi",
    authorReputation: 85,
    createdAt: Date.now() - 86400000 * 1.2
  },
  {
    id: "comm_2",
    postId: "post_1",
    text: "I have registered this formally in the state CM Portal as well. Let's keep upvoting this post so our councillor takes notice.",
    isAnonymous: false,
    authorId: "user_demo_3",
    authorName: "Ramesh Kumar Mandi",
    authorReputation: 195,
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "comm_3",
    postId: "post_3",
    text: "This has been happening at night. I will raise it with the transport union as well.",
    isAnonymous: true,
    authorId: "user_demo_anonymous",
    authorName: "Anonymous Citizen",
    authorReputation: 50,
    createdAt: Date.now() - 86400000 * 0.2
  }
];

// --- RESILIENT HYBRID LOCALSTORAGE STATE MANAGER ---

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getLocalState<T>(key: string, initialValue: T): T {
  try {
    const data = localStorage.getItem(`VoterLens_${key}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("localStorage read failed for:", key, e);
  }
  return initialValue;
}

export function saveLocalState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`VoterLens_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed for:", key, e);
  }
}
