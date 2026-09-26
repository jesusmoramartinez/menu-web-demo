# Continuidad del proyecto — guía paso a paso

Este documento es para vos (el dueño del proyecto), no para el asistente. Está escrito para
poder retomarlo después de semanas sin tocarlo, sin dar nada por sabido: cada comando va con el
porqué. Tiene dos partes independientes — leé la que necesites, no hace falta la otra.

- **Parte A:** cómo pedir un cambio o pulido al proyecto de forma segura.
- **Parte B:** cómo dar de alta un restaurante real y venderle el producto.

Documentos relacionados (éste los enlaza, no los repite): `CLAUDE.md` (arquitectura, para el
asistente), `docs/deploy.md` (poner el proyecto en producción), `docs/alta-restaurante.md`
(checklist técnico de alta), `docs/manual-mozo-cocina.md` (para el personal del cliente).

---

## Parte A — Pedir un cambio o pulido al proyecto

### 1. Ubicar la carpeta correcta

Trabajá siempre sobre **una sola carpeta**, la de siempre (hoy:
`/home/yisus/Projects/menu-web/menu-web-demo`). Si en algún momento encontrás una copia vieja del
proyecto en otro lado (un backup, una carpeta "menu-web-old", algo que te mandaste por otro
medio), **no la uses para trabajar** — es una fuente de confusión: dos copias, dos historiales de
git, cambios que se pisan. Elegí cuál es la buena (la que tiene el commit más reciente y sin
cambios sueltos — ver el paso siguiente), actualizá la otra si hace falta algo que tenía, y
borrala. Así se resolvió una copia vieja en esta misma sesión.

### 2. Antes de empezar, mirá en qué estado quedó

Abrí una terminal en la carpeta del proyecto y corré:

```bash
git status
git log --oneline -5
```

`git status` te dice si quedaron cambios de una sesión anterior sin subir (no debería, pero
pasa). Si aparece algo, no sigas sin entender qué es — preguntale a Claude Code "¿qué cambios hay
sin commitear y por qué?" antes de tocar nada. `git log` te muestra los últimos commits, para
ubicarte en qué se hizo último.

### 3. Variables de entorno (`.env.local`)

La app necesita conectarse a Supabase (la base de datos) para funcionar en tu máquina. Esa
conexión se configura en un archivo llamado `.env.local`, en la raíz del proyecto (al lado de
`package.json`). Este archivo:

- **No se sube a GitHub** (está en `.gitignore`, por el patrón `*.local`) — es información de tu
  máquina, no del código.
- Si no existe, hay que crearlo con este contenido:

  ```
  VITE_SUPABASE_URL=https://oopowxlxpwsjpmpyuckm.supabase.co
  VITE_SUPABASE_ANON_KEY=<la clave anon>
  ```

  La URL de arriba es la del proyecto Supabase de **desarrollo** (el que usa este repo hoy, ver
  `CLAUDE.md` §1). La clave (`VITE_SUPABASE_ANON_KEY`) es pública pero no está en el repo por
  prolijidad — se saca del dashboard de Supabase: entrá a
  [supabase.com/dashboard](https://supabase.com/dashboard), abrí el proyecto, andá a **Project
  Settings → API → Project API keys**, y copiá la que dice **`anon` `public`** (nunca la
  `service_role`, esa es privada y no va en el frontend).

- Si falta este archivo o le faltan estos valores, la app **no arranca**: apenas se carga
  `src/lib/supabase.ts` tira un error y ves la pantalla en blanco. Si te pasa eso, lo primero es
  revisar `.env.local`.

### 4. Instalar dependencias y levantar el proyecto

```bash
npm install    # sólo hace falta si no existe la carpeta node_modules (copia nueva, o borraste algo)
npm run dev    # levanta el servidor de desarrollo en http://localhost:5173
```

Con el servidor corriendo, probá estas URLs para confirmar que todo carga:

- `/` — landing.
- `/demo` — el tenant de demostración (redirige a la vista del comensal).
- `/demo/mozo`, `/demo/cocina`, `/demo/admin` — las otras tres vistas de la demo, sin login.

### 5. Pedir el cambio

Este proyecto tiene un archivo `CLAUDE.md` con toda la arquitectura, convenciones y reglas
específicas (idioma, estilo de código, trampas ya conocidas). Si le pedís el cambio a Claude
Code, lo lee solo y lo sigue. Si el cambio es chico y puntual, pedilo directo. Si es grande o
ambiguo (varias formas de resolverlo, toca muchos archivos), pedile explícitamente que **entre en
plan mode** primero — te va a mostrar un plan antes de tocar código, para que lo apruebes. Así se
armó este mismo documento.

### 6. Antes de cerrar cualquier cambio: los 4 comandos

Sea quien sea el que tocó el código (vos o el asistente), antes de darlo por terminado tienen que
pasar en verde:

```bash
npm run lint        # oxlint — revisa el código sin ejecutar nada
npm run typecheck    # tsc -b — revisa que los tipos de TypeScript cierren
npm test             # vitest run — corre los tests automáticos
npm run build        # compila el proyecto para producción (falla si hay errores de tipos)
```

Si el cambio tocó algo de la base de datos (una migración SQL nueva en
`supabase/migrations/`), además:

```bash
npm run db:push          # aplica la migración nueva al proyecto Supabase vinculado
npm run db:types          # regenera los tipos de TypeScript a partir de la base
npm run db:verify         # 21 checks automáticos de seguridad (RLS/RPCs)
npm run db:verify:staff   # 7 checks más, específicos de operaciones de mozo/cierre de mesa
```

Estos dos últimos scripts existen porque en este proyecto ya hubo un bug de seguridad real que
sólo se detectó corriéndolos (no leyendo el SQL) — ver la nota de la "trampa de lógica de tres
valores" en `CLAUDE.md` §2. No te saltees este paso si tocaste SQL.

### 7. Revisar qué se va a subir

Antes de mandar los cambios a GitHub, mirá qué archivos están involucrados:

```bash
git status
git diff --stat
```

Fijate que no aparezca nada raro: `.env.local`, `node_modules/`, `dist/` nunca deberían estar en
la lista (ya están en `.gitignore`, pero vale la pena el hábito de mirar antes de `git add -A`,
sobre todo si en algún momento alguien tocó el `.gitignore`).

### 8. Commit y push

```bash
git add -A
git commit -m "Descripción corta de qué cambiaste y por qué"
git push origin main
```

Este proyecto trabaja **directo sobre la rama `main`** — así están todos los commits de las Fases
0 a 6 y los de pulido posteriores. No hace falta crear una rama aparte para cambios chicos o
cuando trabajás solo; si en algún momento sumás gente al equipo o el cambio es grande y riesgoso,
ahí sí conviene una rama + Pull Request.

Si el commit lo generó Claude Code, va a agregar una línea de atribución al final del mensaje
(`Co-Authored-By: Claude ... <noreply@anthropic.com>`) — es automático, no hace falta que la
agregues vos.

### 9. Si `git push` falla pidiendo usuario/contraseña

Te va a pasar si es la primera vez que usás git en esa máquina, o si la sesión de GitHub
caducó. El error típico es `fatal: could not read Username for 'https://github.com'`. Se
soluciona autenticando la herramienta `gh` (GitHub CLI, ya viene instalada):

```bash
gh auth login
```

Es un asistente interactivo: preguntas tipo "¿dónde usás GitHub?" (GitHub.com), "¿protocolo?"
(HTTPS), "¿cómo autenticar?" (con navegador). Te va a mostrar un código de un solo uso y abrir el
navegador — pegás el código ahí y confirmás. Para confirmar que quedó bien autenticado:

```bash
gh auth status
```

Tiene que decir `Logged in to github.com account <tu usuario>`. Una vez hecho esto, `git push`
funciona normal (usa las mismas credenciales de `gh`).

### 10. Deploy

Si Vercel tiene el repo de GitHub conectado con deploy automático (lo habitual, y lo más probable
para este proyecto — confirmalo una vez entrando a Vercel → tu proyecto → **Settings → Git**),
**cada `git push origin main` dispara un deploy nuevo solo**, sin ningún paso manual. Después de
un cambio importante, igual conviene entrar a la URL pública y confirmar a ojo que se ve bien
(sobre todo cambios visuales o de rutas).

### 11. Si algo se rompe

`git log --oneline` te muestra el historial. Para deshacer el último cambio sin perder el
historial (recomendado, es reversible):

```bash
git revert HEAD
git push origin main
```

Evitá `git reset --hard` salvo que entiendas bien lo que hace — reescribe el historial y puede
borrar commits para siempre si ya hiciste push. Ante la duda, es mejor preguntar antes de forzar
nada.

---

## Parte B — Dar de alta un restaurante y venderlo

Este proyecto es un **SaaS multi-tenant**: una sola base de datos, y cada restaurante ("tenant")
vive aislado de los demás por reglas de seguridad de la base (RLS — Row Level Security). "Dar de
alta" un cliente nuevo significa crear un restaurante nuevo en esa misma base; técnicamente no
hace falta ni copiar código ni desplegar nada de nuevo, todo pasa dentro de la app ya publicada.

### 1. Punto de partida

El proyecto ya está desplegado y funcionando (Vercel + Supabase). Antes de venderle a alguien,
tené en cuenta la salvedad del punto siguiente.

### 2. Salvedad importante: hoy no hay un Supabase de "producción" separado

Todo el proyecto —incluida la demo pública— corre sobre el proyecto Supabase de **desarrollo**
(`oopowxlxpwsjpmpyuckm`). No existe (todavía) un proyecto separado exclusivo para clientes reales.
Qué implica esto en la práctica:

- **Es más seguro de lo que suena.** El reseteo automático de la demo (`reset_demo()`, que corre
  cada hora por un cron job) sólo borra y recrea **el tenant demo específico** (tiene un id fijo,
  `00000000-0000-4000-8000-000000000001`) — nunca toca otros restaurantes. Se confirmó leyendo la
  función en `supabase/migrations/20260917000400_demo_seed_fn.sql`. Un cliente real no se resetea
  por accidente.
- **Aun así, es la base "de pruebas".** Si en algún momento se aplica una migración nueva que
  sale mal, o se decide resetear todo el proyecto Supabase por algún motivo, un cliente real
  pagando quedaría expuesto a ese riesgo, cosa que no pasaría en un proyecto de producción
  separado.
- **Recomendación:** para el primer cliente (o probar el flujo con alguien conocido), no hace
  falta bloquearse por esto. Antes de tener varios clientes reales pagando, conviene crear el
  proyecto Supabase de producción y migrar (ver `docs/deploy.md` §1) — es un trabajo de una
  tarde, no de semanas.

### 3. No hay cobro ni facturación automática

Es una decisión de producto explícita (fuera del alcance del MVP, ver `docs/plan-producto.md`).
Eso significa: vos acordás el precio y la forma de pago con cada cliente (transferencia,
efectivo, lo que sea) por fuera de la app, y llevás ese registro en otro lado (una planilla, por
ejemplo) — no hay ninguna pantalla dentro del producto que lo trackee.

### 4. El alta técnica: checklist ya escrito

El paso a paso técnico completo (registro, menú, mesas, personal, configuración, prueba final)
ya está en **`docs/alta-restaurante.md`** — seguilo de punta a punta, calculá unos 30 minutos.
Antes de abrirlo, estos son los conceptos que ese documento da por sabidos:

- **`slug`**: la parte del nombre del restaurante que va en la URL de cada mesa
  (`/r/<slug>/m/<token>`). Se genera solo a partir del nombre del restaurante al crearlo, y es
  editable. Tiene que ser única en todo el sistema (dos restaurantes no pueden compartir slug).
- **Token de mesa**: un código al azar, distinto para cada mesa física, que es la parte final de
  esa misma URL. Es lo que codifica el QR que vas a imprimir y pegar en la mesa. Nadie necesita
  memorizarlo ni escribirlo a mano — el QR lo resuelve solo.
- **Invitación**: un código de un solo uso que generás desde `/admin/personal` para cada
  mozo/cocinero. Ya lleva asociado un rol (mozo o cocina); la persona lo usa una vez en
  `/registro` → "Tengo un código" y con eso queda registrada con ese rol, sin que vos tengas que
  crearle una cuenta a mano.

### 5. Qué entregarle al cliente al terminar

- **Los QRs impresos**, uno por mesa (se descargan o se imprime la hoja completa desde
  `/admin/mesas`).
- **`docs/manual-mozo-cocina.md`**, para el personal de salón y cocina — está escrito para que lo
  lean directo (se lo podés reenviar tal cual, o pasarlo a PDF si preferís algo más formal).

### 6. Soporte post-venta — límites reales de hoy

Cosas que todavía no resuelve el producto, para que no las descubras en el momento con un
cliente enojado:

- **No hay forma de resetear la contraseña de nadie desde el admin.** Depende del flujo estándar
  de Supabase Auth ("olvidé mi contraseña" en `/login`, si está habilitado) o de entrar a la base
  a mano desde el dashboard de Supabase.
- **No existe un interruptor para suspender un restaurante entero** si un cliente deja de pagar
  (se verificó: la tabla `restaurants` no tiene ninguna columna de tipo `is_active` o similar).
  Lo único que se puede hacer hoy es desactivar a su personal uno por uno desde
  `/admin/personal` (cada fila tiene un switch de activo/inactivo) — eso bloquea que el personal
  entre a mozo/cocina/admin, pero **no** bloquea que un comensal siga viendo el menú y haciendo
  pedidos desde el QR de la mesa, porque esa parte no requiere login. Es una limitación conocida,
  no algo resuelto — tenerlo en cuenta al negociar condiciones de pago.
- **El problema más común que vas a ver:** el cliente dice "no puedo entrar" después de
  registrarse. Casi siempre es que **falta confirmar el email** — Supabase Auth en este proyecto
  exige hacer clic en el link que llega por correo antes de que exista una sesión (comportamiento
  esperado, documentado en `CLAUDE.md` §5c, no es un bug). Pedile que revise spam si no le llegó.

### 7. Cuándo esto ya no alcanza y hay que volver a la Parte A

Un dueño de restaurante puede resolver solo, desde `/admin`, todo lo del día a día: cambiar
precios, marcar platos agotados, agregar mesas o personal, cambiar el logo o color. Si en cambio
aparece un bug, hace falta una funcionalidad nueva, o un cambio que afecte a **todos** los
restaurantes a la vez (por ejemplo algo de diseño global, como el pulido de marca de esta misma
sesión), eso ya es tocar código — volvé a la Parte A de este documento.
