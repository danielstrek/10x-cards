import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Generate Flashcards Page
 */
export class GeneratePage extends BasePage {
  // Locators
  readonly sourceTextInput: Locator;
  readonly generateButton: Locator;
  readonly loadingIndicator: Locator;
  readonly errorNotification: Locator;
  readonly saveErrorNotification: Locator;
  readonly flashcardsResults: Locator;
  readonly flashcardsCount: Locator;
  readonly acceptedCount: Locator;
  readonly flashcardList: Locator;
  readonly flashcardItems: Locator;
  readonly saveAcceptedButton: Locator;
  readonly saveAllButton: Locator;
  readonly successDialog: Locator;
  readonly successDialogContinueButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators using test IDs
    this.sourceTextInput = page.getByTestId('generate-source-text-input');
    this.generateButton = page.getByTestId('generate-flashcards-button');
    this.loadingIndicator = page.getByTestId('generate-loading-indicator');
    this.errorNotification = page.getByTestId('generate-error-notification');
    this.saveErrorNotification = page.getByTestId('generate-save-error-notification');
    this.flashcardsResults = page.getByTestId('generate-flashcards-results');
    this.flashcardsCount = page.getByTestId('generate-flashcards-count');
    this.acceptedCount = page.getByTestId('generate-accepted-count');
    this.flashcardList = page.getByTestId('flashcard-list');
    this.flashcardItems = page.getByTestId('flashcard-item');
    this.saveAcceptedButton = page.getByTestId('save-accepted-button');
    this.saveAllButton = page.getByTestId('save-all-button');
    this.successDialog = page.getByTestId('success-dialog');
    this.successDialogContinueButton = page.getByTestId('success-dialog-continue-button');
  }

  /**
   * Navigate to generate page
   */
  async navigate(): Promise<void> {
    await this.goto('/generate');
    await this.waitForPageLoad();
  }

  /**
   * Fill source text
   */
  async fillSourceText(text: string): Promise<void> {
    await this.sourceTextInput.fill(text);
  }

  /**
   * Click generate button
   */
  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  /**
   * Wait for generation to complete
   */
  async waitForGenerationComplete(timeout = 30000): Promise<void> {
    // Wait for loading indicator to appear
    await this.loadingIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    // Wait for loading indicator to disappear
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Generate flashcards from text
   */
  async generateFlashcards(text: string): Promise<void> {
    await this.fillSourceText(text);
    await this.clickGenerate();
    await this.waitForGenerationComplete();
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorNotification.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.hasError()) {
      return await this.errorNotification.textContent();
    }
    return null;
  }

  /**
   * Check if save error is displayed
   */
  async hasSaveError(): Promise<boolean> {
    return await this.saveErrorNotification.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get number of generated flashcards
   */
  async getGeneratedFlashcardsCount(): Promise<number> {
    const count = await this.flashcardItems.count();
    return count;
  }

  /**
   * Get accepted flashcards count from UI
   */
  async getAcceptedCountText(): Promise<string | null> {
    if (await this.acceptedCount.isVisible({ timeout: 1000 }).catch(() => false)) {
      return await this.acceptedCount.textContent();
    }
    return null;
  }

  /**
   * Accept a flashcard by index
   */
  async acceptFlashcard(index: number): Promise<void> {
    const flashcard = this.flashcardItems.nth(index);
    const acceptButton = flashcard.getByTestId('flashcard-accept-button');
    await acceptButton.click();
  }

  /**
   * Accept multiple flashcards
   */
  async acceptFlashcards(indices: number[]): Promise<void> {
    for (const index of indices) {
      await this.acceptFlashcard(index);
    }
  }

  /**
   * Edit a flashcard
   */
  async editFlashcard(index: number, front: string, back: string): Promise<void> {
    const flashcard = this.flashcardItems.nth(index);
    const editButton = flashcard.getByTestId('flashcard-edit-button');
    await editButton.click();

    const frontInput = flashcard.getByTestId('flashcard-edit-front-input');
    const backInput = flashcard.getByTestId('flashcard-edit-back-input');
    const saveButton = flashcard.getByTestId('flashcard-save-edit-button');

    await frontInput.fill(front);
    await backInput.fill(back);
    await saveButton.click();
  }

  /**
   * Reject a flashcard
   */
  async rejectFlashcard(index: number): Promise<void> {
    const flashcard = this.flashcardItems.nth(index);
    const rejectButton = flashcard.getByTestId('flashcard-reject-button');
    await rejectButton.click();
  }

  /**
   * Click save accepted button
   */
  async clickSaveAccepted(): Promise<void> {
    await this.saveAcceptedButton.click();
  }

  /**
   * Click save all button
   */
  async clickSaveAll(): Promise<void> {
    await this.saveAllButton.click();
  }

  /**
   * Wait for success dialog
   */
  async waitForSuccessDialog(timeout = 5000): Promise<void> {
    await this.successDialog.waitFor({ state: 'visible', timeout });
  }

  /**
   * Get success message from dialog
   */
  async getSuccessMessage(): Promise<string | null> {
    if (await this.successDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await this.successDialog.textContent();
    }
    return null;
  }

  /**
   * Close success dialog
   */
  async closeSuccessDialog(): Promise<void> {
    await this.successDialogContinueButton.click();
    await this.successDialog.waitFor({ state: 'hidden', timeout: 3000 });
  }

  /**
   * Check if results are displayed
   */
  async hasResults(): Promise<boolean> {
    return await this.flashcardsResults.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get flashcard content by index
   */
  async getFlashcardContent(index: number): Promise<{ front: string; back: string } | null> {
    const flashcard = this.flashcardItems.nth(index);
    
    if (!await flashcard.isVisible()) {
      return null;
    }

    const frontText = await flashcard.locator('[data-label="Przód"]').textContent();
    const backText = await flashcard.locator('[data-label="Tył"]').textContent();

    return {
      front: frontText?.trim() || '',
      back: backText?.trim() || '',
    };
  }
}

