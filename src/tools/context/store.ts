interface InitialContext {
  hasGlobalContext: boolean
}

class ContextStore {
  private context: InitialContext = {
    hasGlobalContext: false,
  }

  setInitialContextLoaded(): void {
    this.context.hasGlobalContext = true
  }

  hasInitialContext(): boolean {
    return this.context.hasGlobalContext
  }

  resetInitialContext(): void {
    this.context.hasGlobalContext = false
  }
}

export const contextStore = new ContextStore()
