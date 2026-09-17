# Manual — Mozo y Cocina

Guía rápida para el personal de salón y cocina. No hace falta instalar nada: es una página web que funciona
desde el navegador del celular, tablet o notebook que ya tengan.

## Ingresar

1. Abrir el link que les pasó el dueño/administrador (`/login`).
2. Completar email y contraseña. Si todavía no tienen cuenta, deben haber recibido un **código de invitación**:
   entrar a `/registro` → "Tengo un código" y completarlo con el código y su nombre.
3. Según el rol que les asignó el administrador, van a caer en la pantalla de **Mozo** o de **Cocina**
   automáticamente. Si tienen rol de dueño/administración, arriba a la derecha hay un botón para cambiar entre
   Mozo, Cocina y Administración.

## Mozo

- **Pedidos**: llegan las comandas nuevas de cada mesa. Se pueden ajustar cantidades o notas antes de
  enviarlas a la cocina (o cancelarlas). Una vez enviada, aparece en la lista "En cocina"; cuando la cocina la
  marca lista, pasa a "Listos para entregar" — marcarla como **Entregado** cuando el mozo la lleva a la mesa.
- **Alertas**: arriba aparecen los avisos de "Llamar al mozo" y "Pedir la cuenta" de cada mesa, con un botón
  para marcarlos como atendidos.
- **Mesas**: panorama de todas las mesas agrupadas por sector, con su estado (libre / con pedidos abiertos /
  pidió la cuenta) y el total acumulado. **Cerrar mesa** libera la mesa para el próximo comensal — sólo se
  puede cerrar si no quedan pedidos sin entregar.
- Si al mozo le asignaron sectores o mesas específicas (`/admin/personal`), por defecto sólo ve esas; hay un
  toggle **"Ver todas"** para mirar el resto del salón igual.
- El ícono de parlante (arriba a la derecha) prende o apaga el sonido/vibración que avisa cuando llega algo
  nuevo. Se recuerda por dispositivo.

## Cocina

- Cada comanda enviada por el mozo aparece como una tarjeta con el tiempo transcurrido desde que se envió. El
  color indica la urgencia: verde (recién llegada), ámbar (viene demorando), rojo (urgente). Las notas del
  cliente quedan resaltadas para que no se pasen por alto.
- **Marcar como Listo** avisa automáticamente al mozo y al comensal (que ve el cambio de estado en su celular).
- El ícono de parlante silencia/activa el aviso sonoro de comandas nuevas, igual que en Mozo.
- El botón de pantalla completa (junto al parlante) sirve para dejar la pantalla de la cocina en modo kiosco en
  una tablet; mientras esta pantalla esté abierta, el dispositivo no se apaga solo (aunque el sistema operativo
  puede igual bloquear la pantalla si el usuario lo hace manualmente).

## Problemas comunes

- **No me deja entrar / dice que mi cuenta no tiene restaurante**: significa que la cuenta no tiene una fila de
  personal asociada. Pedirle al dueño una invitación nueva desde `/admin/personal`.
- **No veo pedidos que sí ve otro mozo**: puede que tengan asignado un sector distinto. Usar el toggle
  "Ver todas" o pedirle al administrador que revise la asignación.
- **La cocina no suena**: el sonido necesita que alguien haya tocado la pantalla al menos una vez después de
  cargarla (restricción de los navegadores, no es un error); tocar en cualquier parte de la pantalla lo
  desbloquea.
