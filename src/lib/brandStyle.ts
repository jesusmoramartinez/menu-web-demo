import type { CSSProperties } from 'react'

const HEX = /^#[0-9a-f]{6}$/i

/**
 * Variables de marca para que `bg-brand-*` tome el color del restaurante (derivando tonos
 * con color-mix). Se usa tanto en la vista del comensal (`ClientLayout`) como en las de
 * staff (`StaffLayout`, `DemoLayout`) para que el color elegido en Configuración se vea
 * en las cuatro vistas, no sólo en la del cliente.
 */
export function brandStyle(brand: string | undefined): CSSProperties | undefined {
  if (!brand || !HEX.test(brand)) return undefined
  return {
    '--color-brand-500': brand,
    '--color-brand-600': `color-mix(in oklab, ${brand} 88%, black)`,
    '--color-brand-700': `color-mix(in oklab, ${brand} 76%, black)`,
    '--color-brand-100': `color-mix(in oklab, ${brand} 20%, white)`,
    '--color-brand-50': `color-mix(in oklab, ${brand} 8%, white)`,
  } as CSSProperties
}
