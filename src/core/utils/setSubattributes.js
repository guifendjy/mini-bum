/**
 * setSubattributes.js
 *
 * Set or remove sub-properties of `style` and `className` on a DOM element.
 *
 * Usage:
 *   // element = document.querySelector(...)
 *   setSubattributes(element, {
 *     style: { color: 'red', 'background-color': null }, // null/undefined/false -> remove
 *     className: { active: true, hidden: false }        // true -> add, false -> remove
 *   });
 */


/**
 * Add or remove a specific class or style from an Element
 *
 * @internal
 * @param {Node} element
 * @param {Object} [param1={}] options
 * @param {String} param1.style
 * @param {String} param1.className
 * @ts-ignore
 * 
 *  */
export default function setSubattributes(element, { style, className } = {}) {
  if (!element || !(element instanceof Element)) {
    throw new TypeError("First argument must be a DOM Element");
  }

  // Handle style sub-properties
  if (style && typeof style === "object") {
    for (const [prop, value] of Object.entries(style)) {
      const isCustomOrKebab = prop.includes("-");

      // Remove if value is falsy boolean / null / undefined / false
      const shouldRemove =
        value === false || value === null || value === undefined;

      if (shouldRemove) {
        if (isCustomOrKebab) {
          element.style.removeProperty(prop);
        } else {
          // setting empty string removes the inline style for JS-style props
          element.style[prop] = "";
        }
        continue;
      }

      // Set property. For kebab/custom properties use setProperty so CSS var and hyphen names work.
      if (isCustomOrKebab) {
        element.style.setProperty(prop, String(value));
      } else {
        // allow numeric values for some css properties (browser will coerce), stringify safe fallback
        element.style[prop] = value;
      }
    }
  }

  // Handle className sub-properties
  if (className && typeof className === "object") {
    for (const [cls, shouldAdd] of Object.entries(className)) {
      if (shouldAdd) {
        element.classList.add(cls);
      } else {
        element.classList.remove(cls);
      }
    }
  }

  return element;
}
