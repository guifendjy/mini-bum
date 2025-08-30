import LIFE_CYCLE_REGISTRY from "./utils/LIFE_CYCLE_REGISTRY.js";

/**
 * @template T
 * @typedef { {[K in keyof T as -readonly K]: T[K]}} Writable
 */

/**
 * @class
 * @template {keyof HTMLElementTagNameMap} T
 *
 * Represents an html element
 */
export default class Element {
  #type;
  #attributes;
  #childNodes;
  #unbindSignalMehtods;
  #onMount;

  /**
   *
   * @param {T|string|Node} type - tag name
   * @param {Partial<Writable<HTMLElementTagNameMap[T]>>} [attributes] - Attributes of the element.
   * @param {string|number|Node|Array<Node|string|number>|{bind: Function;$bind?: Function}} [childNodes] Child nodes or reactive bindings.
   * @returns {HTMLElementTagNameMap[T]} The created DOM node.
   */
  constructor(type = "", attributes = null, childNodes = null) {
    if (type && typeof type == "string" && !type.trim())
      throw new Error("Error: expected a type but got nothing");
    if (
      attributes &&
      (attributes.hasOwnProperty("innerHTML") ||
        attributes.hasOwnProperty("outerHTML"))
    ) {
      console.warn("you are setting innerHTML/outerHTML dangerously.", this);
    }

    this.#type = type;
    this.#attributes = attributes;
    this.#childNodes =
      childNodes && !Array.isArray(childNodes) ? [childNodes] : childNodes; // allow single element without wrapping it in an array

    this.#unbindSignalMehtods = []; // this will hold the unbind methods for the signals used in the attributes
    this.#onMount = this.#attributes?.onMount || false;
    if (this.#onMount) delete this.#attributes.onMount; // removes it so it does not attach to the actual element.

    const element = Object.assign(
      // if it's an instance of HTMLElement then use it as is
      typeof this.#type == "string"
        ? document.createElement(this.#type)
        : this.#type instanceof Node && this.#type,
      this.#attributes
    );

    // NEW FEATURE: Support onMount directly in attributes
    if (this.#onMount && typeof this.#onMount === "function") {
      LIFE_CYCLE_REGISTRY.register({
        element: element,
        onMount: this.#onMount,
      });
    }

    if (!element) throw new Error("Error: expected a tag name or a valid node");

    // setting unbind methods to the element itself
    const _unbind = function () {
      if (!this.#unbindSignalMehtods.length) return;
      this.#unbindSignalMehtods.forEach((unbind) => {
        if (typeof unbind === "function") {
          unbind(); // call the unbind function to remove the subscription
        }
      });
      this.#unbindSignalMehtods = [];
    };
    element.__unbind_Signals = _unbind.bind(this);

    if (this.#attributes) {
      Object.keys(this.#attributes).forEach((attr) => {
        // provides find grained class binding
        if (attr === "class") {
          let classObject = this.#attributes[attr];

          // new Feature allow adding $static classes alongside dynamic ones.
          if (classObject.$static) {
            let transformedStatic = Object.fromEntries(
              classObject.$static.split(" ").map((v) => [v, true])
            );

            Object.keys(transformedStatic).forEach(
              (key) => (this.#attributes.class[key] = true)
            );
            delete this.#attributes.class.$static;
            // done preprocessing  $static
          }

          for (const key in classObject) {
            const value = classObject[key];
            // it's a none pure signal
            if (value.bind) {
              // bind it
              const unbind = value.bind((v) => {
                if (v) {
                  element.classList.add(key);
                } else {
                  element.classList.remove(key);
                }
              }, false);
              this.#unbindSignalMehtods.push(unbind);
            } else if (value._signal_) {
              // it's a pure signal
              // run evaluation by providing the applyval fn
              const unbind = value.evaluate((v) => {
                if (v) {
                  element.classList.add(key);
                } else {
                  element.classList.remove(key);
                }
              });
              this.#unbindSignalMehtods.push(unbind);
            } else {
              if (this.#attributes.class[key]) element.classList.add(key);
            }
          }

          return; // done processing class
        }
        let value = this.#attributes[attr];

        // here if the user just want to bind just to the value alone and not a complex binding(derived) where they provide a callback which means they do as they wish with the new value
        if (value.bind) value = value.bind((v) => v);

        if (value && typeof value === "object" && value._signal_) {
          // this handles subscription
          const unbind = value.evaluate((evaluatedExpression) => {
            //TODO: I need a better way to handle results =>number, boolean both string or actual
            if (
              typeof evaluatedExpression != "number" &&
              !evaluatedExpression &&
              (attr == "className" || attr == "style")
            ) {
              element[attr] = "";
              return;
            }

            element[attr] = evaluatedExpression;
          });
          this.#unbindSignalMehtods.push(unbind); // store the unbind method for later use
        } else {
          // this handles object type atttributes(nested props)
          if (typeof value === "object") {
            Object.assign(element[attr], value);

            // handles subscription for subattribute binding
            Object.keys(value).forEach((subAttr) => {
              const subAttrValue = this.#attributes[attr][subAttr];

              if (subAttrValue._signal_) {
                const unbind = subAttrValue.evaluate((evaluatedExpression) => {
                  //TODO: I need a better way to handle results =>number, boolean both string or actual
                  if (
                    typeof evaluatedExpression != "number" &&
                    !evaluatedExpression
                  ) {
                    element[attr][subAttr] = "";
                    return;
                  }
                  element[attr][subAttr] = evaluatedExpression;
                });
                this.#unbindSignalMehtods.push(unbind);
              }
            });
          }
        }
      });
    }

    if (this.#childNodes) {
      this.#childNodes.forEach((childNode) => {
        if (
          typeof childNode === "string" ||
          typeof childNode == "number" ||
          typeof childNode == "boolean"
        ) {
          childNode = document.createTextNode(String(childNode));
        } // none reactive text can be used inside of children array

        element.appendChild(childNode);
      });
    }

    return element;
  }
}
