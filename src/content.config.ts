import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    stack: z.array(z.string()),
    role: z.string(),
    company: z.string().optional(),
    url: z.string().url().optional(),
    github: z.string().url().optional(),
    featured: z.boolean().default(false),
    lang: z.enum(['en', 'es']).default('en'),
    metrics: z
      .object({
        users: z.string().optional(),
        impact: z.string().optional(),
        timeline: z.string().optional(),
      })
      .optional(),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    // Real demonstrations rendered on the case study page. All optional —
    // drop assets in public/demos/ and reference them here.
    demo: z
      .object({
        live: z.string().url().optional(),
        video: z
          .object({
            src: z.string(),
            poster: z.string().optional(),
            caption: z.string().optional(),
          })
          .optional(),
        gallery: z
          .array(
            z.object({
              src: z.string(),
              alt: z.string(),
              caption: z.string().optional(),
            })
          )
          .optional(),
      })
      .optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    lang: z.enum(['en', 'es']).default('en'),
  }),
});

export const collections = { projects, blog };
