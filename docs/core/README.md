# 🧱 MiniBum Core

Low-level DOM reactive engine built with JavaScript classes and functional bindings.

> ⚠️ This project is `experimental` and MIT licensed. Feel free to use, modify, and learn from it!

## Installation

```bash
npm install minibum@experimental

```

## Usage

```js
import {
  Element,
  signal,
  $bind,
  ListElement,
  ConditionalElement,
} from "minibum/core";
```

## API Overview

### `signal(initialValue)`

Creates a reactive value:

```js
const count = signal(0);
count.value++;
```

### `$bind(signals, callback, evalAsExpression = true)`

#### Inside Element:

```js
new Element("p", {
  textContent: $bind(count, (v) => `Count is ${v}`),
});
// Alternatively, use the bind method directly on the signal:
new Element("p", {
  textContent: count.bind((v) => `Count is ${v}`),
});
```

#### Outside Element (manual update):

```js
$bind(
  count,
  (v) => {
    el.textContent = `Count is ${v}`;
  },
  false
);
```

Alternatively, you can use the `bind` method directly on the signal:

```js
count.bind((v) => {
  el.textContent = `Count is ${v}`;
}, false);
```

> **Note:** The `$bind` or `signal.bind` function automatically evaluates bindings within the `Element` context when `evalAsExpression` is set to `true`(default). For usage outside the `Element` context, set `evalAsExpression` to `false` and manually update the DOM as needed.

### `new Element(type, attributes?, children?)`

Create DOM nodes with attribute and class binding support. The `type` parameter can be a string representing the tag name (e.g., `"div"`, `"span"`) or an already created DOM node. If a node is provided, it will use the existing node instead of creating a new one.

```js
// Using a tag name(this creates a div node)
new Element("div", {
  class: { active: someSignal },
  textContent: "Hello!",
});

// Using an existing DOM node
const existingNode = document.createElement("p");
new Element(existingNode, {
  textContent: "This is an existing node",
});
```

The `attributes` parameter supports reactive bindings for attributes, while the `children` parameter can be a string, a node, or an array of nodes or both:

```js
new Element(
  "div",
  {
    class: { active: someSignal },
    textContent: "Hello!",
  },
  "Optional child content"
);
```

### `class.$static — Combine Static & Reactive Classes`

The class attribute accepts reactive values and a special $static key for always-on classes.

```js
import { Element, signal } from "minibum/core";

const highlighted = signal(true);
const hidden = signal(false);

new Element(
  "div",
  {
    class: {
      $static: "card shadow", // permanent classes - static
      highlighted, // toggled by `highlighted`
      hidden, // toggled by `hidden`
    },
  },
  "Hello World"
);
```

### `Lifecycle Hooks — onMount & onUnmount`

Minibum supports lifecycle hooks for elements:
• onMount(el) — called when the element is inserted into the DOM or atleast 50% of the element is visible(intersecting).
• onMount can return a cleanup function that runs automatically on unmount or atleast 50% of the element becomes hidden and out of focus(you can lazy load resources easily).

```js
new Element(
  "div",
  {
    onMount(el) {
      console.log("Mounted:", el);
      const interval = setInterval(() => console.log("Tick"), 1000);

      // Cleanup on unMount - optional
      return () => clearInterval(interval);
    },
  },
  "I live and die with the DOM"
);
```

> ⚠️Note: Lifecycle hooks are per-instance. If an element is destroyed and recreated, hooks will re-run(re-register). But if the same element node is detached and re-attached manually, hooks won’t re-run.

### `new ListElement(signal, callback)`

Maps over signal values and re-renders on updates.

```js
new ListElement(itemsSignal, (item) => new Element("li", null, item));
```

### `new ConditionalElement(signals, callback)`

Conditionally render nodes based on one or more reactive values(signals).

```js
new ConditionalElement(count, (v) =>
  v > 0
    ? new Element("p", null, "Positive")
    : new Element("p", null, "Zero or Negative")
);
```
