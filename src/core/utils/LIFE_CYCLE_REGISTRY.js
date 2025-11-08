class NodeCycleState {
  constructor() {
    this.mounted = false;
    this.beforeMount = false;
    this.afterMount = false;
    this.beforeUnmount = false;
    this.afterUnmount = false;
  }
}

let LIFE_CYCLE_REGISTRY = {
  registry: new Map(), // node -> { onMount, onUnmount },
  observer: null,
  intersectionObserver: null,
  mutationObserver: null,
  register(o) {
    const { element, onMount } = o;
    if (!this.registry.has(element)) {
      this.initializeObserver(); // initiazes the observer| default threshold [1]
      this.registry.set(element, {
        onMount,
        onUnmount: null,
        state: new NodeCycleState(),
      });
      this.registry.get(element) && this.intersectionObserver.observe(element); // observe the node who want to register
    }
  },
  mount(element) {
    if (this.registry.has(element)) {
      const record = this.registry.get(element);
      if (!record) return;
      const { onMount, state } = record;
      const unMount = onMount(element, state);
      // update onMount scope -> helps if unMount:() is using variables outside of it's scope
      if (typeof unMount === "function") record.onUnmount = unMount;
    }
  },
  unmount(element) {
    if (this.registry.has(element)) {
      const record = this.registry.get(element);
      if (record.onUnmount && typeof record.onUnmount === "function") {
        record.onUnmount();
      }
    }
  },
  removeFromRegistry(element) {
    if (this.registry.has(element)) {
      this.intersectionObserver.unobserve(element);
      this.registry.delete(element);

      // check if registry in empty and remove all observers they will be reinstantiated if other node gets registered(works for dynamic nodes)
      if (this.registry.size == 0) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
    }
  },

  initializeObserver() {
    // this is a visibility based mouting api
    if (!this.intersectionObserver) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const record = this.registry.get(entry.target);
            if (record) {
              const { state } = record;

              if (entry.intersectionRatio >= 1 && !state.mounted) {
                state.beforeMount = true;
                this.mount(entry.target);
                state.mounted = true;
                state.afterMount = true;
              } else if (entry.intersectionRatio < 1 && state.mounted) {
                state.beforeUnmount = true;
                this.unmount(entry.target);
                state.beforeUnmount = false;
                state.mounted = false;
                state.afterMount = false;
              }
            }
          });
        },
        { threshold: 1 } // threshold default 1.
      );
    }

    if (!this.mutationObserver) {
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.removedNodes.forEach((node) => {
            if (this.registry.has(node)) {
              // Permanent removal → full cleanup
              this.unmount(node);
              this.removeFromRegistry(node);
            }
          });
        });
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  },
};

export default LIFE_CYCLE_REGISTRY;
