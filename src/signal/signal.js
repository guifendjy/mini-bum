/**
 * @template T
 * @typedef {Object} SignalInstance
 * @property {T} value - The current value of the signal
 * @property {(cb: (value: T) => void, evalAsExpression?: boolean) => (() => void)|{_signal_: boolean, evaluate: Function}} bind
 *    Subscribe to signal updates. Returns either:
 *    - an `unbind` function, or
 *    - a special evaluator object if `evalAsExpression` is true
 *
 * @example
 * const count = signal(0);
 * count.bind(v => console.log("Count changed:", v));
 * count.value = 5; // triggers subscriber
 * console.log(count.value); // 5
 */

/**
 * @template T
 * @param {T} initialValue - The initial value of the signal
 * @returns {SignalInstance<T>}
 */

export default function signal(initialValue) {
  const subscribers = new Map();
  const Identifier = Symbol(JSON.stringify(initialValue));

  const proxy = new Proxy(
    {
      value: initialValue,
      bind: (callback, evalAsExpression = true) => {
        if (typeof callback !== "function")
          return console.error(
            "Error: expected a function as callback but got:",
            callback
          );

        if (!subscribers.has(Identifier)) {
          subscribers.set(Identifier, new Set());
        }

        // callback fn reference for the subscriber
        let cb_ref = null;

        // TODO: this is a bit of a hacky way to handle the unbinding
        // i need to remove the exact callback from the subscribers
        // set when unbinding when evaluation at the bottom I use a
        // n anonymous fn so I need to account for that to be
        // able to remove it.
        const unbind = () => {
          if (subscribers.get(Identifier) && cb_ref) {
            subscribers.get(Identifier).delete(cb_ref);
            if (subscribers.get(Identifier).size === 0) {
              subscribers.delete(Identifier); // clean up if no subscribers left
            }
          }
        };

        if (!evalAsExpression) {
          subscribers.get(Identifier).add(callback);
          callback(proxy.value);
          cb_ref = callback; // store the reference to the callback for unbinding later. (for regular callbacks no eval to attr)
          return unbind;
        }

        const evaluate = (applyValue) => {
          applyValue(callback(proxy.value));

          const cb = (value) => {
            applyValue(callback(value));
          };
          subscribers.get(Identifier).add(cb);
          cb_ref = cb; // store the reference to the callback for unbinding later(for attr evaluation)
          return unbind;
        };

        return {
          _signal_: true, // this flags it to element as a signal
          evaluate, // this runs the initial evaluation and subscribes the attr to the signal for rerender
        };
      },
    },
    {
      get(target, prop) {
        return target[prop];
      },
      set(target, prop, value) {
        if (target[prop] === value) return true; // no need to update if the value is the same
        target[prop] = value;
        const notify = subscribers.get(Identifier);
        if (notify)
          notify.forEach((cb) => {
            cb(target[prop]); // runs sub
          });
        return true;
      },
    }
  );

  return proxy;
}
