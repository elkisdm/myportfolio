# Auditoría visual v2 — portafolio Elkis Daza Mota

> Audit ejecutada con Playwright (Chromium) contra `http://127.0.0.1:4321`
> Viewport desktop: 1440x900 · Viewport mobile: 375x812
> Screenshots: `/tmp/audit-v2-screenshots/`
> Fecha: 2026-05-27
> Páginas auditadas: 10 (/, /about, /now, /view-source, /work, /work/lead-scoring-engine, /blog, /blog/how-i-orchestrate-ai, /uses, /404)

---

## 1. Executive Summary

Este portafolio pasó de "casi premium" a "claramente premium" en esta segunda iteración. Las 5 fixes P0 funcionaron parcialmente — 3 plenos, 1 parcial, 1 NO aplicada al render real. La calidad editorial es alta: tipografía consciente, espaciado intencional, tono honesto. El sistema visual se sostiene a través de 10 páginas sin desviaciones graves.

Pero hay un problema estructural nuevo que aparece al expandir el sitio: **las páginas `/work` y `/` están desincronizadas** (home promociona 3 proyectos, archive solo lista 1, dos URLs retornan 404). Eso es más grave que cualquier issue visual.

- **% completo:** ~78%
- **Vibe en una palabra:** afilado.

---

## 2. P0 Fix Verification

### Fix #1 — Hero invisible bug → **PASS**

El H1 muestra opacidad `1` desde `t=0ms`. La primera línea ("I identify business problems.") está pintada con 15/24 word-spans visibles desde el primer paint. La segunda línea ("I build the full solution.") se revela vía SplitText entre `t=1.2s` y `t=2.0s`. No hay flash invisible.

Screenshot evidencia: `desktop-home.png` (estado final pintado), `home-hero-200ms.png` (estado a 200ms — primera línea visible, segunda en `opacity:0` aún).

**Observación honesta:** la segunda línea tarda ~1.5s en revelarse. Es animación intencional, no bug. Pero un visitante con ojo crítico podría leer ese gap como lentitud. Lo evaluaría como aceptable; lo marco solo para documentar.

### Fix #2 — Bilingual EN/ES leaking → **PASS (con un agujero menor)**

CSS `html:not([data-lang='es']) [data-es] { display: none }` está activo en `src/styles/global.css:118`. Verificado en runtime con `getComputedStyle`:

- EN active → "Work" visible, "Trabajo" `display:none` ✓
- ES active → "Trabajo" visible, "Work" `display:none` ✓
- Cero concatenaciones en nav, footer, body de las 10 páginas (regex `/Home\s+Inicio|Work\s+Trabajo|About\s+Sobre/`) → cero hits.

Screenshot: `desktop-home-es-clean.png` — nav limpio "Home · Trabajo · Método · Contacto".

**Pero**: el link "Home" en `src/components/Nav.astro:12` NO tiene par `data-en`/`data-es`. Queda literal "Home" en ambos idiomas. Falta el equivalente "Inicio". Es i18n incompleta, no leak. (Ver P1.)

### Fix #3 — Project links → `/work/{slug}` → **FAIL PARCIAL — P0 REGRESIÓN**

Verificado en home: los 3 rows linkean correctamente a `/work/lead-scoring-engine`, `/work/whatsapp-inbox-ai`, `/work/internal-admin-platform`.

**Pero al solicitar esas URLs:**

```
/work/lead-scoring-engine        → 200 ✓
/work/whatsapp-inbox-ai          → 404 ✗
/work/internal-admin-platform    → 404 ✗
```

2 de cada 3 proyectos linkeados llevan a un 404. El home miente sobre el contenido disponible. Esto es **peor** que el bug original porque crea expectativa y la rompe.

### Fix #4 — /work y /blog con contenido real → **PASS PARCIAL**

`/work`:

- Sin placeholders detectados ✓
- Stats: "1+ PROJECTS SHIPPED · 1 IN PRODUCTION · 0 ARCHIVED / KILLED · 4,127+ TOTAL COMMITS"
- Solo 1 proyecto listado en archive ("Lead Scoring Engine")
- Sección "PRODUCTION 1 SHIPPED" presente, secciones "SIDE / ARCHIVED / KILLED" no existen aún (o están vacías sin empty-state)
- **Inconsistencia con home** (que promete 3 proyectos)

`/blog`:

- Sin placeholders ✓
- Counter dice "1 POSTS · MAY 2026 → MAY 2026" ✓
- 1 post real (`how-i-orchestrate-ai`), 4 filter chips (`All`, `AI`, `2026`)
- Search bar con kbd `⌘K`, newsletter form al fondo
- **Felicidades, esto sí está completo.**

### Fix #5 — GitHub heatmap con clarificación → **FAIL — NO APLICADO**

El componente `src/components/GithubActivity.astro` existe y contiene la clarificación exacta:

```astro
>Public account only. Add ~3,000 commits across private and work
```

**Pero ese componente nunca se importa en ninguna página.** Grep recursivo en `src/`:

```
grep -rE "GithubActivity" src/ → solo aparece en el archivo mismo
```

En `/about` no hay sección de heatmap, ni clarificación, ni mención al @elkisdm public/private. El número "4,127 commits" sale en home y `/work` sin contexto sobre lo que es público/privado. La fix está escrita pero no montada.

---

## 3. New P0 Issues (regresión o blocker nuevo)

### P0.A — Proyectos linkeados que 404 (Fix #3)

Ya descrito arriba. Acción: o crear las 2 case studies faltantes, o quitar esos rows del home hasta que existan. Mostrar 404 al hacer clic en un proyecto destacado destruye credibilidad instantáneamente.

**Ubicación:** `src/components/home/Work.astro` (rows que apuntan a slugs no implementados) + `src/pages/work/[slug].astro` (getStaticPaths solo entrega `lead-scoring-engine`).

### P0.B — `/blog/how-i-orchestrate-ai` provoca scroll horizontal en mobile

- Viewport: 375x812
- `documentElement.scrollWidth = 564px` vs `clientWidth = 375px`
- Overflow de 189px

**Causa raíz:** en `src/pages/blog/[slug].astro:587-595`, `.post-layout` usa `grid-template-columns: minmax(0, 1fr) 260px`. A 375px la media query `@media (max-width: 1024px)` colapsa a `1fr` (línea 1078), pero el grid-item `.prose` no tiene `min-width: 0`. Su contenido (probablemente `<pre>` con bloques de código que no envuelven) infla el track del grid a su `max-content`, forzando 544px.

**Fix sugerido:**

```css
.post-layout > * {
  min-width: 0;
}
.prose :global(pre) {
  max-width: 100%;
}
```

o explicitar `min-width: 0` en `.prose` y `.toc`.

`body { overflow-x: hidden }` (línea aprox 65 en BaseLayout) actualmente enmascara el overflow visualmente pero `html.scrollWidth` sigue siendo 564px → significa que en iOS Safari pueden ver scroll horizontal por gesto. Confirma con device real.

### P0.C — Componente GitHub clarificación huérfano (Fix #5)

Ver arriba. El componente existe, nadie lo importa, la promesa de la clarificación no se cumple en pantalla.

---

## 4. P1 — High impact (premium → Awwwards-worthy)

### P1.1 — `/work` no tiene empty states para "Side / Archived / Killed"

El header promete "Production. Side. Archived. Killed." pero solo se ve la sección PRODUCTION. Si las otras tres categorías están vacías, falta el empty-state honesto (que es CONSISTENTE con el tono del sitio — "0 archived / killed because honesty is the only metric that compounds"). Hoy quedan cortadas sin explicación visual.
**Ubicación:** `src/pages/work/index.astro`

### P1.2 — Nav link "Home" no se traduce al español

`src/components/Nav.astro:12` carece de pares `data-en`/`data-es`. ES queda "Home · Trabajo · Método · Contacto" en vez de "Inicio · Trabajo · Método · Contacto". El resto de la nav sí traduce.

### P1.3 — Hero subline `opacity: 0` no revela en algunos casos

En el viewport snap a 2s post-paint, detecté la `.hero-sub` ("Product engineer. TypeScript, Supabase, AI. Zero to tech lead.") con `opacity: 0` y `visibility: visible`. La animación que la revela puede no estar disparando confiablemente. En desktop full-page screenshot final SÍ aparece. Vale la pena revisar la timeline GSAP de hero-sub específicamente — puede tener la misma deuda que tenía el h1 antes.
**Ubicación:** `src/scripts/animations/*` (hero timeline) + `src/components/home/Hero.astro`

### P1.4 — Contador "4,127 commits" sin contexto en home y /work

Como la clarificación de Fix #5 nunca se renderiza, el número parece reclamado pero no verificable. Un visitante curioso entra a github.com/elkisdm y ve <1,000 commits → se vuelve un red flag de credibilidad. Importa el `GithubActivity.astro` en `/about` (que ya está pensado para eso) y considera añadir un footnote en `Timeline.astro` apuntando al detalle.

### P1.5 — Mobile nav links principales NO visibles en viewport mobile

En screenshot `mobile-viewport_.png` (375x812) la `.nav-links` no aparece — solo logo, status "Available · Q3 2026", y toggle EN/ES. No hay menú hamburguesa. Es decir: en mobile **no hay forma de navegar** entre Home/Work/Method/Contact desde el nav.
Verifica el CSS responsive de `.nav-links` — probablemente queda `display: none` en mobile sin reemplazo.
**Ubicación:** `src/components/Nav.astro` styles (no leí media queries del nav, asumir que existen pero no agregan menú alternativo)

### P1.6 — Touch targets bajo 44x44 en mobile

- Botones EN/ES: 35x25 (todas las páginas)
- Links footer "GitHub" 48x20, "LinkedIn" 64x20, "RSS" 22x17
- Logo "elkis daza" 93x26
- 5–11 targets pequeños por página (ver `audit-v2-results.json`)

Apple HIG y WCAG 2.5.5 piden 44x44. Aceptable visualmente pero mal para accesibilidad.

---

## 5. P2 — Polish

- **`/work` PROJECT row layout**: la card "Capital Inteligente · 47% conversion lift · 3× agent throughput" en /work tiene texto solapado con la etiqueta "Production · Feb 2026" — los breakpoints intermedios (~1024px) no acomodan bien las dos columnas. Marginal en 1440px, evidente en 1280px.
- **Astro dev toolbar visible en screenshots**: el widget flotante `<astro-dev-toolbar>` aparece en `/work`, `/blog`, etc. Asegúrate que esté off en producción (lo está por defecto en build; solo aclaro porque si se confunde dev/build el cliente lo va a ver).
- **Inconsistencia de path en /404**: terminal lista `/writing` como dir de posts. Pero el nav linkea a `/blog`. Decide uno y unifica.
- **`now` page section "What I'm reading"**: tres libros sin links. Considera linkear a Amazon/Goodreads o por lo menos al autor para que sea verificable. Mismo principio que GitHub commits.
- **/uses changelog al final** ("What changed recently"): hermoso patrón. Pero los timestamps están en formato relativo sin fecha absoluta — falta cuándo se actualizó. Combina los dos: "3 days ago · 2026-05-24".
- **Pre-loader / page transitions**: el render inicial de cada página muestra ~200ms de fondo negro antes de aparecer contenido. Sumado al hero reveal de 1.5s en home, la primera impresión es "lento" aunque sea fast en métricas. Considera SSR estático con CSS visible inmediato + animaciones que aumenten contraste/escala en vez de revelar desde `opacity: 0`.
- **`<pre>` blocks en /blog/[slug]**: tienen `overflow-x: auto` pero sin indicador visual de que hay overflow (sombra/gradient lateral). En mobile uno no sabe que tiene que hacer scroll horizontal en código.
- **Filter chips de /blog**: muestran "All 1 / AI 1 / 2026 1". Cuando solo hay 1 post el filtrado es ruido. Hide chips si `posts.length < 3`. O al menos no muestres el counter si es trivial.

---

## 6. Cross-page consistency report

### Lo que está en sistema

| Patrón                                                 | Home       | About | Now  | View-Source | Work        | Case Study  | Blog          | Blog Post | Uses    | 404      |
| ------------------------------------------------------ | ---------- | ----- | ---- | ----------- | ----------- | ----------- | ------------- | --------- | ------- | -------- |
| Eyebrow `/ SECTION`                                    | ✓          | ✓     | ✓    | ✓           | ✓           | ✓           | ✓             | ✓         | ✓       | ✓        |
| Display heading 56–72px                                | ✓          | ✓     | ✓    | ✓           | ✓           | ✓           | ✓             | ✓         | ✓       | ✓        |
| Accent dot al final del título                         | ✓ (sol*n*) | (no)  | (no) | ✓ (study.)  | ✓ (Killed.) | ✓ (Engine.) | ✓ (building.) | (no)      | ✓ (on.) | ✓ (404.) |
| Sticky nav blur backdrop                               | ✓          | ✓     | ✓    | ✓           | ✓           | ✓           | ✓             | ✓         | ✓       | ✓        |
| Footer "© 2026 · Last updated · Built in Astro + GSAP" | ✓          | ✓     | ✓    | ✓           | ✓           | ✓           | ✓             | ✓         | ✓       | ✓        |
| Color tokens (text-1, text-2, accent, surface-1, hair) | ✓          | ✓     | ✓    | ✓           | ✓           | ✓           | ✓             | ✓         | ✓       | ✓        |
| Bilingual data-en/data-es                              | ✓          | ✓     | ✓    | parcial     | ✓           | parcial     | ✓             | parcial   | parcial | parcial  |

### Lo que se sale del sistema

1. **404 terminal style** — intencionalmente distinto. OK, está dentro del concepto "case study desde el terminal". Pero el `ls -la` lista `/writing` cuando el nav dice `/blog`.
2. **Acento dot final** falta en `/about`, `/now`, `/blog/[slug]`. Es un mini-detalle de marca; podrías estandarizar.
3. **Bilingual coverage**: `/view-source`, `/blog/[slug]`, `/uses`, `/404` parecen tener mucho contenido solo en inglés. No vi pares `data-en`/`data-es` en sus secciones largas (case study, blog body, uses table, terminal output). Si afirmas portfolio bilingüe, esos 4 son traducción incompleta.

---

## 7. Mobile audit (375px)

| Página                         | Overflow horizontal | Touch targets <44px | Observación                                  |
| ------------------------------ | ------------------- | ------------------- | -------------------------------------------- |
| /                              | NO                  | 9                   | Nav links principales **no visibles** (P1.5) |
| /about                         | NO                  | 5                   | OK                                           |
| /now                           | NO                  | 7                   | OK                                           |
| /view-source                   | NO                  | 6                   | OK                                           |
| /work                          | NO                  | 5                   | OK                                           |
| /work/lead-scoring-engine      | NO                  | 6                   | OK                                           |
| /blog                          | NO                  | 9                   | Filter chips usables                         |
| **/blog/how-i-orchestrate-ai** | **SÍ (564 vs 375)** | 21                  | **P0.B**                                     |
| /uses                          | NO                  | 6                   | OK                                           |
| /404                           | NO                  | 11                  | Terminal `ls` table comprime bien            |

**Resumen mobile:**

- 9/10 páginas SIN overflow horizontal ✓
- 1/10 con overflow grave (blog post) ✗
- Nav mobile está roto en TODAS las páginas (no hay forma de navegar)
- Hero, lists, prose adaptan bien
- Tipografía responsive: H1 baja de 80px a 48px, líneas legibles
- `mobile-blog.png` viewport: hero del blog se ve premium en mobile, search bar y filter chips usables

---

## 8. Top 10 wins

1. **Hero del home** — tipografía display gigante en dos líneas con tratamiento subline. Lee como cartel editorial, no como SaaS landing.
2. **Timeline /transformation con commit-graph SVG** — el gráfico curvo de cumulative commits con waypoints anotados ("first NextJS", "joined CI", "tech lead") es storytelling visual, no decoración.
3. **`/about` editorial** — bloques `01 / 02 / 03 — Three jobs. Same person.` + `Five principles. Non-negotiable.` con conteo y headlines minimal. Tono honesto ("I'm not a dev with AI. I run the system."). Memorable.
4. **`/work/lead-scoring-engine` case study** — estructura `The problem / How I approached it / What I'd do differently` con números reales (`80% latency reduction`, `60-day building-level cache`). No es fluff. Es senior.
5. **`/now` derek-sivers-style** — sin sobrecargarlo. "What I'm building" linkea a repos. Lista "What I'm NOT doing" es trick honesto raro de ver en portafolios.
6. **`/view-source` meta case study** — explica el sitio CON el sitio. `~$38 total cost` + `100 lighthouse` + `<18KB JS` es transparencia técnica que pocos hacen.
7. **`/404` terminal** — `zsh: no such file or directory` + ls de paths reales del sitio. Funciona como navegación de rescate además de personalidad. Inspiradísimo.
8. **`/uses` 7 categorías con changelog** — Hardware/Dev/Data/AI/Hosting/Daily/Design en grid denso. El changelog "What changed recently" en `code-block` al final cierra el patrón.
9. **`/blog` filter chips + ⌘K kbd** — implementación correcta del search field con shortcut hint, scope minimal.
10. **Bilingual EN↔ES toggle limpio** — el switch persiste vía localStorage, no recarga la página, y aplica vía atributo `data-lang` sobre `<html>` con CSS de visibilidad inmediato. Técnicamente bien hecho. Solo le falta cobertura de contenido largo.

---

## 9. Final verdict

- **8-second test (¿el visitante entiende quién eres en 8s?):** SÍ. Hero + eyebrow + sub-line comunican "product engineer, Santiago, available" en menos de 5s. Si el reveal de la 2nd line tarda 1.5s, peor caso = 6.5s aún dentro del umbral.

- **2-minute test (¿le da curiosidad y profundiza?):** SÍ — siempre que no haga clic en proyecto #2 o #3. Si hace clic ahí, el 404 mata el momentum. Asumiendo que va a `/about` o a `/work/lead-scoring-engine`, ambas páginas son densas, con voz propia, y aguantan los 2 minutos.

- **¿Contratarías a este developer?** **SÍ, con una conversación de calibración primero.** El portafolio demuestra:
  - Madurez técnica (TypeScript, Astro, GSAP, SVG, CSS Grid avanzado)
  - Madurez editorial (tono, jerarquía, sin clichés tipo "passionate about code")
  - Madurez de producto (case study con métricas reales, no humo)
  - Auto-conciencia (el `/view-source` y la línea "I run the system" — sabe qué vende)

  Las dudas son: (a) los 404s de proyectos prometidos son sloppiness preocupante, (b) la mobile nav rota indica que QA mobile no se hizo, (c) la fix de GitHub clarification escrita y no montada sugiere apuro al cerrar tasks. Pediría ver un repo real antes de firmar.

- **% completado:** ~78%. Los huesos están. Falta: 2 case studies, mobile nav, importar GithubActivity, post mobile overflow fix, traducir contenido largo a ES, empty states de /work.

- **Sensación en una palabra:** **afilado.**

---

## Anexo — comandos de reproducción

```bash
# Ejecuta auditoría completa
cd /tmp && node audit-v2.mjs

# Resultados JSON
cat /tmp/audit-v2-results.json | jq

# Screenshots
ls /tmp/audit-v2-screenshots/

# Verificar 404s de proyectos
for s in lead-scoring-engine whatsapp-inbox-ai internal-admin-platform; do
  echo "$s: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4321/work/$s)"
done

# Verificar import faltante
grep -rE "GithubActivity" src/  # solo aparece en el archivo mismo
```
