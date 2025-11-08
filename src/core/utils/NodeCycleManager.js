export default class NodeCycleState {
  // private fields
  #mounted = false;

  #beforeMount = false;
  #afterMount = false;
  #beforeUnmount = false;
  #afterUnmount = false;

  #beforeMountHandlers = new Set();
  #afterMountHandlers = new Set();
  #beforeUnmountHandlers = new Set();
  #afterUnmountHandlers = new Set();

  // getters / setters so external code can still assign e.g. state.beforeMount = true
  get mounted() {
    return this.#mounted;
  }
  set mounted(v) {
    this.#mounted = Boolean(v);
  }

  get beforeMount() {
    return this.#beforeMount;
  }
  set beforeMount(v) {
    const bool = Boolean(v);
    this.#beforeMount = bool;
    if (bool) this.#callHandlers(this.#beforeMountHandlers);
    this.#removeHandlers(this.#beforeMountHandlers);
  }

  get afterMount() {
    return this.#afterMount;
  }
  set afterMount(v) {
    const bool = Boolean(v);
    this.#afterMount = bool;
    if (bool) this.#callHandlers(this.#afterMountHandlers);
    this.#removeHandlers(this.#afterMountHandlers);
  }

  get beforeUnmount() {
    return this.#beforeUnmount;
  }
  set beforeUnmount(v) {
    const bool = Boolean(v);
    this.#beforeUnmount = bool;
    if (bool) this.#callHandlers(this.#beforeUnmountHandlers);
    this.#removeHandlers(this.#beforeUnmountHandlers);
  }

  get afterUnmount() {
    return this.#afterUnmount;
  }
  set afterUnmount(v) {
    const bool = Boolean(v);
    this.#afterUnmount = bool;
    if (bool) this.#callHandlers(this.#afterUnmountHandlers);
    this.#removeHandlers(this.#afterUnmountHandlers);
  }

  // Register handlers. If the event already happened, call immediately.
  BeforeMount(callback) {
    void this.#registerAndMaybeCall(
      this.#beforeMountHandlers,
      this.#beforeMount,
      callback
    );
  }
  AfterMount(callback) {
    void this.#registerAndMaybeCall(
      this.#afterMountHandlers,
      this.#afterMount,
      callback
    );
  }
  BeforeUnmount(callback) {
    void this.#registerAndMaybeCall(
      this.#beforeUnmountHandlers,
      this.#beforeUnmount,
      callback
    );
  }
  AfterUnmount(callback) {
    void this.#registerAndMaybeCall(
      this.#afterUnmountHandlers,
      this.#afterUnmount,
      callback
    );
  }

  // internal helpers (private)
  #registerAndMaybeCall(set, already, callback) {
    if (typeof callback !== "function") return;
    set.add(callback);
    if (already) {
      try {
        callback();
      } catch (e) {
        // swallow to avoid breaking lifecycle flow
        console.error(e);
      }
    }
  }

  #callHandlers(set) {
    set.forEach((h) => {
      try {
        void h();
      } catch (e) {
        console.error(e);
      }
    });
  }
  #removeHandlers(set) {
    if (!(set instanceof Set)) return;
    for (const cb of Array.from(set)) {
      try {
        set.delete(cb);
      } catch (e) {
        console.error(e);
      }
    }
  }
}
