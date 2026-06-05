import { Element, ConditionalElement, ListElement } from "../core/index.js";

/**@internal */
export default function _init_() {
  return new Proxy(
    {},
    {
      get(target, tag) {
        if (tag === "$") {
          return query();
        }
        if (tag === "cond") {
          return conditional();
        }

        if (tag === "list") {
          return listRendering();
        }
        if (tag === "fragment") {
          return fragmentRendering();
        }

        // regular element - accept (attrs?), (child|children), or (...children)
        return (...args) => {
          const normalize = (input) => {
            if (input == null) return { attributes: null, children: null };
            if (Array.isArray(input))
              return { attributes: null, children: input };

            // If input is already an Element-like instance (including Conditional/List or anything with render),
            // treat it as a single child rather than attributes.
            if (
              input instanceof Element ||
              input instanceof ConditionalElement ||
              input instanceof ListElement ||
              (input && typeof input.render === "function")
            ) {
              return { attributes: null, children: [input] };
            }

            if (
              typeof input === "object" &&
              !input.bind &&
              !(input instanceof Node)
            ) {
              const { children, ...attrs } = input;
              return {
                attributes: Object.keys(attrs).length ? attrs : null,
                children:
                  children === undefined
                    ? null
                    : Array.isArray(children)
                      ? children
                      : [children],
              };
            }
            // primitives, Node, signal, functions, etc. => single child
            return { attributes: null, children: [input] };
          };

          let attributes = null;
          let children = null;

          if (args.length === 0) {
            // <tag />
          } else if (args.length === 1) {
            const n = normalize(args[0]);
            attributes = n.attributes;
            children = n.children;
          } else {
            // multiple args treated as children: <tag(a, b, c)>
            attributes = null;
            children = args;
          }

          return new Element(tag, attributes, children);
        };
      },
    },
  );
}

/**@internal */
function conditional() {
  return function (signals, callback) {
    return new ConditionalElement(signals, callback);
  };
}

/**@internal */
function listRendering() {
  return function (signal, callback) {
    return new ListElement(signal, callback);
  };
}

/**@internal */
function fragmentRendering() {
  return function (...children) {
    return new Element(document.createDocumentFragment(), null, children);
  };
}

/**@internal */
function sanitizeQuery(query) {
  if (Array.isArray(query)) {
    // array of selector strings
    if (query.every((q) => typeof q === "string")) {
      const seen = new Set();
      const unique = [];
      const dupes = [];
      for (const q of query) {
        if (seen.has(q)) dupes.push(q);
        else {
          seen.add(q);
          unique.push(q);
        }
      }
      if (dupes.length) {
        console.warn("Duplicate selector(s) found and ignored:", [
          ...new Set(dupes),
        ]);
        query = unique;
      }
    } else if (query.every((q) => q instanceof Node)) {
      // array of Nodes
      const seen = new Set();
      const unique = [];
      for (const n of query) {
        if (!seen.has(n)) {
          seen.add(n);
          unique.push(n);
        }
      }
      if (unique.length !== query.length) {
        console.warn("Duplicate DOM Node(s) found and ignored.");
        query = unique;
      }
    }
  } else if (query instanceof NodeList || query instanceof HTMLCollection) {
    const arr = Array.from(query);
    const seen = new Set();
    const unique = [];
    for (const n of arr) {
      if (!seen.has(n)) {
        seen.add(n);
        unique.push(n);
      }
    }
    if (unique.length !== arr.length) {
      console.warn("Duplicate NodeList/HTMLCollection entries removed.");
      query = unique;
    }
  }

  return query;
}

/**@internal */
function query() {
  return (query, attributes = {}) => {
    // detect duplicated queries and collapse them to unique while warning
    sanitizeQuery(query);

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
          console.error(`Error: failed to find Node '${q}' at:`, query);
          return q;
        }
        return n;
      });
      nodes = qNodes;
    } else if (query instanceof NodeList || query instanceof HTMLCollection) {
      nodes = Array.from(query);
    } else {
      throw new Error(
        "Invalid query: must be a selector(string), Node, NodeList, HTMLCollection, or array of selector.",
      );
    }

    // Map each DOM node to an Element instance
    let elms = nodes.map((node) => {
      let { children, ...rest } = Object.assign({}, attributes);
      return new Element(node, rest, children).render();
    });
    return elms.length === 1 ? elms[0] : elms; // return single element or array.
  };
}
