# 🍬 MiniBum Wrapper - @2.0

High-level syntax sugar wrapper for MiniBum Core. Great for quick prototyping and a more declarative feel.

> ⚠️ Experimental. MIT licensed.

## Installation

```bash
npm install minibum@experimental

```

## Usage

```js
import E, { $signal, $computed } from "minibum";

// Counter App
const count = $signal(0);

const app = E.div({
  className: "counter",
  children: [
    E.p({
      children: ["Count is ", count],
    }),
    E.button({
      onclick: () => count.value++,
      textContent: "Increment",
    }),
    E.button({
      disabled: count.derived((v) => v <= 0),
      onclick: () => count.value--,
      textContent: "Decrement",
    }),
  ],
}).render();

document.body.appendChild(app.element);
```

> Note: see more about signals...
> [minibum/core](../core/README.md#$signal-api-overview)

## API

### Parameters for `E.tag()`

Each HTML tag is represented as a function, such as `E.div(...)` or `E.span(...)`. These functions accept a variety of parameters:

- **`string`**: A static string value, e.g., `E.span('text')`.
- **`$signal`**: A reactive $signal that dynamically updates the content. For example, `E.p($signal)`sets the $signal's value as the`textContent`of the`p` element.
- **`array`**: An array containing nodes, strings, $signals, or a combination of these, used as `children`.
- **`object`**: A configuration object where any HTML attribute can be assigned either a static value or a reactive $signal.
  - Example: `{ id: "my-id", className: $signal("my-class") }`
  - **`children`**: A special property within the object that can be:
    - A single node, string, or $signal.
    - An array of nodes, strings, or $signals.

This design provides a clean, declarative, and reactive approach to building UIs with minimal boilerplate.

> E is a thin abstraction — see [minibum/core](<../core/README.md#new-Element-(type-attributes?-children?)>).

### Special Elements

- `E.fragment(...children)` → creates a fragment
- `E.list($signal, mapFn)` → Creates a reactive list block
- `E.cond(signals, condFn)` → Reactive conditional rendering
- `E.$(selector | selector<[]>, attributes)` → allows you to **target existing DOM nodes** and apply reactive attributes or event listeners.

### `E.$(selector | selector<[]>, attributes)` | Example

- **Selector string**: `E.$('#id')`
- **Node**: `E.$(element)`
- **returns: Instance | Array of Instances**: `E.$(document.querySelectorAll('.class'))`

```js
import { E, $signal } from "minibum";

const isActive = $signal(false);

E.$("#toggle-btn", {
  onclick: () => (isActive.value = !isActive.value),
  class: {
    $static: "btn", // static classes
    active: isActive, // reactive class toggled by $signal
    "class-1 class-2": isActive, // flexible
  },
});
```

> see more about $static a
>[minibum/core](../core/README.md#class.$static)

> Note: See directives(special attributes)
> [minibum/core](../core/README.md#directive-definitions)

## Benefits

- Clean, declarative syntax
- Fully reactive
- Reduces boilerplate with default configs
