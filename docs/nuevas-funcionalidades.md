# Nuevas funcionalidades — Menú Digital

Lista de mejoras y funcionalidades pedidas después de la puesta en producción (2026-09-26). **No es un plan de
implementación**: cada ítem describe *qué* se quiere, el contexto del código actual y recomendaciones o preguntas
abiertas. Antes de implementar, pedir un plan por bloque (en otra sesión) y marcar acá lo que se vaya cerrando.

Versiones:

- **v1.1** — secciones A a D: operación del SaaS, administración, mozo y cocina.
- **v2** — sección E: pago con Mercado Pago, **opcional por restaurante** (el modo actual, "pedir la cuenta" y
  que el mozo cobre en la mesa, sigue existiendo).

Prioridad sugerida (no es un orden de trabajo, sólo qué conviene tener antes de cobrarle a alguien): A1, A2 y A4
antes del primer cliente pago; A5 en cuanto haya más de un cliente; el resto según lo que pidan los clientes.

---

## A. Operación del SaaS (plataforma)

### A1. Email de confirmación que cae en spam

- **Observado:** al crear un usuario de prueba en prod, el email de confirmación llegó a **spam** en Gmail; hubo
  que marcarlo "No es spam" para poder confirmar. Hoy se resuelve avisándole al dueño o haciendo el alta junto a
  él (`docs/alta-restaurante.md` §1).
- **Causa probable:** se envía con el servidor de correo por defecto de Supabase, sin un dominio propio
  autenticado, así que Gmail no puede verificar quién lo manda.
- **Recomendación:**
  - Configurar **SMTP propio** en Supabase (Authentication → Emails → SMTP Settings) con un proveedor tipo
    **Resend** y un **dominio propio** con registros SPF/DKIM/DMARC.
    - Esos registros DNS son la "firma" que le prueba a Gmail que el email es legítimo.
  - Plantillas de email en español con el nombre del producto.
  - Depende de comprar el dominio. Conviene hacerlo **antes de imprimir QR** para clientes reales, así los QR
    llevan el dominio definitivo.

### A2. "Olvidé mi contraseña" (detectado, no existe)

- **Hoy:** no hay flujo de recuperación de contraseña. En `services/auth.ts` no hay `resetPasswordForEmail` ni
  `updateUser`. Un mozo o dueño que se olvide la contraseña depende de soporte manual desde el dashboard.
- **Qué se quiere:**
  - Link "¿Olvidaste tu contraseña?" en `/login`.
  - Pantalla para elegir la contraseña nueva al volver del email.
  - La URL de vuelta tiene que estar en *Redirect URLs* de Supabase (ver `docs/deploy.md` §1).
- Comparte el problema de spam de A1.

### A3. Borrar un restaurante — decisión: manual

- **Decidido:** no hay botón. Se borra desde el dashboard de Supabase siguiendo `docs/deploy.md` §5:
  1. `delete from restaurants` (la cascada arrastra todo el tenant).
  2. Borrar los usuarios en Authentication.
  3. Borrar la carpeta del restaurante en Storage.
- Es irreversible y se hace muy rara vez; no justifica una UI. Si en el futuro se agrega al panel superadmin
  (A5), que sea con confirmación escribiendo el slug.

### A4. Suspender / desactivar un restaurante (por falta de pago)

- **Qué se quiere:** poder deshabilitar un restaurante sin borrar sus datos y reactivarlo al instante cuando
  pague. Se maneja desde el panel superadmin (A5).
- **Recomendaciones:**
  - **Un estado en `restaurants`** en lugar de un booleano: `active` / `past_due` (aviso de pago pendiente, sigue
    funcionando) / `suspended`.
    - Con el estado intermedio, el dueño recibe un aviso antes del corte en lugar de enterarse en pleno servicio.
  - **El bloqueo va en el servidor, no sólo en el frontend.** Ocultar pantallas en React no alcanza: cualquiera
    puede llamar a la API directo. Hay que hacer que:
    - `get_table_by_token`, `place_order` y `create_alert` rechacen un restaurante suspendido (error nuevo tipo
      `RESTAURANT_SUSPENDED`, traducido en `lib/errors.ts`);
    - `can_operate` / `can_manage` devuelvan `false` para ese tenant.
    - Estas funciones de autorización nuevas o modificadas llevan `coalesce(..., false)`, como pide `CLAUDE.md`
      §5b, y se verifican con los scripts `db:verify*`.
  - **Qué ve cada uno:**
    - comensal: "Este menú no está disponible por el momento";
    - staff: "La cuenta del restaurante está suspendida, contactá a soporte" (en `StaffLayout`, igual que hoy con
      `staff.is_active = false`);
    - dueño en `past_due`: un banner de aviso en `/admin`.
  - El tenant `demo` nunca se puede suspender.
- **Pregunta abierta:** ¿el menú (solo lectura, sin pedir) debería seguir visible estando suspendido, o se oculta
  todo?

### A5. Panel superadmin (dueño de la plataforma)

- **Qué se quiere:** un panel propio para ver todos los restaurantes, suspender/reactivar (A4) y entrar a la
  administración de cualquiera para ayudar a configurarlo.
- **Recomendaciones:**
  - **Identidad separada del staff.** Hoy un usuario pertenece a un solo restaurante (`staff.id =
    auth.users.id`). En vez de otro rol dentro de `staff`, usar una tabla aparte:
    - `platform_admins(user_id)` + helper `is_platform_admin()` (security definer, con `coalesce(..., false)`);
    - las políticas RLS suman `or is_platform_admin()`;
    - tu cuenta de superadmin conviene que sea distinta de cualquier cuenta de restaurante.
  - **Ruta propia** `/superadmin` (chunk lazy aparte), con guard como `StaffLayout`: sin sesión → `/login`; sin
    fila en `platform_admins` → 404. No se enlaza desde ningún lado de la app.
  - **Dashboard de restaurantes**, una fila por restaurante:
    - nombre, slug, fecha de alta, estado (A4), cantidad de mesas y de staff;
    - pedidos de los últimos 7 días y fecha del último pedido (detecta clientes que dejaron de usarlo);
    - datos de cobro manual: plan/precio, fecha del próximo pago, notas.
    - Excluir el tenant `demo` de los números.
  - **"Entrar como administrador" sin tocar las páginas de admin.** `AdminLayout` y sus páginas sólo leen
    `useRestaurantScope()`; no saben si están en la demo o en un restaurante real (así funciona `/demo/admin`).
    Un `SuperadminLayout` puede publicar el scope de cualquier restaurante y reusar las mismas cuatro páginas,
    por ejemplo en `/superadmin/r/:slug/admin/*`. Hace falta una barra bien visible tipo "Estás editando
    *Restaurante X* como superadmin".
  - **Seguridad:**
    - **nunca** usar la `service_role` key en el frontend para esto: todo pasa por RLS con
      `is_platform_admin()`;
    - activar **MFA (TOTP)** de Supabase Auth en la cuenta superadmin: es la cuenta con acceso a todos los
      clientes;
    - opcional: tabla de auditoría con qué cambió el superadmin y en qué restaurante.

---

## B. Administración (dueño del restaurante)

### B1. Personalización visual ampliada (`/admin/configuracion`)

- **Qué se quiere:** además del color de marca actual:
  - paleta de colores más completa;
  - tamaño de letra;
  - tipografía (font family).
- **Contexto:**
  - Hoy se guarda sólo `theme.brand` (jsonb) y `lib/brandStyle.ts` genera los tonos `--color-brand-*` con
    `color-mix`.
  - `updateRestaurantSettings` **pisa todo `theme`** (`CLAUDE.md` §5d): al agregar claves nuevas hay que
    mezclarlas, no reemplazarlas.
- **Recomendaciones:**
  - Paleta acotada: primario (el actual), secundario/acento y quizás fondo claro/oscuro, en vez de editar cada
    color suelto.
  - Validar el **contraste** de texto sobre el color elegido, para que un dueño no elija amarillo sobre blanco y
    el menú quede ilegible.
  - Tipografía de una **lista curada** (5–6 fuentes de Google Fonts cargadas sólo cuando se eligen), no texto
    libre.
  - Tamaño como **escala** (Chico / Normal / Grande), no píxeles.
  - **Vista previa en vivo** del menú antes de guardar.
- **Pregunta abierta:** ¿la personalización aplica sólo a la vista del comensal o también a mozo/cocina/admin?
  Hoy el color aplica a las cuatro.

### B2. Imágenes comprimidas al subir

- **Qué se quiere:** que el logo y las fotos de platos se suban comprimidas para que pesen menos.
- **Contexto:** `ImageUploadField` → `services/media.ts` sube el archivo tal cual a Storage.
- **Recomendaciones:**
  - Comprimir **en el navegador antes de subir** (canvas o una librería chica tipo `browser-image-compression`),
    convertir a **WebP** y limitar el ancho (p. ej. logo 512 px, platos 1200 px, calidad ~0.8).
  - Una foto de celular de 4–8 MB puede quedar en 100–200 KB.
  - Beneficios:
    - el menú carga rápido con datos móviles en la mesa;
    - se cuida la cuota de Storage y de transferencia del plan de Supabase.

### B3. Categorías con selector de emoji

- **Qué se quiere:** al crear o editar una categoría, un botón que abra un selector de emojis dentro de la web,
  en lugar de tipear el emoji.
- **Recomendación:** dos opciones.
  - Una **lista curada** de emojis de comida y bebida (🍕🍔🍟🌭🥗🍝🍰☕🍺🍷…), liviana y suficiente.
  - Un picker completo (p. ej. `emoji-picker-element`, cargado lazy).
  - La regla "sin librerías de UI" de `CLAUDE.md` §6 apunta a componentes genéricos. Un picker de emoji es un
    widget específico, pero hay que decidirlo explícitamente.
- Mostrarlo en `Sheet`/`Modal` (accesibilidad ya resuelta ahí).

### B4. Formulario de plato nuevo: más detallado y mejor UX/UI

- **Qué se quiere:** un formulario más completo y más claro de usar (`ItemEditModal` + `OptionGroupEditor`).
- **Fricción actual conocida:** para un plato nuevo hay que "Guardar" los datos base antes de poder agregar
  variantes (`CLAUDE.md` §5d); no es evidente para el dueño.
- **Ideas a evaluar:**
  - formulario por pasos o secciones: Datos → Foto → Variantes → Vista previa;
  - vista previa de cómo lo ve el comensal;
  - guardado automático del paso base.
- **Campos candidatos (a definir cuáles):**
  - ingredientes;
  - alérgenos o aptos (vegano, vegetariano, sin TACC);
  - "destacado / recomendado";
  - precio promocional;
  - tiempo estimado de preparación.

### B5. Etiquetas con color

- **Qué se quiere:** que las etiquetas (tags) de los platos tengan color elegible.
- **Contexto:** hoy `menu_items.tags` es `text[]` libre y los estilos de algunas etiquetas están fijos por nombre
  en español (anotado en `docs/pulido-2026-09-23.md`).
- **Recomendación:** pasar a un **catálogo de etiquetas por restaurante** (nombre + color, elegido de una paleta
  con buen contraste). Así la misma etiqueta tiene siempre el mismo color, y renombrarla se hace en un solo
  lugar.

### B6. Cargos fijos extra (cubierto / servicio de mesa)

- **Qué se quiere:** configurar cargos fijos que se suman a la cuenta, como el cubierto o el servicio de mesa.
- **Recomendaciones:**
  - Configurables por restaurante, cada uno activable: nombre, importe y modo de cálculo (**por persona**, **por
    mesa** o **porcentaje** del consumo).
  - Se muestran como línea separada en "La cuenta" del comensal y en el panel de Mesas del mozo. El total lo
    calcula el **servidor**, igual que hoy los precios de `place_order`.
- **Pregunta abierta:** el cubierto suele ser *por persona*. ¿Quién carga la cantidad de comensales: el comensal
  al primer pedido o el mozo desde Mesas?

### B7. Sonidos de notificación configurables

- **Qué se quiere:** desde admin, elegir entre al menos 3 sonidos de notificación para mozo y para cocina (por
  separado) y su volumen.
- **Contexto:**
  - `lib/sound.ts` sintetiza el beep con Web Audio (sin archivos), así que generar 3+ variantes (tonos, ritmos) no
    requiere archivos de audio.
  - El mute se guarda por dispositivo (`localStorage: menu:sound-enabled`).
- **Recomendación:**
  - Sonido y volumen por restaurante (config del admin, guardado en la base).
  - El mute sigue siendo por dispositivo.
  - Botón "Probar sonido" al lado de cada opción.

---

## C. Mozo

### C1. Ajustes al cerrar la mesa (cargo extra)

- **Qué se quiere:** que el mozo pueda agregar un importe extra al cierre de la mesa, por ejemplo si se rompió
  algo.
- **Recomendaciones:**
  - Un **ajuste** con importe y motivo obligatorio, guardado en la sesión de mesa.
  - Queda registrado **quién** lo cargó y se muestra en "La cuenta" del comensal. El total lo sigue calculando el
    servidor.
- **Preguntas abiertas:**
  - ¿También descuentos (importe negativo)?
  - ¿Cualquier mozo puede cargarlo, o sólo dueño/admin, o el mozo con aprobación?

---

## D. Cocina

### D1. Cocina propone "agotado", dueño/admin aprueba

- **Qué se quiere:** que la cocina pueda marcar un plato como agotado; el dueño o administración lo aprueba y
  queda confirmado como agotado por el día.
- **Contexto:** hoy sólo el admin marca "agotado hoy" (`sold_out_until = hoy`, se limpia solo al día siguiente).
- **Recomendación a decidir:** mientras la solicitud está pendiente, ¿el plato se puede seguir pidiendo?
  - En pleno servicio, esperar la aprobación genera pedidos de algo que no hay.
  - Alternativa: **bloqueo provisorio inmediato** al marcarlo en cocina, y el admin **confirma o revierte**.
    Mantiene el control del dueño sin frenar la cocina.
  - Avisar al admin/dueño con el mismo sistema de alertas/sonido.

---

## E. v2 — Pago con Mercado Pago (opcional por restaurante)

**Qué se quiere:** que el comensal pueda pagar la cuenta desde la web con Mercado Pago, con su cuenta de MP o con
tarjeta sin cuenta, y que el dinero vaya a la cuenta de MP **del restaurante**, vinculada previamente desde
admin. Es **opcional por restaurante**: cada uno elige entre:

- **Cobro por el mozo** (actual): el comensal pide la cuenta y el mozo se acerca a cobrar.
- **Pago con Mercado Pago:** el botón "Pedir la cuenta" se reemplaza por "Pagar".

**Contexto y recomendaciones:**

- **Flujo esperado:**
  1. El comensal ve "La cuenta".
  2. Toca "Pagar con Mercado Pago".
  3. La app lo redirige a la app o web de MP (**Checkout Pro**: MP resuelve la pantalla de pago, con cuenta o como
     invitado con tarjeta).
  4. MP lo devuelve a la app.
  5. MP confirma el pago al servidor (**webhook**).
  6. La sesión queda marcada como pagada y el mozo ve "Pagó" en Mesas.
- **Vincular la cuenta de MP del restaurante:** con el **OAuth de Mercado Pago** (modelo de "aplicación /
  marketplace"). El dueño toca "Conectar Mercado Pago" en admin, autoriza en MP y la app guarda sus credenciales.
- **Hace falta backend propio por primera vez.** Crear el pago, guardar los tokens de MP y recibir el webhook
  **no puede hacerse desde el navegador**: los tokens son secretos. Candidato natural: **Supabase Edge Functions**
  (funciones de servidor que corren dentro de Supabase).
  - Los tokens van cifrados y nunca llegan al frontend.
  - El webhook tiene que ser **idempotente**: MP puede avisar el mismo pago más de una vez.
- **Importe:** lo calcula el servidor a partir de la sesión (pedidos + cargos de B6 + ajustes de C1), nunca el
  navegador; igual que `place_order` hoy.
- **Modelo de negocio:** Checkout Pro con marketplace permite cobrar una **comisión de plataforma** por pago
  (`marketplace_fee`). Es una alternativa o complemento a la suscripción mensual; decidir antes de implementar.
- "Llamar al mozo" sigue existiendo en ambos modos.
- **Preguntas abiertas:**
  - ¿Dividir la cuenta entre varios comensales? ¿Pagos parciales?
  - ¿Propina dentro del pago?
  - ¿Qué pasa si el comensal paga y después pide algo más? (¿nueva cuenta a pagar?)
  - ¿La mesa se cierra sola al confirmarse el pago, o igual la cierra el mozo?
  - ¿Un restaurante puede tener los dos modos a la vez (el comensal elige)?
