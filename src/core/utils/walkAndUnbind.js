// UTIL(internal tool) function to walk through a DOM tree and unbind signals(for dynamic nodes)
// this is used to unbind signals of child nodes when the parent node gets unbound or removed from the DOM
// this is useful for dynamic nodes that are created with ListElement or ConditionalElement
export default function walkAndUnbind(node) {
    if (!node || node.nodeType != Node.ELEMENT_NODE) return;
    // unbind the signals of the current node
    if (node.__unbind_Signals) node.__unbind_Signals();
    Array.from(node?.childNodes).forEach((child) => {
      walkAndUnbind(child); // recursively walk through the child nodes
    });
  }