type Node = {
  root?: boolean
  name: string
  parentName?: string,
  component: React.ReactNode
}

class Router {
  private nodes = new Map<string, Node>()
  private routes: string[][] = []
  private history: string[][] = []
  private current: number = 0

  constructor(instance?: Router) {
    if (instance) {
      this.nodes = instance.nodes
      this.routes = instance.routes
      this.history = instance.history
      this.current = instance.current
    }
  }

  private clone() {
    return new Router(this)
  }

  register(node: Node) {
    let route = []
    let currentNode = node
    route.unshift(currentNode.name)
    while (currentNode.parentName) {
      currentNode = this.nodes.get(currentNode.parentName)!
      route.unshift(currentNode.name)
    }
    this.routes.push(route)
    this.nodes.set(node.name, node)
    if (node.root) {
      this.history.push([node.name])
    }
    return this
  }

  back() {
    if (this.current === 0) return this
    this.current--
    return this.clone()
  }

  forward() {
    if (this.current === this.history.length - 1) return this
    this.current++
    return this.clone()
  }

  push(route: string[]) {
    const currentRoute = this.history[this.current]
    this.history.splice(this.current + 1)
    this.history.push(currentRoute.concat(route))
    this.current++
    return this.clone()
  }

  replace(route: string[]) {
    if (JSON.stringify(this.history[this.current]) === JSON.stringify(route)) {
      return this
    }
    this.history.splice(this.current + 1)
    this.history.push(route)
    this.current++
    return this.clone()
  }

  getNode(depth: number) {
    const currentRoute = this.history.at(this.current)
    if (!currentRoute) return null

    const nodeName = currentRoute.at(depth)
    if (!nodeName) return null

    return this.nodes.get(nodeName) ?? null
  }
}

export { Router }
