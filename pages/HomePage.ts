import { Page, Locator } from '@playwright/test';
import { ProductPage } from './ProductPage';
import { AddToCartModal } from './AddToCartModal';
import { CartPage } from './CartPage';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly cartCounter: Locator;

  constructor(page: Page) {
    super(page);
    this.cartCounter = this.iframe
      .locator('a[href*="cart"], a[href*="order"], .cart, [data-target*="cart"]')
      .first();
  }

  async goto() {
    await super.goto();
    await this.waitForCatalog();
  }

  async getProductByName(productName: string) {
    return this.iframe.locator(`article:has-text("${productName}")`).first();
  }

  async clickProduct(productName: string): Promise<ProductPage> {
    // Wait for products to be clickable
    const product = await this.getProductByName(productName);
    await product.waitFor({ state: 'visible', timeout: 10000 });

    // Get the product link and click
    const productLink = product.locator('a').first();
    await productLink.click();

    // Wait for navigation to complete
    await this.page.waitForTimeout(2000);

    // Wait for product page to be ready (Add to cart button visible) - final check
    await this.iframe
      .locator('button:has-text("Add to cart")')
      .waitFor({ state: 'visible', timeout: 15000 });

    // Return ProductPage instance
    return new ProductPage(this.page);
  }

  async getCartCount(): Promise<string> {
    try {
      const cartText = await this.cartCounter.textContent();
      const match = cartText?.match(/\((\d+)\)/);
      return match ? match[1] : '0';
    } catch {
      // On mobile, cart might be an icon - try alternative selector
      const cartIcon = this.iframe
        .locator('[aria-label*="cart" i], .shopping-cart, .cart-icon')
        .first();
      const iconText = await cartIcon.textContent().catch(() => null);
      const match = iconText?.match(/(\d+)/);
      return match ? match[1] : '0';
    }
  }

  /**
   * Add multiple products to cart sequentially
   * Returns the cart page after adding all products
   */
  async addProductsToCart(
    productNames: string[]
  ): Promise<{ modal: AddToCartModal; cartPage: CartPage }> {
    let lastModal: AddToCartModal | null = null;

    await this.ensureHomePageLoaded();

    for (let i = 0; i < productNames.length; i++) {
      await this.waitForCatalog();
      const productPage = await this.clickProduct(productNames[i]);
      const modal = await productPage.addToCart();
      lastModal = modal;

      if (i < productNames.length - 1) {
        const homePage = await modal.continueShopping();
        await homePage.navigateToHome();
      }
    }

    // Proceed to checkout with the last modal
    if (!lastModal) {
      throw new Error('No products were added to cart');
    }

    const cartPage = await lastModal.proceedToCheckout();
    return { modal: lastModal, cartPage };
  }

  async navigateToHome(): Promise<void> {
    const selectors = [
      '#_desktop_logo a',
      '#header_logo a',
      '.logo a',
      'a[title="Home"]',
      'a:has-text("Home")',
    ];

    for (const selector of selectors) {
      const target = this.iframe.locator(selector).first();
      const isVisible = await target.isVisible().catch(() => false);
      if (isVisible) {
        await target.click();
        await this.waitForCatalog();
        return;
      }
    }

    await this.goto();
  }

  private async waitForCatalog(): Promise<void> {
    await this.iframe.locator('article').first().waitFor({ state: 'visible', timeout: 20000 });
  }

  private async ensureHomePageLoaded(): Promise<void> {
    const catalogVisible = await this.iframe
      .locator('article')
      .first()
      .isVisible()
      .catch(() => false);
    if (!catalogVisible) {
      await this.goto();
    }
  }
}
