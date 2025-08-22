# 🍬 MiniBum Wrapper

High-level syntax sugar wrapper for MiniBum Core. Great for quick prototyping and a more declarative feel.

> ⚠️ This project is `experimental` and MIT licensed. Feel free to use, modify, and learn from it!

## Installation

```bash
npm install minibum@experimental

```

## Usage

```js
import E, { signal, $bind } from "minibum";

// Counter App
const count = signal(0);

const app = E.div({
  className: "counter",
  children: [
    E.p({
      children: ["Count is ", E.text(count)],
    }),
    E.button({
      onclick: () => count.value++,
      textContent: "Increment",
    }),
    E.button({
      disabled: count.bind((v) => v <= 0),
      onclick: () => count.value--,
      textContent: "Decrement",
    }),
  ],
});

document.body.appendChild(app);
```

## API

### Parameters for `E.tag()`

Each HTML tag is represented as a function, such as `E.div(...)` or `E.span(...)`. These functions accept a variety of parameters:

- **`string`**: A static string value, e.g., `E.span('text')`.
- **`signal`**: A reactive signal that dynamically updates the content. For example, `E.p(signal)` sets the signal's value as the `textContent` of the `p` element.
- **`array`**: An array containing nodes, strings, signals, or a combination of these, used as `children`.
- **`object`**: A configuration object where any HTML attribute can be assigned either a static value or a reactive signal.
  - Example: `{ id: "my-id", className: signal("my-class") }`
  - **`children`**: A special property within the object that can be:
    - A single node, string, or signal.
    - An array of nodes, strings, or signals.

This design provides a clean, declarative, and reactive approach to building UIs with minimal boilerplate.

### Special Elements

- `E.text(signal || static text)` → Creates reactive text node(signal gets auto detected and binded to this node)
- `E.fragment(...children)` → creates a fragment
- `E.list(signal, mapFn)` → Creates a reactive list block
- `E.cond(signals, condFn)` → Reactive conditional rendering
- `E.$(selector, attributes)` → allows you to **target existing DOM nodes** and apply reactive attributes or event listeners.

### Example

- **Selector string**: `E.$('#id')`
- **Node**: `E.$(element)`
- **NodeList / Array of nodes**: `E.$(document.querySelectorAll('.class'))`

```js
import { E, signal } from "minibum";

const isActive = signal(false);

E.$("#toggle-btn", {
  onclick: () => isActive.set(!isActive.get()),
  class: {
    $static: "btn",
    active: isActive, // reactive class toggled by signal
  },
});
```

> Note: See custom attributes at 
[minibum/core](../wrapper/README.md)

## Benefits

- Clean, declarative syntax
- Fully reactive
- Reduces boilerplate with default configs
