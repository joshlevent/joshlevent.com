import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const imageAsset = z.object({
  src: z.string().startsWith('/images/'),
  alt: z.string().min(1),
  presentation: z.enum(['inline', 'compact-inline', 'page-background']).optional(),
});

// "pages" = standalone content pages (bio, teaching, research, now, ...).
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    nav: z.string().optional(),        // short label used in menus
    hero: imageAsset.optional(),
    gallery: z.array(imageAsset).default([]),
    updated: z.string().optional(),
  }),
});

// "writing" = the blog. Add a .md file here to publish a post.
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    hero: imageAsset.optional(),
    thumbnail: imageAsset,
    draft: z.boolean().default(false),
  }),
});

// "talks" = public speaking. Each file is one talk.
const talks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(0),
    description: z.string().optional(),
    youtube: z.string().optional(),
    hero: imageAsset.optional(),
    thumbnail: imageAsset,
  }),
});

// "projects" = Business Design case studies.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(0),
    client: z.string().optional(),
    description: z.string().optional(),
    hero: imageAsset.optional(),
    thumbnail: imageAsset,
    gallery: z.array(imageAsset).default([]),
  }),
});

// "examples" = Power BI examples with DAX / Power Query code (served under /power-bi/examples/).
const examples = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/examples' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().default(0),
    pbix: z.string().startsWith('/files/').optional(),
  }),
});

// "pieces" = interactive projects and demos (served under /projects/).
const pieces = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pieces' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(0),
    year: z.string().optional(),
    description: z.string().optional(),
    thumbnail: imageAsset,
    hero: imageAsset.optional(),
    gallery: z.array(imageAsset).default([]),
    launch: z.object({ href: z.string(), label: z.string() }).optional(),
    status: z.string().optional(),
  }),
});

export const collections = { pages, writing, talks, projects, examples, pieces };
