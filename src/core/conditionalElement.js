import walkAndUnbind from "./utils/walkAndUnbind.js";
import { $bind } from "../signal/index.js";

/** CondtionalElement
 * Parameters:
 * 1. signal: a signal or an array of signals that will be used to evaluate the condition.
 * 2. a callback function that takes the signal value as an argument and returns a node to render based on the condition.
 */
export default class ConditionalElement {
  #signals;
  #condFn;

  constructor(signals, condFn) {
    this.#signals = signals;
    this.#condFn = condFn;

    let markerNode = document.createComment("mrk:cond"); // initial marker node
    $bind(
      this.#signals,
      (values) => {
        walkAndUnbind(markerNode); // unbind signals of the current node and children before rendering a new one

        const nodeToRender = this.#condFn(values);

        if (
          !nodeToRender ||
          !nodeToRender instanceof Element ||
          !nodeToRender instanceof HTMLElement
        ) {
          console.error(
            "Error: expected a valid Element to render but got:",
            nodeToRender
          );
          return;
        }
        if (nodeToRender.isEqualNode(markerNode)) return; // no need to update if the node is the same(even it the evaluation happens muttiple times with multiple signals)

        markerNode.replaceWith(nodeToRender);
        markerNode = nodeToRender; // update the markerNode to the new node
      },
      false
    );

    return markerNode;
  }
}
