const propMap = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  colspan: "colSpan",
  rowspan: "rowSpan",
};

export default function setAttr(el, name, value) {
  applyValue(el, name, value);
}

function applyValue(el, name, value) {
  const isSvg = el.namespaceURI === "http://www.w3.org/2000/svg";

  if (value == null) {
    removeAttr(el, name);
    return;
  }

  // 1️⃣ Event handlers
  if (name.startsWith("on") && typeof value === "function") {
    const event = name.slice(2).toLowerCase();
    el.removeEventListener(event, el[`__${event}`]);
    el.addEventListener(event, value);
    el[`__${event}`] = value;

    return;
  }

  // 2️⃣ Style
  if (name === "style") {
    if (typeof value === "object") {
      for (const [prop, val] of Object.entries(value)) {
        el.style[prop] = val ?? "";
      }
    } else {
      el.style.cssText = value;
    }
    return;
  }

  // 3️⃣ SVG or regular attribute
  if (isSvg) {
    // Handle xlink:href, xmlns, etc.
    if (name === "xlink:href") {
      el.setAttributeNS("http://www.w3.org/1999/xlink", "href", value);
    } else if (name === "className") {
      el.setAttribute("class", value);
    } else {
      el.setAttribute(name, value);
    }
    return;
  }

  // 4️⃣ HTML Elements (normal path)
  if (name.startsWith("data-") || name.startsWith("aria-")) {
    el.setAttribute(name, value);
    return;
  }

  // Boolean attributes
  if (typeof value === "boolean") {
    const prop = propMap[name] || name;
    if (prop in el) {
      el[prop] = value;
    } else {
      if (value) el.setAttribute(name, "");
      else el.removeAttribute(name);
    }
    return;
  }

  // Fallback: property or attribute
  const prop = propMap[name] || name;
  if (prop in el) {
    el[prop] = value;
  } else {
    el.setAttribute(name, value);
  }
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
