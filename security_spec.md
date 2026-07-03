# Firebase Security Specification & TDD

## Data Invariants
1. **UserProfile Integrity**: A user profile can only be created or updated by its authentic owner (`request.auth.uid == userId`). No user can escalate their own role to 'Moderator' or 'Administrator' during standard updates.
2. **Post Authenticity**: A post's `authorId` must match the authenticated user (`request.auth.uid`). Users can only edit or delete their own posts, unless they are an Administrator/Moderator.
3. **Comment Ownership**: Comments can only be created by signed-in users, with their authentic `authorId`.
4. **Poll Casting**: Users can only cast votes by placing or updating their option corresponding to their authenticated uid under `votes.{userId}`.

## The Dirty Dozen Payloads (Vulnerability Scenarios)
1. Identity Spoofing (Creating user profile with another user's UID)
2. Self-Role Escalation (Setting `role` to 'Administrator' on signup/update)
3. Shadow Updates (Updating user profile with "Ghost Fields" like `isAdmin: true`)
4. Orphaned Posts (Setting `authorId` to a fake or other citizen's UID)
5. Modifying Immutable Fields (Updating `createdAt` or `authorId` on posts)
6. State Shortcutting (Changing a Civic Issue status directly to 'Resolved' without Moderator or Administrator privilege)
7. ID Poisoning (Creating post with 1.5KB long trash strings in document IDs)
8. Vote Hijacking (Submitting votes on behalf of other users in the Polls collection)
9. Spreading Fake News Flag (Tampering with `fakeNewsWarning` field inside post as a standard citizen)
10. Blanket Read Scraping (Retrieving all private profile details of other citizens via unconstrained lists)
11. Comment Spoofing (Posting comment under another user's identity)
12. Denial of Wallet Resource Exhaustion (Injecting unbounded lists or exceeding string constraints)
