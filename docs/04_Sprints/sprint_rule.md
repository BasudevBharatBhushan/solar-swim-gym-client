# Sprint Documentation Rules & AI Guidelines

This directory (`docs/04_Sprints/`) maintains sprint planning, tracking, and retrospectives for systematic development.
**AI ASSISTANT INSTRUCTIONS**: Read and follow these rules strictly whenever you are asked to start a new sprint, structure tasks, or update an existing sprint's progress.

## 1. Creating a New Sprint

*   **File Naming Strategy**: Sprint files MUST be named based on their start and end dates using the ISO `YYYY-MM-DD` standard format.
    *   *Format*: `sprint_{START_DATE}_to_{END_DATE}.md`
    *   *Example*: `sprint_2026-03-01_to_2026-03-07.md`
*   **Duration**: Typically sprints will last 7 or 14 days. If the user asks you to create a sprint but doesn't specify a duration, default to a 7-day period starting from today.

## 2. Sprint File Structure

Every newly created sprint file must include the following sections exactly:

```markdown
# Sprint: [Start Date] to [End Date]

## 🎯 Sprint Goals
*   [Primary Objective 1]
*   [Primary Objective 2]

## 📋 Backlog / Task List
- [ ] **Task 1**: Brief description of the work.
- [ ] **Task 2**: Brief description of the work.

## 🏃‍♂️ Daily Log (Updates)
*   **[YYYY-MM-DD]**: What was accomplished today. Provide a concise summary of the agent's work or the user's notes.
*   **[YYYY-MM-DD]**: ...

## 🛑 Blockers & Challenges
*   [List any issues slowing down development or pending dependencies]

## 🏁 Retrospective
*   **What went well:**
*   **What could be improved:**
*   **Action items for next sprint:**
```

## 3. Updating an Existing Sprint

*   **Logging Progress**: When the user asks you to log progress or finish a session, add a new bullet point under `## 🏃‍♂️ Daily Log (Updates)` with today's standard date `YYYY-MM-DD`. Keep updates clear and specific (e.g., mention which files were modified and what API route was implemented).
*   **Completing Tasks**: Update checkboxes in the `## 📋 Backlog / Task List` from `- [ ]` to `- [x]` when tasks are verified as complete.
*   **Blockers**: If a critical challenge arises (e.g., a massive package conflict, or database schema issue), explicitly log it in `## 🛑 Blockers & Challenges`.
*   **End of Sprint**: At the end of the sprint lifecycle, fill out the `## 🏁 Retrospective` section based on the overall conversational momentum, code quality, and any struggles discussed with the user.
