import { Page, FrameLocator } from '@playwright/test';
import { TEST_CONFIG } from '../config/test-config';

export class BasePage {
  readonly page: Page;
  readonly iframe: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.iframe = page.frameLocator('iframe').first();
  }

  async goto() {
    await this.page.goto(TEST_CONFIG.BASE_URL, {
      waitUntil: 'load',
      timeout: TEST_CONFIG.TIMEOUTS.PAGE_LOAD,
    });
  }
}
