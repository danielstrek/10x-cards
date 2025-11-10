# Manual Testing Guide for Generate View

This document provides a comprehensive manual testing guide for the flashcard generation view.

## Prerequisites

1. Ensure the application is running: `npm run dev`
2. Have a valid auth token in localStorage (key: `auth_token`)
3. Ensure OPENROUTER_API_KEY is configured in environment variables

## Test Scenarios

### 1. Text Input Validation

#### Test 1.1: Empty Input

- **Action**: Navigate to `/generate`
- **Expected**:
  - Character counter shows "0 / 1,000-10,000 characters"
  - Generate button is disabled
  - No error messages displayed

#### Test 1.2: Text Too Short

- **Action**: Enter 500 characters
- **Expected**:
  - Counter shows orange color
  - Message: "Text is too short. Need at least X more characters."
  - Generate button is disabled

#### Test 1.3: Valid Text Length

- **Action**: Enter between 1000-10000 characters
- **Expected**:
  - Counter shows green color
  - No error messages
  - Generate button is enabled

#### Test 1.4: Text Too Long

- **Action**: Enter 10500 characters
- **Expected**:
  - Counter shows red/destructive color
  - Message: "Text is too long. Please remove X characters."
  - Generate button is disabled

### 2. Flashcard Generation

#### Test 2.1: Successful Generation

- **Action**:
  1. Enter valid text (1000+ characters)
  2. Click "Generate Flashcards"
- **Expected**:
  - Button shows spinner and "Generating..." text
  - Input and button are disabled
  - Skeleton loaders appear (5 cards)
  - After completion, flashcards list appears
  - Each card shows front/back content
  - Each card has Accept, Edit, Reject buttons

#### Test 2.2: Generation Error - No Auth

- **Action**:
  1. Remove auth token from localStorage
  2. Try to generate flashcards
- **Expected**:
  - Error notification: "Not authenticated. Please log in first."
  - No flashcards displayed

#### Test 2.3: Generation Error - API Failure

- **Action**: Disconnect internet or use invalid API key
- **Expected**:
  - Error notification with appropriate message
  - No flashcards displayed
  - User can try again

### 3. Flashcard Actions

#### Test 3.1: Accept Flashcard

- **Action**: Click "Accept" button on a flashcard
- **Expected**:
  - Card border turns green
  - Card background becomes light green
  - "Accepted" badge appears with checkmark icon
  - Accept button becomes disabled and shows "Accepted"
  - Accepted counter in header increases by 1

#### Test 3.2: Edit Flashcard

- **Action**:
  1. Click "Edit" button on a flashcard
  2. Modify front and back text
  3. Click "Save Changes"
- **Expected**:
  - Edit mode activates with Input and Textarea
  - Character counters appear (200 for front, 500 for back)
  - Save Changes and Cancel buttons replace action buttons
  - After saving: "Edited" badge appears with blue border
  - Edit mode closes

#### Test 3.3: Edit Validation - Front Too Long

- **Action**:
  1. Enter edit mode
  2. Enter 250 characters in front field
- **Expected**:
  - Input border turns red
  - Character counter shows red text: "250 / 200"
  - Save button is disabled

#### Test 3.4: Edit Validation - Back Too Long

- **Action**:
  1. Enter edit mode
  2. Enter 600 characters in back field
- **Expected**:
  - Textarea border turns red
  - Character counter shows red text: "600 / 500"
  - Save button is disabled

#### Test 3.5: Cancel Edit

- **Action**:
  1. Enter edit mode
  2. Make changes
  3. Click "Cancel"
- **Expected**:
  - Changes are discarded
  - Original content is restored
  - Edit mode closes

#### Test 3.6: Reject Flashcard

- **Action**: Click "Reject" button
- **Expected**:
  - Card is immediately removed from the list
  - Total count in header decreases by 1

### 4. Bulk Save Operations

#### Test 4.1: Save Accepted Flashcards - None Accepted

- **Action**: Click "Save Accepted" without accepting any cards
- **Expected**:
  - Button is disabled
  - Shows "(0)" in button text

#### Test 4.2: Save Accepted Flashcards - Success

- **Action**:
  1. Accept 3 flashcards
  2. Click "Save Accepted (3)"
- **Expected**:
  - Button shows spinner and "Saving..."
  - Both save buttons are disabled during save
  - Success dialog appears with "3 flashcards have been saved"
  - After closing dialog: form resets, flashcards cleared

#### Test 4.3: Save All Flashcards

- **Action**:
  1. Have 5 generated flashcards (some accepted, some not)
  2. Click "Save All (5)"
- **Expected**:
  - All 5 flashcards are saved
  - Success dialog shows correct count
  - Form resets after closing dialog

#### Test 4.4: Save Error - No Generation ID

- **Action**: Manipulate state to have flashcards without generationId
- **Expected**:
  - Error is logged to console
  - Save operation doesn't proceed

#### Test 4.5: Save Error - API Failure

- **Action**:
  1. Accept flashcards
  2. Remove auth token
  3. Try to save
- **Expected**:
  - Error notification appears: "Not authenticated. Please log in first."
  - Success dialog does not appear
  - Flashcards remain in the list

### 5. UI/UX Tests

#### Test 5.1: Responsive Design - Mobile

- **Action**: Resize browser to mobile width (375px)
- **Expected**:
  - All elements stack vertically
  - Buttons are full width on mobile
  - Text is readable
  - No horizontal scrolling

#### Test 5.2: Responsive Design - Tablet

- **Action**: Resize browser to tablet width (768px)
- **Expected**:
  - Layout adapts appropriately
  - Buttons can be side by side if space permits
  - Cards display in single column

#### Test 5.3: Responsive Design - Desktop

- **Action**: View on desktop (1280px+)
- **Expected**:
  - Content is centered with max-width
  - All spacing is comfortable
  - Cards display properly

#### Test 5.4: Dark Mode

- **Action**: Toggle system dark mode
- **Expected**:
  - All colors adapt to dark theme
  - Text remains readable
  - Contrast is sufficient
  - Green/blue/red states are visible

### 6. Accessibility Tests

#### Test 6.1: Keyboard Navigation

- **Action**: Navigate using Tab key only
- **Expected**:
  - Can reach all interactive elements
  - Focus indicators are visible
  - Tab order is logical
  - Can activate buttons with Enter/Space

#### Test 6.2: Screen Reader

- **Action**: Use screen reader (NVDA, JAWS, VoiceOver)
- **Expected**:
  - All form labels are announced
  - Button purposes are clear
  - Loading states are announced (aria-busy, aria-live)
  - Character counts are announced
  - Error messages are announced

#### Test 6.3: Error Messages

- **Action**: Trigger various errors
- **Expected**:
  - Errors have appropriate ARIA attributes
  - Error icons have aria-hidden
  - Error text is associated with form fields

### 7. Edge Cases

#### Test 7.1: Rapid Generation Clicks

- **Action**: Click Generate button multiple times rapidly
- **Expected**:
  - Only one request is made
  - Button is disabled after first click
  - No duplicate flashcards

#### Test 7.2: Edit Multiple Cards

- **Action**:
  1. Edit card A
  2. Without saving, try to edit card B
- **Expected**:
  - Each card maintains its own edit state
  - Can have multiple cards in edit mode simultaneously

#### Test 7.3: Accept Then Edit

- **Action**:
  1. Accept a flashcard
  2. Edit the same flashcard
  3. Save changes
- **Expected**:
  - Card shows both "Accepted" status
  - Source changes to "ai-edited"
  - Blue border for edited state

#### Test 7.4: Reject All Cards

- **Action**: Reject all generated flashcards one by one
- **Expected**:
  - List becomes empty
  - Bulk save buttons are disabled
  - No errors occur

#### Test 7.5: Unicode and Special Characters

- **Action**:
  1. Use text with emojis, special characters, math symbols
  2. Generate flashcards
  3. Edit with special characters
- **Expected**:
  - All characters are preserved
  - Character counting is accurate
  - Saving works correctly

## Success Criteria

- All validation works as expected
- All error states are handled gracefully
- All user actions have appropriate feedback
- No console errors occur during normal operation
- Responsive design works on all screen sizes
- Accessibility standards are met
- Data is correctly saved to the backend

## Known Issues / Future Improvements

- [ ] Auth token management should use proper auth context instead of localStorage
- [ ] Add optimistic UI updates for faster perceived performance
- [ ] Add undo functionality for rejected cards
- [ ] Add ability to regenerate specific flashcards
- [ ] Add preview mode before saving
- [ ] Add ability to save draft and return later
