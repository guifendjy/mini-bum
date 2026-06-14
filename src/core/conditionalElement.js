import shallowEqual from "./utils/shallowEqual.js";
import { $computed } from "../signal/signal.js";
import uniqid from "./utils/uniqId.js";

/** @template T @typedef {import("./Signal.js").default<T>} Signal */

/**
 * A renderable instance expected by ConditionalElement.
 * @template [R=any]
 * @typedef {Object} Renderable
 * @property {function(): Renderable<R>} render - Render and return the instance with .element populated
 * @property {Node} element - DOM node produced by render()
 * @property {function(): void} destroy - Cleanup method called when the instance is removed
 */

/**
 * Signal input accepted by ConditionalElement: single signal or an array of signals.
 * @template [T=any]
 * @typedef {Signal<T> | Array<Signal<T>>} SignalOrList
 */

/**
 * ConditionalElement manages dynamic mounting/unmounting of views based on signal state.
 * @template T - The type of value(s) held by the signals.
 * @template [R=any] - The type of Renderable returned by the condition function.
 */
export default class ConditionalElement {
  /** @type {SignalOrList<T>} */
  #signals;
  /** @type {(values: T | T[]) => (Renderable<R> | null)} */
  #condFn;
  /** @type {T | T[] | null} */
  #lastEvaluation = null;
  /** @type {Renderable<R> | null} */
  #instance = null;
  #scheduled = false;

  /**
   * @param {SignalOrList<T>} signals - A signal or array of signals to bind to.
   * @param {(values: T | T[]) => (Renderable<R> | null)} condFn - Function that returns a renderable instance.
   */
  constructor(signals, condFn) {
    /** @type {Comment | null} */
    this.element = null;
    this.#signals = signals;
    this.#condFn = condFn;
  }

  /**
   * Create a comment placeholder and start listening to signals.
   * @returns {this}
   */
  render() {
    this.element = document.createComment(`m:${uniqid("_", 3)}`);

    // Normalize signals to array for $computed
    const signalArray = Array.isArray(this.#signals)
      ? this.#signals
      : [this.#signals];

    $computed((...args) => {
      // normalize args, to make it predictable
      const values = Array.isArray(this.#signals) ? args : args[0];
      this.#scheduleUpdate(() => this.#update(values));
    }, signalArray);

    return this;
  }

  /**
   * Internal update handler.
   * @param {T | T[]} values - current signal value or values.
   */
  #update(values) {

    if (shallowEqual(this.#lastEvaluation, values)) return;
    this.#lastEvaluation = values;

    let evaluatedElement = this.#condFn(values);

    // Explicitly check for the interface before calling render
    if (evaluatedElement && typeof evaluatedElement.render === "function") {
      evaluatedElement = evaluatedElement.render();
    }

    if (!evaluatedElement) {
      this.#cleanup();
      return;
    }

    if (this.#instance) {
      this.#cleanup();
    }

    // Mount logic
    if (this.element && evaluatedElement.element) {
      this.element.after(evaluatedElement.element);
      this.#instance = evaluatedElement;
    }
  }

  #cleanup() {
    if (this.#instance) {
      try {
        this.#instance.destroy();
      } catch (e) {
        // Suppress cleanup errors
      }
      this.#instance = null;
    }
  }

  /**
   * Batch updates into a single microtask.
   * @param {() => void} fn
   */
  #scheduleUpdate(fn) {
    if (this.#scheduled) return;
    this.#scheduled = true;

    queueMicrotask(() => {
      this.#scheduled = false;
      fn();
    });
  }
}
