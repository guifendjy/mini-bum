import LIFE_CYCLE_REGISTRY from "./utils/LIFE_CYCLE_REGISTRY.js";
import createNode from "./utils/createNode.js";
import setAttr from "./utils/setAttributeSmart.js";
import tokenizeString from "./utils/tokenizeString.js";
import setSubattributes from "./utils/setSubattributes.js";
import shallowEqual from "./utils/shallowEqual.js";
import isNotElementInstance from "./utils/isNotElementInstance.js";

/** @template T @typedef {import("./Signal.js").default<T>} SignalInterface */
/**
 * ClassMap - A map of class names to their activation state.
 * @typedef {Object.<string, boolean|string|SignalInterface<any>> & { $static?: string }} ClassMap
 * @description
 * Primary use: { "active": true, "hidden": $someSignalInterface }.
 * Use "$static" for raw class strings.
 */

/**
 * StyleMap - A map of CSS properties to their values.
 * @typedef {Object.<string, string|number|SignalInterface<any>> & { $static?: string }} StyleMap
 */

/**
 * ElementProps - Configuration for Element factory functions.
 * * @typedef {Object} ElementProps
 * @property {SignalInterface<Node>} [$ref] - Receives the raw DOM node reference.
 * @property {SignalInterface<String>} [$bind] - Two-way data binding for input elements.
 * @property {SignalInterface<Array>} [$bindGroup] - Two-way binding for radio/checkbox groups.
 * @property {(el: HTMLElement) => void} [onMount] - Callback triggered when added to DOM.
 * * @property {string|ClassMap} [class] - Accepts a static string or a ClassMap object.
 * @property {string|ClassMap} [className] - Alias for class.
 * @property {string|StyleMap} [style] - Accepts a static CSS string or a StyleMap object.
 * * @property {string|number|boolean} [textContent] - Static text content. (For reactive text, pass a SignalInterface to children instead).
 * * @property {Object.<string, any>} [attributes] - Catch-all for additional attributes and event listeners (e.g., onclick).
 */

/**
 * ElementInterface - runtime shape of Element instances.
 *
 * @template P - The type of the properties (props)
 * @typedef {Object} ElementInterface
 * @property {HTMLElement|null} element - the underlying DOM Node or null when destroyed.
 * @property {Object} rawProps - props passed to the constructor (useful for diffing).
 * @property {Array<ElementInterface<any>|Node|string|null>} children - normalized child instances.
 * @property {function(): ElementInterface<any>} render - (re)creates/initializes the instance and returns itself.
 * @property {function(): void} destroy - cleanup and detach the element.
 * @property {function(ElementInterface<P>): void} updateProps - patch this instance using another instance.
 */

/**
 * SignalInterface type imported from SignalInterface_instance.js
 * @typedef {import("../SignalInterface/SignalInterface_instance.js").SignalInterface<any>} SignalInterface
 */

/**
 * Element - runtime wrapper around DOM nodes that adds:
 *  - declarative props (attributes / properties / style / class)
 *  - event listeners (keys starting with "on")
 *  - reactive bindings (SignalInterface instances)
 *  - directives ($ref, $bind, $bindGroup, onMount)
 *
 * Notes:
 *  - Construct with a tag name (string) or an existing Node instance.
 *  - Passing SignalInterface instances as prop values will create reactive bindings.
 *  - Use special keys ($ref, $bind, $bindGroup, onMount) for directives.
 *
 * Examples: (see source file for examples)
 */

/**
 * @template P
 * @implements {ElementInterface<P>}
 */
export default class Element {
  #props = {};
  #listeners = [];
  #bindings = [];
  #unSubs = [];
  #specialAttributes = ["$ref", "$bind", "$bindGroup", "$static", "onMount"]; // should probably be a constant somewhere else.
  #directives = {};
  #tag = "";

  /**
   * Element constructor
   * @param {string|Node} [type] - tag name or existing Node
   * @param {ElementProps} [props] - Props of the element.
   * @param {string|number|Node|Array<Node|string|number>|import("../SignalInterface/SignalInterface_instance.js").SignalInterface<any>} [children] - Child nodes or reactive bindings.
   */
  constructor(type = "", props = {}, children = []) {
    if (!type) throw new Error("Error: expected at least a type.");

    this.#tag = type;
    this.element = null;
    this.destroy = this.destroy.bind(this);
    this.updateProps = this.updateProps.bind(this);
    this.render = this.render.bind(this);
    this.rawProps = props || {};

    // extract props, listeners, bindings, directives
    this.#props = this.#getProps(this.rawProps);
    this.children = this.#normalizeChildren(children);
    this.#listeners = this.#getListeners(this.rawProps);
    this.#bindings = this.#getBindings(this.rawProps);
    this.#directives = this.#getDirectives(this.rawProps);
  }

  render() {
    this.element =
      this.#tag instanceof Node || this.#tag instanceof Element
        ? this.#tag
        : this.#createElement(this.#tag); // initialization

    this.#initialize();

    return this;
  }

  #initialize() {
    // 1. apply props
    if (this.#props) this.#applyProps();
    // 2. append children
    if (this.children) this.#appendChildren();
    // 3. initialize bindings
    if (this.#bindings) this.#initializeBindings();
    // 4. initialize directives
    if (this.#directives) this.#initializeDirectives();
    // 5. attach listeners
    if (this.#isListener) this.#attachListeners();
  }

  #removeSubs() {
    // 1) run all registered cleanup/unbind functions
    if (this.#unSubs && this.#unSubs.length) {
      for (const fn of this.#unSubs) {
        try {
          if (typeof fn === "function") fn();
        } catch (e) {
          console.warn("Error running cleanup:", e);
        }
      }
      this.#unSubs.length = 0;
    }
    this.#unSubs = [];
  }
  #clearDirectives() {
    if (this.#directives.$ref) this.#directives.$ref.value = null;
    if (this.#directives.$bind) this.#directives.$bind.value = null;
    if (this.#directives.$bindGroup) this.#directives.$bindGroup.value = null;

    this.#directives = {};
  }
  #removeListeners() {
    // 2) remove event listeners added by this instance
    if (this.#listeners && this.#listeners.length) {
      for (const [key, handler] of this.#listeners) {
        try {
          this.element.removeEventListener(key.slice(2), handler);
        } catch (e) {
          // ignore removal errors
        }
      }
      this.#listeners.length = 0;
    }
    this.#listeners = [];
  }

  #destroyChildren() {
    // 3) recursively destroy child Element instances and unbind SignalInterface binds on DOM children
    if (this.children && this.children.length) {
      for (const child of this.children) {
        try {
          if (isInstanceOfMB(child)) {
            child.destroy();
          }
        } catch (e) {}
      }
      this.children.length = 0;
    }
    this.children = [];
  }

  destroy() {
    this.#removeSubs();
    this.#removeListeners();
    this.#clearDirectives();
    this.#destroyChildren();

    try {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    } catch (e) {}
    this.element = null;
  }

  updateProps(newInstance) {
    // extract props, listeners, bindings, directives from a dummy instance(created from a template - works like a virtual representation but no dom element get created- not rendered)
    const newProps = newInstance.rawProps;

    this.#removeListeners();

    this.#listeners = this.#getListeners(newProps);
    this.#props = this.#getProps(newProps);
    this.#directives = this.#getDirectives(newProps);

    if (!shallowEqual(newProps, this.rawProps)) this.#applyProps();
    this.#attachListeners();

    this.rawProps = newProps || {};

    for (let i = 0; i < newInstance.children.length; i++) {
      const childInstance = newInstance.children[i];
      this.children[i].updateProps(childInstance);
    }
  }

  #createElement(type) {
    return createNode(type);
  }
  #applyProps() {
    Object.entries(this.#props).forEach(([key, value]) => {
      setAttr(this.element, key, value);
    });
  }
  #appendChildren() {
    if (!this.children) return;

    this.children.forEach((child) => {
      if (!child.element) {
        const renderedInstance = child.render();
        this.element.appendChild(renderedInstance.element);
      }
    });
  }

  #normalizeChildren(children) {
    // flatten nested arrays
    const flatten = (input) => {
      if (!Array.isArray(input)) return [input];
      return input.reduce((acc, item) => acc.concat(flatten(item)), []);
    };

    return flatten(children)
      .map((child) => {
        // ignore null / undefined / false (common in JSX-like usage)
        if (child == null || child === false) return null;

        // already an Element-like instance
        if (isInstanceOfMB(child)) {
          return child;
        }

        // raw DOM node(not quite necessary but the listElement uses comment markers for each rendered node-> and there are not wrapped with this el.
        if (child instanceof Node) {
          return new Element(child);
        }

        // reactive SignalInterface -> wrap in an Element around a text node with a binding to textContent
        if (this.#isSignalInterface(child)) {
          const textNode = new Element(document.createTextNode(""), {
            textContent: child,
          });
          return textNode;
        }

        // primitives (string/number/boolean) -> wrap in an Element around a text node
        return new Element(document.createTextNode(""), {
          textContent: String(child),
        });
      })
      .filter((v) => v);
  }

  #attachListeners() {
    if (!this.#listeners.length) return;
    this.#listeners.forEach(([key, value]) => {
      this.element.addEventListener(key.slice(2), value);
    });
  }

  #initializeBindings() {
    if (!this.#bindings.length) return;
    this.#bindings.forEach(([attribute, value]) => {
      if (attribute !== "sub") {
        // regular attr binding
        let unbindMethod = value.bind((value) => {
          setAttr(this.element, attribute, value);
        });
        this.#unSubs.push(unbindMethod);
      } else {
        // sub attribute binding
        Object.entries(value).forEach(([subAttr, subBindings]) => {
          subBindings.forEach(([key, val]) => {
            let unbindMethod = val.bind((value) => {
              if (subAttr == "class") subAttr = "className"; // handle class aliasing for sub bindings(move this dow to setSubattributes maybe? since it can also be used for style sub attributes and in general it can be used for any attribute with sub attributes in the future if needed).
              setSubattributes(this.element, { [subAttr]: { [key]: value } }); // this only supports className and style for now since those are the only ones with sub attributes but it can be extended to support more in the future if needed (like data- or aria- attributes).
            });
            this.#unSubs.push(unbindMethod);
          });
        });
      }
    });
  }
  #initializeDirectives() {
    if (!Object.entries(this.#directives).length) return;

    Object.entries(this.#directives).forEach(([directive, value]) => {
      switch (directive) {
        case "$ref":
          if (this.#isSignalInterface(value)) {
            value.value = this.element; // provide ref to element outside ot the its context. becomes null when the element is removed. HELPS WITH GC
          } else
            throw new Error(
              `Error: expected a SignalInterface to hold the reference of the Node but got: `,
              value,
            );
          break;
        case "$bind":
          if (this.#isSignalInterface(value)) {
            this.#twoWayBinding(this.element, value);
          } else
            throw new Error(
              `Error: expected a SignalInterface to hold the reference of the Node but got: `,value
            );
          break;
        case "$bindGroup":
          if (this.#isSignalInterface(value)) {
            this.#twoWayBindingGroup(this.element, value);
          } else
            throw new Error(
              `Error: expected a SignalInterface to hold the reference of the Node but got: `,value
            );
          break;
        case "onMount":
          if (typeof value === "function") {
            LIFE_CYCLE_REGISTRY.register({
              element: this.element,
              onMount: value,
            });
          }
      }
    });
  }

  // utils
  #getProps(props) {
    return Object.fromEntries(
      Object.entries(props)
        .map(([key, value]) => {
          if (key === "class" || key === "className" || key === "style") {
            if (value && typeof value === "object") {
              if (value?.["$static"])
                // this is a special attribute
                value = { ...value, ...tokenizeString(value["$static"]) };

              return [
                key,
                Object.fromEntries(
                  Object.entries(value)
                    .map(([k, v]) => {
                      return this.#isSpecial(k)
                        ? false
                        : this.#isSignalInterface(v)
                          ? [k, v.value]
                          : [k, v];
                    })
                    .filter((v) => v),
                ),
              ];
            }
          }
          return (
            !this.#isSignalInterface(value) &&
            !this.#isListener(key) &&
            !this.#isSpecial(key) && [key, value]
          );
        })
        .filter((v) => v),
    );
  }

  #getListeners(props) {
    return Object.entries(props)
      .map(([key, value]) => this.#isListener(key) && [key, value])
      .filter((v) => v);
  }

  #getBindings(props) {
    return Object.entries(props)
      .map(([key, value]) => {
        if (key === "class" || key === "className" || key === "style") {
          if (value && typeof value === "object") {
            const subSigbindings = Object.entries(value).filter(
              ([k, v]) => this.#isSignalInterface(v) && !this.#isSpecial(k),
            );
            if (subSigbindings.length)
              return ["sub", { [key]: subSigbindings }];
          }
        }
        if (this.#isSignalInterface(value) && !this.#isSpecial(key)) {
          return [key, value];
        }
        return false;
      })
      .filter((v) => v);
  }
  #getDirectives(props) {
    return Object.fromEntries(
      Object.entries(props)
        .map(([key, value]) => {
          if (this.#isSpecial(key)) {
            return [key, value];
          }
        })
        .filter((v) => v),
    );
  }

  // utils
  #twoWayBinding(el, sig) {
    const valueType = typeState(sig.value); // keeps track of the value type to keeps SignalInterface's value type's stability.
    const { prop, event, tag } = this.#getBindingOptions(el);

    if (tag == "select") return this.#bindSelect(el, sig); // handle select binding multiple=true or not

    let updating = false;

    // update DOM when SignalInterface changes
    const unsub = sig.bind((v) => {
      if (updating) return;
      updating = true;
      if (el[prop] !== String(v)) {
        el[prop] = valueType.convert(v);
      }
      updating = false;
    });
    this.#unSubs.push(unsub);

    // update SignalInterface when DOM changes
    const bindHandler = () => {
      if (updating) return;
      updating = true;
      // keep value type of SignalInterface intact
      sig.value = valueType.convert(el[prop]);
      updating = false;
    };
    this.element.addEventListener(event, bindHandler);
    this.#listeners.push(["on" + event, bindHandler]); // save for when el gets detroyed or props gets updated.(scopes gets updated)
  }

  #bindSelect(el, sig) {
    const isMultiple = el.multiple;

    let updating = false;

    // --- Sync DOM when SignalInterface changes ---
    const unsub = sig.bind((value) => {
      if (updating) return;
      updating = true;

      if (!isMultiple) {
        // ensure DOM receives string
        el.value = value == null ? "" : String(value);
      } else {
        // value must be an array; if not, convert to empty array
        const arr = Array.isArray(value) ? value : [];
        const set = new Set(arr.map(String));

        for (const opt of el.options) {
          opt.selected = set.has(opt.value);
        }
      }

      updating = false;
    });

    // keep constraint
    // (you already have this pattern in your Element class)
    this.#unSubs.push(unsub);

    // --- Sync SignalInterface when DOM changes ---
    const handler = () => {
      if (updating) return;
      updating = true;

      if (!isMultiple) {
        sig.value = el.value;
      } else {
        sig.value = Array.from(el.selectedOptions).map((o) => o.value);
      }

      updating = false;
    };

    el.addEventListener("change", handler);
    this.#listeners.push(["onchange", handler]);
  }

  #twoWayBindingGroup(el, sig) {
    const { event, type } = this.#getBindingOptions(el);
    let updating = false;

    if (type === "radio") {
      const radioType = typeState(sig.value); // keeps track of the value type to keeps SignalInterface's value type's stability.

      if (radioType.type == "object") {
        // to avoid it breaking
        sig.value = "";
        console.warn("use a primite for group of radio inputs.", el); // need a better message here fs.
      }

      const onChange = function ({ target }) {
        if (updating) return;
        updating = true;
        group.value = radioType.sync(target.value);
        updating = false;
      };

      el.addEventListener("change", onChange);

      let unsub = sig.bind((v) => {
        if (updating) return;
        updating = true;
        input.checked = radioType.sync(input.value) == v;
        updating = false;
      });

      this.#unSubs.push(unsub);
      this.#listeners.push(["on" + event, onChange]);
      return;
    }

    if (type == "checkbox") {
      let checkType = typeState(sig.value[0] || sig.value || ""); // fallback to string since it's common
      if (!Array.isArray(sig.value)) {
        // to avoid it breaking
        sig.value = [sig.value];
        console.warn("use an array for group of checkbox inputs.", el); // need a better message here fs.
      }

      const onChange = function ({ target }) {
        if (updating) return;
        updating = true;
        sig.value = [
          ...(sig.value || []).filter((item) => item != target.value),
          target.checked && checkType.convert(target.value),
        ].filter((v) => v);
        updating = false;
      };

      el.addEventListener("change", onChange);

      const unsub = sig.bind((v) => {
        if (updating) return;
        updating = true;
        el.checked = (v || []).some(
          (item) => checkType.convert(el.value) == item,
        );
        updating = false;
      });

      this.#unSubs.push(unsub);
      this.#listeners.push(["on" + event, onChange]);
      return;
    }
    console.warn(
      "Warning: $bindGroup is being used on unauthorised element",
      el,
    );
  }

  #getBindingOptions(el) {
    const tag = el.tagName.toLowerCase();
    const type = el.type;
    const isCheckable = type === "checkbox" || type === "radio";

    const prop = isCheckable ? "checked" : tag === "details" ? "open" : "value";

    const event =
      isCheckable || tag === "select"
        ? "change"
        : tag === "details"
          ? "toggle"
          : "input";

    return { prop, event, type, tag };
  }

  #isSignalInterface(value) {
    return value && value.constructor.name === "Signal";
  }

  #isSpecial(value) {
    return (
      this.#specialAttributes.some((keywrd) => value === keywrd) ||
      (typeof value === "string" && value.startsWith("$"))
    );
  }
  #isListener(value) {
    return value.startsWith("on") && !this.#isSpecial(value);
  }
}

// grabs a value and keeps track of its type and you can then convert to keep it stable
// @ts-ignore
const typeState = (val) => ({
  type: val instanceof Date ? "date" : typeof val,
  convert(v) {
    if (this.type === "number") return isNaN(v) || v === "" ? 0 : Number(v);
    if (this.type === "boolean") return v === "true" || v === true;
    if (this.type === "date") return new Date(v);
    return v;
  },
});

// @ts-ignore
function isInstanceOfMB(element) {
  return element instanceof Element || isNotElementInstance(element); // or is ConditionalElement or ListElement
}
