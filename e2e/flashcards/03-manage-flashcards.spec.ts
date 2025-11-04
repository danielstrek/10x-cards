import { test, expect } from "../fixtures/auth.fixture";
import { FlashcardsPage } from "../pages/FlashcardsPage";
import { GeneratePage } from "../pages/GeneratePage";
import { generateFlashcardData, generateSampleText, generateInvalidFlashcard } from "../helpers/test-data.helper";

/**
 * E2E Tests for Scenario 3: Managing Flashcards
 *
 * Test Cases:
 * - TC-FLASH-001: View empty flashcards list
 * - TC-FLASH-002: Create flashcard manually
 * - TC-FLASH-003: View flashcards list
 * - TC-FLASH-004: Edit existing flashcard
 * - TC-FLASH-005: Delete flashcard
 * - TC-FLASH-006: Validate flashcard field lengths
 * - TC-FLASH-007: Create multiple flashcards
 * - TC-FLASH-008: Cancel flashcard creation
 */

test.describe("Scenario 3: Managing Flashcards", () => {
  test("TC-FLASH-001: Should show empty state when no flashcards exist", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);

    await flashcardsPage.navigate();
    await flashcardsPage.waitForFlashcardsToLoad();

    // Check if empty state is shown
    const isEmptyStateShown = await flashcardsPage.isEmptyStateShown();

    // If no flashcards, should show empty state
    const count = await flashcardsPage.getFlashcardsCount();
    if (count === 0) {
      expect(isEmptyStateShown).toBe(true);
    }
  });

  test("TC-FLASH-002: Should create a flashcard manually", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);
    const flashcardData = generateFlashcardData();

    await flashcardsPage.navigate();
    await flashcardsPage.waitForFlashcardsToLoad();

    const initialCount = await flashcardsPage.getFlashcardsCount();

    // Create a new flashcard
    await flashcardsPage.createFlashcard(flashcardData.front, flashcardData.back);

    // Wait for flashcard to be added
    await authenticatedPage.waitForTimeout(1000);

    // Verify flashcard was added
    const newCount = await flashcardsPage.getFlashcardsCount();
    expect(newCount).toBe(initialCount + 1);

    // Verify the flashcard is visible in the list
    const isEmptyStateShown = await flashcardsPage.isEmptyStateShown();
    expect(isEmptyStateShown).toBe(false);
  });

  test("TC-FLASH-003: Should display list of flashcards", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);
    const generatePage = new GeneratePage(authenticatedPage);

    // First, generate and save some flashcards
    await generatePage.navigate();
    const sampleText = generateSampleText(3000);
    await generatePage.generateFlashcards(sampleText);

    // Save all generated flashcards
    await generatePage.clickSaveAll();
    await generatePage.waitForSuccessDialog();
    await generatePage.closeSuccessDialog();

    // Navigate to flashcards page
    await flashcardsPage.navigate();
    await flashcardsPage.waitForFlashcardsToLoad();

    // Verify flashcards are displayed
    const count = await flashcardsPage.getFlashcardsCount();
    expect(count).toBeGreaterThan(0);

    // Verify total count is displayed
    const totalCount = await flashcardsPage.getTotalCount();
    expect(totalCount).toBeGreaterThan(0);
  });

  test("TC-FLASH-004: Should edit an existing flashcard", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);

    // First, create a flashcard
    const originalData = generateFlashcardData();
    await flashcardsPage.navigate();
    await flashcardsPage.createFlashcard(originalData.front, originalData.back);
    await authenticatedPage.waitForTimeout(1000);

    // Now edit it
    const newFront = "Updated Question?";
    const newBack = "Updated Answer!";

    await flashcardsPage.editFlashcard(0, newFront, newBack);

    // Wait for save to complete
    await authenticatedPage.waitForTimeout(1000);

    // Verify flashcard was updated
    const updatedContent = await flashcardsPage.getFlashcardContent(0);
    expect(updatedContent?.front).toContain("Updated");
    expect(updatedContent?.back).toContain("Updated");
  });

  test("TC-FLASH-005: Should delete a flashcard", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);

    // First, create a flashcard
    const flashcardData = generateFlashcardData();
    await flashcardsPage.navigate();
    await flashcardsPage.createFlashcard(flashcardData.front, flashcardData.back);
    await authenticatedPage.waitForTimeout(1000);

    const initialCount = await flashcardsPage.getFlashcardsCount();
    expect(initialCount).toBeGreaterThan(0);

    // Delete the flashcard
    await flashcardsPage.deleteFlashcard(0);

    // Wait for deletion to complete
    await authenticatedPage.waitForTimeout(1000);

    // Verify flashcard was deleted
    const newCount = await flashcardsPage.getFlashcardsCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test("TC-FLASH-006: Should validate flashcard field lengths", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);
    const invalidData = generateInvalidFlashcard();

    await flashcardsPage.navigate();
    await flashcardsPage.clickAddButton();
    await flashcardsPage.waitForAddDialog();

    // Try to create flashcard with invalid data
    await flashcardsPage.fillAddFlashcardForm(invalidData.front, invalidData.back);

    // Try to submit
    await flashcardsPage.submitAddFlashcard();

    // Wait for validation
    await authenticatedPage.waitForTimeout(500);

    // Verify validation error is shown or dialog is still open
    const hasError = await flashcardsPage.hasAddDialogError();
    const isDialogOpen = await flashcardsPage.addFlashcardDialog.isVisible();

    // Either error is shown or dialog remains open (validation failed)
    expect(hasError || isDialogOpen).toBe(true);
  });

  test("TC-FLASH-007: Should create multiple flashcards in sequence", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);

    await flashcardsPage.navigate();
    await flashcardsPage.waitForFlashcardsToLoad();

    const initialCount = await flashcardsPage.getFlashcardsCount();

    // Create 3 flashcards
    for (let i = 0; i < 3; i++) {
      const flashcardData = generateFlashcardData();
      await flashcardsPage.createFlashcard(`${flashcardData.front} (${i + 1})`, `${flashcardData.back} (${i + 1})`);
      await authenticatedPage.waitForTimeout(500);
    }

    // Verify all flashcards were created
    const finalCount = await flashcardsPage.getFlashcardsCount();
    expect(finalCount).toBe(initialCount + 3);
  });

  test("TC-FLASH-008: Should cancel flashcard creation", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);
    const flashcardData = generateFlashcardData();

    await flashcardsPage.navigate();
    await flashcardsPage.waitForFlashcardsToLoad();

    const initialCount = await flashcardsPage.getFlashcardsCount();

    // Open add dialog
    await flashcardsPage.clickAddButton();
    await flashcardsPage.waitForAddDialog();

    // Fill form
    await flashcardsPage.fillAddFlashcardForm(flashcardData.front, flashcardData.back);

    // Cancel
    await flashcardsPage.cancelAddFlashcard();

    // Wait for dialog to close
    await authenticatedPage.waitForTimeout(500);

    // Verify dialog is closed
    const isDialogVisible = await flashcardsPage.addFlashcardDialog.isVisible();
    expect(isDialogVisible).toBe(false);

    // Verify count didn't change
    const finalCount = await flashcardsPage.getFlashcardsCount();
    expect(finalCount).toBe(initialCount);
  });

  test("TC-FLASH-009: Should show correct total count after operations", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);

    await flashcardsPage.navigate();
    await flashcardsPage.waitForFlashcardsToLoad();

    // Create a flashcard
    const flashcardData = generateFlashcardData();
    await flashcardsPage.createFlashcard(flashcardData.front, flashcardData.back);
    await authenticatedPage.waitForTimeout(1000);

    // Get counts
    const cardCount = await flashcardsPage.getFlashcardsCount();
    const totalCount = await flashcardsPage.getTotalCount();

    // Total count should match card count (or be close if there are multiple pages)
    expect(totalCount).toBeGreaterThanOrEqual(cardCount);
  });

  test("TC-FLASH-010: Should handle empty fields validation", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);

    await flashcardsPage.navigate();
    await flashcardsPage.clickAddButton();
    await flashcardsPage.waitForAddDialog();

    // Try to submit with empty fields
    await flashcardsPage.submitAddFlashcard();

    // Wait for validation
    await authenticatedPage.waitForTimeout(500);

    // Dialog should still be open (validation failed)
    const isDialogOpen = await flashcardsPage.addFlashcardDialog.isVisible();
    expect(isDialogOpen).toBe(true);

    // Should show error or prevent submission
    const hasError = await flashcardsPage.hasAddDialogError();
    const createButton = flashcardsPage.addFlashcardCreateButton;
    const isButtonDisabled = await createButton.isDisabled();

    expect(hasError || isButtonDisabled).toBe(true);
  });

  test("TC-FLASH-011: Should persist flashcards after page reload", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);
    const flashcardData = generateFlashcardData();

    await flashcardsPage.navigate();

    // Create a flashcard
    await flashcardsPage.createFlashcard(flashcardData.front, flashcardData.back);
    await authenticatedPage.waitForTimeout(1000);

    const countBeforeReload = await flashcardsPage.getFlashcardsCount();
    expect(countBeforeReload).toBeGreaterThan(0);

    // Reload page
    await authenticatedPage.reload();
    await flashcardsPage.waitForFlashcardsToLoad();

    // Verify flashcard is still there
    const countAfterReload = await flashcardsPage.getFlashcardsCount();
    expect(countAfterReload).toBe(countBeforeReload);
  });

  test("TC-FLASH-012: Should allow editing flashcard content multiple times", async ({ authenticatedPage }) => {
    const flashcardsPage = new FlashcardsPage(authenticatedPage);
    const originalData = generateFlashcardData();

    await flashcardsPage.navigate();

    // Create a flashcard
    await flashcardsPage.createFlashcard(originalData.front, originalData.back);
    await authenticatedPage.waitForTimeout(1000);

    // First edit
    await flashcardsPage.editFlashcard(0, "Edit 1 Front", "Edit 1 Back");
    await authenticatedPage.waitForTimeout(500);

    // Second edit
    await flashcardsPage.editFlashcard(0, "Edit 2 Front", "Edit 2 Back");
    await authenticatedPage.waitForTimeout(500);

    // Verify latest edit is saved
    const finalContent = await flashcardsPage.getFlashcardContent(0);
    expect(finalContent?.front).toContain("Edit 2");
    expect(finalContent?.back).toContain("Edit 2");
  });
});
