/* Browser-level smoke test for local file:// mode and guided derivatives.
 * Run only after npm run build:offline and npx playwright install chromium.
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

async function main() {
  const root = path.resolve(__dirname, '..');
  const reports = path.join(root,'reports');
  fs.mkdirSync(reports,{recursive:true});
  const browser = await chromium.launch({ headless:true, channel:'chrome' });
  const pageErrors = [];
  const remoteRequests = [];
  try {
    const page = await browser.newPage({viewport:{width:1160,height:900}});
    page.on('pageerror', error => pageErrors.push(String(error)));
    page.on('request', request => {
      if (/^https?:\/\//i.test(request.url())) remoteRequests.push(request.url());
    });
    const url = pathToFileURL(path.join(root,'offline','index.html')).href;
    await page.goto(url,{waitUntil:'load',timeout:30000});
    await page.locator('.step-card h3').waitFor({timeout:30000});
    assert.match(await page.locator('.walkthrough h2').innerText(),/Step-by-step breakdown/);
    assert.match(await page.locator('.step-card h3').innerText(),/Step 1 of 3/);
    assert.equal(await page.locator('.answer-area').isVisible(),false);

    // The learner can predict a rule without seeing the next mathematical step.
    await page.locator('.practice select').selectOption('sum');
    await page.getByRole('button',{name:'Check my choice'}).click();
    assert.match(await page.locator('.practice [aria-live]').innerText(),/Correct/i);

    await page.getByRole('button',{name:'Next step'}).click();
    assert.match(await page.locator('.step-card h3').innerText(),/Step 2 of 3/);
    await page.getByRole('button',{name:'Why this rule?'}).click();
    assert.equal(await page.locator('.step-card .note').last().isVisible(),true);
    await page.getByRole('button',{name:'Show all transformations'}).click();
    assert.equal(await page.locator('.all-steps li').count(),3);
    await page.getByRole('button',{name:'Reveal final CAS answer'}).click();
    assert.equal(await page.locator('.answer-area').isVisible(),true);
    await page.locator('.step-card .math mjx-container').first().waitFor({timeout:30000});
    await page.screenshot({path:path.join(reports,'guided-derivative.png'),fullPage:true});

    // Switch to another rule and ensure the trace changes, not just the final answer.
    await page.locator('#expression').fill('x*sin(x)');
    await page.getByRole('button',{name:'Calculate and typeset'}).click();
    await page.locator('.step-card h3').waitFor();
    assert.match(await page.locator('.step-card h3').innerText(),/Product rule/i);
    assert.match(await page.locator('.walkthrough h2').innerText(),/Step-by-step breakdown/);

    // The other CAS operations must not pretend to contain a derivation.
    await page.locator('#operation').selectOption('integrate');
    await page.locator('#expression').fill('x^2');
    await page.getByRole('button',{name:'Calculate and typeset'}).click();
    assert.equal(await page.locator('.walkthrough').count(),0);
    assert.match(await page.locator('#output').innerText(),/Step-by-step tracing is currently available for derivatives only/);

    // One-file distribution has *the same* guided steps without sibling scripts.
    const single = await browser.newPage({viewport:{width:1060,height:800}});
    single.on('pageerror', error=>pageErrors.push(String(error)));
    single.on('request', request=>{
      if (/^https?:\/\//i.test(request.url())) remoteRequests.push(request.url());
    });
    await single.goto(pathToFileURL(path.join(root,'offline','calculus-lab-single-file.html')).href,
      {waitUntil:'load',timeout:30000});
    try {
      await single.locator('.step-card h3').waitFor({timeout:12000});
    } catch (error) {
      console.error('SINGLE-FILE DIAGNOSTICS:', await single.evaluate(() => ({
        title: document.title,
        casLoaded: !!window.MathDreamweaverCAS,
        stepLoaded: !!window.MathDreamweaverSteps,
        nerdamerLoaded: !!window.nerdamer,
        mathjaxLoaded: !!window.MathJax,
        outputText: document.querySelector('#output')?.innerText,
        scriptElements: document.querySelectorAll('script').length
      })));
      console.error('PAGE ERRORS:', pageErrors);
      await single.screenshot({path:path.join(reports,'single-file-failed.png'),fullPage:true});
      throw error;
    }
    assert.match(await single.locator('.step-card h3').innerText(),/Step 1 of 3/);
    await single.locator('.step-card .math mjx-container').first().waitFor({timeout:30000});
    await single.screenshot({path:path.join(reports,'single-file-guided.png'),fullPage:true});

    assert.deepEqual(remoteRequests,[],'Offline app must not attempt remote requests');
    assert.deepEqual(pageErrors,[],'Browser must not report uncaught JS exceptions');
    console.log('OFFLINE BROWSER SMOKE PASSED: folder, single file, guided rules, answers, fallback and MathJax.');
  } finally {
    await browser.close();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
