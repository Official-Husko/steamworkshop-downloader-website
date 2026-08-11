import { RouterProvider, useMatchedRoute, type RouteDef } from './router'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { ItemPage } from './pages/ItemPage'
import { About } from './pages/About'
import { Donate } from './pages/Donate'
import { Credits } from './pages/Credits'
import { Privacy } from './pages/Privacy'
import { NotFound } from './pages/NotFound'

const routes: RouteDef[] = [
  { path: '/', render: () => <Home /> },
  { path: '/items/:id', render: (p) => <ItemPage id={p.id} /> },
  { path: '/about', render: () => <About /> },
  { path: '/donate', render: () => <Donate /> },
  { path: '/credits', render: () => <Credits /> },
  { path: '/privacy', render: () => <Privacy /> },
]

function Routes() {
  const matched = useMatchedRoute(routes)
  return <Layout>{matched ?? <NotFound />}</Layout>
}

export function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  )
}
