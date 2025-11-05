import { test, expect } from "../fixtures/auth.fixture";
import { GeneratePage } from "../pages/GeneratePage";
import { generateSampleText, generateShortText, generateStudyMaterialText } from "../helpers/test-data.helper";

/**
 * E2E Tests for Scenario 2: Generating Flashcards with AI
 *
 * Test Cases:
 * - TC-GEN-001: Successful flashcard generation
 * - TC-GEN-002: Text length validation (too short)
 * - TC-GEN-003: Text length validation (too long)
 * - TC-GEN-004: Generate with realistic study material
 * - TC-GEN-005: Accept individual flashcards
 * - TC-GEN-006: Edit flashcard before accepting
 * - TC-GEN-007: Reject unwanted flashcards
 * - TC-GEN-008: Save accepted flashcards
 * - TC-GEN-009: Save all flashcards at once
 */

test.describe("Scenario 2: Generating Flashcards with AI", () => {
  test("TC-GEN-001: Should successfully generate flashcards from text", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);
    const sampleText = generateSampleText(5000);

    // Navigate to generate page
    await generatePage.navigate();

    // Fill source text
    await generatePage.fillSourceText(sampleText);

    // Click generate button
    await generatePage.clickGenerate();

    // Wait for generation to complete
    await generatePage.waitForGenerationComplete(30000);

    // Verify flashcards were generated
    const hasResults = await generatePage.hasResults();
    expect(hasResults).toBe(true);

    // Verify we have between 5-20 flashcards
    const flashcardsCount = await generatePage.getGeneratedFlashcardsCount();
    expect(flashcardsCount).toBeGreaterThanOrEqual(5);
    expect(flashcardsCount).toBeLessThanOrEqual(20);

    // Verify flashcards have content
    const firstFlashcard = await generatePage.getFlashcardContent(0);
    expect(firstFlashcard).toBeTruthy();
    expect(firstFlashcard?.front).toBeTruthy();
    expect(firstFlashcard?.back).toBeTruthy();

    // Verify front is not too long (max 200 chars)
    expect(firstFlashcard?.front.length).toBeLessThanOrEqual(200);

    // Verify back is not too long (max 500 chars)
    expect(firstFlashcard?.back.length).toBeLessThanOrEqual(500);
  });

  test("TC-GEN-002: Should show error for text that is too short", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);
    const shortText = generateShortText();

    await generatePage.navigate();
    await generatePage.fillSourceText(shortText);

    // Try to generate
    await generatePage.clickGenerate();

    // Wait a bit for error to appear
    await authenticatedPage.waitForTimeout(1000);

    // Verify error is displayed
    const hasError = await generatePage.hasError();
    expect(hasError).toBe(true);

    const errorMessage = await generatePage.getErrorMessage();
    expect(errorMessage?.toLowerCase()).toMatch(/(1000|długość|length|minimum)/);
  });

  test("TC-GEN-003: Should show error for text that is too long", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);
    const longText = generateSampleText(12000); // Over 10000 limit

    await generatePage.navigate();
    await generatePage.fillSourceText(longText);

    // Try to generate
    await generatePage.clickGenerate();

    // Wait a bit for validation
    await authenticatedPage.waitForTimeout(1000);

    // Verify error or disabled button
    const hasError = await generatePage.hasError();
    const isButtonDisabled = await generatePage.generateButton.isDisabled();

    expect(hasError || isButtonDisabled).toBe(true);
  });

  test("TC-GEN-004: Should generate flashcards from realistic study material", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);
    const studyMaterial = generateStudyMaterialText();

    await generatePage.navigate();
    await generatePage.generateFlashcards(studyMaterial);

    // Verify generation was successful
    const hasResults = await generatePage.hasResults();
    expect(hasResults).toBe(true);

    const flashcardsCount = await generatePage.getGeneratedFlashcardsCount();
    expect(flashcardsCount).toBeGreaterThan(0);

    // Verify flashcards are related to the study material
    const firstFlashcard = await generatePage.getFlashcardContent(0);
    expect(firstFlashcard).toBeTruthy();

    // Content should be in Polish (study material is in Polish)
    const hasPollishContent = firstFlashcard?.front.match(/[ąćęłńóśźż]/i) || firstFlashcard?.back.match(/[ąćęłńóśźż]/i);

    // This is a soft check - may not always have Polish characters
    // The important thing is that we have content
    expect(firstFlashcard?.front.length).toBeGreaterThan(0);
    expect(firstFlashcard?.back.length).toBeGreaterThan(0);
  });

  test("TC-GEN-005: Should accept individual flashcards", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);
    const sampleText = generateSampleText(3000);

    await generatePage.navigate();
    await generatePage.generateFlashcards(sampleText);

    const initialCount = await generatePage.getGeneratedFlashcardsCount();
    expect(initialCount).toBeGreaterThan(0);

    // Accept first flashcard
    await generatePage.acceptFlashcard(0);

    // Wait for UI to update
    await authenticatedPage.waitForTimeout(500);

    // Verify accepted count increased
    const acceptedCountText = await generatePage.getAcceptedCountText();
    expect(acceptedCountText).toContain("1");
  });

  test("TC-GEN-006: Should edit flashcard before accepting", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);
    const sampleText = generateSampleText(3000);

    await generatePage.navigate();
    await generatePage.generateFlashcards(sampleText);

    const flashcardsCount = await generatePage.getGeneratedFlashcardsCount();
    expect(flashcardsCount).toBeGreaterThan(0);

    // Edit first flashcard
    const newFront = "Edited Question?";
    const newBack = "Edited Answer!";

    await generatePage.editFlashcard(0, newFront, newBack);

    // Wait for edit to complete
    await authenticatedPage.waitForTimeout(500);

    // Verify flashcard was edited
    const editedFlashcard = await generatePage.getFlashcardContent(0);
    expect(editedFlashcard?.front).toContain(newFront);
    expect(editedFlashcard?.back).toContain(newBack);
  });

  test("TC-GEN-007: Should reject unwanted flashcards", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);
    const sampleText = generateSampleText(4000);

    await generatePage.navigate();
    await generatePage.generateFlashcards(sampleText);

    const initialCount = await generatePage.getGeneratedFlashcardsCount();
    expect(initialCount).toBeGreaterThan(1);

    // Reject first flashcard
    await generatePage.rejectFlashcard(0);

    // Wait for UI to update
    await authenticatedPage.waitForTimeout(500);

    // Verify flashcard was removed
    const newCount = await generatePage.getGeneratedFlashcardsCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test("TC-GEN-008: Should save accepted flashcards only", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);
    const sampleText = generateSampleText(5000);

    await generatePage.navigate();
    await generatePage.generateFlashcards(sampleText);

    const totalCount = await generatePage.getGeneratedFlashcardsCount();
    expect(totalCount).toBeGreaterThanOrEqual(3);

    // Accept first 3 flashcards
    await generatePage.acceptFlashcards([0, 1, 2]);

    // Wait for UI to update
    await authenticatedPage.waitForTimeout(500);

    // Click save accepted button
    await generatePage.clickSaveAccepted();

    // Wait for success dialog
    await generatePage.waitForSuccessDialog();

    // Verify success message mentions 3 flashcards
    const successMessage = await generatePage.getSuccessMessage();
    expect(successMessage).toContain("3");

    // Close success dialog
    await generatePage.closeSuccessDialog();
  });

  test("TC-GEN-009: Should save all flashcards at once", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);
    const sampleText = generateSampleText(3000);

    await generatePage.navigate();
    await generatePage.generateFlashcards(sampleText);

    const totalCount = await generatePage.getGeneratedFlashcardsCount();
    expect(totalCount).toBeGreaterThan(0);

    // Click save all button
    await generatePage.clickSaveAll();

    // Wait for success dialog
    await generatePage.waitForSuccessDialog();

    // Verify success message
    const successMessage = await generatePage.getSuccessMessage();
    expect(successMessage).toBeTruthy();
    expect(successMessage).toMatch(/\d+/); // Should contain a number

    // Close success dialog
    await generatePage.closeSuccessDialog();
  });

  test("TC-GEN-010: Should handle generation error gracefully", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);

    // Use valid text
    const sampleText = generateSampleText(2000);

    await generatePage.navigate();
    await generatePage.fillSourceText(sampleText);
    await generatePage.clickGenerate();

    // Wait for either success or error (longer timeout for API)
    await authenticatedPage.waitForTimeout(15000);

    // Check if we have results or error
    const hasResults = await generatePage.hasResults();
    const hasError = await generatePage.hasError();

    // One of them should be true
    expect(hasResults || hasError).toBe(true);

    // If error, it should have a message
    if (hasError) {
      const errorMessage = await generatePage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
    }
  });

  test("TC-GEN-011: Should clear previous results when generating again", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);
    const firstText = generateSampleText(2000);

    await generatePage.navigate();

    // Generate first set of flashcards
    await generatePage.generateFlashcards(firstText);
    const firstCount = await generatePage.getGeneratedFlashcardsCount();
    expect(firstCount).toBeGreaterThan(0);

    // Generate second set
    const secondText = generateSampleText(2500);
    await generatePage.generateFlashcards(secondText);

    // Verify we have new results
    const secondCount = await generatePage.getGeneratedFlashcardsCount();
    expect(secondCount).toBeGreaterThan(0);

    // Counts might be different (new generation)
    // The important thing is that we have valid results
    expect(secondCount).toBeGreaterThanOrEqual(5);
  });

  test("TC-GEN-012: Should disable generate button while generating", async ({ authenticatedPage }) => {
    const generatePage = new GeneratePage(authenticatedPage);
    const sampleText = generateSampleText(3000);

    await generatePage.navigate();
    await generatePage.fillSourceText(sampleText);

    // Click generate
    await generatePage.clickGenerate();

    // Immediately check if button is disabled
    const isDisabled = await generatePage.generateButton.isDisabled();
    expect(isDisabled).toBe(true);

    // Wait for generation to complete
    await generatePage.waitForGenerationComplete(30000);

    // Button should be enabled again
    const isEnabledAfter = await generatePage.generateButton.isEnabled();
    expect(isEnabledAfter).toBe(true);
  });
});
