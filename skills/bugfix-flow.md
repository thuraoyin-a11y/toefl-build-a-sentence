# Bugfix Flow

## 1. Reproduce
- Read open_bugs.md for the reported issue.
- Run `npm run build` to confirm the bug manifests (compile error, runtime error, or visual issue).

## 2. Locate
- Search the codebase for the relevant component, store, or utility.
- Identify the minimal file(s) causing the issue.

## 3. Fix
- Make the smallest possible change.
- Do NOT refactor unrelated code.
- Preserve existing types and interfaces.

## 4. Verify
- Run `npm run build` and ensure it passes.
- Check that the fix resolves the reported issue.
- Update open_bugs.md (remove fixed bug or add notes).
- Update current_state.md if behavior changes.
