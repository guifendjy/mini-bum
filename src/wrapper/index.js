import _init_ from "./wrapper.js";
import { $signal, $computed } from "../signal/signal.js";

// 🍬 MINI BUM LIBRARY - CREATE DOM ELEMENTS OR ADD REACTIVITY TO EXISTING ELEMENTS🍬
/**
 * @license MIT
 * Copyright © 2025 Dads Guifendjy Paul
 *
 * This project is open source under the MIT License.
 * You are free to use, modify, and distribute this code as you wish.
 * Attribution is appreciated but not required.
 *
 * This is an educational project that explores state management,
 * reactive UI patterns, and DOM rendering using plain JavaScript.
 *
 * Intended as a learning tool and a lightweight alternative to more
 * complex front-end frameworks. Not intended for production use (yet!).
 *
 * See LICENSE file for full terms. 🍬
 */

/**
 * Type helpers exposed for TypeScript-aware editors and d.ts generation.
 *
 * Note: For full TypeScript semantics you can redeclare in a .d.ts:
 *   type Writable<T> = { -readonly [K in keyof T]: T[K] }
 */

/** @template T @typedef {import("./Signal.js").default<T>} Signal */

/**
 * @typedef {import("../core/element.js").ElementInterface} ElementInterface
 */

/**
 * @callback FragmentFactory
 * @param {...(Node|string|number|Signal<any>)} children
 * @returns {ElementInterface}
 *
 * Creates a safe document fragment with children.
 *
 * @example
 * E.fragment(
 *   E.div("Fragment Child 1"),
 *   E.div("Fragment Child 2"),
 *   E.div("Fragment Child 3")
 * );
 */

/**
 * @callback TextFactory
 * @template T
 * @param {string|number|Signal} text
 * @returns {ElementInterface}
 *
 * Creates a reactive text node.
 *
 * @example
 * E.text($signal("Hello, World!"));
 */

/**
 * @callback ListFactory
 * @template T
 * @param {Signal} signal - A reactive signal source
 * @param {(item: any, index: number) => Node} mapFn - Function mapping items to DOM nodes
 * @returns {ElementInterface}
 *
 * Creates a reactive foreach list renderer.
 *
 * @example
 * E.list($signal([1, 2, 3]), (item, index) =>
 *   E.div({ class: "list-item" }, `Item ${index}: ${item}`)
 * );
 */

/**
 * @callback CondFactory
 * @template T
 * @param {Signal} signal - A reactive signal source
 * @param {(value: any) => Node} condFn - Function that returns a node depending on signal value
 * @returns {ElementInterface}
 *
 * Creates a reactive conditional renderer.
 *
 * @example
 * E.cond($signal(true), (v) => {
 *   console.log("Conditional render, value:", v);
 *   return E.div({ class: "conditional" }, "Condition is ", v.toString());
 * });
 */

/**
 * @template T
 * @typedef {Object} Writable
 * @description
 * A lightweight JSDoc placeholder for "writable" mapped types.
 * For exact TypeScript behavior, declare `type Writable<T> = {-readonly [K in keyof T]: T[K]}` in a .d.ts file.
 */

/**
 * A function to add reactivity to existing DOM nodes.
 *
 * This can be used to select nodes by a CSS selector, a single Node, or a NodeList,
 * and then apply attributes or reactive behavior to them.
 *
 * @template {keyof HTMLElementTagNameMap} T
 * @callback Query
 * @param {string|string[]|Node|NodeList} query
 *   The target for reactivity. Can be:
 *   - A CSS selector string (or an array of selectors) (e.g., `#id`, `.class`)
 *   - A single DOM Node
 *   - A NodeList of DOM nodes
 * @param {Partial<Writable<HTMLElementTagNameMap[T]>>} [attributes]
 *   Attributes or reactive bindings to apply to the selected node(s).
 * @returns {ElementInterface|ElementInterface[]|void}
 *
 * @example
 * E.$("body", { style: "background-color: lightyellow;" });
 */

/**
 * @typedef {Object} ElementFactory
 * @property {FragmentFactory} fragment - Create a document fragment
 * @property {ListFactory} list - Create a reactive foreach list
 * @property {CondFactory} cond - Create a conditional renderer
 * @property {Query<any>} $ - Query existing DOM nodes and add reactivity
 */

/**
 * @typedef {import("../core/element.js").ElementProps} ElementProps
 */

/**
 * @typedef {ElementFactory & {
 *   [K in keyof HTMLElementTagNameMap]:
 *     (
 *       attributes?: Partial<Writable<HTMLElementTagNameMap[K]>> & ElementProps,
 *       ...children: (string|number|boolean|Node)[]
 *     ) => HTMLElementTagNameMap[K]
 * }} FullElementFactory
 */

/** @type {FullElementFactory} */
const E = _init_();

export default E;
export { $signal, $computed };
