# Alta de un restaurante nuevo

Checklist para onboardear un cliente real, de punta a punta, en unos 30 minutos. Se corre contra el deploy de
**producción** (dev y prod ya están separados, ver `docs/deploy.md`); sirve igual contra un Preview (dev) para
ensayar el flujo. Para borrar un restaurante de prueba, ver `docs/deploy.md` §5.

## 1. Cuenta y restaurante (el dueño)

1. Entrar a `/registro` → **"Crear mi restaurante"**.
2. Completar nombre del restaurante (el slug se autogenera, editable — es lo que va en la URL de cada mesa:
   `/r/<slug>/m/<token>`) y los datos de la cuenta (email + contraseña).
3. Revisar el email y confirmar la cuenta (el link vuelve a `/registro` y termina el alta solo). Sin confirmar
   el email no hay sesión — es el comportamiento esperado del proyecto (`CLAUDE.md` §5c).
   - **El email suele caer en spam** (comprobado en Gmail): avisarle al dueño que lo busque en "Spam" y lo marque
     como "No es spam", o hacer este paso junto a él. Plan B si no llega: ver `docs/deploy.md` §1 ("Email de
     confirmación").
   - Abrir el link **en el mismo navegador** donde se completó el registro: la acción pendiente ("crear
     restaurante") queda guardada en ese navegador. Si se confirma desde otro dispositivo, la cuenta queda
     confirmada pero sin restaurante: iniciar sesión y repetir `/registro` → "Crear mi restaurante".
4. Una vez confirmado, el dueño queda como `owner` de su restaurante y cae en `/admin`.

## 2. Menú (`/admin/menu`)

1. Crear las categorías (p. ej. "Entradas", "Pizzas", "Bebidas") en el orden en que deben aparecer.
2. Cargar los platos: nombre, descripción, precio, foto (subida a Storage o URL externa), tags.
3. Para platos con variantes (tamaño, extras): agregar los grupos de opciones desde el editor del plato
   (`ItemEditModal` → hay que guardar los datos base primero para poder agregarle grupos).
4. Confirmar que el menú se ve bien desde el celular en la mesa real (una vez creada, paso siguiente) —
   no hace falta revisarlo antes en `/demo/m/...`, ese tenant es sólo para mostrarle la app a un prospecto.

## 3. Mesas y sectores (`/admin/mesas`)

1. Crear los sectores (salón, terraza, barra, etc.) si el local los tiene.
2. Crear una mesa por cada mesa física, asignada a su sector.
3. Descargar el QR de cada mesa (o la hoja completa para imprimir todas juntas) e imprimirlos.
4. **Probar al menos un QR con un celular real** antes de entregar: escanearlo, confirmar que abre el menú
   correcto y que un pedido de prueba llega al panel de mozo.

## 4. Personal (`/admin/personal`)

1. Generar una invitación por cada mozo/cocinero (rol + código de un solo uso).
2. Pasarle el código a cada persona para que se registre en `/registro` → **"Tengo un código"**.
3. Asignar a cada mozo sus sectores o mesas (si no se asigna nada, ve todas las mesas por defecto).

## 5. Configuración (`/admin/configuracion`)

1. Cargar logo, color de marca y moneda del restaurante.
2. Confirmar que el color se ve reflejado en el menú del comensal y en la barra superior del personal.

## 6. Prueba end-to-end antes de entregar

Con el celular del dueño (o uno de prueba) y una tablet/notebook para mozo y cocina, repetir el flujo de
`docs/manual-mozo-cocina.md` una vez completo, usando una mesa real (no la demo):

- Pedido desde el QR → aparece en Mozo sin recargar.
- Mozo lo envía a Cocina → aparece en el KDS.
- Cocina marca Listo → el comensal ve "Listo" en su celular en pocos segundos.
- Mozo marca Entregado y cierra la mesa → el comensal ve la pantalla de agradecimiento.
- "Llamar al mozo" y "Pedir la cuenta" generan alertas visibles en el panel de mozo.

Si algo falla, revisar primero `CLAUDE.md` (arquitectura, RLS, errores conocidos) antes de tocar código.
