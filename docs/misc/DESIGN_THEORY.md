# Solar Swim Admin - Design Theory & Interface Guidelines

> **Status**: Active Standard
> **Last Updated**: February 2024
> **Design Philosophy**: Professional, High-Density, Admin-First.

This document serves as the **single source of truth** for all UI/UX design decisions in the Solar Swim Admin portal. All future development must strictly adhere to these patterns to ensure consistency.

---

## 1. Core Visual Identity

### Color Architecture
We use a **Slate & Emerald** primary theme, moving away from generic bright colors to a more "enterprise SaaS" aesthetic.

| Role | Color Name | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `Slate 900` | `#1e293b` | Primary Buttons (Save, Submit), Sidebar, Strong Headers |
| **Secondary Brand** | `Emerald 500` | `#10b981` | Success States, "Services" Panel Header, Active Toggles |
| **Accent / Link** | `Blue 500` | `#3b82f6` | Text Links, Selection Highlights, Focus States |
| **Surface (Base)** | `White` | `#ffffff` | Content Cards, Input Fields |
| **Surface (Alt)** | `Slate 50` | `#f8fafc` | Page Backgrounds, Secondary Panel Backgrounds |
| **Border** | `Slate 200` | `#e2e8f0` | Dividers, Input Borders, Card Outlines |

### Typography
*   **Font Family**: `Inter`, `Roboto`, system-ui.
*   **Headings**: `FontWeight: 600/700`, Color: `Slate 900`.
*   **Labels**: `FontWeight: 600`, Uppercase, `LetterSpacing: 0.05em`, Color: `Slate 500` (text.secondary).
*   **Body**: `FontWeight: 400`, Size: `0.875rem` (14px), Color: `Slate 700`.

---

## 2. Component Guidelines

### Buttons
*   **Primary Action**: Solid `Slate 900` (#1e293b) background, White text.
    *   *Example*: "Save Changes", "Create New".
*   **Secondary Action**: Outlined or `Slate 100` background.
*   **Add Item Button**: Often situated in Headers. Can use `Slate 900` or transparent white if on a colored background (e.g., Service Panel).
*   **Shape**: `BorderRadius: 6px` to `8px`.

### Inputs & Forms
*   **Style**: Outlined variant (MUI Default).
*   **Shape**: `BorderRadius: 8px` (Approx).
*   **Focus State**: Blue border (`#3b82f6`) with 1px width.
*   **Labels**: Always use **uppercase** caption above the input for clarity in dense forms.
    *   *Example*: `SERVICE NAME`, `DESCRIPTION`.

### Data Display (Tables & Lists)
*   **Table Headers**:
    *   Background: Transparent or very light slate.
    *   Text: `600` weight, Uppercase, `text.secondary`.
    *   Borders: Bottom border only `1px solid #e2e8f0`.
*   **Table Rows**:
    *   Hover effect: `bg-slate-50`.
*   **Badges / Chips**:
    *   **Active/Success**: Bg `#d1fae5` (Emerald-100), Text `#059669` (Emerald-700).
    *   **Info/Pending**: Bg `#dbeafe` (Blue-100), Text `#1d4ed8` (Blue-700).
    *   **Shape**: `BorderRadius: 4px` (Small/standard), `FontWeight: 700`.

---

## 3. Layout Patterns

### A. The "Master-Detail" Split View
Used for pages managing lists of items (e.g., Service Management).
*   **Left Panel (List)**:
    *   Width: ~25-30%.
    *   Header: Distinct functionality color (e.g., Emerald `#10b981` for Services).
    *   Item: Clickable rows with generic description and "Active" badge.
    *   Selected State: Light Blue wash (`rgba(59, 130, 246, 0.04)`).
*   **Right Panel (Detail)**:
    *   Width: Remaining space.
    *   Header: Title + Primary Action ("Save").
    *   Content: Scrollable form area.

### B. Standard Settings Page
Used for simple tabular data (e.g., Age Groups, Terms).
*   **Page Header**: Breadcrumbs -> Title -> Description -> Action Button (Right aligned).
*   **Content**: Single Card/Paper containing the data table.
*   **Modals**: Use Dialogs for creating/editing simple records to keep context.

---

## 4. Implementation Rules (React/MUI)

1.  **Direct Styling**: Use `sx={{}}` prop for layout-specific overrides, but prefer global `theme` values where possible.
2.  **Icons**: Use Material Icons (`@mui/icons-material`).
    *   *Add*: `AddIcon`
    *   *Save*: `SaveIcon`
    *   *Edit*: `EditIcon` (Greyscale)
    *   *Delete*: `DeleteIcon` (Greyscale or Red on hover)
3.  **Spacing**:
    *   Standard padding: `p: 3` (24px).
    *   Gap between grid items: `spacing={3}`.

---

## 5. Specific Component Specs

### The "Service Fee" Table
When displaying matrices (like Price x Age Group):
*   Wrap in a `Paper` with `variant="outlined"` and `bgcolor="#f8fafc"`.
*   Header Row: Include Icon + Title (UPPERCASE) + Subtext (Normal case).
*   Inputs: Small size, white background, `$` adornment.

### Navigation Sidebar
*   Background: Dark Slate (`#1e293b`).
*   Text: White / Light Grey.
*   Active Item: Slightly lighter background or accent border.

---
**Adhere to this document for all future UI tasks.**
