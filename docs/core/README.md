# 🧱 MiniBum Core

Low-level DOM reactive engine built with JavaScript classes and functional bindings.

> ⚠️ This project is `experimental` and MIT licensed. Feel free to use, modify, and learn from it!

## Installation

```bash
npm install minibum@experimental.0
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

The `attributes` parameter supports reactive bindings for attributes and classes, while the `children` parameter can be a string, a DOM node, or an array of nodes:

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

### `new ListElement(signal, callback)`

Maps over signal values and re-renders on updates.

```js
new ListElement(itemsSignal, (arr) =>
  arr.map((item) => new Element("li", null, item))
);
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
