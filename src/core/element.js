/**  Element
 *  * Parameters:
 * 1. type: the type of element you want to create or an an existing element. -> eg: div, span, etc {String || an Instance of HTMLElement} | required
 * 2. attributes: you can add any attributes that is not readonly onto the created element. -> eg: textContent, className, style(can nest object to apply properties like display, gap etc. can also be just a string) {Object || null}  | Optional
 * 3. childNodes: you can add childNode either created with Element constructor or just any legit Dom node. {Array} | Optional
 */
export default class Element {
  #type;
  #attributes;
  #childNodes;
  #unbindSignalMehtods;
  constructor(type = "", attributes = null, childNodes = null) {
    if (type && typeof type == "string" && !type.trim())
      throw new Error("Error: expected a type but got nothing");
    if (
      attributes &&
      (attributes.hasOwnProperty("innerHTML") ||
        attributes.hasOwnProperty("outerHTML"))
    ) {
      console.warn(
        "you are setting innerHTML/outerHTML dangerously, beware of client input",
        this
      );
    }

    this.#type = type;
    this.#attributes = attributes;
    this.#childNodes =
      childNodes && !Array.isArray(childNodes) ? [childNodes] : childNodes; // allow single element without wrapping it in an array

    this.#unbindSignalMehtods = []; // this will hold the unbind methods for the signals used in the attributes

    const element = Object.assign(
      typeof this.#type == "string"
        ? document.createElement(this.#type)
        : this.#type instanceof Node && this.#type,
      // if it's an instance of HTMLElement then use it as is,
      this.#attributes
    );

    if (!element) throw new Error("Error: expected a tag name or a valid node");

    // setting unbind methods to the element itself
    const _unbind = function () {
      if (!this.#unbindSignalMehtods.length) return;
      this.#unbindSignalMehtods.forEach((unbind) => {
        if (typeof unbind === "function") {
          unbind(); // call the unbind function to remove the subscription
        }
      });
      this.#unbindSignalMehtods = []; // clear the unbind methods after calling them
    };
    element.__unbind_Signals = _unbind.bind(this); // bind the unbind method to the element itself

    if (this.#attributes) {
      Object.keys(this.#attributes).forEach((attr) => {
        // provides find grained class binding
        if (attr === "class") {
          const classObject = this.#attributes[attr];

          for (const key in classObject) {
            const value = classObject[key];

            if (value.bind) {
              // bind it
              const unbind = value.bind((v) => {
                if (typeof v !== "boolean")
                  return console.error(
                    `Error: expected a boolean value but got ${v}`
                  );
                if (v) {
                  element.classList.add(key);
                } else {
                  element.classList.remove(key);
                }
              }, false);
              this.#unbindSignalMehtods.push(unbind);
            } else if (value._signal_) {
              // run evaluation by providing the applyval fn
              const unbind = value.evaluate((v) => {
                if (typeof v !== "boolean")
                  return console.error(
                    `Error: expected a boolean value but got ${v}`
                  );
                if (v) {
                  element.classList.add(key);
                } else {
                  element.classList.remove(key);
                }
              });
              this.#unbindSignalMehtods.push(unbind);
            } else {
              if (typeof this.#attributes.class[key] !== "boolean")
                return console.error(
                  `Error: expected a boolean but got ${
                    this.#attributes.class[key]
                  }`
                );

              if (this.#attributes.class[key]) element.classList.add(key);
            }
          }

          return; // done processing class
        }
        let value = this.#attributes[attr];

        // here if the user just want to bind just to the value alone and not a complex binding where they provide a callback which means they do as they wish with the new value
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
          // srore the binding for unbinding later on the exact node itself
          this.#unbindSignalMehtods.push(unbind); // store the unbind method for later use
        } else {
          // this handles object type atttributes
          if (typeof value === "object") {
            Object.assign(element[attr], value); // assign element attr properties to the element attribute

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
                // srore the binding for unbinding later
                this.#unbindSignalMehtods.push(unbind); // store the unbind method for later use
              }
            });
          }
        }
      });
    }

    if (this.#childNodes) {
      this.#childNodes.forEach((childNode) => {
        if (typeof childNode === "string")
          childNode = document.createTextNode(childNode); // none reactive text can be used inside of children array

        element.appendChild(childNode);
      });
    }

    return element;
  }
}
