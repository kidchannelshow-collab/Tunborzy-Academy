import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:3000/#login', { waitUntil: 'networkidle0' });
  
  console.log('Typing credentials...');
  await page.type('input[type="email"]', 'admin@tunborzy.com');
  await page.type('input[type="password"]', 'password123'); // Adjust password if needed
  
  console.log('Clicking login...');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForFunction('window.location.hash === "#admin_dashboard" || window.location.hash === "#dashboard"', {timeout: 15000}).catch(() => console.log('Timeout waiting for navigation'))
  ]);
  
  console.log('Final URL:', page.url());
  await browser.close();
})();
