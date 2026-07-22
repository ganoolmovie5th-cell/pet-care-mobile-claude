# AGENTS.md

Panduan koordinasi untuk subagent-driven execution of Pet Care Community mobile app.

## Model Eksekusi: Subagent-Driven

Setiap task dijalankan oleh fresh subagent dengan review checkpoint.

**Alur:**
1. Main agent dispatch subagent dengan task number + requirements
2. Subagent execute steps: code → test → commit
3. Subagent report: files created, tests passing, commit hash
4. Main agent review: quality, tests, integration
5. Main agent approve atau request revisions
6. Main agent dispatch next task

**Keuntungan:**
- Fresh context per task
- Clear checkpoints
- Parallel execution potential
- Modular delivery

## Task Breakdown

**Phase 1: Project Setup & Auth (Tasks 1-4)**

### Task 1: Mobile Project Initialization
**See backend AGENTS.md Task 1 — same repo, same execution**

---

### Task 2: Backend Project Initialization
**See backend AGENTS.md Task 2 — same repo, same execution**

---

### Task 3: Web Dashboard Project Initialization
**See backend AGENTS.md Task 3 — same repo, same execution**

---

### Task 4: Firebase Phone OTP Auth (Mobile + Backend)
**Mobile portion — see backend AGENTS.md Task 4 for backend portion**

**Files (Mobile):**
- Create: `src/services/firebase.ts`, `src/services/auth.ts`, `src/context/AuthContext.tsx`, `src/screens/auth/PhoneScreen.tsx`, `src/screens/auth/OTPScreen.tsx`
- Modify: `src/navigation/RootNavigator.tsx`, `App.tsx`

**Steps (Mobile):**
- [ ] Create `src/services/firebase.ts`: Initialize Firebase with AsyncStorage persistence
- [ ] Create `src/services/auth.ts`: `sendPhoneOTP()`, `verifyOTP()`, `getCurrentUser()`, `logout()`, `getIdToken()`
- [ ] Create `src/context/AuthContext.tsx`: AuthProvider with user state, loading, error, onAuthStateChanged listener
- [ ] Create `src/screens/auth/PhoneScreen.tsx`: Phone input (+62 validation), send OTP button, error handling
- [ ] Create `src/screens/auth/OTPScreen.tsx`: 6-digit OTP input, verify button, error handling
- [ ] Modify `src/navigation/RootNavigator.tsx`: Conditionally render AuthStack (phone/OTP) or main tabs based on user auth state
- [ ] Modify `App.tsx`: Wrap with AuthProvider, pass auth context to navigator
- [ ] Test: `npm run web` → enter phone → receive OTP → verify → navigate to dashboard (50% complete)
- [ ] Commit: `feat: mobile phone OTP auth with Firebase`

---

**Gate Checkpoint (after Task 4):**
- [ ] Mobile app: Phone → OTP → Dashboard screens render without crash
- [ ] Auth flow: Phone entry → OTP verification works
- [ ] Integration: Mobile calls backend `/auth/verify-token` (see backend Task 4)
- [ ] Tests: Auth tests passing
- [ ] No console errors

---

**Phase 2: Vet Marketplace (Tasks 5-20)**
**TBD after Phase 1 checkpoint**

---

**Phase 3: Health Passport (Tasks 21-35)**
**TBD after Phase 2 checkpoint**

---

**Phase 4: Playdate Community (Tasks 36-50)**
**TBD after Phase 3 checkpoint**

---

**Phase 5: Polish & Integration (Tasks 51-60)**
**TBD after Phase 4 checkpoint**

---

## Subagent Dispatch Template

**For each task, main agent sends:**

```
TASK [number]: [Task Name]

**Context:** [Brief background]
**Goal:** [What should be delivered]
**Files:** [Create/Modify list]

**Requirements:**
- [Specific requirement 1]
- [Specific requirement 2]
- [Etc.]

**Integration points:**
- Previous task: [Task X] output → this task input
- Next task: [Task Y] depends on this task → [specific files/exports]

**Success criteria:**
- [ ] All files created/modified per spec
- [ ] All tests passing
- [ ] No console warnings/errors
- [ ] Commit message: `feat: [description]`

**Code examples (if needed):**
[Paste relevant snippets from implementation plan]

**Execute:**
1. Read implementation plan task details
2. Implement step-by-step
3. Test locally
4. Commit
5. Report completion with file paths and commit hash
```

---

## Review Checklist

**Main agent reviews every subagent delivery:**

1. **Files created/modified:** Match spec exactly? Missing files?
2. **Code quality:** ESLint clean? Types correct? Self-documenting?
3. **Tests:** Passing? Adequate coverage (80%+)?
4. **Integration:** Connects to previous/next tasks properly?
5. **Performance:** No unnecessary re-renders, async handled correctly?
6. **Security:** No secrets in code? Auth checks in place?
7. **Commits:** Message follows convention? Co-authored by Claude?
8. **Mobile-specific:** Tested on device/emulator? No platform-specific bugs?

---

## Communication During Execution

**Subagent reports:** "Task X complete. Files: [list]. Tests: [pass/fail]. Commit: [hash]. Tested on [device/emulator]."

**Main agent response:** "Approved" OR "Requested changes: [list]"

**If revisions needed:** Subagent fixes and re-commits (new commit, not amend).

---

## Parallel Execution (Optional)

Once Phase 1 (Tasks 1-4) complete and stable:
- Task 5 (mobile A) + Task 21 (mobile B) can run concurrently (different files)
- Task 5 (mobile A) and Task 6 (mobile B) should NOT run concurrently (sequential)
- Main agent coordinates task graph, manages concurrency

---

## Troubleshooting

**Subagent stuck on task:**
- Main agent: Review task requirements, provide code hints, split into smaller steps
- Escalate: If architectural blocker, pause execution, return to main for design clarification

**Test failures:**
- Subagent: Debug locally, check Firebase Emulator logs, review error
- Main agent: Provide error analysis if root cause unclear

**Integration issues:**
- Main agent: Verify exports, type signatures match
- Subagent: Adjust to match upstream output

**Mobile-specific issues:**
- Subagent: Test on physical device + emulator, check platform logs (adb logcat, Xcode)
- Main agent: Provide platform-specific debugging guidance

---

## Timeline & Velocity

**Target:** 1-2 tasks per day

**Phase 1:** 1 day (Tasks 1-4)
**Phase 2:** 3 days (Vet marketplace)
**Phase 3:** 2 days (Health passport)
**Phase 4:** 2 days (Playdate community)
**Phase 5:** 1 day (Polish)

**Contingency:** 1 day buffer

---

## Git Workflow

**Main branch:** Always stable, all tests passing
**Feature branches:** One per task (e.g., `feat/mobile-auth`, `feat/vet-browse`)
**Commits:** Frequent per task step
**Squash merge:** At task completion

---

## Testing on Device

**Physical Device (Recommended):**
```bash
npm run web
# Scan QR code with Expo Go app (iOS/Android)
```

**iOS Simulator (macOS):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

---

## Debugging

**Expo Logs:**
```bash
npm run web  # Shows console output
```

**Device Logs:**
```bash
# iOS
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "pet-care"'

# Android
adb logcat | grep pet-care
```

**Firebase Emulator:**
```bash
firebase emulators:start  # Run in separate terminal
```

---

Next: Dispatch Subagent for Task 1 (Mobile Project Initialization) alongside Tasks 2-3 (Backend + Web) if running in parallel, then Task 4 (Auth) after all three projects initialized.
