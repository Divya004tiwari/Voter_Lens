import React, { useState } from "react";
import { UserProfile, GeographicLocation, UserRole } from "../types";
import { INITIAL_LOCATIONS } from "../firebase";
import { Shield, User, MapPin, Award, CheckCircle2, Moon, Sun, AlertTriangle } from "lucide-react";

interface ProfileCardProps {
  currentUser: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  reputationLogs: { amount: number; reason: string; createdAt: number }[];
  onAppealWarning: (warningId: string, text: string) => void;
}

export default function ProfileCard({ currentUser, onUpdateProfile, reputationLogs, onAppealWarning }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);
  const [mobile, setMobile] = useState(currentUser.mobile || "");
  const [role, setRole] = useState(currentUser.role);
  const [appealTexts, setAppealTexts] = useState<{ [key: string]: string }>({});
  
  // Location selectors
  const [state, setState] = useState(currentUser.location.state);
  const [district, setDistrict] = useState(currentUser.location.district);
  const [block, setBlock] = useState(currentUser.location.block);
  const [panchayat, setPanchayat] = useState(currentUser.location.panchayat);
  const [ward, setWard] = useState(currentUser.location.ward);

  const districts = INITIAL_LOCATIONS.districts[state] || [];
  const blocks = INITIAL_LOCATIONS.blocks[district] || [];
  const panchayats = INITIAL_LOCATIONS.panchayats[block] || [];

  const handleStateChange = (val: string) => {
    setState(val);
    setDistrict("");
    setBlock("");
    setPanchayat("");
    setWard("");
  };

  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setBlock("");
    setPanchayat("");
    setWard("");
  };

  const handleBlockChange = (val: string) => {
    setBlock(val);
    setPanchayat("");
    setWard("");
  };

  const handleSave = () => {
    onUpdateProfile({
      ...currentUser,
      username,
      email,
      mobile,
      role,
      location: {
        country: "India",
        state,
        district,
        block,
        panchayat,
        ward
      }
    });
    setIsEditing(false);
  };

  // Badge logic based on reputation
  const getReputationBadge = (rep: number) => {
    if (rep >= 300) return { name: "Civic Champion", color: "bg-orange-500 text-white" };
    if (rep >= 150) return { name: "Active Watchdog", color: "bg-blue-600 text-white" };
    if (rep >= 50) return { name: "Engaged Citizen", color: "bg-emerald-600 text-white" };
    return { name: "Local Voice", color: "bg-slate-200 text-slate-700" };
  };

  const badge = getReputationBadge(currentUser.reputation);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden" id="profile-card-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <h3 className="font-display font-semibold text-lg text-slate-800 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-600" />
          My Citizen Card
        </h3>
        <button
          onClick={() => {
            if (isEditing) handleSave();
            else setIsEditing(true);
          }}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
            isEditing 
              ? "bg-emerald-600 text-white hover:bg-emerald-700" 
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          id="profile-edit-btn"
        >
          {isEditing ? "Save Changes" : "Configure Identity"}
        </button>
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-display text-xl font-bold text-slate-900 flex flex-wrap items-center gap-2">
                {currentUser.username}
                {[
                  "Gram Panchayat Official",
                  "Municipal Officer",
                  "Block Development Officer",
                  "District Official",
                  "MLA Office Representative",
                  "MP Office Representative",
                  "State Government Representative"
                ].includes(currentUser.role) ? (
                  <span className="text-[10px] tracking-wider uppercase font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200">
                    🏛 Official Government Badge
                  </span>
                ) : currentUser.role !== "Citizen" && (
                  <span className="text-[10px] tracking-wider uppercase font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {currentUser.role}
                  </span>
                )}
              </h4>
              <p className="text-sm text-slate-500">{currentUser.email}</p>
              {currentUser.mobile && <p className="text-xs text-slate-400">Mob: {currentUser.mobile}</p>}
            </div>
            
            <div className="text-right">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold inline-block ${badge.color}`}>
                {badge.name}
              </span>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-end gap-1">
                <Award className="w-3.5 h-3.5 text-orange-500" />
                Reputation: <span className="font-bold text-slate-800">{currentUser.reputation} pts</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-sm border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase block mb-1">
              Registered Constituency & Constituency Level
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-medium text-slate-500">State:</span>
              </div>
              <span className="text-xs font-semibold text-slate-800">{currentUser.location.state || "Not Set"}</span>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-medium text-slate-500">District:</span>
              </div>
              <span className="text-xs font-semibold text-slate-800">{currentUser.location.district || "Not Set"}</span>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-medium text-slate-500">Block/Tehsil:</span>
              </div>
              <span className="text-xs font-semibold text-slate-800">{currentUser.location.block || "Not Set"}</span>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-medium text-slate-500">Panchayat:</span>
              </div>
              <span className="text-xs font-semibold text-slate-800 text-ellipsis overflow-hidden whitespace-nowrap">{currentUser.location.panchayat || "Not Set"}</span>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-medium text-slate-500">Ward:</span>
              </div>
              <span className="text-xs font-semibold text-slate-800">{currentUser.location.ward || "Not Set"}</span>
            </div>
          </div>

          {/* Anonymous mode toggle */}
          <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <div>
              <h5 className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                Anonymous Identity Protection
              </h5>
              <p className="text-[11px] text-indigo-600 mt-0.5">
                Posts and comments show as "Anonymous Citizen"
              </p>
            </div>
            <button
              onClick={() => {
                onUpdateProfile({
                  ...currentUser,
                  isAnonymousMode: !currentUser.isAnonymousMode
                });
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                currentUser.isAnonymousMode ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
              }`}
              id="anonymous-identity-toggle"
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md block"></span>
            </button>
          </div>

          {/* Reputation Log */}
          <div>
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recent Reputation Ledger</h5>
            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
              {reputationLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No events logged yet. Be active to earn points!</p>
              ) : (
                reputationLogs.map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-slate-600 truncate max-w-[180px]">{log.reason}</span>
                    <span className={`font-bold shrink-0 ${log.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {log.amount > 0 ? `+${log.amount}` : log.amount} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Safety Warnings & Appeals */}
          {currentUser.warnings && currentUser.warnings.length > 0 && (
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h5 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Policy Violations & Appeals ({currentUser.warnings.length})
              </h5>
              <div className="space-y-3.5">
                {currentUser.warnings.map((warn) => (
                  <div key={warn.id} className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-2 text-xs" id={`warn-item-${warn.id}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-red-800 uppercase tracking-wide text-[10px]">
                        Level {warn.level} Warning
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(warn.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium font-sans">
                      <span className="font-semibold text-slate-500">Reason:</span> {warn.reason}
                    </p>
                    <p className="text-slate-600 font-sans text-[11px] leading-relaxed">
                      {warn.description}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono space-y-0.5 border-t border-red-100/50 pt-1.5 mt-1">
                      <div>Issued by: <span className="font-semibold text-slate-600">{warn.moderatorName}</span></div>
                      <div>Recommended Action: <span className="font-medium text-slate-500">{warn.recommendedAction}</span></div>
                    </div>

                    {/* Appeal Section */}
                    <div className="pt-2 mt-2 border-t border-slate-100">
                      {warn.appealStatus === "Pending" && (
                        <div className="bg-amber-100/70 border border-amber-200 text-amber-800 font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1">
                          <span>⏳ Appeal Pending: "{warn.appealText}"</span>
                        </div>
                      )}
                      {warn.appealStatus === "Accepted" && (
                        <div className="bg-emerald-100/70 border border-emerald-200 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1">
                          <span>✅ Appeal Accepted (Warning Dismissed)</span>
                        </div>
                      )}
                      {warn.appealStatus === "Rejected" && (
                        <div className="bg-red-100/70 border border-red-200 text-red-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                          <span>❌ Appeal Rejected: "{warn.appealText}"</span>
                        </div>
                      )}
                      {!warn.appealStatus && (
                        <div className="space-y-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="State your case for appeal..."
                            value={appealTexts[warn.id] || ""}
                            onChange={(e) => setAppealTexts(prev => ({ ...prev, [warn.id]: e.target.value }))}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-600 bg-white"
                          />
                          <button
                            onClick={() => {
                              const txt = appealTexts[warn.id];
                              if (!txt || !txt.trim()) return;
                              onAppealWarning(warn.id, txt.trim());
                              setAppealTexts(prev => ({ ...prev, [warn.id]: "" }));
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1 px-3 rounded-lg text-[10px] transition"
                          >
                            Submit Official Appeal
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3.5 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Username / Public Display Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Mobile Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. +91 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Select Account Type (Testing & Simulation)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-600"
            >
              <optgroup label="Standard Roles">
                <option value="Citizen">Citizen User</option>
                <option value="Moderator">Moderator User</option>
                <option value="Fact Checker">Fact Checker User</option>
                <option value="Administrator">Administrator User</option>
              </optgroup>
              <optgroup label="Verified Government Officials">
                <option value="Gram Panchayat Official">Gram Panchayat Official</option>
                <option value="Municipal Officer">Municipal Officer</option>
                <option value="Block Development Officer">Block Development Officer</option>
                <option value="District Official">District Official</option>
                <option value="MLA Office Representative">MLA Office Representative</option>
                <option value="MP Office Representative">MP Office Representative</option>
                <option value="State Government Representative">State Government Representative</option>
              </optgroup>
            </select>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-3">
            <span className="block text-xs font-bold text-slate-700 mb-2">Update Location Jurisdiction</span>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">State</label>
                <select
                  value={state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium"
                >
                  <option value="">Select State</option>
                  {INITIAL_LOCATIONS.states.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">District</label>
                <select
                  value={district}
                  disabled={!state}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium disabled:opacity-50"
                >
                  <option value="">Select District</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Block / Tehsil</label>
                <select
                  value={block}
                  disabled={!district}
                  onChange={(e) => handleBlockChange(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium disabled:opacity-50"
                >
                  <option value="">Select Block</option>
                  {blocks.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Panchayat / Local Council</label>
                <select
                  value={panchayat}
                  disabled={!block}
                  onChange={(e) => setPanchayat(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium disabled:opacity-50"
                >
                  <option value="">Select Panchayat</option>
                  {panchayats.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Ward Number / Division</label>
              <input
                type="text"
                placeholder="e.g. Ward 4"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
