import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// One place to preserve old Squarespace URLs. Add a line whenever you move a page.
// Left = old path, right = new path. Astro emits a redirect page for each.
const redirects = {
  '/home': '/',
  // Talks moved under /talks/
  '/ted-talk-2016': '/talks/ted-talk-2016',
  '/ted-talk-2013': '/talks/ted-talk-2013',
  '/the-red-pill': '/talks/the-red-pill',
  '/stories-define-our-lives': '/talks/stories-define-our-lives',
  // Business Design projects moved under /business-design/
  '/eomo': '/business-design/eomo',
  '/made-in-italy-designed-in-india': '/business-design/made-in-italy-designed-in-india',
  '/gtfu': '/business-design/gtfu',
  '/muutu': '/business-design/muutu',
  '/cassarius': '/business-design/data-center-automation',
  // Coaching offers moved under /coaching/
  '/entrepreneurship-trainer': '/coaching/entrepreneurship-trainer',
  '/for-therapists': '/coaching/for-therapists',
  '/tedx-coaching': '/coaching/tedx-coaching',
  '/general-coaching': '/coaching/general-coaching',
  // Blog posts: drop the date segments, keep the slug
  '/writing/2023/4/6/swiss-income-tax-for-high-earners': '/writing/swiss-income-tax-for-high-earners',
  '/writing/2023/3/17/party-in-the-land-of-babel': '/writing/party-in-the-land-of-babel',
  '/writing/2021/07/04/we-need-bold-new-ideas-for-the-great-reset': '/writing/we-need-bold-new-ideas-for-the-great-reset',
  '/writing/2019/9/21/no-self-worth-required': '/writing/no-self-worth-required',
  '/writing/2019/9/5/choose-discomfort': '/writing/choose-discomfort',
  '/writing/2018/8/4/a-memory-from-2006': '/writing/a-memory-from-2006',
  '/writing/2018/8/4/self-acceptance': '/writing/self-acceptance',
  '/writing/2016/4/26/what-is-business-design': '/writing/what-is-business-design',
};

export default defineConfig({
  site: 'https://joshlevent.com',
  trailingSlash: 'ignore',
  redirects,
  integrations: [sitemap()],
});
