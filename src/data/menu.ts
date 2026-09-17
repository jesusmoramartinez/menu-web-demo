import type { Category, MenuItem } from '@/types/domain'

export const RESTAURANT = {
  name: 'Pizzería Don Remolo',
  tagline: 'Horno de leña desde 1987',
  currency: 'ARS',
}

export const CATEGORIES: Category[] = [
  { id: 'entradas', label: 'Entradas', emoji: '🥖' },
  { id: 'pizzas', label: 'Pizzas', emoji: '🍕' },
  { id: 'bebidas', label: 'Bebidas', emoji: '🥤' },
  { id: 'postres', label: 'Postres', emoji: '🍮' },
]

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=70`

/** Precios en centavos: 650000 = $6.500 */
export const MENU_ITEMS: MenuItem[] = [
  // ── Entradas ─────────────────────────────────────────────
  {
    id: 'e1',
    category: 'entradas',
    name: 'Provoleta a la Parrilla',
    description: 'Queso provolone fundido con orégano y aceite de oliva.',
    price: 650000,
    image: img('photo-1541014741259-de529411b96a'),
    tags: ['Vegetariano'],
  },
  {
    id: 'e2',
    category: 'entradas',
    name: 'Empanadas de Carne (x3)',
    description: 'Cortadas a cuchillo, con huevo y aceituna. Al horno de barro.',
    price: 540000,
    image: img('photo-1601050690597-df0568f70950'),
    tags: [],
  },
  {
    id: 'e3',
    category: 'entradas',
    name: 'Bruschettas Caprese',
    description: 'Pan de campo tostado, tomate cherry, mozzarella fresca y albahaca.',
    price: 590000,
    image: img('photo-1572695157366-5e585ab2b69f'),
    tags: ['Vegetariano'],
  },
  {
    id: 'e4',
    category: 'entradas',
    name: 'Rabas a la Romana',
    description: 'Aros de calamar rebozados, con alioli casero y limón.',
    price: 890000,
    image: img('photo-1599487488170-d11ec9c172f0'),
    tags: [],
  },

  // ── Pizzas ───────────────────────────────────────────────
  {
    id: 'p1',
    category: 'pizzas',
    name: 'Muzzarella Clásica',
    description: 'Salsa de tomate, muzzarella, aceitunas verdes y orégano.',
    price: 980000,
    image: img('photo-1574071318508-1cdbab80d002'),
    tags: ['Popular', 'Vegetariano'],
  },
  {
    id: 'p2',
    category: 'pizzas',
    name: 'Napolitana Don Remolo',
    description: 'Muzzarella, rodajas de tomate, ajo confitado y albahaca fresca.',
    price: 1120000,
    image: img('photo-1604068549290-dea0e4a305ca'),
    tags: ['Popular'],
  },
  {
    id: 'p3',
    category: 'pizzas',
    name: 'Fugazzeta Rellena',
    description: 'Doble masa rellena de muzzarella, cubierta de cebolla caramelizada.',
    price: 1250000,
    image: img('photo-1513104890138-7c749659a591'),
    tags: ['Vegetariano'],
  },
  {
    id: 'p4',
    category: 'pizzas',
    name: 'Calabresa Picante',
    description: 'Longaniza calabresa, morrones asados y un toque de chili.',
    price: 1290000,
    image: img('photo-1628840042765-356cda07504e'),
    tags: ['Picante'],
  },
  {
    id: 'p5',
    category: 'pizzas',
    name: 'Cuatro Quesos',
    description: 'Muzzarella, roquefort, provolone y parmesano con nueces.',
    price: 1340000,
    image: img('photo-1565299624946-b28f40a0ae38'),
    tags: ['Vegetariano'],
  },
  {
    id: 'p6',
    category: 'pizzas',
    name: 'Rúcula y Jamón Crudo',
    description: 'Base blanca, jamón crudo, rúcula fresca y escamas de parmesano.',
    price: 1420000,
    image: img('photo-1595854341625-f33ee10dbf94'),
    tags: ['Chef'],
  },

  // ── Bebidas ──────────────────────────────────────────────
  {
    id: 'b1',
    category: 'bebidas',
    name: 'Limonada con Menta y Jengibre',
    description: 'Jarra de 1 litro, preparada al momento.',
    price: 480000,
    image: img('photo-1523677011781-c91d1bbe2f9e'),
    tags: ['Sin alcohol'],
  },
  {
    id: 'b2',
    category: 'bebidas',
    name: 'Cerveza Artesanal IPA',
    description: 'Pinta de 500 ml, elaborada en la ciudad.',
    price: 450000,
    image: img('photo-1608270586620-248524c67de9'),
    tags: [],
  },
  {
    id: 'b3',
    category: 'bebidas',
    name: 'Gaseosa Línea Coca-Cola',
    description: 'Botella de 500 ml. Regular, Zero o Light.',
    price: 280000,
    image: img('photo-1554866585-cd94860890b7'),
    tags: [],
  },
  {
    id: 'b4',
    category: 'bebidas',
    name: 'Copa de Malbec',
    description: 'Malbec mendocino de bodega boutique.',
    price: 520000,
    image: img('photo-1510812431401-41d2bd2722f3'),
    tags: [],
  },
  {
    id: 'b5',
    category: 'bebidas',
    name: 'Agua Mineral',
    description: 'Con o sin gas, 500 ml.',
    price: 220000,
    image: img('photo-1548839140-29a749e1cf4d'),
    tags: ['Sin alcohol'],
  },

  // ── Postres ──────────────────────────────────────────────
  {
    id: 'd1',
    category: 'postres',
    name: 'Tiramisú de la Nonna',
    description: 'Receta original italiana con café espresso y mascarpone.',
    price: 580000,
    image: img('photo-1571877227200-a0d98ea607e9'),
    tags: ['Popular'],
  },
  {
    id: 'd2',
    category: 'postres',
    name: 'Flan Casero con Dulce de Leche',
    description: 'Flan de huevo con dulce de leche y crema batida.',
    price: 460000,
    image: img('photo-1624353365286-3f8d62daad51'),
    tags: [],
  },
  {
    id: 'd3',
    category: 'postres',
    name: 'Volcán de Chocolate',
    description: 'Bizcocho tibio con centro líquido y helado de vainilla.',
    price: 640000,
    image: img('photo-1606313564200-e75d5e30476c'),
    tags: ['Chef'],
  },
  {
    id: 'd4',
    category: 'postres',
    name: 'Panna Cotta de Frutos Rojos',
    description: 'Suave crema italiana con coulis de frutos rojos.',
    price: 520000,
    image: img('photo-1488477181946-6428a0291777'),
    tags: [],
  },
]
