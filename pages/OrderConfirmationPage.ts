import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class OrderConfirmationPage extends BasePage {
  readonly confirmationHeading: Locator;
  readonly orderReferenceText: Locator;
  readonly orderDetailsSection: Locator;
  readonly orderTotal: Locator;

  constructor(page: Page) {
    super(page);
    this.confirmationHeading = this.iframe.locator('h3:has-text("Your order is confirmed")');
    this.orderReferenceText = this.iframe.locator('text=/Order reference.*#[A-Z0-9]+/');
    this.orderDetailsSection = this.iframe
      .locator('section, div')
      .filter({ hasText: 'Order details' });
    this.orderTotal = this.iframe.locator('text=/Total.*€\\d+\\.\\d+/');
  }

  async isConfirmationVisible(): Promise<boolean> {
    try {
      await this.confirmationHeading.waitFor({ timeout: 5000 });
      return await this.confirmationHeading.isVisible();
    } catch {
      return false;
    }
  }

  async getOrderReference(): Promise<string> {
    const text = await this.orderReferenceText.textContent();
    const match = text?.match(/#([A-Z0-9]+)/);
    return match ? match[1] : '';
  }

  async getOrderTotal(): Promise<string> {
    const text = await this.orderTotal.textContent();
    const match = text?.match(/€(\d+\.\d+)/);
    return match ? match[1] : '0';
  }

  /**
   * Verify order confirmation page is displayed correctly
   */
  async verifyOrderConfirmation(): Promise<{ isConfirmed: boolean; orderRef: string }> {
    const isConfirmed = await this.isConfirmationVisible();
    const orderRef = await this.getOrderReference();

    return {
      isConfirmed,
      orderRef: orderRef || '',
    };
  }
}
