import React, { useState, useEffect } from "react";
import { 
  UserProfile, Post, Comment, PoliticalLeader, 
  PoliticalParty, Poll, NotificationItem, IssueStatus, UserRole, WarningItem, AuditLogItem
} from "./types";
import { 
  INITIAL_POSTS, INITIAL_COMMENTS, INITIAL_LEADERS, 
  INITIAL_PARTIES, INITIAL_POLLS, getLocalState, saveLocalState,
  auth, db, firebaseEnabled, handleFirestoreError, OperationType
} from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, 
  collection, onSnapshot, query, where, orderBy 
} from "firebase/firestore";
import ProfileCard from "./components/ProfileCard";
import AuthScreen from "./components/AuthScreen";
import Feed from "./components/Feed";
import Leaders from "./components/Leaders";
import Parties from "./components/Parties";
import IssueTracker from "./components/IssueTracker";
import Polls from "./components/Polls";
import Analytics from "./components/Analytics";
import ModeratorPanel from "./components/ModeratorPanel";
import { 
  Building, Star, Landmark, HelpCircle, Bell, Shield, 
  FileText, Vote, BarChart3, Users, Flame, ChevronRight, MapPin, 
  Clock, CheckCircle, Award, Volume2, Search, SlidersHorizontal, LogOut, AlertCircle
} from "lucide-react";

export default function App() {
  // --- STATE HANDLERS (PERSISTED RESILIENTLY) ---
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firestorePermissionError, setFirestorePermissionError] = useState(false);

  // Bind Firebase auth listener
  useEffect(() => {
    if (!firebaseEnabled) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as UserProfile);
          } else {
            setCurrentUser(null);
          }
        } catch (error: any) {
          console.error("Error reading profile:", error);
          if (error.code === "permission-denied" || error.message?.includes("permission")) {
            setFirestorePermissionError(true);
          }
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [leaders, setLeaders] = useState<PoliticalLeader[]>(INITIAL_LEADERS);
  const [parties, setParties] = useState<PoliticalParty[]>(INITIAL_PARTIES);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [reputationLogs, setReputationLogs] = useState<{ amount: number; reason: string; createdAt: number }[]>([
    { amount: 50, reason: "Account verification welcome bonus", createdAt: Date.now() - 86400000 * 30 },
    { amount: 30, reason: "First verified civic issue logged", createdAt: Date.now() - 86400000 * 15 },
    { amount: 30, reason: "Constructive commentary bonus", createdAt: Date.now() - 86400000 * 5 }
  ]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const [activeTab, setActiveTab] = useState<string>("feed");
  const [showNotifications, setShowNotifications] = useState(false);

  // Real-time synchronization using Firestore listeners when authenticated
  useEffect(() => {
    if (!firebaseEnabled || !currentUser) return;

    // 1. Listen to posts
    const unsubPosts = onSnapshot(collection(db, "posts"), (snapshot) => {
      const postsList: Post[] = [];
      snapshot.forEach((doc) => {
        postsList.push({ ...doc.data(), id: doc.id } as Post);
      });
      postsList.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(postsList);
    }, (error) => {
      console.error("Error subscribing to posts:", error);
    });

    // 2. Listen to comments
    const unsubComments = onSnapshot(collection(db, "comments"), (snapshot) => {
      const commentsList: Comment[] = [];
      snapshot.forEach((doc) => {
        commentsList.push({ ...doc.data(), id: doc.id } as Comment);
      });
      setComments(commentsList);
    }, (error) => {
      console.error("Error subscribing to comments:", error);
    });

    // 3. Listen to polls
    const unsubPolls = onSnapshot(collection(db, "polls"), (snapshot) => {
      const pollsList: Poll[] = [];
      snapshot.forEach((doc) => {
        pollsList.push({ ...doc.data(), id: doc.id } as Poll);
      });
      setPolls(pollsList);
    }, (error) => {
      console.error("Error subscribing to polls:", error);
    });

    // 4. Listen to notifications (filtered by userId for security)
    const qNotifs = query(collection(db, "notifications"), where("userId", "==", currentUser.uid));
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      const notifsList: NotificationItem[] = [];
      snapshot.forEach((doc) => {
        notifsList.push({ ...doc.data(), id: doc.id } as NotificationItem);
      });
      notifsList.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(notifsList);
    }, (error) => {
      console.error("Error subscribing to notifications:", error);
    });

    // 5. Listen to users (to keep allUsers synced)
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersList.push(doc.data() as UserProfile);
      });
      setAllUsers(usersList);
    }, (error) => {
      console.error("Error subscribing to users:", error);
    });

    // 6. Listen to auditLogs
    const unsubAudit = onSnapshot(collection(db, "auditLogs"), (snapshot) => {
      const logsList: AuditLogItem[] = [];
      snapshot.forEach((doc) => {
        logsList.push({ ...doc.data(), id: doc.id } as AuditLogItem);
      });
      logsList.sort((a, b) => b.createdAt - a.createdAt);
      setAuditLogs(logsList);
    }, (error) => {
      console.error("Error subscribing to auditLogs:", error);
    });

    // 7. Listen to issues
    const unsubIssues = onSnapshot(collection(db, "issues"), (snapshot) => {
      console.log("Real-time issues updated:", snapshot.size);
    }, (error) => {
      console.error("Error subscribing to issues:", error);
    });

    return () => {
      unsubPosts();
      unsubComments();
      unsubPolls();
      unsubNotifs();
      unsubUsers();
      unsubAudit();
      unsubIssues();
    };
  }, [currentUser]);

  // Database Bootstrapping/Seeding if empty
  useEffect(() => {
    if (!firebaseEnabled || !currentUser) return;

    const bootstrap = async () => {
      try {
        const postsSnap = await getDocs(collection(db, "posts"));
        if (postsSnap.empty) {
          console.log("Firestore empty, seeding initial data...");
          
          // Seed posts (and any civic issues also go to issues collection)
          for (const post of INITIAL_POSTS) {
            await setDoc(doc(db, "posts", post.id), post);
            if (post.category === "Civic Issue") {
              await setDoc(doc(db, "issues", post.id), {
                issueId: post.id,
                title: post.title,
                description: post.description,
                category: post.category,
                location: post.location,
                evidenceFiles: post.evidenceFiles || [],
                status: post.status || "Reported",
                escalationLevel: post.escalationLevel || "Ward",
                createdBy: post.authorId,
                createdAt: post.createdAt
              });
            }
          }

          // Seed comments
          for (const comm of INITIAL_COMMENTS) {
            await setDoc(doc(db, "comments", comm.id), {
              ...comm,
              commentId: comm.id,
              content: comm.text
            });
          }

          // Seed polls
          for (const poll of INITIAL_POLLS) {
            await setDoc(doc(db, "polls", poll.id), {
              ...poll,
              pollId: poll.id,
              expiresAt: poll.endsAt
            });
          }

          // Seed default users in users collection
          const defaultUsersList: UserProfile[] = [
            {
              uid: "user_superadmin_1",
              username: "Deepak Kumar (Super Admin)",
              email: "admin@VoterLens.in",
              role: "Administrator",
              reputation: 980,
              isAnonymousMode: false,
              createdAt: Date.now() - 86400000 * 100,
              location: { country: "India", state: "Uttar Pradesh", district: "Lucknow", block: "Malihabad", panchayat: "Khalispur", ward: "Ward 5" }
            },
            {
              uid: "user_moderator_1",
              username: "Ananya Sharma (Staff Mod)",
              email: "moderator@VoterLens.in",
              role: "Moderator",
              reputation: 450,
              isAnonymousMode: false,
              createdAt: Date.now() - 86400000 * 50,
              location: { country: "India", state: "Uttar Pradesh", district: "Lucknow", block: "Malihabad", panchayat: "Khalispur", ward: "Ward 3" }
            },
            {
              uid: "user_factchecker_1",
              username: "Dr. Rajesh Varma (Prasar Fact-Check)",
              email: "factchecker@VoterLens.in",
              role: "Fact Checker",
              reputation: 670,
              isAnonymousMode: false,
              createdAt: Date.now() - 86400000 * 60,
              location: { country: "India", state: "Uttar Pradesh", district: "Lucknow", block: "Malihabad", panchayat: "Khalispur", ward: "Ward 2" }
            }
          ];

          for (const u of defaultUsersList) {
            const userDoc = await getDoc(doc(db, "users", u.uid));
            if (!userDoc.exists()) {
              await setDoc(doc(db, "users", u.uid), u);
            }
          }

          // Seed default audit logs
          const defaultLogs: AuditLogItem[] = [
            {
              id: "audit_1",
              action: "Fact-Check Published (False Information)",
              performedBy: "Dr. Rajesh Varma (Prasar Fact-Check)",
              performedByRole: "Fact Checker",
              contentIdAffected: "post_1",
              contentTypeAffected: "Post",
              reason: "Assigned label False Information with official evidence links.",
              createdAt: Date.now() - 3600000 * 4
            },
            {
              id: "audit_2",
              action: "User Warned",
              performedBy: "Ananya Sharma (Staff Mod)",
              performedByRole: "Moderator",
              userIdAffected: "user_badcitizen_1",
              usernameAffected: "Suresh Yadav (Repeated Spammer)",
              reason: "Issued Level 2 Posting restriction due to commercial posting violations.",
              createdAt: Date.now() - 3600000 * 24
            }
          ];

          for (const log of defaultLogs) {
            await setDoc(doc(db, "auditLogs", log.id), log);
          }

          console.log("Seeding complete!");
        }
      } catch (err) {
        console.error("Error bootstrapping database:", err);
      }
    };

    bootstrap();
  }, [currentUser]);

  // --- CORE SOCIAL OPERATIONS ---

  const handleUpdateProfile = async (updated: UserProfile) => {
    try {
      setCurrentUser(updated);
      await setDoc(doc(db, "users", updated.uid), updated);
    } catch (error) {
      console.error("Error updating profile in Firestore:", error);
    }
  };

  const handleAddPost = async (newPost: Post) => {
    try {
      await setDoc(doc(db, "posts", newPost.id), {
        ...newPost,
        postId: newPost.id,
        content: newPost.description // Double-compatibility with content/description
      });
      
      if (newPost.category === "Civic Issue") {
        await setDoc(doc(db, "issues", newPost.id), {
          issueId: newPost.id,
          title: newPost.title,
          description: newPost.description,
          category: newPost.category,
          location: newPost.location,
          evidenceFiles: newPost.evidenceFiles || [],
          status: newPost.status || "Reported",
          escalationLevel: newPost.escalationLevel || "Ward",
          createdBy: newPost.authorId,
          createdAt: newPost.createdAt
        });
      }

      // Reward reputation if public post
      if (!newPost.isAnonymous && currentUser) {
        const repReward = newPost.category === "Civic Issue" ? 15 : 5;
        const updatedUser = { ...currentUser, reputation: currentUser.reputation + repReward };
        await setDoc(doc(db, "users", currentUser.uid), updatedUser);
        setReputationLogs(prev => [
          { amount: repReward, reason: `Logged public ${newPost.category} report`, createdAt: Date.now() },
          ...prev
        ]);
      }

      // Update matching Leader's counts if specified (static/local updates if leaders is not in Firestore yet)
      if (newPost.leaderId) {
        setLeaders(prev => prev.map(l => {
          if (l.id === newPost.leaderId) {
            return {
              ...l,
              issuesReported: newPost.category === "Civic Issue" ? l.issuesReported + 1 : l.issuesReported,
              developmentCount: newPost.category === "Development" ? l.developmentCount + 1 : l.developmentCount,
              positiveCount: newPost.sentiment === "Positive" ? l.positiveCount + 1 : l.positiveCount,
              negativeCount: newPost.sentiment === "Negative" ? l.negativeCount + 1 : l.negativeCount,
            };
          }
          return l;
        }));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${newPost.id}`);
    }
  };

  const handleAddComment = async (newComment: Comment) => {
    try {
      await setDoc(doc(db, "comments", newComment.id), {
        ...newComment,
        commentId: newComment.id,
        content: newComment.text // For double compatibility
      });

      // Update comments count in post document
      const postRef = doc(db, "posts", newComment.postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const pData = postDoc.data() as Post;
        await updateDoc(postRef, {
          commentsCount: (pData.commentsCount || 0) + 1
        });
      }
      
      // Reward reputation for comments
      if (!newComment.isAnonymous && currentUser) {
        const updatedUser = { ...currentUser, reputation: currentUser.reputation + 2 };
        await setDoc(doc(db, "users", currentUser.uid), updatedUser);
        setReputationLogs(prev => [
          { amount: 2, reason: "Contributed constructive feedback thread", createdAt: Date.now() },
          ...prev
        ]);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `comments/${newComment.id}`);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const pData = postDoc.data() as Post;
        const currentLikes = pData.likes || [];
        const isLiked = currentLikes.includes(currentUser.uid);
        const updatedLikes = isLiked 
          ? currentLikes.filter(uid => uid !== currentUser.uid)
          : [...currentLikes, currentUser.uid];
        await updateDoc(postRef, {
          likes: updatedLikes,
          likesCount: updatedLikes.length
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}`);
    }
  };

  const handleBookmarkPost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const pData = postDoc.data() as Post;
        const currentBookmarks = pData.bookmarkedBy || [];
        const isBookmarked = currentBookmarks.includes(currentUser.uid);
        const updatedBookmarks = isBookmarked 
          ? currentBookmarks.filter(uid => uid !== currentUser.uid)
          : [...currentBookmarks, currentUser.uid];
        await updateDoc(postRef, {
          bookmarkedBy: updatedBookmarks
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}`);
    }
  };

  const handleReportPost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const pData = postDoc.data() as Post;
        await updateDoc(postRef, {
          likesCount: (pData.likesCount || 0) - 10,
          fakeNewsWarning: {
            flagged: true,
            warningMessage: "COMMUNITY REPORT RECEIVED",
            explanation: "Multiple citizens flagged this post for safety moderation. Under administrative audit."
          }
        });
      }

      // Create reported document in reports collection
      const reportId = "rep_" + Date.now();
      await setDoc(doc(db, "reports", reportId), {
        reportId,
        targetId: postId,
        targetType: "Post",
        reporterId: currentUser.uid,
        reason: "Community safety report registered",
        createdAt: Date.now()
      });

      // Alert Administrators/Moderators
      const notId = "not_alert_" + Date.now();
      await setDoc(doc(db, "notifications", notId), {
        id: notId,
        userId: "user_demo_1",
        title: "Community safety report registered",
        message: "Post safety alert filed for administration audit. Safety filters will analyze claims.",
        type: "moderation",
        isRead: false,
        read: false,
        createdAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `reports`);
    }
  };

  const handleUpdatePostStatus = async (postId: string, status: IssueStatus) => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { status });

      // Also update in issues collection if exists
      const issueRef = doc(db, "issues", postId);
      const issueDoc = await getDoc(issueRef);
      if (issueDoc.exists()) {
        await updateDoc(issueRef, { status });
      }

      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const matchingPost = postDoc.data() as Post;
        const isResolved = status === "Resolved";
        
        // Dispatches a dynamic citizen notification
        const notId = "not_stat_" + Date.now();
        await setDoc(doc(db, "notifications", notId), {
          id: notId,
          userId: matchingPost.authorId,
          title: `Issue Report Status: ${status}`,
          message: `Your grievance regarding "${matchingPost.title.substring(0, 35)}..." has been escalated and marked as "${status}".`,
          type: "status_change",
          isRead: false,
          read: false,
          createdAt: Date.now()
        });

        if (isResolved) {
          // If leader is specified, update resolved count
          if (matchingPost.leaderId) {
            setLeaders(prev => prev.map(l => {
              if (l.id === matchingPost.leaderId) {
                return { ...l, issuesResolved: l.issuesResolved + 1 };
              }
              return l;
            }));
          }

          // Only reward points if the user wasn't anonymous
          if (!matchingPost.isAnonymous && matchingPost.authorId) {
            const userRef = doc(db, "users", matchingPost.authorId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const u = userSnap.data() as UserProfile;
              const newRep = (u.reputation || 0) + 30;
              await updateDoc(userRef, { reputation: newRep });
              if (currentUser && currentUser.uid === matchingPost.authorId) {
                setCurrentUser(prev => prev ? { ...prev, reputation: newRep } : null);
              }
            }
            setReputationLogs(prev => [
              { amount: 30, reason: "Verified civic complaint successfully resolved", createdAt: Date.now() },
              ...prev
            ]);
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}`);
    }
  };

  const handleFollowLeader = (leaderId: string) => {
    if (!currentUser) return;
    setLeaders(prev => prev.map(leader => {
      if (leader.id === leaderId) {
        const followers = leader.followers || [];
        const isFollowing = followers.includes(currentUser.uid);
        const updated = isFollowing 
          ? followers.filter(uid => uid !== currentUser.uid)
          : [...followers, currentUser.uid];
        return { ...leader, followers: updated };
      }
      return leader;
    }));
  };

  const handleFollowParty = (partyId: string) => {
    if (!currentUser) return;
    setParties(prev => prev.map(party => {
      if (party.id === partyId) {
        const followers = party.followers || [];
        const isFollowing = followers.includes(currentUser.uid);
        const updated = isFollowing 
          ? followers.filter(uid => uid !== currentUser.uid)
          : [...followers, currentUser.uid];
        return { ...party, followers: updated };
      }
      return party;
    }));
  };

  const handleCastVote = async (pollId: string, optionId: string) => {
    if (!currentUser) return;
    try {
      const pollRef = doc(db, "polls", pollId);
      const pollDoc = await getDoc(pollRef);
      if (pollDoc.exists()) {
        const poll = pollDoc.data() as Poll;
        const updatedOptions = poll.options.map(opt => {
          if (opt.id === optionId) {
            return { ...opt, votesCount: opt.votesCount + 1 };
          }
          return opt;
        });

        await updateDoc(pollRef, {
          options: updatedOptions,
          votes: {
            ...(poll.votes || {}),
            [currentUser.uid]: optionId
          }
        });

        // Reward voter reputation
        const userRef = doc(db, "users", currentUser.uid);
        const newRep = (currentUser.reputation || 0) + 5;
        await updateDoc(userRef, { reputation: newRep });
        setCurrentUser(prev => prev ? { ...prev, reputation: newRep } : null);

        setReputationLogs(prev => [
          { amount: 5, reason: "Participated in democratic local poll", createdAt: Date.now() },
          ...prev
        ]);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `polls/${pollId}`);
    }
  };

  const handleAddPoll = async (newPoll: Poll) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "polls", newPoll.id), {
        ...newPoll,
        pollId: newPoll.id
      });
      
      // Add notification item
      const notId = "not_poll_" + Date.now();
      await setDoc(doc(db, "notifications", notId), {
        id: notId,
        userId: currentUser.uid,
        title: "New Public Poll Published",
        message: `A new dynamic poll was launched regarding: "${newPoll.question.substring(0, 45)}...". Cast your vote now!`,
        type: "poll_new",
        isRead: false,
        read: false,
        createdAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `polls/${newPoll.id}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
      await deleteDoc(doc(db, "issues", postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const handleClearWarning = async (postId: string) => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        fakeNewsWarning: null,
        isReported: false,
        moderationLabel: null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}`);
    }
  };

  const handleUpdateUser = async (userId: string, updatedFields: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, updatedFields);
      if (currentUser && currentUser.uid === userId) {
        setCurrentUser(prev => prev ? { ...prev, ...updatedFields } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  };

  const handleUpdatePost = async (postId: string, updatedFields: Partial<Post>) => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, updatedFields);

      const issueRef = doc(db, "issues", postId);
      const issueSnap = await getDoc(issueRef);
      if (issueSnap.exists()) {
        const issueFields: any = {};
        if (updatedFields.title !== undefined) issueFields.title = updatedFields.title;
        if (updatedFields.description !== undefined) issueFields.description = updatedFields.description;
        if (updatedFields.category !== undefined) issueFields.category = updatedFields.category;
        if (updatedFields.location !== undefined) issueFields.location = updatedFields.location;
        if (updatedFields.status !== undefined) issueFields.status = updatedFields.status;
        if (Object.keys(issueFields).length > 0) {
          await updateDoc(issueRef, issueFields);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}`);
    }
  };

  const handleUpdateComment = async (postId: string, commentId: string, updatedFields: Partial<Comment>) => {
    try {
      await updateDoc(doc(db, "comments", commentId), updatedFields);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `comments/${commentId}`);
    }
  };

  const handleAddAuditLog = async (log: Omit<AuditLogItem, "id" | "createdAt">) => {
    try {
      const logId = "audit_" + Date.now();
      const newLog: AuditLogItem = {
        ...log,
        id: logId,
        createdAt: Date.now()
      };
      await setDoc(doc(db, "auditLogs", logId), {
        ...newLog,
        logId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `auditLogs`);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteDoc(doc(db, "comments", commentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  const handleIssueWarning = async (
    userId: string, 
    level: 1 | 2 | 3 | 4, 
    reason: string, 
    description: string, 
    recommendedAction: string
  ) => {
    try {
      const warningId = "warn_" + Date.now();
      const newWarning: WarningItem = {
        id: warningId,
        userId,
        level,
        reason,
        description,
        createdAt: Date.now(),
        moderatorName: currentUser?.username || "Administrative Staff",
        recommendedAction
      };

      // Store warning document in warnings collection
      await setDoc(doc(db, "warnings", warningId), newWarning);

      // Update user document
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const u = userSnap.data() as UserProfile;
        const currentWarnings = u.warnings || [];
        const updatedWarnings = [...currentWarnings, newWarning];
        let isSuspended = u.isSuspended || false;
        let isBanned = u.isBanned || false;

        if (level === 3) isSuspended = true;
        if (level === 4) isBanned = true;

        const updatedReputation = Math.max(0, (u.reputation || 0) - (level * 15));

        await updateDoc(userRef, {
          warnings: updatedWarnings,
          isSuspended,
          isBanned,
          reputation: updatedReputation
        });

        if (currentUser && currentUser.uid === userId) {
          setCurrentUser(prev => prev ? {
            ...prev,
            warnings: updatedWarnings,
            isSuspended,
            isBanned,
            reputation: updatedReputation
          } : null);
        }
      }

      // Add notification
      const notId = "not_" + Date.now();
      await setDoc(doc(db, "notifications", notId), {
        id: notId,
        userId,
        title: `Guidelines Infraction Warning Issued (Level ${level})`,
        message: `Your account was warned for: ${reason}. Action required: ${recommendedAction}`,
        type: "moderation",
        isRead: false,
        read: false,
        createdAt: Date.now()
      });

      // Log action
      handleAddAuditLog({
        action: `User Warned (Level ${level})`,
        performedBy: currentUser?.username || "Administrative Staff",
        performedByRole: currentUser?.role || "Moderator",
        userIdAffected: userId,
        usernameAffected: allUsers.find(u => u.uid === userId)?.username || "Citizen User",
        reason: `Issued level ${level} warning. Reason: ${reason}`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `warnings`);
    }
  };

  const handleResolveAppeal = async (userId: string, warningId: string, status: "Accepted" | "Rejected") => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const u = userSnap.data() as UserProfile;
        const currentWarnings = u.warnings || [];
        const updatedWarnings = currentWarnings.map(w => {
          if (w.id === warningId) {
            return { ...w, appealStatus: status, appealDate: Date.now() };
          }
          return w;
        });

        let isSuspended = u.isSuspended || false;
        let isBanned = u.isBanned || false;
        
        const targetWarning = currentWarnings.find(w => w.id === warningId);
        if (status === "Accepted" && targetWarning) {
          if (targetWarning.level === 3) isSuspended = false;
          if (targetWarning.level === 4) isBanned = false;
        }

        const updatedReputation = status === "Accepted" ? (u.reputation || 0) + 15 : (u.reputation || 0);

        await updateDoc(userRef, {
          warnings: updatedWarnings,
          isSuspended,
          isBanned,
          reputation: updatedReputation
        });

        if (currentUser && currentUser.uid === userId) {
          setCurrentUser(prev => prev ? {
            ...prev,
            warnings: updatedWarnings,
            isSuspended,
            isBanned,
            reputation: updatedReputation
          } : null);
        }
      }

      // Also update warnings collection
      const warningRef = doc(db, "warnings", warningId);
      const warningSnap = await getDoc(warningRef);
      if (warningSnap.exists()) {
        await updateDoc(warningRef, {
          appealStatus: status,
          appealDate: Date.now()
        });
      }

      // Notification
      const notId = "not_" + Date.now();
      await setDoc(doc(db, "notifications", notId), {
        id: notId,
        userId,
        title: `Appeal ${status}`,
        message: status === "Accepted" 
          ? "Your guidelines warning appeal was ACCEPTED. Your account access has been fully restored." 
          : "Your guidelines warning appeal was REJECTED. The administrative restriction was upheld.",
        type: "moderation",
        isRead: false,
        read: false,
        createdAt: Date.now()
      });

      handleAddAuditLog({
        action: `Appeal Resolved (${status})`,
        performedBy: currentUser?.username || "Administrative Staff",
        performedByRole: currentUser?.role || "Moderator",
        userIdAffected: userId,
        usernameAffected: allUsers.find(u => u.uid === userId)?.username || "Citizen User",
        reason: `Appeal against warning ${warningId} was ${status}.`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `warnings/${warningId}`);
    }
  };

  const handleReportComment = async (postId: string, commentId: string) => {
    if (!currentUser) return;
    try {
      const commentRef = doc(db, "comments", commentId);
      const commentSnap = await getDoc(commentRef);
      if (commentSnap.exists()) {
        const cData = commentSnap.data() as Comment;
        const currentReporterList = cData.reportedBy || [];
        await updateDoc(commentRef, {
          isReported: true,
          reportedBy: [...currentReporterList, currentUser.uid]
        });
      }

      // Create reported document in reports collection
      const reportId = "rep_" + Date.now();
      await setDoc(doc(db, "reports", reportId), {
        reportId,
        targetId: commentId,
        postId: postId,
        targetType: "Comment",
        reporterId: currentUser.uid,
        reason: "User flagged comment for inappropriate content.",
        createdAt: Date.now()
      });

      handleAddAuditLog({
        action: "Comment Flagged",
        performedBy: currentUser.username,
        performedByRole: currentUser.role,
        contentIdAffected: commentId,
        contentTypeAffected: "Comment",
        reason: "User flagged comment for inappropriate content."
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `reports`);
    }
  };

  const handleAppealWarning = async (warningId: string, text: string) => {
    if (!currentUser) return;
    try {
      const currentWarnings = currentUser.warnings || [];
      const updatedWarnings = currentWarnings.map(w => {
        if (w.id === warningId) {
          return { ...w, isAppealed: true, appealText: text, appealStatus: "Pending" as const, appealDate: Date.now() };
        }
        return w;
      });

      // Update user document
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        warnings: updatedWarnings
      });

      // Update warning document in warnings collection
      const warningRef = doc(db, "warnings", warningId);
      const warningSnap = await getDoc(warningRef);
      if (warningSnap.exists()) {
        await updateDoc(warningRef, {
          isAppealed: true,
          appealText: text,
          appealStatus: "Pending",
          appealDate: Date.now()
        });
      }

      setCurrentUser(prev => prev ? { ...prev, warnings: updatedWarnings } : null);

      handleAddAuditLog({
        action: "Warning Appealed",
        performedBy: currentUser.username,
        performedByRole: currentUser.role,
        userIdAffected: currentUser.uid,
        usernameAffected: currentUser.username,
        reason: `Submitted appeal for warning ${warningId}: "${text}"`
      });

      alert("Appeal submitted successfully. Our governance staff will audit your request shortly.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `warnings/${warningId}`);
    }
  };

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-center items-center font-sans">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mb-4"></div>
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Retrieving Account State...</p>
      </div>
    );
  } 

  if (!currentUser) {
    return (
      <AuthScreen 
        onAuthSuccess={(profile) => setCurrentUser(profile)} 
        initialPermissionError={firestorePermissionError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="VoterLens-root">
      {/* Visual top border styling */}
      <div className="h-1.5 bg-gradient-to-r from-orange-500 via-white to-green-600"></div>

      {/* Primary Header Navbar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center font-display font-extrabold text-white text-base shadow-sm">
              L²
            </div>
            <div>
              <span className="font-display font-black text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                VoterLens
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-medium">v1.2</span>
              </span>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-1">Political Accountability Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Jurisdiction overview */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl text-xs">
              <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
              <span className="font-semibold text-slate-600">{currentUser.location.state} / {currentUser.location.district}</span>
            </div>

            {/* Notifications panel bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  // Mark notifications as read when panel is toggled open
                  if (!showNotifications) {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  }
                }}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition relative"
                id="notifications-panel-bell"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-600 text-white font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {/* Notifications drop menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 p-4 space-y-3" id="notifications-dropdown">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="font-display font-bold text-slate-800 text-xs">Citizen Inbox Notifications</span>
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 text-xs">
                    {notifications.length === 0 ? (
                      <p className="text-center text-slate-400 italic py-4">Inbox clear. We'll notify you on status upgrades.</p>
                    ) : (
                      notifications.map(not => (
                        <div key={not.id} className={`p-2.5 rounded-xl border ${not.isRead ? "bg-slate-50/50 border-slate-100" : "bg-primary-50/30 border-primary-100"} space-y-1`}>
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-800 text-[11px]">{not.title}</span>
                            <span className="text-[8px] text-slate-400 font-mono">{new Date(not.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-500 text-[11px] leading-relaxed">{not.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick reputation widget */}
            <div className="flex items-center gap-1.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 px-3 py-1 rounded-xl text-xs text-orange-800 font-bold">
              <Award className="w-4 h-4 text-orange-500" />
              <span>{currentUser.reputation} pts</span>
            </div>

            {/* Account Log Out button */}
            <button
              onClick={async () => {
                try {
                  if (firebaseEnabled) {
                    await signOut(auth);
                  }
                  setCurrentUser(null);
                } catch (error) {
                  console.error("Logout error: ", error);
                }
              }}
              className="p-2 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-slate-50 transition shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header / Breadcrumbs / Editorial Region Ribbon */}
      <div className="bg-primary-600 text-primary-100 px-4 sm:px-8 py-2 text-[10px] uppercase tracking-[0.2em] flex flex-wrap gap-2 sm:gap-4 items-center justify-center sm:justify-start">
        <span>India</span>
        <span className="opacity-40">/</span>
        <span className="font-bold">{currentUser.location.state}</span>
        {currentUser.location.district && (
          <>
            <span className="opacity-40">/</span>
            <span>{currentUser.location.district} District</span>
          </>
        )}
        {currentUser.location.block && (
          <>
            <span className="opacity-40">/</span>
            <span>{currentUser.location.block} Block</span>
          </>
        )}
        {currentUser.location.panchayat && (
          <>
            <span className="opacity-40">/</span>
            <span className="font-bold">{currentUser.location.panchayat}</span>
          </>
        )}
        {currentUser.location.ward && (
          <>
            <span className="opacity-40">/</span>
            <span className="text-white font-medium">{currentUser.location.ward}</span>
          </>
        )}
      </div>

      {/* Horizontal Navigation Bar (Editorial Aesthetic) */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex flex-wrap gap-x-6 gap-y-1.5 py-3 text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500" id="horizontal-navigation-bar">
            <button
              onClick={() => setActiveTab("feed")}
              className={`pb-1 transition flex items-center gap-1.5 border-b-2 ${
                activeTab === "feed" 
                  ? "text-primary-600 border-primary-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Social Feed
            </button>
            <button
              onClick={() => setActiveTab("leaders")}
              className={`pb-1 transition flex items-center gap-1.5 border-b-2 ${
                activeTab === "leaders" 
                  ? "text-primary-600 border-primary-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Leader Profiles
            </button>
            <button
              onClick={() => setActiveTab("parties")}
              className={`pb-1 transition flex items-center gap-1.5 border-b-2 ${
                activeTab === "parties" 
                  ? "text-primary-600 border-primary-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              Party Pages
            </button>
            <button
              onClick={() => setActiveTab("tracker")}
              className={`pb-1 transition flex items-center gap-1.5 border-b-2 ${
                activeTab === "tracker" 
                  ? "text-primary-600 border-primary-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Civic Issue Tracker
            </button>
            <button
              onClick={() => setActiveTab("polls")}
              className={`pb-1 transition flex items-center gap-1.5 border-b-2 ${
                activeTab === "polls" 
                  ? "text-primary-600 border-primary-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              Polling System
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-1 transition flex items-center gap-1.5 border-b-2 ${
                activeTab === "analytics" 
                  ? "text-primary-600 border-primary-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics Dashboard
            </button>
            <button
              onClick={() => setActiveTab("moderation")}
              className={`pb-1 transition flex items-center gap-1.5 border-b-2 ${
                activeTab === "moderation" 
                  ? "text-red-700 border-red-700" 
                  : "border-transparent text-slate-500 hover:text-red-600"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              AI Moderator Desk
            </button>
          </nav>
        </div>
      </div>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column (Desktop): Citizen Card */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Identity / Configuration Card */}
          <ProfileCard 
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            reputationLogs={reputationLogs}
            onAppealWarning={handleAppealWarning}
          />
        </div>

        {/* Middle Columns (Desktop): Core App View routing */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "feed" && (
            <Feed 
              currentUser={currentUser}
              posts={posts}
              comments={comments}
              onAddPost={handleAddPost}
              onAddComment={handleAddComment}
              onLikePost={handleLikePost}
              onBookmarkPost={handleBookmarkPost}
              onReportPost={handleReportPost}
              onReportComment={handleReportComment}
              onUpdatePost={handleUpdatePost}
              leadersList={leaders.map(l => ({ id: l.id, name: l.name }))}
              partiesList={parties.map(p => ({ id: p.id, name: p.name }))}
            />
          )}

          {activeTab === "leaders" && (
            <Leaders 
              currentUser={currentUser}
              leaders={leaders}
              posts={posts}
              onFollowLeader={handleFollowLeader}
            />
          )}

          {activeTab === "parties" && (
            <Parties 
              currentUser={currentUser}
              parties={parties}
              onFollowParty={handleFollowParty}
            />
          )}

          {activeTab === "tracker" && (
            <IssueTracker 
              currentUser={currentUser}
              posts={posts}
              onUpdatePostStatus={handleUpdatePostStatus}
            />
          )}

          {activeTab === "polls" && (
            <Polls 
              currentUser={currentUser}
              polls={polls}
              onCastVote={handleCastVote}
              onAddPoll={handleAddPoll}
            />
          )}

          {activeTab === "analytics" && (
            <Analytics 
              posts={posts}
              leaders={leaders}
              parties={parties}
            />
          )}

          {activeTab === "moderation" && (
            <ModeratorPanel 
              currentUser={currentUser}
              posts={posts}
              comments={comments}
              allUsers={allUsers}
              auditLogs={auditLogs}
              onUpdateUser={handleUpdateUser}
              onUpdatePost={handleUpdatePost}
              onUpdateComment={handleUpdateComment}
              onAddAuditLog={handleAddAuditLog}
              onDeletePost={handleDeletePost}
              onDeleteComment={handleDeleteComment}
              onIssueWarning={handleIssueWarning}
              onResolveAppeal={handleResolveAppeal}
            />
          )}
        </div>
      </main>

      {/* Humble Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs text-center font-mono">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 VoterLens India. Designed for structural transparency & fact-based public accountability.</p>
          <p className="text-[10px] text-slate-500">Serving citizens down to the local Gram Panchayat, Ward, and Lok Sabha division levels.</p>
        </div>
      </footer>
    </div>
  );
}
