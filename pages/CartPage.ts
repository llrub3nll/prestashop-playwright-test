import { Page, Locator } from '@playwright/test';
import { CheckoutPage } from './CheckoutPage';
import { BasePage } from './BasePage';
import { TEST_CONFIG } from '../config/test-config';

export class CartPage extends BasePage {
  readonly pageTitle: Locator;
  readonly productItems: Locator;
  readonly proceedToCheckoutButton: Locator;
  readonly continueShoppingLink: Locator;
  readonly cartSummary: Locator;
  readonly subtotal: Locator;
  readonly shippingCost: Locator;
  readonly totalPrice: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = this.iframe.locator('h1');
    // Cart line items - look for list items within the cart overview that have quantity inputs
    // This is more specific than just 'li' which matches ALL list items on the page
    this.productItems = this.iframe
      .locator('.cart-overview li, .cart-items li, ul.cart-items > li')
      .filter({
        has: this.iframe.locator('input[type="number"]'),
      });
    this.proceedToCheckoutButton = this.iframe.getByRole('link', {
      name: /PROCEED TO CHECKOUT|Proceed to checkout/i,
    });
    this.continueShoppingLink = this.iframe.getByRole('link', { name: /Continue shopping/i });
    this.cartSummary = this.iframe.locator('text=/\\d+\\s+items/');
    this.subtotal = this.iframe.locator('text=/€\\d+\\.\\d+/').first();
    this.shippingCost = this.iframe.locator('text=/Shipping.*Free|€\\d+\\.\\d+/');
    this.totalPrice = this.iframe.locator('text=/Total.*€\\d+\\.\\d+/');
  }

  async goto() {
    await super.goto();
    await this.iframe
      .locator('a[href*="cart"]')
      .first()
      .waitFor({ timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE });

    await this.iframe.locator('a[href*="cart"]').first().click();

    await this.page.waitForTimeout(TEST_CONFIG.TIMEOUTS.SHORT_WAIT);

    await this.pageTitle.waitFor({
      state: 'visible',
      timeout: TEST_CONFIG.TIMEOUTS.ELEMENT_VISIBLE,
    });
  }

  async getProductCount(): Promise<number> {
    return await this.productItems.count();
  }

  /**
   * Verify cart page is loaded and has products
   */
  async verifyCartLoaded(minProducts: number = 1): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
    const count = await this.getProductCount();
    if (count < minProducts) {
      throw new Error(`Expected at least ${minProducts} product(s) in cart, but found ${count}`);
    }
  }

  async getProductNames(): Promise<string[]> {
    const products = await this.productItems.all();
    const names: string[] = [];
    for (const product of products) {
      const name = await product.locator('a').first().textContent();
      if (name) names.push(name.trim());
    }
    return names;
  }

  async proceedToCheckout(): Promise<CheckoutPage> {
    await this.proceedToCheckoutButton.click();

    // Wait for checkout page to load
    await this.page.waitForTimeout(2000);

    // Return CheckoutPage instance
    return new CheckoutPage(this.page);
  }

  async getTotalPrice(): Promise<string> {
    const text = await this.totalPrice.textContent();
    const match = text?.match(/€(\d+\.\d+)/);
    return match ? match[1] : '0';
  }

  async removeProduct(index: number) {
    const deleteButton = this.productItems
      .nth(index)
      .locator('a[href*="delete"], .remove-from-cart');
    await deleteButton.click();

    // Wait for the cart to update
    await this.page.waitForTimeout(1500);
  }

  async updateQuantity(index: number, quantity: number) {
    const quantityInput = this.productItems.nth(index).locator('input[type="number"]');
    await quantityInput.fill(quantity.toString());
    await quantityInput.press('Enter'); // Trigger the update

    // Wait for the cart to update
    await this.page.waitForTimeout(1500);
  }
}
