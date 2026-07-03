import React, { useState } from "react";
import { Poll, UserProfile } from "../types";
import { INITIAL_LOCATIONS } from "../firebase";
import { 
  Vote, PlusCircle, Search, SlidersHorizontal, MapPin, 
  Clock, Check, Sparkles, HelpCircle, X, ChevronRight 
} from "lucide-react";

interface PollsProps {
  currentUser: UserProfile;
  polls: Poll[];
  onCastVote: (pollId: string, optionId: string) => void;
  onAddPoll: (newPoll: Poll) => void;
}

export default function Polls({ currentUser, polls, onCastVote, onAddPoll }: PollsProps) {
  const [showCreator, setShowCreator] = useState(false);
  const [question, setQuestion] = useState("");
  const [optionsText, setOptionsText] = useState(["", "", ""]);
  const [category, setCategory] = useState("Governance");
  const [endsInDays, setEndsInDays] = useState(7);

  // Filters State
  const [filterCategory, setFilterCategory] = useState("All");

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = optionsText.filter(opt => opt.trim() !== "");
    if (!question || cleanOptions.length < 2) {
      alert("Please enter a question and at least 2 options");
      return;
    }

    const newPoll: Poll = {
      id: "poll_" + Date.now(),
      question,
      options: cleanOptions.map((text, idx) => ({
        id: `opt_${idx + 1}`,
        text,
        votesCount: 0
      })),
      category,
      isMultiChoice: false,
      votes: {},
      endsAt: Date.now() + endsInDays * 86400000,
      createdAt: Date.now(),
      authorId: currentUser.uid,
      location: { country: "India", state: currentUser.location.state }
    };

    onAddPoll(newPoll);
    
    // Reset form
    setQuestion("");
    setOptionsText(["", "", ""]);
    setCategory("Governance");
    setShowCreator(false);
  };

  const handleOptionChange = (idx: number, text: string) => {
    const updated = [...optionsText];
    updated[idx] = text;
    setOptionsText(updated);
  };

  const handleAddOptionField = () => {
    if (optionsText.length < 6) {
      setOptionsText([...optionsText, ""]);
    }
  };

  const filteredPolls = polls.filter(poll => {
    return filterCategory === "All" || poll.category === filterCategory;
  });

  return (
    <div className="space-y-6" id="polling-dashboard">
      {/* Header filter */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex gap-2 items-center text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Filter category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="All">All Poll Categories</option>
            <option value="Elections">Elections</option>
            <option value="Governance">Governance</option>
            <option value="Civic Issues">Civic Issues</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreator(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-700 transition"
          id="new-poll-creator-trigger"
        >
          <PlusCircle className="w-4 h-4" />
          Create Poll
        </button>
      </div>

      {/* Creator Panel */}
      {showCreator && (
        <form onSubmit={handleCreatePollSubmit} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in" id="poll-creator-form">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-display font-semibold text-slate-800 flex items-center gap-1.5">
              <Vote className="w-5 h-5 text-primary-600 animate-bounce" />
              Draft New Citizen Poll
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
              <label className="block text-xs font-semibold text-slate-500 mb-1">Poll Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="Elections">Elections & Parties</option>
                <option value="Governance">Governance Performance</option>
                <option value="Civic Issues">Civic Issues & Grievances</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Voting Duration</label>
              <select
                value={endsInDays}
                onChange={(e) => setEndsInDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
                <option value={15}>15 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Poll Question</label>
            <input
              type="text"
              placeholder="e.g. Do you support the installation of smart water meters in Malihabad Ward 4?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500">Poll Options</label>
            {optionsText.map((text, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={text}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required={idx < 2}
              />
            ))}
            
            {optionsText.length < 6 && (
              <button
                type="button"
                onClick={handleAddOptionField}
                className="text-xs text-primary-600 font-bold hover:underline"
              >
                + Add Option Field
              </button>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-emerald-700 transition"
              id="submit-poll-btn"
            >
              Publish Poll
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Poll Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="poll-items-container">
        {filteredPolls.map(poll => {
          const userVote = poll.votes[currentUser.uid] as string | undefined;
          const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votesCount, 0);
          const isExpired = poll.endsAt < Date.now();

          return (
            <div key={poll.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between" id={`poll-card-${poll.id}`}>
              <div>
                <div className="flex justify-between items-start text-[10px] text-slate-400 font-semibold mb-2">
                  <span className="uppercase tracking-wider font-mono text-primary-600">{poll.category}</span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    {isExpired ? "Concluded" : `Ends in ${Math.round((poll.endsAt - Date.now()) / 86400000)} days`}
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-slate-900 text-sm leading-snug">
                  {poll.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5 my-4">
                {poll.options.map(opt => {
                  const hasVotedThis = userVote === opt.id;
                  const pct = totalVotes ? (opt.votesCount / totalVotes) * 100 : 0;

                  return (
                    <div key={opt.id} className="relative">
                      {userVote || isExpired ? (
                        // Results view
                        <div className="p-3 bg-slate-50/75 border border-slate-150 rounded-xl overflow-hidden relative text-xs">
                          {/* Percent bar background */}
                          <div 
                            className={`absolute top-0 left-0 bottom-0 transition-all duration-500 ${
                              hasVotedThis ? "bg-primary-100/60" : "bg-slate-100/50"
                            }`}
                            style={{ width: `${pct}%` }}
                          ></div>

                          <div className="relative flex justify-between items-center font-semibold text-slate-700">
                            <span className="flex items-center gap-1.5 text-[11px] truncate pr-2">
                              {hasVotedThis && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                              {opt.text}
                            </span>
                            <span className="text-slate-800 text-[11px]">{pct.toFixed(0)}% <span className="text-[10px] font-normal text-slate-400">({opt.votesCount} votes)</span></span>
                          </div>
                        </div>
                      ) : (
                        // Voting view
                        <button
                          onClick={() => onCastVote(poll.id, opt.id)}
                          className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-primary-300 rounded-xl transition duration-200 text-xs font-semibold text-slate-700 flex items-center justify-between"
                        >
                          <span>{opt.text}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Poll footer */}
              <div className="border-t border-slate-50 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono">Total Ballots cast: {totalVotes}</span>
                {poll.location && (
                  <span className="flex items-center gap-0.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {poll.location.state || "All India"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
