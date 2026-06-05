import Signal from "./Signal_instance.js";

/** @template T @typedef {import("./Signal_instance.js").default<T>} SignalInterface */

/**
 * Create a new Signal instance.
 *
 * @internal
 * @template T
 * @param {T | (() => T) | undefined} [initialValue] - Initial value or thunk.
 * @returns {SignalInterface<T>}
 */
export function $signal(initialValue) {
  return new Signal(initialValue);
}

/**
 * Create a computed Signal from an array of signals.
 *
 * @template T
 * @param {() => T} fn - Compute function.
 * @param {Array<SignalInterface<any>>} [dependencies] - Array of Signal instances to track.
 * @returns {SignalInterface<T>}
 */
export function $computed(fn, dependencies) {
  return Signal.computed(fn, dependencies);
}
