import { ArrowRight, Bell, ChefHat, Pizza, QrCode, Smartphone, UserRound } from 'lucide-react'
import { Link } from 'react-router'

const ROLES = [
  {
    to: '/demo/cliente',
    Icon: Smartphone,
    title: 'Cliente',
    text: 'Escanea el QR de la mesa, elige, agrega notas y pide sin esperar al mozo.',
  },
  {
    to: '/demo/mozo',
    Icon: UserRound,
    title: 'Mozo',
    text: 'Recibe llamados y comandas en el celular, las revisa y las manda a cocina.',
  },
  {
    to: '/demo/cocina',
    Icon: ChefHat,
    title: 'Cocina',
    text: 'Pantalla con los pedidos aprobados, tiempos y notas resaltadas.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Pizza size={20} aria-hidden="true" />
          </span>
          Menú Digital
        </div>
        <Link to="/demo" className="text-sm font-semibold text-brand-700 hover:underline">
          Ver demo
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-10 pb-16">
        <section className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            <QrCode size={14} aria-hidden="true" /> Menú QR + comandas en tiempo real
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Tus mesas piden solas.
            <br />
            <span className="text-brand-600">Tu equipo, sincronizado.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
            Un menú digital para restaurantes donde el cliente pide desde su celular, el mozo revisa y la cocina
            recibe la comanda al instante. Sin apps que instalar.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-stone-800"
            >
              Probar la demo <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a
              href="mailto:hola@ejemplo.com?subject=Menú%20Digital"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
            >
              <Bell size={18} aria-hidden="true" /> Quiero una demo para mi local
            </a>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-3" aria-label="Roles">
          {ROLES.map(({ to, Icon, title, text }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-3 font-bold">{title}</h2>
              <p className="mt-1 text-sm text-stone-600">{text}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                Abrir vista <ArrowRight size={14} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  )
}
