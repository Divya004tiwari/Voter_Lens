import React, { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { auth, db, INITIAL_LOCATIONS, firebaseEnabled } from "../firebase";
import { UserProfile, UserRole, GeographicLocation } from "../types";
import { Landmark, Shield, User, AlertCircle, Sparkles, MapPin, Eye, EyeOff } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
  initialPermissionError?: boolean;
}

export default function AuthScreen({ onAuthSuccess, initialPermissionError }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<UserRole>("Citizen");
  
  // Location selection state
  const [selectedState, setSelectedState] = useState("Uttar Pradesh");
  const [selectedDistrict, setSelectedDistrict] = useState("Lucknow");
  const [selectedBlock, setSelectedBlock] = useState("Malihabad");
  const [selectedPanchayat, setSelectedPanchayat] = useState("Panchayat Khalispur");
  const [selectedWard, setSelectedWard] = useState("Ward 4");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(initialPermissionError ? "permission-denied" : null);
  const [loading, setLoading] = useState(false);

  // Lists based on initial hierarchy
  const availableStates = INITIAL_LOCATIONS.states;
  const availableDistricts = INITIAL_LOCATIONS.districts[selectedState] || [];
  const availableBlocks = INITIAL_LOCATIONS.blocks[selectedDistrict] || [];
  const availablePanchayats = INITIAL_LOCATIONS.panchayats[selectedBlock] || [];

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    const districts = INITIAL_LOCATIONS.districts[state] || [];
    const firstDistrict = districts[0] || "";
    setSelectedDistrict(firstDistrict);
    
    const blocks = INITIAL_LOCATIONS.blocks[firstDistrict] || [];
    const firstBlock = blocks[0] || "";
    setSelectedBlock(firstBlock);

    const panchayats = INITIAL_LOCATIONS.panchayats[firstBlock] || [];
    const firstPanchayat = panchayats[0] || "";
    setSelectedPanchayat(firstPanchayat);
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    const blocks = INITIAL_LOCATIONS.blocks[district] || [];
    const firstBlock = blocks[0] || "";
    setSelectedBlock(firstBlock);

    const panchayats = INITIAL_LOCATIONS.panchayats[firstBlock] || [];
    const firstPanchayat = panchayats[0] || "";
    setSelectedPanchayat(firstPanchayat);
  };

  const handleBlockChange = (block: string) => {
    setSelectedBlock(block);
    const panchayats = INITIAL_LOCATIONS.panchayats[block] || [];
    const firstPanchayat = panchayats[0] || "";
    setSelectedPanchayat(firstPanchayat);
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!firebaseEnabled) {
      setError("Firebase is not initialized. Please ensure configuration is correct.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Enforce validations
        if (!username.trim()) throw new Error("Name / Username is required.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");

        // Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const location: GeographicLocation = {
          country: "India",
          state: selectedState,
          district: selectedDistrict,
          block: selectedBlock,
          panchayat: selectedPanchayat,
          ward: selectedWard || "General Ward"
        };

        const newUserProfile: UserProfile = {
          uid: user.uid,
          username: username.trim(),
          email: user.email || email,
          mobile: mobile.trim() || undefined,
          role,
          location,
          reputation: 110, // Initial standard reputation bonus
          isAnonymousMode: false,
          createdAt: Date.now()
        };

        // Store User Data in Firestore
        await setDoc(doc(db, "users", user.uid), newUserProfile);
        onAuthSuccess(newUserProfile);
      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch User Profile Document
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          onAuthSuccess(userDocSnap.data() as UserProfile);
        } else {
          // Fallback if auth exists but firestore profile wasn't made
          const fallbackProfile: UserProfile = {
            uid: user.uid,
            username: user.displayName || email.split("@")[0],
            email: user.email || email,
            role: "Citizen",
            location: {
              country: "India",
              state: "Uttar Pradesh",
              district: "Lucknow",
              block: "Malihabad",
              panchayat: "Panchayat Khalispur",
              ward: "Ward 4"
            },
            reputation: 110,
            isAnonymousMode: false,
            createdAt: Date.now()
          };
          await setDoc(doc(db, "users", user.uid), fallbackProfile);
          onAuthSuccess(fallbackProfile);
        }
      }
    } catch (err: any) {
      console.error("Auth process error: ", err);
      let friendlyMessage = err.message;
      if (err.code === "permission-denied" || (err.message && (err.message.includes("permission") || err.message.includes("Permission")))) {
        friendlyMessage = "permission-denied";
      } else if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "This email address is already in use.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "The password is too weak.";
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        if (isSignUp) {
          friendlyMessage = "Registration failed with 'auth/invalid-credential'. Since you connected a custom Firebase account, you MUST enable the 'Email/Password' provider in your Firebase Console under 'Authentication' -> 'Sign-in method'. Alternatively, click the Offline Demo button below to bypass and start testing immediately.";
        } else {
          friendlyMessage = "Invalid email or password combination. If you are using a custom Firebase account, please ensure that you have enabled 'Email/Password' authentication in your Firebase Console (Authentication -> Sign-in method -> Email/Password -> Enable).";
        }
      } else if (err.code === "auth/operation-not-allowed") {
        friendlyMessage = "Email/Password sign-in is disabled in your custom Firebase Console. Go to Authentication -> Sign-in method -> Email/Password and enable it.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // Safe mode demo bypass for sandbox environments if required
  const handleBypassDemo = () => {
    const demoUser: UserProfile = {
      uid: "user_demo_1",
      username: "Ankit Singh",
      email: "ankit.malihabad@gmail.com",
      mobile: "+91 9452012356",
      role: "Citizen",
      location: {
        country: "India",
        state: "Uttar Pradesh",
        district: "Lucknow",
        block: "Malihabad",
        panchayat: "Panchayat Khalispur",
        ward: "Ward 4"
      },
      reputation: 110,
      isAnonymousMode: false,
      createdAt: Date.now() - 86400000 * 30
    };
    onAuthSuccess(demoUser);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-center items-center px-4 py-12 font-sans text-slate-800">
      <div className="w-full max-w-lg bg-white border border-slate-200 p-8 sm:p-10" id="editorial-auth-box">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center gap-2 text-primary-600 bg-primary-50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest font-bold">
            <Landmark className="w-4 h-4" />
            <span>VoterLens</span>
          </div>
           <h1 className="text-4xl font-bold text-slate-900">
            VoterLens India
           </h1>

          {/* <p className="text-slate-500 text-sm mt-2">
          S
          </p> */}
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 border-b border-slate-200 mb-6 text-center text-xs font-bold uppercase tracking-widest font-mono">
          <button
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`pb-3 border-b-2 transition-all ${!isSignUp ? "border-primary-600 text-primary-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`pb-3 border-b-2 transition-all ${isSignUp ? "border-primary-600 text-primary-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Register Account
          </button>
        </div>

        {/* Form Error */}
        {error && error === "permission-denied" ? (
          <div className="mb-6 p-5 bg-amber-50 border border-amber-200 text-slate-800 text-xs space-y-3 rounded-lg" id="permission-denied-guide">
            <div className="flex gap-2 items-center text-amber-800 font-bold uppercase tracking-wider font-mono">
              <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
              <span>Firestore Rules Setup Required</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              Your custom Firebase project <strong>VoterLens-23047</strong> rejected the request due to <strong>Missing or insufficient permissions</strong>. Since this is your own Firebase project, you must configure the Security Rules in your Firebase Console.
            </p>
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 block">How to Fix This:</span>
              <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                <li>Go to the <a href="https://console.firebase.google.com/project/VoterLens-23047/firestore/rules" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline font-semibold">Firebase Console Rules Tab</a>.</li>
                <li>Delete any existing rules and paste the following snippet:</li>
              </ol>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded overflow-x-auto text-[10px] font-mono leading-normal max-h-40">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
            </pre>
            <p className="text-[10px] text-slate-500 italic">
              Once you publish these rules in your Firebase Console, refresh this page and sign in or sign up!
            </p>
          </div>
        ) : error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs flex gap-2.5 items-start rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleAuthAction} className="space-y-5">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Divya Tiwari"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 text-sm focus:bg-white focus:ring-1 focus:ring-primary-600 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 text-sm focus:bg-white focus:ring-1 focus:ring-primary-600 focus:outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 text-sm focus:bg-white focus:ring-1 focus:ring-primary-600 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 text-sm focus:bg-white focus:ring-1 focus:ring-primary-600 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Platform Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 text-sm focus:bg-white focus:outline-none transition"
                  >
                    <option value="Citizen">🇮🇳 Citizen Reporter</option>
                    <option value="Moderator">⚖️ Civil Moderator</option>
                    <option value="Fact Checker">🔍 Fact Checker</option>
                    <option value="Administrator">👑 Administrator</option>
                  </select>
                </div>
              </div>

              {/* Geographical Hierarchy Map Selection */}
              <div className="space-y-3.5 border-t border-slate-100 pt-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-primary-600 font-bold uppercase tracking-wider font-mono">
                  <MapPin className="w-4 h-4" />
                  <span>Verify Local Jurisdiction</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">State</label>
                    <select
                      value={selectedState}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                    >
                      {availableStates.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">District</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                    >
                      {availableDistricts.map(dt => (
                        <option key={dt} value={dt}>{dt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Block</label>
                    <select
                      value={selectedBlock}
                      onChange={(e) => handleBlockChange(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                    >
                      {availableBlocks.map(bl => (
                        <option key={bl} value={bl}>{bl}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Gram Panchayat / Town</label>
                    <select
                      value={selectedPanchayat}
                      onChange={(e) => setSelectedPanchayat(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                    >
                      {availablePanchayats.map(pan => (
                        <option key={pan} value={pan}>{pan}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase block">Ward Number / Division</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ward 4"
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-mono text-xs uppercase tracking-widest py-3 font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              </>
            )}
          </button>
        </form>

      {/* <div className="mt-6 text-[10px] text-slate-400 tracking-wider font-mono uppercase text-center max-w-sm leading-relaxed">
        Secure Login
      </div> */}
    
    </div>
    </div>
  );
}
