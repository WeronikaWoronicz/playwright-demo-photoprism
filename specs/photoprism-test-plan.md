# Photoprism — Test Plan

## Executive summary

This document is a practical, runnable test plan for the Photoprism web application used in the `playwright-demo-photoprism` repository. It focuses on core user journeys (authentication, photo upload, browsing, search, sharing, metadata editing) plus defensive tests (error handling, edge cases, persistence) and admin workflows. Each scenario includes numbered steps, assumptions, expected results, success criteria and failure conditions so QA or automation engineers can turn them into Playwright tests directly.

Assume a blank/fresh state for every scenario unless noted otherwise.

## Scope

In-scope:

- Authentication (UI and API)
- Session persistence and restoration
- Photo upload (single, multiple, large file, invalid formats)
- Library browsing, filtering and sorting
- Search and metadata operations (view/edit/rotate/delete)
- Sharing and permissions (public link, invite)
- Settings and admin operations
- Basic API verification for common endpoints

Out-of-scope (for this plan):

- Performance / load testing
- Deep database integrity checks
- External integrations (except WebDAV basic verification)

## Environment & prerequisites

Assumptions:

- Tests run against a known BASE_URL (local environment or test deployment).
- Tests run with a clean browser context unless a scenario requires pre-seeded auth state.
- Test accounts exist: `admin` (admin role) and `user` (regular role). Credentials are available in `config.js`.
- Photoprism backend and database are running and reachable.
- For API-based login scenarios, the `.auth/adminState.json` or similar fixtures may be used.

Recommended test setup steps:

1. Start Photoprism (use local compose or the provided `playwright/sut/compose.yml` if available).
2. Ensure `BASE_URL` points to the running instance.
3. Run Playwright with headed mode and `page.on('console')` capture for debugging when validating init scripts.

## Test data

- Small sample photos: `test-assets/photo-small.jpg` (valid JPG, < 1 MB)
- Large sample photos: `test-assets/photo-large.jpg` ( > 50 MB) or generated large file
- Invalid format: `test-assets/photo.txt` or unsupported file like `.exe`
- Multi-photo zip (if Photoprism supports) or multiple file uploads via input

## How to run (QA / automation)

Suggested manual run:

- Open `BASE_URL` in a browser and walk through scenarios.

Suggested automation run (Playwright):

- Create tests in `tests/` mirroring these scenarios.
- Example command to run a single test file (PowerShell):

```powershell
npx playwright test tests/login.spec.ts --headed
```

## Success criteria for the plan

- All critical paths pass in at least one browser (Chromium).
- No regressions for authentication and core CRUD operations.
- Edge cases reveal expected errors or graceful handling.

## Common starting-state assumption

Each scenario explicitly states the starting state. By default assume "fresh browser profile" (no cookies, no localStorage) and fresh application state unless a scenario requires pre-seeded data.

---

## Scenarios

### 1. Login - UI (happy path)

Assumptions: fresh browser profile.

Steps:

1. Navigate to `BASE_URL`.
2. Click "Sign in" if needed and enter username `admin` and password.
3. Click the Sign In button.
4. Wait for navigation to `/library/browse` (or dashboard).
5. Click application logo/menu and confirm user context is shown.

Expected results:

- User is navigated to the library/dashboard URL.
- UI shows the logged-in username or avatar.
- A persisted session token appears in localStorage or cookies as the app expects.

Success criteria: The app loads library view and user-specific UI appears.
Failure conditions: Login fails, 4xx/5xx returned, or app redirects back to login.

### 2. Login - via API/auth state (addInitScript or context state)

Assumptions: You have a valid state file (e.g. `playwright/.auth/adminState.json`) that contains stringified keys the app expects (e.g. `session.data`, `session.id`, `session.token`).

Steps:

1. Create a new browser context.
2. Inject session/localStorage via `context.addInitScript` passing a serializable object and the expected host (avoid referencing Node-only variables in the page function).
3. If the app expects a cookie, add it with `context.addCookies` for the domain.
4. Create a new page or navigate to `BASE_URL`.
5. Verify that the app shows the logged-in state.

Expected results:

- The user sees the authenticated UI without manual sign-in.
- localStorage/cookies contain the keys the app uses (verify via `page.evaluate`).

Edge checks:

- If injection fails, capture `page.on('console')` logs and verify the script arguments are serializable (strings for storage values).

Success criteria: Authenticated view appears using injected state. Confirm via `page.evaluate(() => localStorage.getItem('session.id'))`.
Failure conditions: Injection silently fails (addInitScript thrown), or the server overrides state on load; then try adding cookies or server-side tokens.

### 3. Upload a single valid photo (happy path)

Assumptions: logged-in admin user, fresh library.

Steps:

1. Navigate to Upload page or click Upload button.
2. Use file chooser to select `test-assets/photo-small.jpg`.
3. Confirm upload and wait for processing to finish.
4. Navigate to Library and search/filter for the uploaded photo (by date or filename).

Expected results:

- Upload succeeds, no client-side errors.
- Photo appears in the library with thumbnail and metadata.
- EXIF data (if present) is parsed and displayed.

Success criteria: Photo is visible and not in an error state.
Failure conditions: Upload UI error, server 4xx/5xx, missing thumbnail.

### 4. Upload multiple photos and bulk operations

Assumptions: logged-in user.

Steps:

1. Upload 3 small photos.
2. In the library, select multiple photos and use bulk actions (delete, favorite, add to album).
3. Verify the bulk action result.

Expected results:

- Bulk action applies to selected items.

Edge case: Use a very large batch (>100) to ensure UI and server handle pagination or queuing.

### 5. Upload invalid/unsupported file (negative test)

Steps:

1. Attempt to upload `test-assets/photo.txt` or an unsupported format.
2. Observe client validation and server responses.

Expected results:

- The app blocks the upload and displays a user-friendly error.
- No partial records are created in the library.

### 6. Large file upload / timeout and resume behaviour

Assumptions: Large file generator or `photo-large.jpg` available.

Steps:

1. Start uploading a large file that will take some time.
2. Simulate a temporary network interruption (toggle offline in devtools or stop network in test harness).
3. Restore network and verify upload resumes or fails with clear error.

Expected results:

- Upload either resumes or fails gracefully with a retry option.
- Server-side logs show a consistent state (no half-created record).

### 7. Browse library, filter and sort (happy path)

Steps:

1. Go to Library view.
2. Apply filters (by date, by album) and sort by newest/oldest.
3. Verify items match filter criteria.

Expected results:

- Filtered results are correct and sorting order is correct.

### 8. Search for photos (text and metadata search)

Steps:

1. Use search bar to query by filename and metadata (e.g. location or tag).
2. Verify results relevance.

Expected results:

- Search returns expected photos.
- Fuzzy matches and partial matches behave as documented.

### 9. Edit photo metadata (title, description, tags)

Steps:

1. Open photo detail.
2. Edit title, description and tags.
3. Save and reload page.

Expected results:

- Changes are persisted and visible after reload.
- Backend returns updated fields on API calls.

Edge case: Empty title or extremely long strings should be validated.

### 10. Rotate/Flip/Crop image operations

Steps:

1. Open editor, perform a rotate operation.
2. Save and verify thumbnail updates and image reflects transformation.

Expected results:

- Transformation is applied and persisted.

Failure: Editor crashes, or transformations do not persist.

### 11. Share photo / create public link

Steps:

1. Select a photo and create a public share link.
2. Open the link in an incognito window.

Expected results:

- The shared page loads without requiring authentication.
- Shared link has expected permissions and expiry behavior.

Security check: verify private photos do not become public unless explicitly shared.

### 12. Delete photo (single) and Undo behaviour

Steps:

1. Delete a single photo from library.
2. Confirm the delete operation (if confirmation appears).
3. If app offers undo, click undo.

Expected results:

- Photo is removed from library when delete confirmed.
- Undo restores the photo if the feature exists.

### 13. Role-based access control (admin vs regular user)

Assumptions: `admin` and `user` accounts exist.

Steps:

1. Login as regular `user` and attempt to access admin-only pages (settings, maintenance).
2. Verify access denied or redirected.
3. Login as `admin` and verify admin UI and operations are accessible.

Expected results:

- Permissions enforced correctly.

### 14. Session expiration and refresh behavior

Steps:

1. Simulate session expiration by deleting `session.token` or setting expiry on server.
2. Reload the page.

Expected results:

- App prompts for re-login or handles gracefully by redirecting to login.
- No silent failures.

### 15. URL routing and deep links

Steps:

1. Open a deep link (e.g., `/photo/<id>` or `/album/<id>`) in a fresh browser session.
2. If the route requires auth, verify redirect to login; after login, verify route restores correctly.

Expected results:

- Deep links load correct content or redirect to login and preserve return URL.

### 16. API checks (basic endpoints)

Steps:

1. Call GET `/api/v1/photos` with valid auth token and verify response schema.
2. Call POST `/api/v1/import` (if available) and verify accepted payloads.

Expected results:

- HTTP 200/201 for valid requests.
- Schema validation passes for expected fields.

### 17. WebDAV and External access

Steps:

1. Connect a WebDAV client using user credentials.
2. List and upload files via WebDAV.

Expected results:

- Authentication succeeds and files are accessible.

### 18. Concurrent edits and conflict handling

Steps:

1. Open same photo in two browser contexts as different users.
2. Edit metadata simultaneously and save conflicting updates.

Expected results:

- App either serializes updates or surfaces a merge/conflict UI.

### 19. Import/Export albums or backup/restore (if supported)

Steps:

1. Export an album or run backup.
2. Restore into a fresh instance.

Expected results:

- Exported data contains expected entries and restore recreates items.

### 20. Accessibility smoke checks

Steps:

1. Run a keyboard-only navigation pass through the main flows.
2. Run automated accessibility scan (axe or similar) on core pages.

Expected results:

- No critical accessibility violations.

---

## Edge cases and negative tests (summary)

- Empty upload (no file chosen) — UI should prevent submission.
- Extremely long filenames and metadata — validate truncation or errors.
- Corrupted image files — should fail gracefully.
- Simultaneous deletes and edits from multiple sessions — check consistency.
- Missing keys in injected auth state — app should not silently accept incomplete auth; test error handling.

## Diagnostics and debugging tips

- For `addInitScript` failures, pass simple serializable objects and avoid referencing Node variables inside the injected function. Capture logs with `page.on('console')`.
- Validate `playwright/.auth/adminState.json` with a quick Node script and ensure all values you inject are strings.
- When tests fail intermittently, re-run in headed mode with devtools open to inspect console errors.

## Cleanup and teardown

- Tests that create data (uploads, shares, albums) should delete them in an `afterEach` or cleanup step unless the scenario explicitly preserves data.
- For destructive tests (delete, export/import), run them in a disposable environment.

## Appendix: quick validation script

A small Node snippet to validate the admin state file and pretty-print inner JSON fields (run from repo root):

```powershell
node -e "const fs=require('fs'); const f='playwright/.auth/adminState.json'; const o=JSON.parse(fs.readFileSync(f,'utf8')); console.log(JSON.stringify(o,null,2)); ['session.data','session.user'].forEach(k=>{ if(o[k]){ try{ console.log('PARSED',k, JSON.stringify(JSON.parse(o[k]),null,2)); }catch(e){ console.warn(k,'not parseable as JSON string'); } } });"
```

---

## Next steps

- Convert high-priority scenarios (Login, Upload, Browse, Delete) to Playwright tests in `tests/` as automated smoke tests.
- Add test assets in `test-assets/` and update CI to run the smoke suite against a test deployment.

---

Generated by test planning for the `playwright-demo-photoprism` repository.
