import { test, expect } from '@playwright/test';

test('static chart archives and artist histories work without JavaScript', async ({ browser }) => {
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 await page.goto('/explore/charts/pop/');
 await page.getByRole('link',{name:'Explore the latest chart →'}).click();
 await expect(page.locator('tbody tr')).not.toHaveCount(0);
 await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',/https:\/\/trivia.rocks\/explore\/charts\/pop\/\d{4}-\d{2}-\d{2}\//);
 const name=await page.locator('tbody tr').first().getByRole('link').innerText();
 await page.locator('tbody tr').first().getByRole('link').click();
 await expect(page.getByRole('heading',{level:1})).toHaveText(name);
 await expect(page.locator('.stats').getByText('Best observed rank',{exact:false})).toBeVisible();
 await page.locator('.song-group').first().locator('.song-weeks > summary').click();
 await page.locator('.song-group').first().locator('tbody tr').first().getByRole('link').click();
 await expect(page.getByRole('link',{name:'Play this week'})).toHaveAttribute('href',/mode=specific&week=/);
 await context.close();
});

test('artist search, genre directory and licensed photo', async ({ page }) => {
 await page.goto('/explore/artists/');
 await page.getByRole('searchbox',{name:'Search artists'}).fill('Taylor Swift');
 await expect(page.locator('#artist-status')).toContainText('matches');
 await page.locator('#artist-results').getByRole('link').filter({has:page.getByText('Taylor Swift',{exact:true})}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Taylor Swift');
 await expect(page.getByRole('img',{name:'Taylor Swift'})).toBeVisible();
 await expect(page.locator('figcaption')).toContainText('CC BY 3.0');
 await page.goto('/explore/artists/genre/country/');
 await expect(page.getByRole('heading',{level:1})).toHaveText('Country artists');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('year suggestions link to real artist pages', async ({ page }) => {
 await page.route('**/rest/v1/rpc/get_chart_date_range',r=>r.fulfill({json:[{min_date:'1958-08-04',max_date:'2026-11-07'}]}));
 await page.goto('/trivia/pop/?mode=quick&era=2020');
 await expect(page.locator('.artist-suggestions a').first()).toBeVisible();
 const href=await page.locator('.artist-suggestions a').first().getAttribute('href');
 expect((await page.request.get(href!)).status()).toBe(200);
});


test('artist songs are grouped and chart journeys support keyboard inspection', async ({ page }, testInfo) => {
 await page.goto('/explore/artists/death-cab-for-cutie-q8xi0y/');
 const cards=page.locator('.song-group');
 await expect(cards).toHaveCount(18);
 const names=await page.locator('.song-summary strong').allTextContents();
 expect(new Set(names).size).toBe(18);
 const first=cards.first();
 await expect(first).toHaveAttribute('open','');
 const svg=first.locator('.rank-journey').first();
 await expect(svg).toBeVisible();
 const points=JSON.parse((await svg.getAttribute('data-series'))!);
 await svg.focus();await page.keyboard.press('Home');
 await expect(first.locator('.journey-value').first()).toHaveText(`${points[0][0]} · No. ${points[0][1]}`);
 await page.keyboard.press('End');
 await expect(first.locator('.journey-value').first()).toHaveText(`${points.at(-1)[0]} · No. ${points.at(-1)[1]}`);
 const box=(await svg.boundingBox())!;
 await svg.dispatchEvent('pointerdown',{clientX:box.x+2,clientY:box.y+2});
 await expect(first.locator('.journey-value').first()).toHaveText(`${points[0][0]} · No. ${points[0][1]}`);
 const weekLink=first.locator('.journey-week').first();
 expect((await page.request.get((await weekLink.getAttribute('href'))!)).status()).toBe(200);
 await first.locator('.song-weeks > summary').click();
 await expect(first.locator('tbody tr').first()).toBeVisible();
 await first.locator('.song-weeks > summary').click();
 await first.scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('song-journey.png')});
 await cards.nth(1).locator(':scope > summary').click();
 await expect(cards.nth(1).locator('.rank-journey').first()).toBeVisible();
});


test('old appearance pagination links lead to the grouped artist overview', async ({ page }) => {
 await page.goto('/explore/artists/death-cab-for-cutie-q8xi0y/page/4/');
 await expect(page).toHaveURL(/\/death-cab-for-cutie-q8xi0y\/$/);
 await expect(page.locator('.song-group')).toHaveCount(18);
});

test('album names and covers appear on artist cards and their chart weeks', async ({ page }, testInfo) => {
 await page.route('https://*.mzstatic.com/**', route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#41656b"/></svg>'}));
 await page.goto('/explore/artists/death-cab-for-cutie-q8xi0y/');
 // Use the exact summary title rather than matching repeated release metadata.
 const card=page.locator('.song-group').filter({has:page.getByText('Soul Meets Body',{exact:true})});
 await card.locator(':scope > summary').click();
 await expect(card.locator('.release-detail .release-name')).toHaveText('Plans');
 await expect(card.locator('.release-cover')).toBeVisible();
 await expect(card.locator('.release-detail a').last()).toHaveAttribute('href',/^https:\/\/music.apple.com\//);
 const week=await card.locator('.journey-week').first().getAttribute('href');
 await page.goto(week!);
 const row=page.locator('tbody tr').filter({has:page.getByText('Soul Meets Body',{exact:false})});
 await row.scrollIntoViewIfNeeded();
 await expect(row.locator('.chart-cover')).toBeVisible();
 await expect(row.locator('.release-name')).toHaveText('Plans');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('chart-covers.png')});
});

test('unavailable cover metadata leaves chart songs usable', async ({ page }) => {
 await page.route('**/release-data/**',route=>route.fulfill({status:503,body:''}));
 await page.goto('/explore/charts/pop/2005-09-03/');
 await expect(page.locator('tbody tr').first()).toBeVisible();
 await expect(page.getByRole('link',{name:'Play this week'})).toBeVisible();
 await expect(page.locator('.chart-cover')).toHaveCount(0);
});
