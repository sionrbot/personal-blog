import { expect, test } from '@playwright/test';

test('built minimal homepage is readable and styled at its project base', async ({
  page,
}, testInfo) => {
  const response = await page.goto('./');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Sion 的博客');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Sion 的博客',
  );
  await expect(
    page.getByText('记录开发过程中的学习、实践与思考。'),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    process.env.GITHUB_REPOSITORY === 'sionrbot/personal-blog-acceptance'
      ? 'https://sionrbot.github.io/personal-blog-acceptance/'
      : 'https://sionrbot.github.io/personal-blog/',
  );
  await expect(page.locator('body')).toHaveCSS('margin-top', '0px');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('homepage.png'),
    fullPage: true,
  });
});
