# Workflow Rules

## 1. Mandatory First Reads
Every agent session MUST read these files in order before any code change:
1. WORKFLOW_RULES.md (this file)
2. current_state.md
3. decision_log.md
4. open_bugs.md
5. next_task.md
6. All files under skills/

## 2. Scope Control
- Do NOT implement features not listed in next_task.md unless explicitly asked.
- Do NOT refactor unrelated code.
- Do NOT add new dependencies without explicit user approval.

## 3. Pre-Change Checks
- Run `npm run build` after any non-trivial change.
- Fix TypeScript errors before finishing.
- Do NOT break the static export (`output: "export"`).

## 4. Documentation Updates
- Update current_state.md if the implemented state changes.
- Append to decision_log.md if a new architectural decision is made.
- Update or remove entries from open_bugs.md if a bug is fixed.
- Update next_task.md before ending the session.

## 5. Summary Requirement
Every session MUST end with a summary formatted per skills/summary-format.md.
