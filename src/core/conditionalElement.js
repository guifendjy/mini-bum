import walkAndUnbind from "./utils/walkAndUnbind.js";
import { $bind } from "../signal/index.js";

/** ConditionalElement
 * Parameters:
 * 1. signals: A signal or an array of signals.
 * 2. condFn: A callback function that gets passed the value(s) of the signal(s) as parameter and gets reevaluated whenever any signal's value changes.
 */
export default class ConditionalElement {
  #signals;
  #condFn;

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
