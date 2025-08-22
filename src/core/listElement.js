import walkAndUnbind from "./utils/walkAndUnbind.js";

/**
 * @class
 * Represents a reactive list of elements
 */
export default class ListElement {
  #signal;
  #mapFn;
  #nodes;

  /**
   * @param {Signal<T[]>} signal - A reactive signal holding an array of items.
   * @param {(item: any, index: number) => Node} mapFn - Function mapping items to DOM nodes
   * @returns {DocumentFragment}
   */
  constructor(signal, mapFn) {
    if (!signal || typeof signal !== "object" || !signal.bind) {
      throw new Error(
        "Error: expected a signal as first parameter but got nothing or invalid signal."
      );
    }
    this.#signal = signal;
    this.#mapFn = mapFn;
    this.#nodes = [];

    const markerNode = document.createComment("mb:map");
    const tempFrag = document.createDocumentFragment();

    this.#signal.bind((currentItemValue) => {
      const newNodes = currentItemValue.map((v) => {
        const node = this.#mapFn(v);
        if (!node) {
          console.error(`Error expected a node but got ${node}`, this.#mapFn);
          return;
        }
        return node;
      });

      // all needs to be gone
      if (!newNodes.length) {
        if (this.#nodes.length)
          this.#nodes.forEach((n) => {
            walkAndUnbind(n); // unbind signals of the current node and children before removing it
            n.remove();
          });
        return;
      }

      if (markerNode.isConnected) {
        // when it gets updated rerender everything
        this.#nodes.forEach((n) => {
          walkAndUnbind(n); // unbind signals of the current node and children before removing it
          n.remove();
        });
        tempFrag.append(...newNodes);
        markerNode.parentNode.insertBefore(tempFrag, markerNode);
      }
      this.#nodes = newNodes;
    }, false);

    const frag = document.createDocumentFragment();
    frag.append(markerNode, ...this.#nodes);
    return frag; // this should always return an array.
  }
}
