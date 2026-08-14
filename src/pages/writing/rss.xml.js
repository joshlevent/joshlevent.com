import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('writing', ({ data }) => !data.draft);
  return rss({
    title: 'Josh Levent — Writing',
    description: 'Essays on economics, design and being human.',
    site: context.site,
    items: posts
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((p) => ({
        title: p.data.title,
        description: p.data.description ?? '',
        pubDate: p.data.date,
        link: `/writing/${p.id}/`,
      })),
  });
}
