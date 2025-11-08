import NodeCycleState from "./NodeCycleManager.js";

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

              //wait for element to be completly visible to do anything(life cycle hooks gets triggerd whenever state changes)
              if (entry.intersectionRatio >= 1 && !state.mounted) {
                state.beforeMount = true; // before mount

                this.mount(entry.target); // main mount logic gets

                state.afterMount = true; // after mount
                state.beforeMount = false; // before mount

                state.mounted = true; // mounted
              } else if (entry.intersectionRatio < 1 && state.mounted) {
                state.beforeUnmount = true; // before unMount

                this.unmount(entry.target); // main unmount logic

                state.afterUnmount = true; // after unmount
                state.beforeUnmount = false; // before unmount

                state.mounted = false; // mounted
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
            const record = this.registry.has(node);
            if (record) {
              // Permanent removal → full cleanup
              this.unmount(node);
              this.removeFromRegistry(node);
              record.state = new NodeCycleState();
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
