import tagNames from "./tagNames.js";
import { Element, ConditionalElement, ListElement } from "../core/index.js";

export default function _init_() {
  const E = {};

  // Core element factory with flexible argument parsing
  for (const tag of tagNames) {
    E[tag] = (input) => {
      if (
        typeof input === "string" ||
        typeof input === "number" ||
        input instanceof Node ||
        Array.isArray(input) ||
        input?.bind ||
        input?._signal_
      ) {
        if (!Array.isArray(input)) input = [input];

        input = input.map(createText);
        return new Element(tag, null, input);
      }

      if (input !== null && typeof input === "object") {
        let { children, ...attributes } = input;
        if (children && !Array.isArray(children)) {
          // change it to an array if it is not.
          children = [children];
        }
        return new Element(tag, attributes, (children || []).map(createText));
      }

      return new Element(tag, null); // no args
    };
  }

  // Reactive text node — now internal use only
  function createText(value) {
    if (value instanceof Node) return value;
    if (value && value.bind) value = value.bind((v) => v);

    const node = new Element(document.createTextNode(""), {
      textContent: value,
    }); // this will automaticly detect if value is a signal or not

    return node;
  }

  // Safe fragment generator
  E.fragment = (...children) => {
    const frag = document.createDocumentFragment();

    const append = (child) => {
      if (child === false || child === null || child === undefined) return;

      if (Array.isArray(child)) {
        child.forEach(append);
      } else if (child instanceof Node) {
        frag.appendChild(child);
      } else if (
        child &&
        typeof child === "object" &&
        (child._signal_ || child.bind)
      ) {
        frag.appendChild(createText(child));
      } else {
        frag.appendChild(document.createTextNode(String(child)));
      }
    };

    children.forEach(append);
    return frag;
  };

  E.text = (text) => {
    const node = new Element(document.createTextNode(""), {
      textContent: text,
    }); // this will automaticly detect if text is a signal or not

    return node;
  };

  // `E.list` - reactive foreach
  E.list = (signal, mapFn) => {
    let list = new ListElement(signal, mapFn);
    return list;
  };

  // `E.cond` - reactive conditional
  E.cond = (signal, condFn) => {
    return new ConditionalElement(signal, condFn);
  };

  // E.$ - adds reactivity to a node
  E.$ = (query, attributes = {}) => {
    let nodes = [];

    // Handle different input types
    if (typeof query === "string") {
      nodes = [document.querySelector(query)];
    } else if (query instanceof Node) {
      nodes = [query];
    } else if (
      Array.isArray(query) &&
      query.every((q) => typeof q === "string")
    ) {
      const qNodes = query.map((q) => {
        let n = document.querySelector(q);
        if (!n) {
          console.error(`Error querring '${q}' at:`, query);
          return q;
        }
        return n;
      });
      nodes = qNodes;
    } else if (query instanceof NodeList || query instanceof HTMLCollection) {
      nodes = Array.from(query);
    } else {
      throw new Error(
        "Invalid query: must be a selector(string), Node, NodeList, HTMLCollection, or array of selector."
      );
    }

    // Map each DOM node to an Element instance
    let elms = nodes.map((node) => {
      let { children, ...rest } = Object.assign({}, attributes);
      if (children && !Array.isArray(children)) {
        // change it to an array if it is not.
        children = [children];
      }
      return new Element(node, rest, (children || []).map(createText));
    });
    return elms.length === 1 ? elms[0] : elms; // return single element or array.
  };

  return Object.freeze(E); // makes it more secure so tags cannot be overriden
}
