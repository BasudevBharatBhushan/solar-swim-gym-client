# Changelog Index & AI Guidelines

This directory (`docs/03_Changelog/`) maintains the version history of the Solar Swim Gym Backend II.
**AI ASSISTANT INSTRUCTIONS**: Follow these rules strictly when documenting new versions, updates, or releases.

## AI Instructions for Managing Changelogs

1. **File Naming Convention**:
   - Every version release MUST have its own dedicated markdown file.
   - Name the file using Semantic Versioning (SemVer): `vMAJOR.MINOR.PATCH.md` (e.g., `v1.2.0.md`).
   - Do NOT maintain a single massive `CHANGELOG.md` file. This prevents merge conflicts and context overflow.

2. **File Structure (Inside the `vX.X.X.md` file)**:
   - Begin with the version number as the Header 1 (e.g., `# Version 1.2.0`).
   - Provide the release date underneath it (e.g., `**Release Date:** 2026-03-02`).
   - Use the following standardized [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) headers (only include the ones that have actual items to report):
     - `### Added` (for new features)
     - `### Changed` (for changes in existing functionality)
     - `### Deprecated` (for soon-to-be removed features)
     - `### Removed` (for now removed features)
     - `### Fixed` (for any bug fixes)
     - `### Security` (in case of vulnerabilities)

3. **Updating the Index (This File)**:
   - Whenever you create a new `vX.X.X.md` file, you MUST append it to the **Version Master List** below.
   - Prepend new versions so the most recent is ALWAYS at the top of the list.

---

## 📌 Version Master List

* [v1.2.0](v1.2.0.md) - *Atomic Payments, Deferred Creation & Billing UI Refinements*
* [v1.1.1](v1.1.1.md) - *Patch Notes Example*
* [v1.1.0](v1.1.0.md) - *Minor Release Example*
* [v1.0.0](v1.0.0.md) - *Initial Stable Release*
