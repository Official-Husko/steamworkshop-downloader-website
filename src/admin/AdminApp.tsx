import { RouterProvider, useMatchedRoute, type RouteDef } from '../router'
import { AdminShell } from './components/AdminShell'
import { AdminSessionProvider, useAdminSession } from './lib/session'
import { Login } from './pages/Login'
import { Overview } from './pages/Overview'
import { Traffic } from './pages/Traffic'
import { DonatedKeys } from './pages/DonatedKeys'
import { ApiApplications } from './pages/ApiApplications'
import { IssuedKeys } from './pages/IssuedKeys'
import { Logs } from './pages/Logs'
import { RequestedGames } from './pages/RequestedGames'
import { GameCoverage } from './pages/GameCoverage'
import { CreditsList } from './pages/CreditsList'
import { SiteMessages } from './pages/SiteMessages'
import { Maintenance } from './pages/Maintenance'

// Its own RouterProvider/route table, deliberately not the public app's
// Layout/Header/Footer (those carry public nav items and public-only
// legal copy that doesn't belong on an internal tool) — a separate
// bundle entirely, built and served apart from the public site.
const routes: RouteDef[] = [
  { path: '/', render: () => <Overview /> },
  { path: '/traffic', render: () => <Traffic /> },
  { path: '/logs', render: () => <Logs /> },
  { path: '/keys/donated', render: () => <DonatedKeys /> },
  { path: '/keys/applications', render: () => <ApiApplications /> },
  { path: '/keys/issued', render: () => <IssuedKeys /> },
  { path: '/content/requested-games', render: () => <RequestedGames /> },
  { path: '/content/coverage', render: () => <GameCoverage /> },
  { path: '/content/credits', render: () => <CreditsList /> },
  { path: '/service/messages', render: () => <SiteMessages /> },
  { path: '/service/maintenance', render: () => <Maintenance /> },
]

function Routes() {
  const matched = useMatchedRoute(routes)
  return matched ?? <Overview />
}

function Gate() {
  const { authenticated } = useAdminSession()
  if (!authenticated) return <Login />
  return (
    <AdminShell>
      <Routes />
    </AdminShell>
  )
}

export function AdminApp() {
  return (
    <RouterProvider>
      <AdminSessionProvider>
        <Gate />
      </AdminSessionProvider>
    </RouterProvider>
  )
}
