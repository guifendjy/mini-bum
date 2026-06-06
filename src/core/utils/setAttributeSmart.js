const propMap = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  colspan: "colSpan",
  rowspan: "rowSpan",
};

/**
 * Set attributes on an Element.
 * @internal
 * @param {Node} el
 * @param {String} name
 * @param {String | Object} value
 *@returns {void}
 *
 * @ts-ignore
 *  */

export default function setAttr(el, name, value) {
  applyValue(el, name, value);
}

function removeAttr(el, name) {
  const prop = propMap[name] || name;
  if (name in el) {
    try {
      el[prop] = typeof el[prop] === "boolean" ? false : "";
    } catch {}
  }
  el.removeAttribute(name);
}

function applyValue(el, name, value) {
  const isSvg = el.namespaceURI === "http://www.w3.org/2000/svg";

  if (value == null) {
    removeAttr(el, name);
    return;
  }

  if (isSvg) {
    if (name === "xlink:href") {
      el.setAttributeNS("http://www.w3.org/1999/xlink", "href", value);
    } else if (name === "className" || name === "class") {
      // note: cannot set prop 'className' onto svg element.
      if (typeof value === "object") {
        setClasses(el, value);
      } else if (typeof value == "string") {
        el.setAttribute("class", sanitizeClassString(value));
      }
    } else {
      el.setAttribute(name, value);
    }
    return;
  }

  if (name === "style") {
    setStyles(el, value);
    return;
  }

  if (name === "className" || name === "class") {
    setClasses(el, value);
    return;
  }

  if (name.startsWith("data-") || name.startsWith("aria-")) {
    el.setAttribute(name, value);
    return;
  }

  const prop = propMap[name] || name;

  if (typeof value === "boolean") {
    if (prop in el) {
      el[prop] = value;
    } else {
      value ? el.setAttribute(name, "") : el.removeAttribute(name);
    }
    return;
  }

  if (prop in el) {
    el[prop] = value;
  } else {
    el.setAttribute(name, value);
  }
}

function setClasses(el, value) {
  if (typeof value === "object") {
    for (const [prop, val] of Object.entries(value)) {
      el.classList[val ? "add" : "remove"](...prop.split(" ").filter(Boolean));
    }
  } else {
    el.className = sanitizeClassString(value);
  }
}

function setStyles(el, value) {
  if (typeof value === "object") {
    for (const [prop, val] of Object.entries(value)) {
      val ? (el.style[prop] = val) : el.style.removeProperty(prop);
    }
  } else {
    el.style.cssText = sanitizeStyleString(value);
  }
}

function sanitizeClassString(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .filter(
      (token) =>
        !/^(?:true|false|null|undefined|NaN|Infinity|-Infinity)$/.test(token),
    )
    .join(" ");
}

function sanitizeStyleString(value) {
  return value
    .replace(/\b(?:true|false|null|undefined|NaN|Infinity|-Infinity)\b/g, "")
    .trim()
    .replace(/\s*;\s*/g, ";")
    .replace(/;;+/g, ";")
    .replace(/^;|;$/g, "");
}
