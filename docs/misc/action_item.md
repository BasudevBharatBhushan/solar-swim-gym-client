Frontend Implementation Prompt: Mandatory Waiver Signing Flow

Objective:
Integrate a mandatory Waiver Signing step into the multi-profile creation flow. Each profile must sign an age-profile-specific waiver before the profile is created and persisted in the database.

1. Flow & State Management

- Introduce a new mandatory step in the multi-step profile creation flow:
  Step 1: Basic Details (First Name, Last Name, DOB, Age Profile, Guardian Name if applicable)
  Step 2: Waiver Signing (NEW)
  Step 3: Finalization (Create Profile)

- Store profile details (entered in Step 1) in local state or context.
- Do NOT call the final profile creation API until the waiver is successfully signed and persisted.
- If the user navigates back and forth between steps, preserve entered data and waiver state until completion or cancellation.

2. Fetching & Rendering Waiver Template

- After the user selects an Age Profile in Step 1, fetch the relevant waiver template:

  API:
  GET /api/v1/waiver-templates

- Filter the response to find the active template:
  ageprofile_id == selected_age_profile_id AND is_active == true

- If no active waiver template exists for the selected age profile:
  - Display a clear UI message:
    "No active waiver is configured for this age profile. Please contact an administrator."
  - Block profile creation flow.

3. Dynamic Variable Replacement & Preview

- Waiver template content will contain placeholders such as:
  - [FullName]
  - [GuardianName]

- Before rendering the waiver preview:
  - Replace [FullName] with `${first_name} ${last_name}`
  - Replace [GuardianName] with guardian name (if provided; otherwise replace with empty string or “N/A” as per UX decision)

- Render the waiver as a read-only, scrollable preview inside a card-style container.
- Sanitize HTML content before rendering (e.g., using dompurify).

- Require a checkbox:
  "I have read and agree to the terms above"
  This checkbox must be checked before enabling signature input and progression.

4. Signature Capture & API Integration

- Provide a canvas-based signature pad for the user to sign.
- Allow clearing and re-signing.

- On action: "Accept & Sign"

  Step 1: Upload Signature Image
  API:
  POST /api/v1/signed-waivers/signature

  Payload:
  {
    "signature_base64": "data:image/png;base64,..."
  }

  Response:
  {
    "success": true,
    "signature_url": "https://..."
  }

  Step 2: Persist Signed Waiver Record
  API:
  POST /api/v1/signed-waivers/upsert

  Payload:
  {
    "profile_id": null, 
    "waiver_template_id": "<resolved-template-uuid>",
    "waiver_type": "AGE_PROFILE",
    "content": "<final waiver HTML with replaced variables>",
    "signature_url": "<signature_url from previous step>"
  }

  Notes:
  - profile_id is passed as null because the profile is not yet created.
  - location_id is injected automatically via headers/context.
  - The content saved must be the final rendered waiver (not the raw template).

5. Final Profile Creation

- Only after successful completion of:
  - Signature upload AND
  - Signed waiver upsert

  proceed with the final profile creation / account setup API call.

- If any of the following fail:
  - Waiver template fetch
  - Signature upload
  - Signed waiver persistence

  then:
  - Block profile creation
  - Show a meaningful error message
  - Allow retry of the waiver signing step

6. UX & Validation Rules

- Disable “Continue” / “Create Profile” button until:
  - Waiver template is loaded
  - Waiver preview is rendered
  - Agreement checkbox is checked
  - Signature pad is not empty

- Show loading states / skeletons while fetching templates.
- Provide visual confirmation after successful waiver signing.
- Ensure long waiver content is scrollable and readable on smaller screens.

7. Technical Constraints

- All API requests must include:
  - Authorization header
  - x-location-id header (injected via existing auth/config layer)

- Waiver preview must be read-only.
- Do not allow users to edit waiver content.

Deliverables:
- Waiver signing step integrated into the profile creation flow.
- Waiver preview component with placeholder replacement.
- Signature capture component with clear/retry support.
- API integration for:
  - Fetching waiver templates
  - Uploading signature images
  - Persisting signed waivers
- Proper gating to enforce waiver signing before profile creation.
