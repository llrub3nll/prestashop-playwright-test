import { Page, Locator } from '@playwright/test';
import { HomePage } from './HomePage';
import { CartPage } from './CartPage';
import { BasePage } from './BasePage';

export class AddToCartModal extends BasePage {
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly continueShoppingButton: Locator;
  readonly proceedToCheckoutButton: Locator;
  readonly cartSummary: Locator;
  readonly cartTotal: Locator;

  constructor(page: Page) {
    super(page);
    this.modal = this.iframe
      .locator('text=Product successfully added to your shopping cart')
      .locator('..');
    this.modalTitle = this.iframe.locator('text=Product successfully added to your shopping cart');
    this.continueShoppingButton = this.iframe.getByRole('button', {
      name: /CONTINUE SHOPPING|Continue shopping/i,
    });
    this.proceedToCheckoutButton = this.iframe.getByRole('link', {
      name: /PROCEED TO CHECKOUT|Proceed to checkout/i,
    });
    this.cartSummary = this.iframe.locator('text=/There \\w+ \\d+ items? in your cart/');
    this.cartTotal = this.iframe.locator('text=/Total.*€\\d+\\.\\d+/');
  }

  async waitForModal() {
    await this.modalTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async isVisible(): Promise<boolean> {
    try {
      await this.modalTitle.waitFor({ state: 'visible', timeout: 5000 });
      return await this.modalTitle.isVisible();
    } catch {
      return false;
    }
  }

  async continueShopping(): Promise<HomePage> {
    await this.modalTitle.waitFor({ state: 'visible', timeout: 15000 });
    await this.continueShoppingButton.click();
    await this.modalTitle.waitFor({ state: 'hidden', timeout: 10000 });

    // Return HomePage instance for follow-up actions within the storefront
    return new HomePage(this.page);
  }

  async proceedToCheckout(): Promise<CartPage> {
    await this.modalTitle.waitFor({ state: 'visible', timeout: 15000 });

    await this.proceedToCheckoutButton.click();

    // Wait for navigation to cart page
    await this.page.waitForTimeout(2000);

    // Wait for modal to disappear
    await this.modalTitle.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // Modal might already be hidden, that's okay
    });

    // Return CartPage instance
    return new CartPage(this.page);
  }

  async getCartItemCount(): Promise<string> {
    const text = await this.cartSummary.textContent();
    const match = text?.match(/(\d+)\s+item/);
    return match ? match[1] : '0';
  }

  async getCartTotal(): Promise<string> {
    const text = await this.cartTotal.textContent();
    const match = text?.match(/€(\d+\.\d+)/);
    return match ? match[1] : '0';
  }
}
