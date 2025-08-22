import walkAndUnbind from "./utils/walkAndUnbind.js";
import { $bind } from "../signal/index.js";

/**
 * @class
 * Represents a reactive conditional renderer.
 */
export default class ConditionalElement {
  #signals;
  #condFn;

  /**
   * @param {Signal<T> | Signal<T>[]} signals - A signal or array of signals to bind to.
   * @param {(value: any) => Node} condFn Function that returns a node depending on signal value
   * @returns {HTMLElement}
   */

  constructor(signals, condFn) {
    this.#signals = signals;
    this.#condFn = condFn;

    let markerNode = document.createComment("mrk:cond"); // Initial marker node

    $bind(
      this.#signals,
      (values) => {
        const nodeToRender = this.#condFn(values);

        if (markerNode === nodeToRender) return; // If the node to render is the same as the marker node, do nothing

        if (!nodeToRender) {
          // If no node to render, ensure markerNode is a comment
          if (
            markerNode.nodeType !== Node.COMMENT_NODE ||
            markerNode.nodeValue !== "mrk:cond"
          ) {
            walkAndUnbind(markerNode); // Unbind signals of the current node and children
            const commentNode = document.createComment("mrk:cond");
            markerNode.replaceWith(commentNode);
            markerNode = commentNode;
          }
          return;
        }

        // If there is a node to render, replace the markerNode
        walkAndUnbind(markerNode); // Unbind signals of the current node and children
        markerNode.replaceWith(nodeToRender);
        markerNode = nodeToRender; // Update markerNode to the new node
      },
      false
    );

    return markerNode;
  }
}
