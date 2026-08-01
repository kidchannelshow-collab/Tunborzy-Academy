const { chromium } = require('playwright');
const fs = require('fs');
require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

(async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const randomStr = Math.random().toString(36).substring(7);
  const email = `testuser_${randomStr}@example.com`;
  
  // Register user
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: {
      data: {
        full_name: 'Test User',
        role: 'Student',
        portal: 'UTME'
      }
    }
  });
  console.log("Registered user", email, error);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`BROWSER LOG [${msg.type()}]: ${msg.text()}`);
  });

  console.log("Navigating to http://localhost:3000/#login");
  await page.goto('http://localhost:3000/#login');

  console.log("Waiting for email input...");
  await page.waitForSelector('input[type="email"]');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'password123'); 
  
  console.log("Clicking sign in...");
  await page.click('button:has-text("Login")');

  console.log("Waiting 30 seconds to see what happens...");
  await page.waitForTimeout(30000);

  await browser.close();
})();
