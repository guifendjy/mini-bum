import walkAndUnbind from "./utils/walkAndUnbind.js";
import shallowEqual from "./utils/shallowDiffing.js";
import { $bind } from "../signal/index.js";
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
 * @class
 * Represents a reactive conditional renderer.
 */
export default class ConditionalElement {
  #signals;
  #condFn;
  #nodes = [];
  #start = document.createComment("mb:start");
  #end = document.createComment("mb:end");
  #lastEvaluation;

  /**
   * @param {SignalInstance<T> | SignalInstance<T>[]} signals - A signal or array of signals to bind to.
   * @param {(value: any) => Node} condFn Function that returns a node depending on signal value
   * @returns {DOCUMENT_FRAGMENT_NODE}
   */

  constructor(signals, condFn) {
    this.#signals = signals;
    this.#condFn = condFn;

    const markers = document.createDocumentFragment();
    markers.append(this.#start, this.#end);

    $bind(this.#signals, (vals) => this.#update(vals), false);

    return markers;
  }

  #update(values) {
    // avoid unnecessary re-renders with a shallow comparison
    if (shallowEqual(this.#lastEvaluation, values)) return;
    // diff evaluation
    this.#lastEvaluation = values;

    const nodesToRender = this.#condFn(values); // evaluate condition

    if (!nodesToRender) {
      // if no nodes to render remove everything
      this.#removeNodes();
      return;
    }

    const newNodes =
      nodesToRender.nodeType === Node.DOCUMENT_FRAGMENT_NODE
        ? Array.from(nodesToRender.childNodes)
        : [nodesToRender] || [];

    // update nodes(clear and add new nodes)
    this.#addNodes(newNodes);
  }

  #removeNodes() {
    if (!this.#nodes.length) return; // nothing to remove

    let current = this.#start.nextSibling;
    while (current && current != this.#end) {
      let next = current.nextSibling;
      walkAndUnbind(current); // unbind any signals in the node
      current.remove();
      current = next;
    }
  }

  #addNodes(newNodes) {
    this.#removeNodes(); // remove oldnodes before proceeding

    const fragment = document.createDocumentFragment();
    this.#nodes = newNodes;

    this.#nodes.forEach((node) => {
      fragment.appendChild(node);
    });
    this.#start.parentNode.insertBefore(fragment, this.#end);
  }
}
