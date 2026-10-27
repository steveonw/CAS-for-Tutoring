/* Verify that guided MathJax formulas do not contain merror fragments.
 * Requires the offline build, and either a preinstalled Google Chrome or
 * Playwright Chromium installed via: npx playwright install chromium.
 * npm run test:render
 * A MathJax merror is a blocking regression.
 */
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const problems=[
  'x^2*e^x','e^(3*x)','e^(sin(x))','(x^2+3)^4','sin(x^2)',
  'x^x','(2*x+1)^3*(x-4)^2','x/sqrt(x+1)','log(x)','log(x^2+1)','abs(x)'
];
async function main() {
  const root=path.resolve(__dirname,'..');
  let browser;
  try {
    browser=await chromium.launch({channel:'chrome',headless:true});
  } catch(e) {
    // Local developers can use Playwright's downloaded Chromium instead.
    // GitHub Actions uses the preinstalled Google Chrome for speed.
    try { browser=await chromium.launch({headless:true}); }
    catch(second) {
      throw new Error('Neither Google Chrome nor Playwright Chromium was available: '+second.message);
    }
  }
  const errors=[],failures=[];
  try {
    const page=await browser.newPage();
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(pathToFileURL(path.join(root,'offline','index.html')).href);
    for(const input of problems) {
      await page.locator('#operation').selectOption('differentiate');
      await page.locator('#expression').fill(input);
      await page.getByRole('button',{name:'Start guided practice'}).click();
      await page.locator('.step-card h3').waitFor({timeout:30000});
      await page.getByRole('button',{name:'Show all transformations'}).click();
      await page.getByRole('button',{name:'Reveal final CAS answer'}).click();
      await page.locator('.answer-area mjx-container').waitFor({timeout:30000});
      await page.waitForTimeout(350);
      const bad=await page.evaluate(()=>document.querySelectorAll(
        '#output [data-mml-node="merror"], #output [data-mml-node="mtext"][fill="red"]'
      ).length);
      console.log((bad?'FAIL':'ok  ')+'  '+input+(bad?' ('+bad+' MathJax error fragments)':''));
      if(bad)failures.push(input);
    }
    if(errors.length)throw Error('Browser JavaScript errors: '+errors.join('; '));
  } finally {await browser.close();}
  if(failures.length) {
    console.error(failures.length+' derivative(s) render with MathJax errors: '+failures.join(', '));
    process.exitCode=1;
  } else console.log('All tested walkthrough formulas render cleanly.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
