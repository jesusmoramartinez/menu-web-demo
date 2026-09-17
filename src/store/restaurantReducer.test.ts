import { describe, expect, it } from 'vitest'
import type { MenuItem } from '@/types/domain'
import { initialState, restaurantReducer, type RestaurantState } from './restaurantReducer'

const pizza: MenuItem = {
  id: 'p1',
  category: 'pizzas',
  name: 'Muzzarella',
  description: '',
  price: 980000,
  image: '',
  tags: [],
}

const empty: RestaurantState = { table: 4, cart: [], orders: [], alerts: [] }

describe('carrito', () => {
  it('agrega un plato nuevo con qty 1 y snapshot de precio', () => {
    const s = restaurantReducer(empty, { type: 'CART_ADD', item: pizza })
    expect(s.cart).toEqual([{ itemId: 'p1', name: 'Muzzarella', price: 980000, qty: 1, notes: '' }])
  })

  it('incrementa la cantidad si ya estaba', () => {
    let s = restaurantReducer(empty, { type: 'CART_ADD', item: pizza })
    s = restaurantReducer(s, { type: 'CART_ADD', item: pizza })
    expect(s.cart).toHaveLength(1)
    expect(s.cart[0].qty).toBe(2)
  })

  it('quita la línea cuando la cantidad llega a 0', () => {
    let s = restaurantReducer(empty, { type: 'CART_ADD', item: pizza })
    s = restaurantReducer(s, { type: 'CART_SET_QTY', itemId: 'p1', qty: 0 })
    expect(s.cart).toHaveLength(0)
  })

  it('guarda notas por línea', () => {
    let s = restaurantReducer(empty, { type: 'CART_ADD', item: pizza })
    s = restaurantReducer(s, { type: 'CART_SET_NOTES', itemId: 'p1', notes: 'sin orégano' })
    expect(s.cart[0].notes).toBe('sin orégano')
  })
})

describe('pedidos', () => {
  it('ORDER_SUBMIT crea un pedido pendiente con la mesa y vacía el carrito', () => {
    let s = restaurantReducer(empty, { type: 'CART_ADD', item: pizza })
    s = restaurantReducer(s, { type: 'ORDER_SUBMIT', now: 1000 })
    expect(s.cart).toHaveLength(0)
    expect(s.orders).toHaveLength(1)
    expect(s.orders[0]).toMatchObject({ table: 4, status: 'pending', createdAt: 1000, sentToKitchenAt: null })
    expect(s.orders[0].items[0]).toMatchObject({ itemId: 'p1', qty: 1 })
  })

  it('ORDER_SUBMIT con carrito vacío no hace nada', () => {
    expect(restaurantReducer(empty, { type: 'ORDER_SUBMIT' })).toBe(empty)
  })

  it('el pedido no comparte referencia con el carrito', () => {
    let s = restaurantReducer(empty, { type: 'CART_ADD', item: pizza })
    const cartLine = s.cart[0]
    s = restaurantReducer(s, { type: 'ORDER_SUBMIT' })
    expect(s.orders[0].items[0]).not.toBe(cartLine)
  })

  it('recorre el ciclo pending → kitchen → done con timestamps', () => {
    let s = restaurantReducer(empty, { type: 'CART_ADD', item: pizza })
    s = restaurantReducer(s, { type: 'ORDER_SUBMIT', now: 1 })
    const id = s.orders[0].id
    s = restaurantReducer(s, { type: 'ORDER_SEND_TO_KITCHEN', orderId: id, now: 2 })
    expect(s.orders[0]).toMatchObject({ status: 'kitchen', sentToKitchenAt: 2 })
    s = restaurantReducer(s, { type: 'ORDER_MARK_DONE', orderId: id, now: 3 })
    expect(s.orders[0]).toMatchObject({ status: 'done', doneAt: 3 })
  })

  it('ORDER_UPDATE_ITEMS reemplaza las líneas y ORDER_DELETE elimina', () => {
    let s = restaurantReducer(empty, { type: 'CART_ADD', item: pizza })
    s = restaurantReducer(s, { type: 'ORDER_SUBMIT' })
    const id = s.orders[0].id
    s = restaurantReducer(s, {
      type: 'ORDER_UPDATE_ITEMS',
      orderId: id,
      items: [{ itemId: 'p1', name: 'Muzzarella', price: 980000, qty: 3, notes: 'bien cocida' }],
    })
    expect(s.orders[0].items[0]).toMatchObject({ qty: 3, notes: 'bien cocida' })
    s = restaurantReducer(s, { type: 'ORDER_DELETE', orderId: id })
    expect(s.orders).toHaveLength(0)
  })
})

describe('alertas', () => {
  it('agrega una alerta y no la duplica para la misma mesa y tipo', () => {
    let s = restaurantReducer(empty, { type: 'ALERT_ADD', table: 4, alertType: 'waiter' })
    s = restaurantReducer(s, { type: 'ALERT_ADD', table: 4, alertType: 'waiter' })
    expect(s.alerts).toHaveLength(1)
    s = restaurantReducer(s, { type: 'ALERT_ADD', table: 4, alertType: 'bill' })
    expect(s.alerts).toHaveLength(2)
  })

  it('resuelve por id', () => {
    let s = restaurantReducer(empty, { type: 'ALERT_ADD', table: 4, alertType: 'waiter' })
    s = restaurantReducer(s, { type: 'ALERT_RESOLVE', alertId: s.alerts[0].id })
    expect(s.alerts).toHaveLength(0)
  })
})

describe('demo', () => {
  it('RESET_DEMO vuelve al estado inicial con datos de prueba', () => {
    const s = restaurantReducer(empty, { type: 'RESET_DEMO' })
    expect(s).toBe(initialState)
    expect(s.orders.length).toBeGreaterThan(0)
  })
})
