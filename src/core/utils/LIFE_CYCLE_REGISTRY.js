let LIFE_CYCLE_REGISTRY = {
  registry: new Map(), // node -> { onMount, onUnmount },
  observer: null,
  intersectionObserver: null,
  mutationObserver: null,
  register(o) {
    const { element, onMount } = o;
    if (!this.registry.has(element)) {
      this.initializeObserver(); // initiazes the observer
      this.registry.set(element, { onMount, onUnmount: null, mounted: false });
      this.registry.get(element) && this.intersectionObserver.observe(element); // observe the node who want to register
    }
  },
  mount(element) {
    if (this.registry.has(element)) {
      const watchedNode = this.registry.get(element);

      if (!watchedNode.mounted) {
        const unMount = watchedNode.onMount?.(element);

        if (!watchedNode.onUnmount) {
          // save unMount cb
          watchedNode.onUnmount = unMount;
        }
        // set it to true
        watchedNode.mounted = true;
      }
    }
  },
  unmount(element) {
    if (this.registry.has(element)) {
      const watchedNode = this.registry.get(element);

      if (watchedNode.mounted) {
        watchedNode.onUnmount?.();
        // then set to false
        watchedNode.mounted = false;
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
    //TODO: optional but to clear space I can also implement a mutation observer which when nodes gets added the register for mouting but the key difference when unmounting it will remove the entire node from the registry so mouting it will not trigger the unmount call(which I think might be create some non intuitive behaviors.)
    if (!this.intersectionObserver) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // run mount logic

              this.mount(entry.target);
            } else {
              // run unmount logic
              this.unmount(entry.target);
            }
          });
        },
        { threshold: 0.5 } // thershold can take an array of value which Fires at multiple visibility percentages.(default at 50% -> atleast 50% of the element need to be visible to fire any mounting and same for unmounting)
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
