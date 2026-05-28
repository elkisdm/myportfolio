export const languages = {
  en: 'English',
  es: 'Español',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

export const translations = {
  en: {
    'nav.home': 'Home',
    'nav.work': 'Work',
    'nav.blog': 'Blog',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'hero.tagline': 'I spot the business problem. I build the full solution.',
    'hero.sub': 'Product engineer. TypeScript, Supabase, AI. Zero to 4,100 commits in 12 months.',
    'hero.cta': 'See my work',
    'section.featured': 'Featured Projects',
    'section.methodology': 'How I Build',
    'section.blog': 'Writing',
    'footer.built': 'Built with Astro, TypeScript & discipline.',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.work': 'Trabajo',
    'nav.blog': 'Blog',
    'nav.about': 'Sobre mí',
    'nav.contact': 'Contacto',
    'hero.tagline': 'Identifico problemas de negocio. Construyo la solución completa.',
    'hero.sub': 'Product engineer. TypeScript, Supabase, IA. De cero a 4,100 commits en 12 meses.',
    'hero.cta': 'Ver mi trabajo',
    'section.featured': 'Proyectos Destacados',
    'section.methodology': 'Cómo Construyo',
    'section.blog': 'Escritura',
    'footer.built': 'Hecho con Astro, TypeScript y disciplina.',
  },
} as const;
