import walkAndUnbind from "./utils/walkAndUnbind";

/**
 * ListElement
 * 
 * Parameters:
 * 1. signal: A reactive value (expected to be an array) that triggers re-rendering or re-evaluation of a callback whenever its value changes. The signal must provide a `bind` method as part of its API.
 * 
 * 2. mapFn: A callback function that takes the signal's value as input and returns an array of DOM nodes or elements. These nodes can be nested if the signal's value is a multi-dimensional array. The user is responsible for implementing the logic to handle such cases.
 * 
 * Behavior:
 * - The entire structure is re-rendered whenever the signal's value changes.
 * - Existing nodes are unbound and removed before new nodes are rendered.
 */
export default class ListElement {
  #signal;
  #mapFn;
  #nodes;

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

    this.#signal.bind((MUTDSignal) => {
      const newNodes = this.#mapFn(MUTDSignal);

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

    return [markerNode, ...this.#nodes]; // this should always return an array.
  }
}
