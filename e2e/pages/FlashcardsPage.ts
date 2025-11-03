import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for My Flashcards Page
 */
export class FlashcardsPage extends BasePage {
  // Locators
  readonly totalCount: Locator;
  readonly addButton: Locator;
  readonly errorNotification: Locator;
  readonly loadingIndicator: Locator;
  readonly emptyState: Locator;
  readonly emptyCreateButton: Locator;
  readonly flashcardsList: Locator;
  readonly flashcardCards: Locator;
  readonly addFlashcardDialog: Locator;
  readonly addFlashcardFrontInput: Locator;
  readonly addFlashcardBackInput: Locator;
  readonly addFlashcardError: Locator;
  readonly addFlashcardCancelButton: Locator;
  readonly addFlashcardCreateButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators using test IDs
    this.totalCount = page.getByTestId('flashcards-total-count');
    this.addButton = page.getByTestId('flashcards-add-button');
    this.errorNotification = page.getByTestId('flashcards-error-notification');
    this.loadingIndicator = page.getByTestId('flashcards-loading-indicator');
    this.emptyState = page.getByTestId('flashcards-empty-state');
    this.emptyCreateButton = page.getByTestId('flashcards-empty-create-button');
    this.flashcardsList = page.getByTestId('flashcards-list');
    this.flashcardCards = page.getByTestId('flashcard-card');
    this.addFlashcardDialog = page.getByTestId('add-flashcard-dialog');
    this.addFlashcardFrontInput = page.getByTestId('add-flashcard-front-input');
    this.addFlashcardBackInput = page.getByTestId('add-flashcard-back-input');
    this.addFlashcardError = page.getByTestId('add-flashcard-error');
    this.addFlashcardCancelButton = page.getByTestId('add-flashcard-cancel-button');
    this.addFlashcardCreateButton = page.getByTestId('add-flashcard-create-button');
  }

  /**
   * Navigate to flashcards page
   */
  async navigate(): Promise<void> {
    await this.goto('/flashcards');
    await this.waitForPageLoad();
  }

  /**
   * Wait for flashcards to load
   */
  async waitForFlashcardsToLoad(timeout = 5000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  }

  /**
   * Get total flashcards count
   */
  async getTotalCount(): Promise<number> {
    const text = await this.totalCount.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Check if empty state is shown
   */
  async isEmptyStateShown(): Promise<boolean> {
    return await this.emptyState.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get number of flashcard cards
   */
  async getFlashcardsCount(): Promise<number> {
    return await this.flashcardCards.count();
  }

  /**
   * Click add flashcard button
   */
  async clickAddButton(): Promise<void> {
    if (await this.isEmptyStateShown()) {
      await this.emptyCreateButton.click();
    } else {
      await this.addButton.click();
    }
  }

  /**
   * Wait for add dialog to open
   */
  async waitForAddDialog(timeout = 3000): Promise<void> {
    await this.addFlashcardDialog.waitFor({ state: 'visible', timeout });
  }

  /**
   * Fill add flashcard form
   */
  async fillAddFlashcardForm(front: string, back: string): Promise<void> {
    await this.addFlashcardFrontInput.fill(front);
    await this.addFlashcardBackInput.fill(back);
  }

  /**
   * Submit add flashcard form
   */
  async submitAddFlashcard(): Promise<void> {
    await this.addFlashcardCreateButton.click();
  }

  /**
   * Cancel add flashcard dialog
   */
  async cancelAddFlashcard(): Promise<void> {
    await this.addFlashcardCancelButton.click();
  }

  /**
   * Create a new flashcard
   */
  async createFlashcard(front: string, back: string): Promise<void> {
    await this.clickAddButton();
    await this.waitForAddDialog();
    await this.fillAddFlashcardForm(front, back);
    await this.submitAddFlashcard();
    
    // Wait for dialog to close
    await this.addFlashcardDialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }

  /**
   * Edit a flashcard by index
   */
  async editFlashcard(index: number, front: string, back: string): Promise<void> {
    const flashcard = this.flashcardCards.nth(index);
    const editButton = flashcard.getByTestId('flashcard-card-edit-button');
    await editButton.click();

    const frontInput = flashcard.getByTestId('flashcard-card-edit-front-input');
    const backInput = flashcard.getByTestId('flashcard-card-edit-back-input');
    const saveButton = flashcard.getByTestId('flashcard-card-save-button');

    await frontInput.fill(front);
    await backInput.fill(back);
    await saveButton.click();

    // Wait for edit mode to close
    await this.page.waitForTimeout(500);
  }

  /**
   * Delete a flashcard by index
   */
  async deleteFlashcard(index: number): Promise<void> {
    const flashcard = this.flashcardCards.nth(index);
    const deleteButton = flashcard.getByTestId('flashcard-card-delete-button');
    await deleteButton.click();

    // Wait for deletion to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get flashcard content by index
   */
  async getFlashcardContent(index: number): Promise<{ front: string; back: string } | null> {
    const flashcard = this.flashcardCards.nth(index);
    
    if (!await flashcard.isVisible()) {
      return null;
    }

    const content = await flashcard.textContent();
    
    // Try to extract front and back from content
    // This is a simplified approach - adjust based on actual HTML structure
    return {
      front: content?.split('\n')[0]?.trim() || '',
      back: content?.split('\n')[1]?.trim() || '',
    };
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorNotification.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if add dialog has validation error
   */
  async hasAddDialogError(): Promise<boolean> {
    return await this.addFlashcardError.isVisible({ timeout: 1000 }).catch(() => false);
  }
}

