# Test Cases — PhotoPrism E2E Suite

> Derived from `specs/photoprism-test-plan.md`. Each test case maps to a plan scenario,
> references the exact page objects / fixtures / helpers available, and specifies
> concrete preconditions, steps, and assertions.

## Legend

| Column       | Meaning                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| **ID**       | Stable reference (e.g. TC-AUTH-001)                                      |
| **Plan**     | Scenario # from `photoprism-test-plan.md`                                |
| **Priority** | P0 = blocker, P1 = critical, P2 = important, P3 = nice-to-have           |
| **Project**  | Playwright project: `chromium` (admin) or `user-chromium` (regular user) |
| **Fixture**  | Fixture from `fixtures/pages.ts` used by the test                        |

## Infrastructure Reference

| Asset        | Path / Value                                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page Objects | `pages/LoginPage.ts`, `AlbumPage.ts`, `UploadPage.ts`, `LibraryPage.ts`, `SearchPage.ts`, `SharePage.ts`, `PhotoDetailPage.ts`, `AdminPage.ts`              |
| Fixtures     | `loginPage`, `uploadPage`, `libraryPage`, `photoDetailPage`, `searchPage`, `sharePage`, `adminPage`, `albumPage`, `albumFixture`, `a11yCheck`, `pageErrors` |
| Helpers      | `lib/auth.ts` → `loginViaAPI`, `lib/photoprism-api.ts` → `deleteAllPhotos`, `getPhotos`, `lib/accessibility.ts` → `checkA11y`                               |
| Test data    | `fixtures/testData/photoData.ts` → `generatePhotoMetadata`                                                                                                  |
| Test assets  | `test-assets/photo-1.jpg` … `photo-4.jpg`, `photo-small.jpg`, `photo-invalid.txt`                                                                           |
| Auth states  | `playwright/.auth/adminState.json` (admin), `playwright/.auth/userState.json` (user)                                                                        |
| Env          | `BASE_URL`, `PHOTOPRISM_USERNAME` (admin), `PHOTOPRISM_PASSWORD` (insecure)                                                                                 |

---

## 1. Authentication — UI Login

**File**: `tests/ui/auth/login-ui.spec.ts`
**Plan**: Scenario 1
**Project**: `chromium` with `storageState: { cookies: [], origins: [] }` (fresh context)

### TC-AUTH-001 — Valid admin login via UI (P0)

|                  |                                                     |
| ---------------- | --------------------------------------------------- |
| **Precondition** | Fresh browser context (no cookies, no localStorage) |
| **Fixture**      | `loginPage`, `page`                                 |

**Steps:**

1. Navigate to `BASE_URL`.
2. Fill username field with `photoprism.username` ("admin").
3. Fill password field with `photoprism.password` ("insecure").
4. Click Sign In button.
5. Wait for URL to contain `/library/browse`.
6. Click the PhotoPrism logo in the sidebar menu.
7. Assert the "admin" title element is visible.
8. Click the admin avatar/title link.
9. Assert the Display Name textbox has value "Admin".
10. Verify `session.token` exists in localStorage via `page.evaluate`.

**Expected Result:** User is redirected to library. Admin identity confirmed in UI and localStorage.

---

### TC-AUTH-002 — Invalid password shows error (P1)

|                  |                       |
| ---------------- | --------------------- |
| **Precondition** | Fresh browser context |
| **Fixture**      | `loginPage`, `page`   |

**Steps:**

1. Navigate to `BASE_URL`.
2. Fill username with "admin".
3. Fill password with "wrongpassword".
4. Click Sign In button.
5. Assert URL still contains `/login` (no redirect).
6. Assert an error message or alert is visible on the page (e.g. text matching `/invalid|wrong|failed/i`).
7. Assert `session.token` does NOT exist in localStorage.

**Expected Result:** Login rejected. User stays on login page with visible error.

---

### TC-AUTH-003 — Empty credentials prevented (P2)

|                  |                       |
| ---------------- | --------------------- |
| **Precondition** | Fresh browser context |
| **Fixture**      | `loginPage`, `page`   |

**Steps:**

1. Navigate to `BASE_URL`.
2. Leave username and password fields empty.
3. Click Sign In button.
4. Assert URL still contains `/login`.
5. Assert no navigation to `/library/browse` occurred.

**Expected Result:** App does not attempt login with empty fields.

---

### TC-AUTH-004 — Password field is masked (P2)

|                  |                       |
| ---------------- | --------------------- |
| **Precondition** | Fresh browser context |
| **Fixture**      | `page`                |

**Steps:**

1. Navigate to `BASE_URL`.
2. Assert the password input has `type="password"`.

**Expected Result:** Password is masked in the UI.

---

## 2. Authentication — API Login

**File**: `tests/ui/auth/login-api.spec.ts`
**Plan**: Scenario 2
**Project**: `chromium` with `storageState: { cookies: [], origins: [] }` (fresh context)

### TC-AUTH-005 — Valid login via API injects session (P0)

|                  |                                |
| ---------------- | ------------------------------ |
| **Precondition** | Fresh browser context          |
| **Fixture**      | `loginPage`, `page`, `context` |

**Steps:**

1. Call `loginViaAPI(username, password, context)` to inject session via `addInitScript`.
2. Navigate to `BASE_URL`.
3. Assert URL contains `/library/browse` (not `/login`).
4. Verify `session.token` exists in localStorage via `page.evaluate`.
5. Verify `session.id` exists in localStorage via `page.evaluate`.
6. Click PhotoPrism logo menu, assert "admin" title is visible.

**Expected Result:** Authenticated view loads without manual login. Session tokens present.

---

### TC-AUTH-006 — API login with invalid credentials returns error (P1)

|                  |                       |
| ---------------- | --------------------- |
| **Precondition** | Fresh browser context |
| **Fixture**      | `page`, `context`     |

**Steps:**

1. Send POST to `${BASE_URL}/api/v1/session` with `{ username: "admin", password: "wrong" }`.
2. Assert response status is 400 or 401 (not 200).
3. Assert response body does NOT contain a valid `access_token`.

**Expected Result:** Server rejects invalid credentials with appropriate HTTP status.

---

## 3. Authentication — Session Expiry

**File**: `tests/ui/auth/session-expiry.spec.ts`
**Plan**: Scenario 14
**Project**: `chromium` (pre-authenticated admin)

### TC-AUTH-007 — Clearing tokens forces re-login (P0)

|                  |                                            |
| ---------------- | ------------------------------------------ |
| **Precondition** | Authenticated admin session (storageState) |
| **Fixture**      | `page`                                     |

**Steps:**

1. Navigate to `BASE_URL`.
2. Assert URL does NOT contain `/login` (confirming authenticated state).
3. Remove `session.token` and `session.id` from localStorage via `page.evaluate`.
4. Reload the page.
5. Assert URL redirects to `/login` within 10s.

**Expected Result:** App detects missing session and redirects to login.

---

### TC-AUTH-008 — Clearing only session.token forces re-login (P1)

|                  |                             |
| ---------------- | --------------------------- |
| **Precondition** | Authenticated admin session |
| **Fixture**      | `page`                      |

**Steps:**

1. Navigate to `BASE_URL`.
2. Assert URL does NOT contain `/login`.
3. Remove only `session.token` from localStorage.
4. Reload the page.
5. Assert URL redirects to `/login`.

**Expected Result:** Missing token alone is enough to invalidate the session.

---

### TC-AUTH-009 — Re-login works after forced expiry (P1)

|                  |                             |
| ---------------- | --------------------------- |
| **Precondition** | Authenticated admin session |
| **Fixture**      | `loginPage`, `page`         |

**Steps:**

1. Navigate to `BASE_URL` and confirm authenticated.
2. Clear all session keys from localStorage.
3. Reload → assert redirect to `/login`.
4. Fill username ("admin"), fill password ("insecure"), click Sign In.
5. Assert URL contains `/library/browse`.
6. Assert `session.token` exists in localStorage.

**Expected Result:** User can re-authenticate after session expiry.

---

## 4. Authentication — RBAC

**File**: `tests/ui/auth/rbac.spec.ts`
**Plan**: Scenario 13

### TC-RBAC-001 — Admin can access settings page (P0)

|                  |                     |
| ---------------- | ------------------- |
| **Precondition** | Authenticated admin |
| **Project**      | `chromium`          |
| **Fixture**      | `adminPage`, `page` |

**Steps:**

1. Navigate to settings via `adminPage.navigateToSettings()`.
2. Assert `adminPage.isAccessDenied()` returns `false`.
3. Assert `adminPage.isSettingsVisible()` returns `true`.
4. Assert a "General" tab is visible on the page.

**Expected Result:** Admin has full access to settings.

---

### TC-RBAC-002 — Admin can access maintenance page (P0)

|                  |                     |
| ---------------- | ------------------- |
| **Precondition** | Authenticated admin |
| **Project**      | `chromium`          |
| **Fixture**      | `adminPage`, `page` |

**Steps:**

1. Navigate to maintenance via `adminPage.navigateToMaintenance()`.
2. Assert `adminPage.isAccessDenied()` returns `false`.
3. Assert `page.locator('main')` is visible.
4. Assert URL contains `/maintenance`.

**Expected Result:** Admin has access to maintenance.

---

### TC-RBAC-003 — Regular user cannot access settings (P0)

|                  |                               |
| ---------------- | ----------------------------- |
| **Precondition** | Authenticated as regular user |
| **Project**      | `user-chromium`               |
| **Fixture**      | `adminPage`, `page`           |

**Steps:**

1. Navigate to settings via `adminPage.navigateToSettings()`.
2. Assert one of:
   - URL redirected away from `/settings`, OR
   - `adminPage.isAccessDenied()` returns `true`, OR
   - Settings tabs are NOT visible.

**Expected Result:** Regular user is denied access to settings.

---

### TC-RBAC-004 — Regular user cannot access maintenance (P1)

|                  |                               |
| ---------------- | ----------------------------- |
| **Precondition** | Authenticated as regular user |
| **Project**      | `user-chromium`               |
| **Fixture**      | `adminPage`, `page`           |

**Steps:**

1. Navigate to maintenance via `adminPage.navigateToMaintenance()`.
2. Assert one of:
   - URL redirected away from `/maintenance`, OR
   - `adminPage.isAccessDenied()` returns `true`.

**Expected Result:** Regular user is denied access to maintenance.

---

### TC-RBAC-005 — Regular user can access library browse (P1)

|                  |                               |
| ---------------- | ----------------------------- |
| **Precondition** | Authenticated as regular user |
| **Project**      | `user-chromium`               |
| **Fixture**      | `libraryPage`, `page`         |

**Steps:**

1. Navigate to library via `libraryPage.navigateToBrowse()`.
2. Assert URL contains `/library/browse`.
3. Assert the search textbox is visible.

**Expected Result:** Regular user has access to the library.

---

## 5. Upload — Single Valid Photo

**File**: `tests/ui/upload/upload-happy.spec.ts` (NEW)
**Plan**: Scenario 3
**Project**: `chromium`

### TC-UPL-001 — Upload single photo and verify in library (P0)

|                  |                                                                     |
| ---------------- | ------------------------------------------------------------------- |
| **Precondition** | Authenticated admin, clean library (uploadPage fixture auto-cleans) |
| **Fixture**      | `uploadPage`, `page`, `pageErrors`                                  |

**Steps:**

1. Navigate to upload form via `uploadPage.navigateToUploadForm()`.
2. Upload `test-assets/photo-1.jpg` via `uploadPage.uploadFiles(...)`.
3. Wait for upload complete via `uploadPage.waitForUploadComplete()`.
4. Navigate to review section via `uploadPage.navigateToReviewSection()`.
5. Approve all photos via `uploadPage.approveAllPhotos()`.
6. Navigate to library via `uploadPage.navigateToLibrary()`.
7. Assert at least 1 photo tile (`.is-photo`) is visible.
8. Assert rendered photo UIDs via `uploadPage.getRenderedPhotoUids()` has length >= 1.
9. Assert `pageErrors` array is empty (no console errors).

**Expected Result:** Photo uploaded, approved, and visible in library with no JS errors.

---

### TC-UPL-002 — Upload multiple photos (P1)

|                  |                                    |
| ---------------- | ---------------------------------- |
| **Precondition** | Authenticated admin, clean library |
| **Fixture**      | `uploadPage`, `page`               |

**Steps:**

1. Navigate to upload form.
2. Upload `['test-assets/photo-1.jpg', 'test-assets/photo-2.jpg', 'test-assets/photo-3.jpg']`.
3. Wait for upload complete.
4. Navigate to review, approve all.
5. Navigate to library.
6. Assert photo tile count >= 3.
7. Assert rendered photo UIDs length >= 3.

**Expected Result:** All three photos appear in library after upload and approval.

---

### TC-UPL-003 — Uploaded photo is accessible via API (P1)

|                  |                                    |
| ---------------- | ---------------------------------- |
| **Precondition** | Authenticated admin, clean library |
| **Fixture**      | `uploadPage`, `page`               |

**Steps:**

1. Upload `test-assets/photo-1.jpg`, approve via review.
2. Get auth token from storageState.
3. GET `${BASE_URL}/api/v1/photos?count=10` with auth header.
4. Assert response status 200.
5. Assert response array length >= 1.
6. Assert first photo has `UID` property (non-empty string).

**Expected Result:** Uploaded photo exists in API response with valid UID.

---

## 6. Upload — Invalid File

**File**: `tests/ui/upload/upload-invalid.spec.ts`
**Plan**: Scenario 5
**Project**: `chromium`

### TC-UPL-004 — Upload text file creates no photo record (P1)

|                  |                                    |
| ---------------- | ---------------------------------- |
| **Precondition** | Authenticated admin, clean library |
| **Fixture**      | `uploadPage`                       |

**Steps:**

1. Navigate to upload form.
2. Upload `test-assets/photo-invalid.txt`.
3. Wait for upload complete (server accepts the file but won't index it as a photo).
4. Navigate to library.
5. Assert photo tile count is 0.

**Expected Result:** Invalid file does not create a photo record.

---

## 7. Upload — Network Failure

**File**: `tests/ui/upload/upload-large.spec.ts`
**Plan**: Scenario 6
**Project**: `chromium`

### TC-UPL-005 — Network abort during upload shows error state (P1)

|                  |                                    |
| ---------------- | ---------------------------------- |
| **Precondition** | Authenticated admin, clean library |
| **Fixture**      | `uploadPage`, `page`, `a11yCheck`  |

**Steps:**

1. Intercept upload API route: `page.route('**/api/v1/upload/**', route => route.abort('connectionfailed'))`.
2. Navigate to upload form.
3. Run a11y check on the upload form.
4. Attempt to upload `test-assets/photo-1.jpg` (catch expected error).
5. Assert the Browse button is still visible (form is not broken).
6. Remove the route intercept via `page.unroute(...)`.
7. Navigate to library.
8. Assert photo tile count is 0 (no partial records).

**Expected Result:** Upload fails gracefully. No partial photo records. Form remains usable.

---

## 8. Library — Browse, Filter, Sort

**File**: `tests/ui/library/browse-filter.spec.ts` (NEW)
**Plan**: Scenario 7
**Project**: `chromium`

> **Note:** These tests require photos in the library. Each test uploads photos first
> using `uploadPage` fixture, or uses the existing library state if photos are present.

### TC-LIB-001 — Library browse page loads with search bar (P0)

|                  |                       |
| ---------------- | --------------------- |
| **Precondition** | Authenticated admin   |
| **Fixture**      | `libraryPage`, `page` |

**Steps:**

1. Navigate to library via `libraryPage.navigateToBrowse()`.
2. Assert URL contains `/library/browse`.
3. Assert search textbox (role "textbox", name "Search") is visible.
4. Assert `page.locator('main')` is visible.

**Expected Result:** Library page loads correctly with core UI elements.

---

### TC-LIB-002 — Library shows uploaded photos (P0)

|                  |                                     |
| ---------------- | ----------------------------------- |
| **Precondition** | Authenticated admin, clean library  |
| **Fixture**      | `uploadPage`, `libraryPage`, `page` |

**Steps:**

1. Upload `test-assets/photo-1.jpg` via uploadPage, approve in review.
2. Navigate to library via `libraryPage.navigateToBrowse()`.
3. Wait for photos via `libraryPage.waitForPhotos()`.
4. Assert `libraryPage.getPhotoCount()` >= 1.
5. Assert `libraryPage.getRenderedPhotoUids()` returns array with at least 1 non-empty UID.

**Expected Result:** Uploaded photos appear in library with valid UIDs.

---

### TC-LIB-003 — Sort by newest shows most recent first (P2)

|                  |                                         |
| ---------------- | --------------------------------------- |
| **Precondition** | Authenticated admin, library has photos |
| **Fixture**      | `uploadPage`, `libraryPage`, `page`     |

**Steps:**

1. Upload 2 photos (photo-1.jpg, photo-2.jpg), approve.
2. Set sort order to "newest" via `libraryPage.setSortOrder('newest')`.
3. Wait for photos to render.
4. Get rendered UIDs.
5. Set sort order to "oldest" via `libraryPage.setSortOrder('oldest')`.
6. Wait for photos to render.
7. Get rendered UIDs again.
8. Assert the two UID lists are in different order (or at minimum, both contain the same UIDs).

**Expected Result:** Sort order changes the display order of photos.

---

## 9. Library — Search

**File**: `tests/ui/library/search.spec.ts`
**Plan**: Scenario 8
**Project**: `chromium`

### TC-LIB-004 — Search with no results shows empty state (P1)

|                  |                      |
| ---------------- | -------------------- |
| **Precondition** | Authenticated admin  |
| **Fixture**      | `searchPage`, `page` |

**Steps:**

1. Navigate to `BASE_URL + '/library/browse'`.
2. Search for `'xyznonexistentquery12345'` via `searchPage.search(...)`.
3. Assert `searchPage.getResultCount()` equals 0.

**Expected Result:** Nonsense query returns zero results.

---

### TC-LIB-005 — Search finds uploaded photo (P0)

|                  |                                    |
| ---------------- | ---------------------------------- |
| **Precondition** | Authenticated admin, clean library |
| **Fixture**      | `uploadPage`, `searchPage`, `page` |

**Steps:**

1. Upload `test-assets/photo-1.jpg`, approve in review.
2. Navigate to library browse.
3. Search for `'photo'` (partial filename match) via `searchPage.search(...)`.
4. Wait for results via `searchPage.waitForResults()`.
5. Find exactly uploaded photo

**Expected Result:** Search returns the uploaded photo.

---

### TC-LIB-006 — Clearing search restores all results (P2)

|                  |                                         |
| ---------------- | --------------------------------------- |
| **Precondition** | Authenticated admin, library has photos |
| **Fixture**      | `uploadPage`, `searchPage`, `page`      |

**Steps:**

1. Upload `test-assets/photo-1.jpg`, approve.
2. Navigate to library browse.
3. Search for `'xyznonexistent'` → assert 0 results.
4. Clear search via `searchPage.clearSearch()` and press Enter.
5. Wait for results.
6. Assert result count >= 1 (photos are back).

**Expected Result:** Clearing the search restores the full library view.

---

## 10. Library — Deep Links & Routing

**File**: `tests/ui/library/deep-links.spec.ts`
**Plan**: Scenario 15
**Project**: `chromium`

### TC-LIB-007 — Unauthenticated user redirected to login (P0)

|                  |                                           |
| ---------------- | ----------------------------------------- |
| **Precondition** | Fresh unauthenticated browser context     |
| **Fixture**      | `browser` (create fresh context manually) |

**Steps:**

1. Create new context with `storageState: { cookies: [], origins: [] }`.
2. Navigate to `BASE_URL + '/library/browse'`.
3. Assert URL redirects to match `/login/` within 10s.
4. Close context.

**Expected Result:** Unauthenticated access to library redirects to login.

---

### TC-LIB-008 — Deep link to library browse loads correctly (P1)

|                  |                       |
| ---------------- | --------------------- |
| **Precondition** | Authenticated admin   |
| **Fixture**      | `libraryPage`, `page` |

**Steps:**

1. Navigate directly to `BASE_URL + '/library/browse'`.
2. Assert URL contains `/library/browse`.
3. Assert search textbox is visible.

**Expected Result:** Deep link to library loads authenticated view.

---

### TC-LIB-009 — Deep link to albums page loads correctly (P1)

|                  |                     |
| ---------------- | ------------------- |
| **Precondition** | Authenticated admin |
| **Fixture**      | `albumPage`, `page` |

**Steps:**

1. Navigate to albums via `albumPage.navigateToAlbums()`.
2. Assert URL contains `/albums`.
3. Assert `page.locator('main')` is visible.

**Expected Result:** Albums deep link works for authenticated admin.

---

### TC-LIB-010 — Non-existent route handled gracefully (P2)

|                  |                     |
| ---------------- | ------------------- |
| **Precondition** | Authenticated admin |
| **Fixture**      | `page`              |

**Steps:**

1. Navigate to `BASE_URL + '/nonexistent-route-xyz'`.
2. Assert URL is redirected to one of: `/library/browse`, `/library/login`, or `/login`.
3. Assert no blank/error page (main content or login form visible).

**Expected Result:** Invalid routes redirect gracefully, no broken page.

---

## 11. Album CRUD

**File**: `tests/ui/admin/album-crud.spec.ts`
**Plan**: Scenario 4 (bulk actions, add to album), Scenario 7 (browse)
**Project**: `chromium`

> **Design principle:** Album Create, Read, and Delete are the things being tested.
> They must happen through the UI, not hidden behind API calls or fixtures.
> API is only acceptable for **setup of unrelated preconditions** (e.g. uploading photos
> so we have something to add to an album — upload itself is tested in the upload suite).
>
> `albumFixture` is NOT used here — it hides the Create/Delete behind API calls,
> which defeats the purpose of a CRUD test.
>
> `test.skip` is NOT used — if the environment is missing data, that is a test failure.

### TC-ALB-001 — Create album through UI (P0)

| | |
|---|---|
| **Precondition** | Authenticated admin |
| **Fixture** | `albumPage`, `page` |

**Steps:**

1. Navigate to albums page via `albumPage.navigateToAlbums()`.
2. Click the "Add Album" / "+" button on the albums page.
3. Type album name: `'E2E Test Album'`.
4. Confirm / press Enter.
5. Assert the new album appears in the albums list (visible by title text).
6. Assert URL is still on `/albums` (no error redirect).

**Expected Result:** Album is created through the UI and visible in the albums list.

**Teardown:** Delete the created album (via API is fine for cleanup — cleanup is not the thing under test).

**Page object gap:** `AlbumPage` needs new UI methods: `clickAddAlbum()`, `typeAlbumName(name)`, `confirmCreate()`, `getAlbumTitles()`. Currently only has API methods.

---

### TC-ALB-002 — Created album appears on albums page (P0)

| | |
|---|---|
| **Precondition** | Authenticated admin, album created in TC-ALB-001 (or use `test.describe.serial`) |
| **Fixture** | `albumPage`, `page` |

**Steps:**

1. Navigate to albums page.
2. Assert `page.locator('main')` is visible.
3. Assert at least one album card/entry is visible in the list.
4. Assert album with title `'E2E Test Album'` is present.

**Expected Result:** Albums page renders and shows the created album.

---

### TC-ALB-003 — Add photos to album through UI (P0)

| | |
|---|---|
| **Precondition** | Authenticated admin, at least 1 photo in library, album exists |
| **Fixture** | `uploadPage`, `albumPage`, `libraryPage`, `page` |

**Steps:**

1. Upload `test-assets/photo-1.jpg` via `uploadPage`, approve in review (precondition setup — upload UI is tested separately).
2. Navigate to library browse.
3. Select a photo by clicking its select/checkbox control.
4. Open the bulk action menu (clipboard FAB).
5. Click "Add to Album" (or equivalent bulk action).
6. Select the target album from the album picker.
7. Confirm the action.
8. Navigate to the album detail page.
9. Assert the photo is visible inside the album (photo tile count >= 1).

**Expected Result:** Photo added to album through UI bulk action, visible in album.

**If no photos exist:** Test FAILS — not skips. No photos = broken test environment.

**Page object gap:** `AlbumPage` needs: `openAlbum(name)`. `UploadPage` / `LibraryPage` needs: `selectPhoto(index)`, `openBulkActionMenu()`, `clickAddToAlbum()`, `selectAlbumFromPicker(name)`.

---

### TC-ALB-004 — Delete album through UI (P1)

| | |
|---|---|
| **Precondition** | Authenticated admin, album exists in albums list |
| **Fixture** | `albumPage`, `page` |

**Steps:**

1. Navigate to albums page.
2. Note the album count before delete.
3. Right-click or long-press the target album to open context menu (or select + bulk delete).
4. Click "Delete" action.
5. Confirm deletion if a dialog appears.
6. Assert the album is no longer in the albums list.
7. Assert album count decreased by 1.

**Expected Result:** Album deleted through UI and removed from list.

**Page object gap:** `AlbumPage` needs: `deleteAlbumViaUI(name)`, `getAlbumCount()`, `isAlbumVisible(name)`.

---

### TC-ALB-005 — Rename album through UI (P2)

| | |
|---|---|
| **Precondition** | Authenticated admin, album exists |
| **Fixture** | `albumPage`, `page` |

**Steps:**

1. Navigate to albums page.
2. Open the album for editing (double-click title, or open detail → edit).
3. Change album name to `'Renamed Album'`.
4. Save / confirm.
5. Assert the album list shows `'Renamed Album'` instead of the old name.

**Expected Result:** Album rename persists and is visible in the list.

**Page object gap:** `AlbumPage` needs: `renameAlbum(oldName, newName)`.
---

## 12. Photo Detail — Edit Metadata

**File**: `tests/ui/library/photo-edit.spec.ts` (NEW)
**Plan**: Scenario 9
**Project**: `chromium`

### TC-PHO-001 — Edit photo title and verify persistence (P1)

|                  |                                                        |
| ---------------- | ------------------------------------------------------ |
| **Precondition** | Authenticated admin, clean library, 1 uploaded photo   |
| **Fixture**      | `uploadPage`, `libraryPage`, `photoDetailPage`, `page` |

**Steps:**

1. Upload `test-assets/photo-1.jpg`, approve in review.
2. Navigate to library, wait for photos.
3. Get first rendered photo UID via `libraryPage.getRenderedPhotoUids()`.
4. Open photo via `photoDetailPage.openPhoto(uid)`.
5. Open edit panel via `photoDetailPage.openEditPanel()`.
6. Generate test metadata via `generatePhotoMetadata(42)` for deterministic data.
7. Edit title via `photoDetailPage.editTitle(metadata.title)`.
8. Save changes via `photoDetailPage.saveChanges()`.
9. Reload the page.
10. Re-open the photo and edit panel.
11. Assert the title textbox still has the value `metadata.title`.

**Expected Result:** Title edit persists across page reload.

---

### TC-PHO-002 — Edit photo description (P2)

|                  |                                                        |
| ---------------- | ------------------------------------------------------ |
| **Precondition** | Authenticated admin, 1 uploaded photo                  |
| **Fixture**      | `uploadPage`, `libraryPage`, `photoDetailPage`, `page` |

**Steps:**

1. Upload photo, approve, navigate to library.
2. Open first photo, open edit panel.
3. Edit description via `photoDetailPage.editDescription('E2E test description')`.
4. Save changes.
5. Reload, re-open photo and edit panel.
6. Assert description textbox has value "E2E test description".

**Expected Result:** Description edit persists.

---

### TC-PHO-003 — Delete photo removes it from library (P1)

|                  |                                                        |
| ---------------- | ------------------------------------------------------ |
| **Precondition** | Authenticated admin, 1 uploaded photo                  |
| **Fixture**      | `uploadPage`, `libraryPage`, `photoDetailPage`, `page` |

**Steps:**

1. Upload photo, approve, navigate to library.
2. Get photo count before delete.
3. Open first photo.
4. Delete photo via `photoDetailPage.deletePhoto()`.
5. Navigate back to library.
6. Assert photo count decreased by 1 (or is 0 if started with 1).

**Expected Result:** Deleted photo no longer appears in library.

> **Note:** Plan Scenario 12 mentions "undo" behavior. PhotoPrism may or may not support undo after delete.
> If undo button appears after delete, add TC-PHO-004 to test it. Otherwise, skip.

---

## 13. Sharing — Public Links

**File**: `tests/ui/sharing/share-link.spec.ts`
**Plan**: Scenario 11
**Project**: `chromium`

### TC-SHR-001 — Unauthenticated library access redirects to login (P1)

|                  |                         |
| ---------------- | ----------------------- |
| **Precondition** | Unauthenticated context |
| **Fixture**      | `browser`               |

**Steps:**

1. Create fresh context with empty storageState.
2. Navigate to `BASE_URL + '/library/browse'`.
3. Assert redirect to `/login/` within 10s.
4. Close context.

**Expected Result:** Private content requires authentication.

---

### TC-SHR-002 — Create share link and access without auth (P0)

|                  |                                                   |
| ---------------- | ------------------------------------------------- |
| **Precondition** | Authenticated admin, library has at least 1 photo |
| **Fixture**      | `uploadPage`, `sharePage`, `page`, `browser`      |

**Steps:**

1. Upload `test-assets/photo-1.jpg`, approve.
2. Navigate to `BASE_URL` (ensure auth context initialized).
3. Get photos via API, take first photo UID.
4. Create share link via `sharePage.createShareLink(photoUid, page.request)` → get token.
5. Create a new unauthenticated browser context.
6. Navigate to share URL via `sharePage.getShareUrl(token)` in unauthenticated page.
7. Assert the page loads (status 200, not redirected to login).
8. Assert some content is visible (photo or album view).
9. Close unauthenticated context.

**Expected Result:** Share link grants access without authentication.

---

### TC-SHR-003 — Private album not accessible without share link (P1)

|                  |                                   |
| ---------------- | --------------------------------- |
| **Precondition** | Authenticated admin, album exists |
| **Fixture**      | `albumFixture`, `browser`         |

**Steps:**

1. `albumFixture` creates a test album → get albumUid.
2. Create a new unauthenticated context.
3. Navigate to `BASE_URL + '/library/albums/' + albumUid` in unauthenticated page.
4. Assert URL redirects to `/login`.
5. Close unauthenticated context.

**Expected Result:** Albums are private by default; no access without auth or share link.

---

## 14. API Checks

**File**: `tests/api/api-checks.spec.ts`
**Plan**: Scenario 16
**Project**: `chromium`

### TC-API-001 — GET /api/v1/photos returns valid response (P0)

|                  |                     |
| ---------------- | ------------------- |
| **Precondition** | Authenticated admin |
| **Fixture**      | `page`              |

**Steps:**

1. Navigate to `BASE_URL` (initialize context).
2. Get auth token from storageState.
3. GET `${BASE_URL}/api/v1/photos` with `count=10` param and auth header.
4. Assert response status is 200.
5. Assert response body is an array.

**Expected Result:** Photos endpoint returns 200 with array body.

---

### TC-API-002 — Photo response schema has expected fields (P1)

|                  |                                         |
| ---------------- | --------------------------------------- |
| **Precondition** | Authenticated admin, library has photos |
| **Fixture**      | `uploadPage`, `page`                    |

**Steps:**

1. Upload `test-assets/photo-1.jpg`, approve.
2. GET photos via API with auth.
3. Assert array is non-empty.
4. Assert first item has property `UID` (string).
5. Assert first item has property `Title` (string).
6. Assert first item has property `OriginalName` (string).

**Expected Result:** Photo objects contain expected schema fields.

---

### TC-API-003 — GET /api/v1/status returns 200 (P1)

|                  |                        |
| ---------------- | ---------------------- |
| **Precondition** | None (public endpoint) |
| **Fixture**      | `page`                 |

**Steps:**

1. Navigate to `BASE_URL`.
2. GET `${BASE_URL}/api/v1/status`.
3. Assert response status is 200.

**Expected Result:** Status endpoint is reachable.

---

### TC-API-004 — Unauthenticated photos request returns 401 or 403 (P0)

|                  |                         |
| ---------------- | ----------------------- |
| **Precondition** | Unauthenticated context |
| **Fixture**      | `browser`               |

**Steps:**

1. Create fresh context with empty storageState.
2. GET `${BASE_URL}/api/v1/photos?count=10` (no auth header).
3. Assert response status is 401 or 403.
4. Close context.

**Expected Result:** API enforces authentication.

---

### TC-API-005 — GET /api/v1/config returns server configuration (P2)

|                  |                     |
| ---------------- | ------------------- |
| **Precondition** | Authenticated admin |
| **Fixture**      | `page`              |

**Steps:**

1. Navigate to `BASE_URL`.
2. Get auth token from storageState.
3. GET `${BASE_URL}/api/v1/config` with auth header.
4. Assert response status is 200.
5. Assert response body is an object (not array, not null).

**Expected Result:** Config endpoint returns server configuration.

---

## 15. WebDAV

**File**: `tests/api/webdav.spec.ts`
**Plan**: Scenario 17
**Project**: `chromium`

### TC-API-006 — WebDAV PROPFIND returns directory listing (P3)

|                    |                                             |
| ------------------ | ------------------------------------------- |
| **Precondition**   | `WEBDAV_ENABLED=true` env variable set      |
| **Fixture**        | `page`                                      |
| **Skip condition** | `test.skip(!process.env['WEBDAV_ENABLED'])` |

**Steps:**

1. Build Basic auth header from admin credentials.
2. Send PROPFIND to `${BASE_URL}/originals/` with auth and `Depth: 1` header.
3. Assert response status is 207 (Multi-Status) or 200.

**Expected Result:** WebDAV endpoint responds with directory listing.

---

## 16. Accessibility

**File**: `tests/ui/accessibility/a11y-smoke.spec.ts`
**Plan**: Scenario 20
**Project**: `chromium`

### TC-A11Y-001 — Login page has no critical a11y violations (P1)

|                  |                         |
| ---------------- | ----------------------- |
| **Precondition** | Unauthenticated context |
| **Fixture**      | `browser`               |

**Steps:**

1. Create fresh unauthenticated context.
2. Navigate to `BASE_URL + '/library/login'`.
3. Run `checkA11y(page)` with known disabled rules.
4. Assert violations array is empty.
5. Close context.

---

### TC-A11Y-002 — Library browse page has no critical a11y violations (P1)

|             |                            |
| ----------- | -------------------------- |
| **Fixture** | `libraryPage`, `a11yCheck` |

**Steps:**

1. Navigate to library via `libraryPage.navigateToBrowse()`.
2. Run `a11yCheck()`.

---

### TC-A11Y-003 — Upload form has no critical a11y violations (P1)

|             |                           |
| ----------- | ------------------------- |
| **Fixture** | `uploadPage`, `a11yCheck` |

**Steps:**

1. Navigate to upload form via `uploadPage.navigateToUploadForm()`.
2. Run `a11yCheck()`.

---

### TC-A11Y-004 — Albums page has no critical a11y violations (P1)

|             |                          |
| ----------- | ------------------------ |
| **Fixture** | `albumPage`, `a11yCheck` |

**Steps:**

1. Navigate to albums via `albumPage.navigateToAlbums()`.
2. Run `a11yCheck()`.

---

### TC-A11Y-005 — Settings page has no critical a11y violations (P1)

|             |                          |
| ----------- | ------------------------ |
| **Fixture** | `adminPage`, `a11yCheck` |

**Steps:**

1. Navigate to settings via `adminPage.navigateToSettings()`.
2. Run `a11yCheck()`.

---

### TC-A11Y-006 — Keyboard Tab navigation works on main nav (P2)

|             |                       |
| ----------- | --------------------- |
| **Fixture** | `libraryPage`, `page` |

**Steps:**

1. Navigate to library via `libraryPage.navigateToBrowse()`.
2. Press Tab key.
3. Assert the focused element (`:focus`) is visible.
4. Assert the focused element does NOT have `tabindex="-1"`.
5. Count all focusable elements (`button, a, input, [tabindex]:not([tabindex="-1"])`).
6. Assert focusable count > 0.

---

## Deferred / Out-of-scope

These plan scenarios are intentionally deferred due to infrastructure limitations:

| Plan Scenario                | Reason                                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **10. Rotate/Flip/Crop**     | `PhotoDetailPage.rotatePhoto()` exists but has a try/catch fallback — rotation support depends on PhotoPrism config. Add when confirmed available. |
| **18. Concurrent edits**     | Requires two authenticated contexts editing simultaneously. Complex setup; low ROI for this phase.                                                 |
| **19. Import/Export backup** | No API endpoint or UI flow confirmed in current codebase for album export/import.                                                                  |

---

## Summary — Test Count by File

| File                                        | Current | Proposed | Delta   |
| ------------------------------------------- | ------- | -------- | ------- |
| `tests/ui/auth/login-ui.spec.ts`            | 1       | 4        | +3      |
| `tests/ui/auth/login-api.spec.ts`           | 1       | 2        | +1      |
| `tests/ui/auth/session-expiry.spec.ts`      | 1       | 3        | +2      |
| `tests/ui/auth/rbac.spec.ts`                | 2       | 5        | +3      |
| `tests/ui/upload/upload-happy.spec.ts`      | 0 (NEW) | 3        | +3      |
| `tests/ui/upload/upload-invalid.spec.ts`    | 1       | 1        | 0       |
| `tests/ui/upload/upload-large.spec.ts`      | 1       | 1        | 0       |
| `tests/ui/library/browse-filter.spec.ts`    | 0 (NEW) | 3        | +3      |
| `tests/ui/library/search.spec.ts`           | 1       | 3        | +2      |
| `tests/ui/library/deep-links.spec.ts`       | 3       | 4        | +1      |
| `tests/ui/library/photo-edit.spec.ts`       | 0 (NEW) | 3        | +3      |
| `tests/ui/admin/album-crud.spec.ts`         | 2       | 5        | +3      |
| `tests/ui/sharing/share-link.spec.ts`       | 1       | 3        | +2      |
| `tests/ui/accessibility/a11y-smoke.spec.ts` | 6       | 6        | 0       |
| `tests/api/api-checks.spec.ts`              | 3       | 5        | +2      |
| `tests/api/webdav.spec.ts`                  | 1       | 1        | 0       |
| **TOTAL**                                   | **24**  | **52**   | **+28** |