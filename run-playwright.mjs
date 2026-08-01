import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
