import ClientView from './components/client/ClientView'
import KitchenView from './components/kitchen/KitchenView'
import Toast from './components/Toast'
import ViewSwitcher from './components/ViewSwitcher'
import WaiterView from './components/waiter/WaiterView'
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext'

const VIEWS = {
  client: ClientView,
  waiter: WaiterView,
  kitchen: KitchenView,
}

function Screen() {
  const { view } = useRestaurant()
  const View = VIEWS[view] ?? ClientView
  return <View />
}

export default function App() {
  return (
    <RestaurantProvider>
      <ViewSwitcher />
      <Screen />
      <Toast />
    </RestaurantProvider>
  )
}
