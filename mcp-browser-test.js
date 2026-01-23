const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('🚀 Starting browser automation test...');
    
    let browser;
    try {
      browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222'
      });
      console.log('✓ Connected to existing Chrome instance');
    } catch (e) {
      console.log('Starting new Chrome instance...');
      browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('challenge')) || await browser.newPage();
    
    const currentUrl = page.url();
    if (currentUrl === 'about:blank' || !currentUrl.includes('challenge')) {
      await page.goto('http://localhost:3000/challenge', { waitUntil: 'networkidle0' });
    }
    
    console.log('✓ Navigated to challenge page');
    
    await page.waitForSelector('textarea', { timeout: 8000 });
    await page.click('textarea');
    await page.type('textarea', 'Hello from MCP! This is automated text input.', { delay: 80 });
    
    console.log('✓ Successfully filled textarea with test message');
    
    await page.screenshot({ path: '/tmp/mcp-test-result.png', fullPage: false });
    console.log('✓ Screenshot saved to /tmp/mcp-test-result.png');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await browser.disconnect();
    await browser.close();
    
    console.log('✅ MCP browser automation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
