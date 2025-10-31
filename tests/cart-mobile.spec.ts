import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { prepareCart, goToCheckout, finishCheckout } from './helpers/cartFlows';
import { PRODUCTS } from '../test-data/products';
import { generateUSCustomer } from '../test-data/customers';
import { TEST_CONFIG } from '../config/test-config';

test.describe('Cart Functionality Tests - Mobile (iPhone 14)', () => {
  test.beforeEach(async () => {
    test.setTimeout(TEST_CONFIG.TIMEOUTS.TEST);
  });

  test('AC9: Mobile - User can add multiple products and complete checkout', async ({ page }) => {
    // NOTE: This test may fail due to a known bug in the PrestaShop demo:
    // The "Place Order" button remains disabled even after accepting terms on mobile.
    // The checkout flow works correctly up to the payment step, but the final
    // button enable logic appears to have issues with the demo site's JavaScript.
    const { homePage, cartPage } = await prepareCart(page, [PRODUCTS.TSHIRT, PRODUCTS.MUG]);

    const cartCount = await homePage.getCartCount();
    expect(parseInt(cartCount)).toBeGreaterThanOrEqual(1);

    const checkoutPage = await goToCheckout(cartPage);
    const customer = generateUSCustomer();
    const confirmationPage = await finishCheckout(checkoutPage, customer);

    const { isConfirmed, orderRef } = await confirmationPage.verifyOrderConfirmation();
    expect(isConfirmed).toBe(true);
    expect(orderRef.length).toBeGreaterThan(0);
  });

  test('AC9: Mobile - Cart icon is visible and functional', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    const cartExists = await homePage.cartCounter.isVisible().catch(() => false);
    if (!cartExists) {
      await homePage.iframe.locator('article').first().waitFor({ state: 'visible', timeout: 5000 });
    }

    const productPage = await homePage.clickProduct(PRODUCTS.MUG);
    const modal = await productPage.addToCart();
    await modal.continueShopping();

    const cartCount = await homePage.getCartCount();
    expect(cartCount).toBe('1');
  });

  test('AC9: Mobile - No horizontal scrolling on cart and checkout pages', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    const productPage = await homePage.clickProduct(PRODUCTS.TSHIRT);
    const modal = await productPage.addToCart();
    const cartPage = await modal.proceedToCheckout();

    // Check viewport width matches device width (no horizontal scroll)
    const viewportWidth = page.viewportSize()?.width || 0;
    const bodyWidth = await cartPage.iframe.locator('body').evaluate(el => el.scrollWidth);

    // Body width should not exceed viewport width (allowing small tolerance)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);

    // Verify checkout buttons are accessible
    await expect(cartPage.proceedToCheckoutButton).toBeVisible();
  });
});
