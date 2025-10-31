# PrestaShop Cart Automation Tests

Automated E2E tests for PrestaShop cart functionality using Playwright + TypeScript with Page Object Model pattern.

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## 🧪 Running Tests

### Run All Tests
```bash
npm test
```

### Run Desktop Tests Only
```bash
npm run test:desktop
```

### Run Mobile Tests Only
```bash
npm run test:mobile
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:headed
```

### Run Tests with UI Mode (Interactive)
```bash
npm run test:ui
```

### View Test Report
After running tests, view the HTML report:
```bash
npm run report
```

## 🔍 Code Quality

### Linting
Check for code quality issues:
```bash
npm run lint
```

Auto-fix linting issues:
```bash
npm run lint:fix
```

### Formatting
Format code with Prettier:
```bash
npm run format
```

Check formatting without changes:
```bash
npm run format:check
```

## ⚠️ Important Note on Performance

**The PrestaShop demo system has significant performance issues**, which cause slow page loads, delayed element rendering, and inconsistent network responses. As a result, the test suite includes multiple explicit waits and extended timeouts to ensure reliable test execution.

These waits are intentional and necessary to handle:
- Slow page transitions
- Delayed element appearance
- Inconsistent API responses
- Network latency on the demo environment

The test timeouts and wait strategies are configured to account for these performance limitations.

## 🏗️ Project Structure

```
InterviewPrep/
├── pages/                      # Page Object Model classes
│   ├── HomePage.ts
│   ├── ProductPage.ts
│   ├── AddToCartModal.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── OrderConfirmationPage.ts
├── tests/                      # Test specifications
│   ├── cart.spec.ts           # Desktop cart tests
│   └── cart-mobile.spec.ts    # Mobile cart tests
├── playwright.config.ts        # Playwright configuration
└── package.json
```

## 📋 Test Coverage

The test suite validates:
- Adding multiple different products to cart
- Product quantity merging (no duplicates)
- Cart persistence after page refresh
- Removing items and updating quantities
- Complete checkout flow
- Order confirmation
- Mobile viewport support (iPhone 14)

## 🔧 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v8 or higher

## 📝 Notes

- **Demo Site**: The PrestaShop demo site runs in an iframe, requiring special handling with `frameLocator()`
- **Dynamic Environment**: Demo site resets periodically, tests use unique emails and timestamps
- **Test Reports**: Located in `playwright-report/` directory with videos and screenshots on failure

---

**Test Site**: https://demo.prestashop.com/  
**Framework**: Playwright + TypeScript  
**Pattern**: Page Object Model
