/* Offline browser smoke test: Tutor Mode, Step 0, typed work, quick CAS,
 * both file:// package shapes, MathJax, and absolutely no network calls.
 */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
async function main(){
  const root=path.resolve(__dirname,'..'), reports=path.join(root,'reports');
  fs.mkdirSync(reports,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const pageErrors=[],remoteRequests=[];
  const observe=page=>{
    page.on('pageerror',error=>pageErrors.push(String(error)));
    page.on('request',req=>{if(/^https?:\/\//i.test(req.url()))remoteRequests.push(req.url());});
  };
  try{
    const page=await browser.newPage({viewport:{width:1160,height:900}});
    observe(page);
    await page.goto(pathToFileURL(path.join(root,'offline','index.html')).href,{waitUntil:'load'});
    await page.locator('.step-card h3').waitFor({timeout:30000});
    assert.equal(await page.locator('#study-mode').inputValue(),'tutor');
    assert.match(await page.locator('.step-card h3').innerText(),/Step 0 — Choose the first rule/);
    assert.match(await page.locator('.walkthrough h2').innerText(),/Step-by-step breakdown/);
    assert.equal(await page.locator('.answer-area').isVisible(),false);
    assert.equal(await page.locator('#student-next-step').count(),1);
    assert.equal(await page.locator('.step-card .math').nth(1).isVisible(),false,'next line must not be revealed');

    // Step 0 is where students choose the FIRST rule.
    await page.locator('#next-rule').selectOption('sum');
    await page.getByRole('button',{name:'Check my choice'}).click();
    assert.match(await page.locator('.rule-feedback').innerText(),/Not quite/i);
    await page.locator('#next-rule').selectOption('power');
    await page.getByRole('button',{name:'Check my choice'}).click();
    assert.match(await page.locator('.rule-feedback').innerText(),/Correct/i);

    // A raw final result skips the first intermediate rule.
    const trace=await page.evaluate(()=>{
      const calculated=window.MathDreamweaverCAS.calculate('differentiate','(x^2+3)^4');
      return window.MathDreamweaverSteps.explainDerivative(calculated.latexExpression,{
        checkLatex:calculated.latexAnswer
      });
    });
    await page.locator('#student-step-format').selectOption('latex');
    await page.locator('#student-next-step').fill(trace.resultLatex);
    await page.getByRole('button',{name:'Check my step'}).click();
    assert.equal(await page.locator('#student-feedback').getAttribute('data-status'),'skipped');
    assert.equal(await page.locator('.answer-area').isVisible(),false);

    // The exact next transformation earns a match without revealing the answer.
    await page.locator('#student-next-step').fill(trace.steps[0].latex);
    await page.getByRole('button',{name:'Check my step'}).click();
    assert.equal(await page.locator('#student-feedback').getAttribute('data-status'),'matched');
    await page.locator('#student-next-step').fill('\\href{https://bad.example}{x}');
    await page.getByRole('button',{name:'Check my step'}).click();
    assert.equal(await page.locator('#student-feedback').getAttribute('data-status'),'invalid');

    await page.getByRole('button',{name:'Reveal step 1'}).click();
    assert.match(await page.locator('.step-card h3').innerText(),/Step 1 of 3/);
    assert.equal(await page.locator('.step-card .math').nth(1).isVisible(),true);
    await page.locator('#next-rule').selectOption('sum');
    await page.getByRole('button',{name:'Check my choice'}).click();
    assert.match(await page.locator('.rule-feedback').innerText(),/Correct/i);
    await page.getByRole('button',{name:'Next step'}).click();
    assert.match(await page.locator('.step-card h3').innerText(),/Step 2 of 3/);
    await page.getByRole('button',{name:'Why this rule?'}).click();
    assert.equal(await page.locator('.step-card .note').last().isVisible(),true);
    await page.getByRole('button',{name:'Show all transformations'}).click();
    assert.equal(await page.locator('.all-steps li').count(),3);
    await page.getByRole('button',{name:'Reveal final CAS answer'}).click();
    assert.equal(await page.locator('.answer-area').isVisible(),true);
    await page.locator('.step-card .math mjx-container').first().waitFor({timeout:30000});
    await page.screenshot({path:path.join(reports,'tutor-step-zero.png'),fullPage:true});

    // Calculator Mode shows the answer immediately, without tutor questions.
    await page.locator('#study-mode').selectOption('calculator');
    assert.equal(await page.locator('.walkthrough').count(),0);
    assert.match(await page.locator('#output').innerText(),/Calculator Mode/i);
    assert.match(await page.locator('#output').innerText(),/CAS answer/i);
    await page.locator('#study-mode').selectOption('tutor');
    assert.match(await page.locator('.step-card h3').innerText(),/Step 0/);
    assert.equal(await page.locator('.answer-area').isVisible(),false);

    // Changing the derivative resets the lesson and still traces real rules.
    await page.locator('#expression').fill('x*sin(x)');
    await page.getByRole('button',{name:'Start guided practice'}).click();
    assert.match(await page.locator('.step-card h3').innerText(),/Step 0/);
    await page.getByRole('button',{name:'Reveal step 1'}).click();
    assert.match(await page.locator('.step-card h3').innerText(),/Product rule/);

    // Non-derivatives stay explicit about the lack of a validated trace.
    await page.locator('#operation').selectOption('integrate');
    await page.locator('#expression').fill('x^2');
    await page.getByRole('button',{name:'Start guided practice'}).click();
    assert.equal(await page.locator('.walkthrough').count(),0);
    assert.match(await page.locator('#output').innerText(),/Step-by-step tracing is currently available for derivatives only/);

    // One-file offline build must include the identical practice experience.
    const single=await browser.newPage({viewport:{width:1060,height:800}});
    observe(single);
    await single.goto(pathToFileURL(path.join(root,'offline','calculus-lab-single-file.html')).href,
      {waitUntil:'load',timeout:30000});
    await single.locator('.step-card h3').waitFor({timeout:30000});
    assert.match(await single.locator('.step-card h3').innerText(),/Step 0/);
    await single.locator('.step-card .math mjx-container').first().waitFor({timeout:30000});
    await single.locator('#next-rule').selectOption('power');
    await single.getByRole('button',{name:'Check my choice'}).click();
    assert.match(await single.locator('.rule-feedback').innerText(),/Correct/);
    await single.getByRole('button',{name:'Reveal step 1'}).click();
    await single.locator('.step-card .math mjx-container').first().waitFor({timeout:30000});
    await single.screenshot({path:path.join(reports,'single-file-step-zero.png'),fullPage:true});
    assert.deepEqual(remoteRequests,[],'An offline package attempted network requests');
    assert.deepEqual(pageErrors,[],'Uncaught browser JavaScript errors');
    console.log('PASS: Tutor Step 0, typed steps, rule quiz, quick mode, offline folder and standalone HTML.');
  } finally {
    await browser.close();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
