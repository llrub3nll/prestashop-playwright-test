import { Page, Locator } from '@playwright/test';
import { AddToCartModal } from './AddToCartModal';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  readonly addToCartButton: Locator;
  readonly quantityInput: Locator;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly sizeSelector: Locator;
  readonly colorSelector: Locator;

  constructor(page: Page) {
    super(page);
    this.addToCartButton = this.iframe.locator('button:has-text("Add to cart")');
    this.quantityInput = this.iframe.locator('input[type="number"]').first();
    this.productTitle = this.iframe.locator('h1').first();
    this.productPrice = this.iframe.locator('text=/€\\d+\\.\\d+/').first();
    this.sizeSelector = this.iframe.locator('select').first();
    this.colorSelector = this.iframe.locator('input[type="radio"]').first();
  }

  async addToCart(): Promise<AddToCartModal> {
    await this.addToCartButton.click();

    // Wait for the API call and UI update
    await this.page.waitForTimeout(2000);

    // Wait for the success modal to appear - final check
    const successMessage = this.iframe.locator(
      'text=Product successfully added to your shopping cart'
    );
    await successMessage.waitFor({ state: 'visible', timeout: 15000 });

    // Return AddToCartModal instance
    return new AddToCartModal(this.page);
  }

  async setQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
  }

  async getProductTitle(): Promise<string> {
    return (await this.productTitle.textContent()) || '';
  }

  async getProductPrice(): Promise<string> {
    return (await this.productPrice.textContent()) || '';
  }
}
