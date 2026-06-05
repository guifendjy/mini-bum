# 🧱 MiniBum Core - @2.0

Low-level DOM reactive engine using JavaScript classes and functional bindings.

> ⚠️ Experimental. MIT licensed.

## Installation

```bash
npm install minibum@experimental
```

## Usage

```js
import {
  Element,
  $signal,
  $computed,
  ListElement,
  ConditionalElement,
} from "minibum/core";
```

## $signal - API Overview

### `$signal(initialValue)`

Creates a reactive value:

```js
const count = $signal(0);
count.value++;
```

### `$signal.derived(callback)`

Create a derived Signal from another signal. Returns a reactive value with the same API as $signal.

Inside an Element:

```js
new Element("p", {
  textContent: count.derived((v) => `Count is ${v}`),
});
```

Outside an Element (manual subscription):

```js
const unsubscribe = count.bind((v) => {
  el.textContent = `Count is ${v}`;
});

// later
unsubscribe();
```

### `$computed(callback, signals?)`

Create a computed Signal from other signals. Returns a reactive value with the same API as $signal.

```js
const items = $signal([]);

const total = $computed(
  (newItems) =>
    newItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
  // dependency array
  [items]
);

// computed can also be used for side-effect callbacks without returning a value(if any signal passed in the dependency array changes then the callback will be called)
$computed(() => {
  doSideEffect();
}, [...signals]);
```

> Note: Updating a derived signal doesn't affect its source; only the source signal updates its derivations.

### `new Element(type, attributes?, children?)`

Creates a DOM node wrapper. `type` is a tag name or an existing DOM node.

Adds:

- declarative attributes/properties/styles/classes
- event listeners
- reactive bindings (Signal instances)
- directives: `$ref`, `$bind`, `$bindGroup`, `onMount`. see - [directives](#directive-definitions)

Public properties:

- `render()` — prepares the instance (does not create/insert the DOM node).
- `element` — the DOM node after `render()`; `null` before.
- `destroy()` — removes bindings, runs cleanup, and removes node(s) from the DOM.

Note: Nested Element instances are managed by their closest parent; calling `render()` on a root element handles children recursively.

```js
new Element("div", {
  class: { active: someSignal },
  textContent: "Hello!",
});

const existingNode = document.createElement("p");
new Element(existingNode, { textContent: "This is an existing node" });
```

`attributes` supports reactive bindings. `children` can be string, node, or array.

### `class.$static`

Combine Static & Reactive Classes

```js
import { Element, $signal } from "minibum/core";

const highlighted = $signal(true);
const hidden = $signal(false);

new Element(
  "div",
  {
    class: {
      $static: "card shadow",
      highlighted,
      hidden,
    },
  },
  "Hello World"
);
```

### Lifecycle Hooks — onMount & onUnmount

onMount(el) is called when the element is inserted (or at least partially visible). It may return a cleanup function that runs on unmount.

```js
new Element(
  "div",
  {
    onMount(el) {
      const interval = setInterval(() => console.log("Tick"), 1000);
      return () => clearInterval(interval);
    },
  },
  "I live and die with the DOM"
);
```

Note: Hooks are per-instance; they re-run if the element is destroyed and recreated.

### Directive Definitions

Directives are property keys prefixed with $ (or onMount) that trigger internal behavior.

- $ref: Capture the rendered DOM node into a Signal; reset to null on destroy.
- $bind: Two-way binding for form inputs and.
- $bindGroup: Group binding for radio/checkbox sets (radio -> single value, checkbox -> array).
- onMount: Lifecycle hook (must be a function).

Example:

```js
new Element("div", {
  $ref: myRefSignal,
  onMount: () => console.log("Mounted"),
  children: [
    new Element("input", { $bind: nameSignal }),
    new Element("input", {
      type: "checkbox",
      value: "admin",
      $bindGroup: rolesSignal,
    }),
  ],
});
```

### `new ListElement(signal, callback)`

Maps over a signal array and re-renders on updates.

```js
new ListElement(items, (item) => new Element("li", null, item));
```

### `new ConditionalElement(signals, callback)`

Render conditionally based on one or more signals.

```js
new ConditionalElement(count, (v) =>
  v > 0
    ? new Element("p", null, "Positive")
    : new Element("p", null, "Zero or Negative")
);
```
