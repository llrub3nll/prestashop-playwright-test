import { Page } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { OrderConfirmationPage } from '../../pages/OrderConfirmationPage';

export type CustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  state?: string;
};

export async function prepareCart(
  page: Page,
  productNames: string[],
  minProducts: number = 1
): Promise<{ homePage: HomePage; cartPage: CartPage }> {
  const homePage = new HomePage(page);
  const { cartPage } = await homePage.addProductsToCart(productNames);
  await cartPage.verifyCartLoaded(minProducts);
  return { homePage, cartPage };
}

export async function goToCheckout(cartPage: CartPage): Promise<CheckoutPage> {
  const checkoutPage = await cartPage.proceedToCheckout();
  await checkoutPage.verifyCheckoutReady();
  return checkoutPage;
}

export async function finishCheckout(
  checkoutPage: CheckoutPage,
  customer: CustomerDetails
): Promise<OrderConfirmationPage> {
  return checkoutPage.completeCheckout(
    customer.firstName,
    customer.lastName,
    customer.email,
    customer.address,
    customer.city,
    customer.zipCode,
    customer.state
  );
}
