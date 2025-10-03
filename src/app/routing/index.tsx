import { create } from "zustand"
import { MainPage } from "@/pages/main"
import { SettingsPage } from "@/pages/settings"
import { createContext, useContext } from "react"
import { Router } from "@/shared/config/router"

const router = new Router()
router
  .register({
    root: true,
    name: 'main',
    component: <MainPage />
  })
  .register({
    name: 'settings',
    component: <SettingsPage />
  })

interface routerState {
  router: Router
  back: () => void
  forward: () => void
  push: (route: string[]) => void
  replace: (route: string[]) => void
}

const useRouter = create<routerState>()((set) => ({
  router: router,
  back: () => set({ router: router.back() }),
  forward: () => set({ router: router.forward() }),
  push: (route: string[]) => set({ router: router.push(route) }),
  replace: (route: string[]) => set({ router: router.replace(route) }),
}))

const RouteDepthContext = createContext<number>(0)

const Outlet = () => {
  const { router } = useRouter()
  const depth = useContext(RouteDepthContext)
  const node = router.getNode(depth)
  return (
    <RouteDepthContext.Provider value={depth + 1}>
      {node?.component}
    </RouteDepthContext.Provider>
  )
}

export { useRouter, Outlet }
