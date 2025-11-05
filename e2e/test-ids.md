# Test IDs Reference

This document lists all `data-test-id` attributes added to components for E2E testing.

## Authentication Flow

### RegisterForm Component (`src/components/auth/RegisterForm.tsx`)

| Test ID                            | Element     | Description                               |
| ---------------------------------- | ----------- | ----------------------------------------- |
| `register-email-input`             | Input field | Email input field                         |
| `register-password-input`          | Input field | Password input field                      |
| `register-password-toggle`         | Button      | Toggle password visibility button         |
| `register-confirm-password-input`  | Input field | Confirm password input field              |
| `register-confirm-password-toggle` | Button      | Toggle confirm password visibility button |
| `register-submit-button`           | Button      | Register submit button                    |
| `register-error-notification`      | Div wrapper | Error notification container              |
| `register-login-link`              | Link        | "Already have an account? Login" link     |

### LoginForm Component (`src/components/auth/LoginForm.tsx`)

| Test ID                      | Element     | Description                       |
| ---------------------------- | ----------- | --------------------------------- |
| `login-email-input`          | Input field | Email input field                 |
| `login-password-input`       | Input field | Password input field              |
| `login-password-toggle`      | Button      | Toggle password visibility button |
| `login-remember-me-checkbox` | Checkbox    | "Remember me" checkbox            |
| `login-submit-button`        | Button      | Login submit button               |
| `login-error-notification`   | Div wrapper | Error notification container      |
| `login-forgot-password-link` | Link        | "Forgot password?" link           |
| `login-register-link`        | Link        | "Register" link                   |

## Flashcard Generation Flow

### TextInputArea Component (`src/components/TextInputArea.tsx`)

| Test ID                      | Element  | Description                         |
| ---------------------------- | -------- | ----------------------------------- |
| `generate-source-text-input` | Textarea | Main text input for source material |

### GenerateButton Component (`src/components/GenerateButton.tsx`)

| Test ID                      | Element | Description                            |
| ---------------------------- | ------- | -------------------------------------- |
| `generate-flashcards-button` | Button  | Button to trigger flashcard generation |

### FlashcardGenerationView Component (`src/components/FlashcardGenerationView.tsx`)

| Test ID                            | Element     | Description                                |
| ---------------------------------- | ----------- | ------------------------------------------ |
| `generate-error-notification`      | Div wrapper | Generation error notification container    |
| `generate-save-error-notification` | Div wrapper | Save error notification container          |
| `generate-loading-indicator`       | Div         | Loading state indicator during generation  |
| `generate-flashcards-results`      | Div         | Container for generated flashcards results |
| `generate-flashcards-count`        | H2          | Heading showing total flashcard count      |
| `generate-accepted-count`          | Div         | Counter showing accepted flashcards        |

### FlashcardList Component (`src/components/FlashcardList.tsx`)

| Test ID          | Element | Description                          |
| ---------------- | ------- | ------------------------------------ |
| `flashcard-list` | Div     | Container for the list of flashcards |

### FlashcardListItem Component (`src/components/FlashcardListItem.tsx`)

| Test ID                        | Element  | Description                            |
| ------------------------------ | -------- | -------------------------------------- |
| `flashcard-item`               | Card     | Individual flashcard card              |
| `flashcard-accept-button`      | Button   | Accept flashcard button                |
| `flashcard-edit-button`        | Button   | Edit flashcard button                  |
| `flashcard-reject-button`      | Button   | Reject/remove flashcard button         |
| `flashcard-edit-front-input`   | Input    | Front side edit input (in edit mode)   |
| `flashcard-edit-back-input`    | Textarea | Back side edit textarea (in edit mode) |
| `flashcard-save-edit-button`   | Button   | Save changes button (in edit mode)     |
| `flashcard-cancel-edit-button` | Button   | Cancel edit button (in edit mode)      |

### BulkSaveButton Component (`src/components/BulkSaveButton.tsx`)

| Test ID                | Element | Description                          |
| ---------------------- | ------- | ------------------------------------ |
| `save-accepted-button` | Button  | Save only accepted flashcards button |
| `save-all-button`      | Button  | Save all flashcards button           |

### SuccessDialog Component (`src/components/SuccessDialog.tsx`)

| Test ID                          | Element        | Description                            |
| -------------------------------- | -------------- | -------------------------------------- |
| `success-dialog`                 | Dialog content | Success dialog after saving flashcards |
| `success-dialog-continue-button` | Button         | Continue button in success dialog      |

## My Flashcards Flow

### FlashcardsView Component (`src/components/FlashcardsView.tsx`)

| Test ID                          | Element     | Description                                 |
| -------------------------------- | ----------- | ------------------------------------------- |
| `flashcards-total-count`         | Paragraph   | Total flashcards count display              |
| `flashcards-add-button`          | Button      | Add new flashcard button (header)           |
| `flashcards-error-notification`  | Div wrapper | Error notification container                |
| `flashcards-loading-indicator`   | Div wrapper | Loading state indicator                     |
| `flashcards-empty-state`         | Div         | Empty state container when no flashcards    |
| `flashcards-empty-create-button` | Button      | Create first flashcard button (empty state) |
| `flashcards-list`                | Div         | Container for flashcards list               |

### FlashcardItem Component (`src/components/FlashcardItem.tsx`)

| Test ID                           | Element  | Description                            |
| --------------------------------- | -------- | -------------------------------------- |
| `flashcard-card`                  | Card     | Individual flashcard card container    |
| `flashcard-card-edit-button`      | Button   | Edit flashcard button (display mode)   |
| `flashcard-card-delete-button`    | Button   | Delete flashcard button (display mode) |
| `flashcard-card-edit-front-input` | Textarea | Front side edit input (edit mode)      |
| `flashcard-card-edit-back-input`  | Textarea | Back side edit input (edit mode)       |
| `flashcard-card-save-button`      | Button   | Save changes button (edit mode)        |
| `flashcard-card-cancel-button`    | Button   | Cancel edit button (edit mode)         |

### AddFlashcardDialog Component (`src/components/AddFlashcardDialog.tsx`)

| Test ID                       | Element        | Description                        |
| ----------------------------- | -------------- | ---------------------------------- |
| `add-flashcard-dialog`        | Dialog content | Add flashcard dialog container     |
| `add-flashcard-front-input`   | Textarea       | Front side input for new flashcard |
| `add-flashcard-back-input`    | Textarea       | Back side input for new flashcard  |
| `add-flashcard-error`         | Paragraph      | Validation error message           |
| `add-flashcard-cancel-button` | Button         | Cancel button in dialog            |
| `add-flashcard-create-button` | Button         | Create flashcard button in dialog  |

## Study Flow

### StudyView Component (`src/components/StudyView.tsx`)

| Test ID                      | Element     | Description                           |
| ---------------------------- | ----------- | ------------------------------------- |
| `study-statistics`           | Div         | Statistics container                  |
| `study-due-count`            | Strong      | Due flashcards count                  |
| `study-reviewed-today-count` | Strong      | Reviewed today count                  |
| `study-total-count`          | Strong      | Total flashcards count                |
| `study-progress-text`        | Paragraph   | Progress text (e.g., "Fiszka 1 z 10") |
| `study-progress-bar`         | Div         | Progress bar visual indicator         |
| `study-error-notification`   | Div wrapper | Error notification container          |
| `study-loading-indicator`    | Div wrapper | Loading state indicator               |
| `study-empty-state`          | Div         | Empty state when no cards to review   |
| `study-refresh-button`       | Button      | Refresh button in empty state         |
| `study-session-complete`     | Div         | Session complete message container    |
| `study-restart-button`       | Button      | Restart session button                |

### FlashcardStudyCard Component (`src/components/FlashcardStudyCard.tsx`)

| Test ID                    | Element | Description                                      |
| -------------------------- | ------- | ------------------------------------------------ |
| `study-flashcard-card`     | Card    | Study flashcard card container                   |
| `study-flashcard-front`    | Div     | Front side of flashcard (question)               |
| `study-flashcard-back`     | Div     | Back side of flashcard (answer)                  |
| `study-show-answer-button` | Button  | Show answer button                               |
| `study-rating-buttons`     | Div     | Rating buttons container                         |
| `study-rate-again-button`  | Button  | Rate as "Again" button                           |
| `study-rate-hard-button`   | Button  | Rate as "Hard" button                            |
| `study-rate-good-button`   | Button  | Rate as "Good" button                            |
| `study-rate-easy-button`   | Button  | Rate as "Easy" button                            |
| `study-flashcard-metadata` | Div     | Flashcard metadata (repetitions, interval, etc.) |

## Usage in Tests

Example usage in Playwright tests:

```typescript
// Login flow
await page.getByTestId("login-email-input").fill("user@example.com");
await page.getByTestId("login-password-input").fill("password123");
await page.getByTestId("login-submit-button").click();

// Generate flashcards flow
await page.getByTestId("generate-source-text-input").fill("Your study material here...");
await page.getByTestId("generate-flashcards-button").click();
await page.getByTestId("generate-loading-indicator").waitFor({ state: "hidden" });

// Interact with generated flashcards
const flashcardItems = page.getByTestId("flashcard-item");
await flashcardItems.first().getByTestId("flashcard-accept-button").click();

// Save flashcards
await page.getByTestId("save-accepted-button").click();
await page.getByTestId("success-dialog").waitFor({ state: "visible" });
await page.getByTestId("success-dialog-continue-button").click();

// My flashcards - View and manage
await page.goto("/flashcards");
await page.getByTestId("flashcards-add-button").click();
await page.getByTestId("add-flashcard-dialog").waitFor({ state: "visible" });
await page.getByTestId("add-flashcard-front-input").fill("Question?");
await page.getByTestId("add-flashcard-back-input").fill("Answer!");
await page.getByTestId("add-flashcard-create-button").click();

// Edit existing flashcard
const flashcardCards = page.getByTestId("flashcard-card");
await flashcardCards.first().getByTestId("flashcard-card-edit-button").click();
await page.getByTestId("flashcard-card-edit-front-input").fill("Updated question?");
await page.getByTestId("flashcard-card-save-button").click();

// Study session
await page.goto("/study");
await page.getByTestId("study-statistics").waitFor({ state: "visible" });
const dueCount = await page.getByTestId("study-due-count").textContent();

// Review flashcard
await page.getByTestId("study-flashcard-card").waitFor({ state: "visible" });
await page.getByTestId("study-show-answer-button").click();
await page.getByTestId("study-flashcard-back").waitFor({ state: "visible" });
await page.getByTestId("study-rate-good-button").click();
```

## Notes

- All test IDs follow the pattern: `{context}-{element}-{type}`
- Context can be: `login`, `generate`, `flashcard`, `save`, `success`, `study`, `add-flashcard`
- Type describes the element: `input`, `button`, `checkbox`, `link`, `dialog`, `card`, `count`, etc.
- Test IDs are stable and should not change unless the component structure significantly changes
- For dynamic lists (flashcards), use `getByTestId()` to get all items and then select specific ones with `.first()`, `.nth()`, etc.
