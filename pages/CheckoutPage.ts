import { Page, Locator } from '@playwright/test';
import { OrderConfirmationPage } from './OrderConfirmationPage';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  readonly personalInfoHeading: Locator;
  readonly guestTabButton: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly termsCheckbox: Locator;
  readonly continueButton: Locator;
  readonly addressContinueButton: Locator;
  readonly shippingContinueButton: Locator;
  readonly addressSection: Locator;
  readonly shippingSection: Locator;
  readonly paymentMethodRadio: Locator;
  readonly placeOrderCheckbox: Locator;
  readonly placeOrderButton: Locator;
  readonly paymentSection: Locator;
  readonly orderSummary: Locator;

  constructor(page: Page) {
    super(page);
    this.personalInfoHeading = this.iframe.locator('h1:has-text("Personal Information")');
    this.guestTabButton = this.iframe.locator('button:has-text("Order as a guest")');
    this.firstNameInput = this.iframe.locator('input[name="firstname"]').first();
    this.lastNameInput = this.iframe.locator('input[name="lastname"]').first();
    this.emailInput = this.iframe.locator('input[name="email"]').first();
    this.termsCheckbox = this.iframe.locator('input[name="psgdpr"]').first();
    // More specific selectors for continue buttons in each step
    this.continueButton = this.iframe
      .locator('button[type="submit"]:has-text("Continue"), button:has-text("Continue")')
      .first();
    this.addressSection = this.iframe.locator('section#checkout-addresses-step');
    this.addressContinueButton = this.addressSection
      .locator(
        'button[type="submit"]:has-text("Continue"), button[name="confirm-addresses"]:has-text("Continue")'
      )
      .first();
    this.shippingSection = this.iframe.locator('section#checkout-delivery-step');
    // Shipping continue button - on mobile, shipping might be auto-selected, so button might not exist
    // Try to find it within the section or after it
    this.shippingContinueButton = this.shippingSection
      .locator('button[name="confirmDeliveryOption"], button[type="submit"]')
      .first();
    this.paymentSection = this.iframe.locator('section#checkout-payment-step');
    this.paymentMethodRadio = this.paymentSection.locator('input[name="payment-option"]').first();
    // Note: Using name^= because actual attribute is "conditions_to_approve[terms-and-conditions]"
    this.placeOrderCheckbox = this.paymentSection.locator('input[name^="conditions_to_approve"]');
    this.placeOrderButton = this.paymentSection.locator(
      'button[type="submit"]:has-text("Place order"), button.button.btn-primary:has-text("Place order")'
    );
    this.orderSummary = this.iframe.locator('text=/\\d+\\s+items/');
  }

  async fillPersonalInfo(firstName: string, lastName: string, email: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
  }

  async acceptTerms() {
    // Check all required checkboxes - both newsletter and privacy
    const allCheckboxes = this.iframe.locator('input[type="checkbox"]');
    const count = await allCheckboxes.count();
    for (let i = 0; i < count; i++) {
      const checkbox = allCheckboxes.nth(i);
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.check();
      }
    }
  }

  async continueToAddress() {
    await this.continueButton.click();

    // Wait for checkout progression
    await this.page.waitForTimeout(2000);

    // Wait for the next step UI to appear (address form) - final check
    await this.iframe
      .locator('input[name="address1"]')
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillAddressForm(address: string, city: string, zipCode: string, state?: string) {
    // Wait for address form to be ready
    const addressInput = this.iframe.locator('input[name="address1"]');
    await addressInput.waitFor({ state: 'visible', timeout: 10000 });

    const cityInput = this.iframe.locator('input[name="city"]');
    const zipCodeInput = this.iframe.locator('input[name="postcode"]');
    const countryDropdown = this.iframe.locator('select[name="id_country"]');
    const stateDropdown = this.iframe.locator('select[name="id_state"]');

    // Select United States if state is provided (state dropdown only appears for certain countries)
    if (state) {
      // Wait for state dropdown to populate after country selection
      const stateLoadPromise = this.page
        .waitForResponse(
          response => response.url().includes('/ajax') || response.url().includes('/states'),
          { timeout: 10000 }
        )
        .catch(() => {
          // States might be already loaded, that's okay
        });

      await countryDropdown.selectOption({ label: 'United States' });
      await stateLoadPromise;
    }

    await addressInput.fill(address);
    await cityInput.fill(city);
    await zipCodeInput.fill(zipCode);

    // Fill state if provided (some countries require it)
    if (state) {
      await stateDropdown.waitFor({ state: 'visible', timeout: 5000 });
      await stateDropdown.selectOption({ label: state });
    }
  }

  /**
   * Complete the entire checkout flow from personal info to order placement
   */
  async completeCheckout(
    firstName: string,
    lastName: string,
    email: string,
    address: string,
    city: string,
    zipCode: string,
    state?: string
  ): Promise<OrderConfirmationPage> {
    // Fill personal information
    await this.personalInfoHeading.waitFor({ state: 'visible', timeout: 10000 });
    await this.fillPersonalInfo(firstName, lastName, email);
    await this.acceptTerms();
    await this.continueToAddress();

    // Fill address information
    await this.fillAddressForm(address, city, zipCode, state);
    await this.continueToShipping();

    // Continue through shipping
    await this.continueToPayment();

    // Complete payment
    await this.selectPaymentMethod();
    await this.acceptOrderTerms();

    return await this.placeOrder();
  }

  /**
   * Verify the checkout page is ready (personal info section visible)
   */
  async verifyCheckoutReady(): Promise<void> {
    await this.personalInfoHeading.waitFor({ state: 'visible', timeout: 10000 });
  }

  async continueToShipping() {
    // Wait for address form to be ready and continue button to be visible
    await this.addressSection.waitFor({ state: 'visible', timeout: 10000 });
    await this.addressContinueButton.waitFor({ state: 'visible', timeout: 10000 });

    // Check if button is enabled before clicking
    const isEnabled = await this.addressContinueButton.isEnabled();
    if (!isEnabled) {
      // Button might be disabled due to validation - wait a bit and check form fields
      await this.page.waitForTimeout(1000);
      // Verify all required fields are filled
      const addressInput = this.iframe.locator('input[name="address1"]');
      const cityInput = this.iframe.locator('input[name="city"]');
      const zipInput = this.iframe.locator('input[name="postcode"]');
      await addressInput.waitFor({ state: 'visible', timeout: 5000 });
      await cityInput.waitFor({ state: 'visible', timeout: 5000 });
      await zipInput.waitFor({ state: 'visible', timeout: 5000 });
    }

    await this.addressContinueButton.click();

    // Wait for checkout progression
    await this.page.waitForTimeout(2000);

    // Wait for shipping section to appear - final check (delivery inputs may be hidden, so check section instead)
    await this.shippingSection.waitFor({ state: 'visible', timeout: 10000 });
  }

  async continueToPayment() {
    // Wait for shipping section to be visible
    await this.shippingSection.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for the continue button to exist (attached) - may be hidden
    await this.shippingContinueButton.waitFor({ state: 'attached', timeout: 10000 });

    // Small wait for any animations/transitions
    await this.page.waitForTimeout(1000);

    // Check if visible - if not, use force click (common on mobile, sometimes desktop too)
    const isVisible = await this.shippingContinueButton.isVisible().catch(() => false);
    await this.shippingContinueButton.click({ force: !isVisible });

    // Wait for checkout progression
    await this.page.waitForTimeout(2000);

    // Wait for payment section to appear - final check (radio may be hidden, just check section)
    await this.paymentSection.waitFor({ state: 'visible', timeout: 10000 });
  }

  async selectPaymentMethod() {
    await this.paymentSection.waitFor({ state: 'visible', timeout: 10000 });

    const paymentRadioExists = await this.paymentMethodRadio.count().then(c => c > 0);

    if (paymentRadioExists) {
      const isVisible = await this.paymentMethodRadio.isVisible();
      await this.paymentMethodRadio.check({ force: !isVisible });
    }
  }

  async acceptOrderTerms() {
    await this.paymentSection.waitFor({ state: 'visible', timeout: 10000 });

    // Scroll to the payment section to ensure checkbox is visible
    await this.paymentSection.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);

    await this.placeOrderCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await this.placeOrderCheckbox.check({ force: true });

    // Wait for checkbox state to update and enable the button
    await this.page.waitForTimeout(1500);
  }

  async placeOrder(): Promise<OrderConfirmationPage> {
    await this.paymentSection.waitFor({ state: 'visible', timeout: 10000 });
    await this.placeOrderButton.waitFor({ state: 'visible', timeout: 10000 });

    await this.placeOrderButton.click();

    await this.page.waitForTimeout(3000);

    await this.iframe
      .locator('text=/Your order is confirmed|Order confirmation/i')
      .waitFor({ state: 'visible', timeout: 15000 });

    return new OrderConfirmationPage(this.page);
  }

  async getOrderSummaryItemCount(): Promise<string> {
    const text = await this.orderSummary.textContent();
    const match = text?.match(/(\d+)\s+items/);
    return match ? match[1] : '0';
  }
}
