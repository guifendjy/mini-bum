import LCSDiffEngine from "./utils/diffing.js";
import uniqid from "./utils/uniqId.js";
/**
 * @template T
 * @typedef {import('./element.js').ElementInstance<T>} ElementInstance
 */

/**
 * @template T
 * @typedef {import("../signal/Signal_instance.js").SignalInstance<T>} SignalInstance
 */

/**
 * ListElement<T>
 *
 * A reactive list/controller that maps an array-held Signal to a sequence of DOM
 * blocks and incrementally updates the DOM using a diffing engine (LCS-based).
 *
 * The ListElement expects a "signal" object that exposes a `bind` method:
 * - signal.bind(callback) — registers a callback invoked with the current array and on subsequent updates.
 *
 * The mapping function (`mapFn`) should return an "item instance" that conforms to the minimal instance
 * interface used by ListElement:
 * - instance.element: Node | DocumentFragment        // the root DOM node for the item (or a fragment)
 * - instance.render?(): instance                      // optional: prepare/render the instance and return it
 * - instance.updateProps(otherInstance): void         // update this instance's content/props from another instance
 * - instance.destroy(): void                          // clean up/remove DOM listeners/resources
 * - instance.children?: Array<instance>               // optional: when element is a fragment, child instances
 *
 * @template T
 *
 * Public properties:
 * - render: () => any
 *   Renders the list element and returns an Element instance.
 *
 * - element: Node
 *   A placeholder comment node inserted into the DOM; used as an anchor for insertions when the list is empty.
 *
 * Usage example (basic):
 *
 * const mapFn = (item, index) => {
 *   return new Element("div", {textContent: `${index}: ${item}`});
 * };
 *
 * const list = new ListElement(signal, mapFn).render();
 * document.body.appendChild(list.element);
 *
 * When `signal` emits a new array the internal LCSDiffEngine will compute
 * add/remove/move/keep operations and ListElement will:
 * - call mapFn for added/moved/kept items to create a "dummy" instance representing the new state,
 * - call updateProps(dummy) on existing instances when keeping or after moving,
 * - call destroy() for removed instances and delete them from internal bookkeeping,
 * - insert newly rendered instances into the DOM next to the placeholder or previous sibling.
 *
 * Important implementation details (behavioral summary):
 * - render():
 *     - creates a comment placeholder: this.element = document.createComment('m:...').
 *     - binds to the provided signal: signal.bind(items => schedule microtask to #update(items)).
 *     - returns `this` so the caller may append the placeholder to the DOM.
 *
 * - #update(items) [private]:
 *     - computes differences between the previously observed array and the new `items` using LCSDiffEngine.
 *     - handles "remove" changes first by invoking instance.destroy() and removing bookkeeping entries.
 *     - processes "move", "keep", and "add" changes:
 *         * "move": extracts the instance, transfers its DOM (using a DocumentFragment placeholder),
 *           then calls instance.updateProps(dummyInstanceFromMapFn).
 *         * "keep": calls updateProps on the existing instance using a dummy instance from mapFn.
 *         * "add": creates a new instance via mapFn(...).render(), inserts it after a computed reference node,
 *           and stores it in the internal map keyed by item keys.
 *     - updates internal #currentState with a deep-cloned copy of `items`.
 *
 * - #createItem(item, index) [private]
 *     - returns the object produced by mapFn(item, index) (the "dummy" or newly-created instance).
 *
 * - #scheduleUpdate(fn) [private]
 *     - queues the update using queueMicrotask ensuring only one microtask is scheduled at a time.
 *
 * - #safeDeepClone(value) [private]
 *     - performs a safe deep clone of arrays and plain objects to avoid mutating the original signal-provided array.
 *     - preserves identity for non-plain objects (e.g. DOM nodes, class instances) and handles cycles.
 *
 * Example: integrating with a very small Signal implementation
 *
 *  @example
 * // create and use the list
 * const s = $signal([{ id: 1, text: 'one' }, { id: 2, text: 'two' }])
 * const mapFn = (item) => {
 *   return new Element(item);
 * };
 *
 * const list = new ListElement(s, mapFn).render();
 * document.body.appendChild(list.element);
 *
 */

// NOTE: implement a way to handle fragments as item instances,
// where the mapFn returns an instance with multiple child nodes.
// This would require some adjustments to the way we handle
// insertions and updates, since we would need to manage a
// group of nodes as a single item instance. The placeholder
// technique could still work, but we would need to ensure that
//  all child nodes of the fragment are correctly inserted and updated
//  together. This is an important feature for more complex list items
// that may consist of multiple DOM elements.
// solution: wrap result with a div or some other container element,
//  so that we can treat the entire fragment as a single unit
//  for insertion and updates. The mapFn would be responsible
// for creating this wrapper element around the fragment content,
//  and the ListElement would then manage the wrapper as the item
// instance. This way we can maintain the same update and insertion
//  logic while still allowing for complex item structures.

/** @template T */
export default class ListElement {
  #signal;
  #mapFn;
  #currentState = []; // old array items before diffing
  #refreshMap = new Map();
  #scheduled = false;
  #diffEngine = new LCSDiffEngine();

  /**
   * @param {SignalInstance<T>} signal - A reactive signal holding an array of items.
   * @param {(item: T, index: number) => ElementInstance<T>} mapFn - Function mapping items to DOM nodes
   */
  constructor(signal, mapFn) {
    if (!signal.bind) {
      throw new Error("Error: expected a signal as first parameter.");
    }
    this.element = null;
    this.#signal = signal;
    this.#mapFn = mapFn;
    this.render = this.render.bind(this);
  }

  render() {
    this.element = document.createComment(`m:${uniqid("_", 3)}`);

    this.#signal.bind((items) => {
      this.#scheduleUpdate(() => this.#update(items));
    });

    return this;
  }

  #update(items) {
    const is2DArray =
      Array.isArray(items) && items.length > 0 && Array.isArray(items[0]);

    let standardizedItems = [];
    if (is2DArray) {
      // If it's a 2D matrix (like BOARD)
      // This tells the LCS engine: "This is Row X, compare its identity by position, not by its array memory reference!"
      standardizedItems = items.map((rowItem, index) => {
        return {
          key: `matrix-row-${index}`, // Stable structural key bound to row position
          rawData: rowItem, // Keep the actual row contents safe
        };
      });
    } else {
      // 1D Array Fallback
      standardizedItems = items.map((item, index) => {
        return {
          key:
            typeof item === "object" && item !== null
              ? item.id || `1d-${index}`
              : `primitive-${item}@${index}`,
          rawData: item,
        };
      });
    }
    let changes = this.#diffEngine.runDiff(
      this.#currentState,
      standardizedItems,
    );

    //  phase 1: removals
    for (const [key, change] of changes) {
      if (change.type === "remove") {
        let blockToRemove = this.#refreshMap.get(key);

        if (blockToRemove) {
          blockToRemove.destroy();
          this.#refreshMap.delete(key);
        }
      }
    }

    // phase 2: reconcile
    let cursor = this.element; // start at the placeholder

    this.#diffEngine.wrappedNew.forEach((wrapped, index) => {
      const { key, item } = wrapped;
      const change = changes.get(key);
      let currentInstance = this.#refreshMap.get(key);

      if (change.type === "add") {
        const itemInstance = this.#createItem(item.rawData, index).render();

        currentInstance = itemInstance;

        cursor.after(itemInstance.element);
        this.#refreshMap.set(key, itemInstance);
      } else {
        if (change.patch) {
          const dummyInstance = this.#createItem(item.rawData, index);
          currentInstance.updateProps(dummyInstance);
        }

        // move after cursor if not already in the right place
        if (
          change.type === "move" &&
          (!cursor.nextSibling ||
            cursor.nextSibling !== currentInstance.element)
        ) {
          cursor.after(currentInstance.element);
        }
      }
      cursor = currentInstance.element;
    });

    this.#currentState = standardizedItems;
  }

  #createItem(item, index) {
    let itemInstance = this.#mapFn(item, index);
    return itemInstance;
  }

  #scheduleUpdate(fn) {
    if (this.#scheduled) return;
    this.#scheduled = true;

    queueMicrotask(() => {
      this.#scheduled = false;
      fn();
    });
  }
}
