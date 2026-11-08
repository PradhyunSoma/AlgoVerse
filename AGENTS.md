# AlgoVerse project instructions

AlgoVerse is a client-side educational site for learning data structures and algorithms through step-by-step visualization. Use [PROJECT_PLAN.md](PROJECT_PLAN.md) for the architecture, roadmap, and phase acceptance criteria.

## Working agreement

- Work on one small, user-approved task at a time. Start with the relevant roadmap item and keep changes within its scope.
- During planning-only requests, edit planning documents as requested. Scaffold the app, write application code, or install dependencies only when implementation is in scope.
- Prefer working behavior over placeholders. Introduce shared code when there is a clear need for it.
- Explain architectural decisions that affect behavior, maintainability, or later phases.
- Verify each completed feature through its normal entry point. Run the relevant automated checks and manually verify interactions where appropriate. Fix errors introduced by the task and report any checks you could not run.
- Continue regular task-level checks and immediate fixes during development. Postpone comprehensive phase-by-phase audits until all development phases are complete; a deferred audit does not block the next user-approved task.
- Get explicit permission before committing, pushing, or deploying.

## Technical conventions

- Use React, TypeScript, Vite, and Tailwind CSS. Use Motion for transitions and React Flow for tree and graph canvases when interactive nodes and edges are needed.
- Keep algorithms, validation, and trace generation in TypeScript modules independent of React, timing, and rendering. Given the same input and options, a trace should be deterministic.
- Keep playback state separate from algorithm logic. Visual state and pseudocode highlighting must derive from the same step index. Preserve the ability to inspect earlier steps.
- Put algorithm-specific rules in feature modules. Extract shared controls and UI only when they serve multiple features or establish a clear boundary.
- Use stable IDs for nodes and edges. Validate edits before generating a trace and keep the last valid visualization available if an edit fails.
- Make controls keyboard-accessible, label inputs and buttons, convey state with more than color, and respect reduced-motion preferences.
- Keep the initial product usable entirely in the browser. Treat quizzes and an AI tutor as optional later work.
