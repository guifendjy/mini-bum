import walkAndUnbind from "./utils/walkAndUnbind";

/** ListElement
 * Parameters:
 * 1. signal: a reactive value that triggers a rerender or re-evaluation of a given callback using the bind method provide by the signal api. it's value has to be an array.
 * 2. callback: which take a signal as parameter which can be used to loop through and return map op nodes either regular dom nodes or elements(can be nested if signal's value is a 2 dimensional array users have to figure out the logic)
 * // ps: the entire stucture gets re-renrendered when the signals value changes.
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
