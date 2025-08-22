import _init_ from "./wrapper.js";
import { signal, $bind } from "../signal/index.js";

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
 * @template T
 * @typedef { {[K in keyof T as -readonly K]: T[K]}} Writable
 */

/**
 * @callback FragmentFactory
 * @param {...(Node|string|number|{bind: Function})} children
 * @returns {DocumentFragment}
 *
 * Creates a safe document fragment with children.
 */

/**
 * @callback TextFactory
 * @param {string|number|{bind: Function}} text
 * @returns {Text}
 *
 * Creates a reactive text node .
 */

/**
 * @callback ListFactory
 * @param {Signal<T>} signal - A reactive signal source
 * @param {(item: any, index: number) => Node} mapFn - Function mapping items to DOM nodes
 * @returns {DocumentFragment}
 *
 * Creates a reactive foreach list renderer.
 */

/**
 * @callback CondFactory
 * @param {Signal<T>} signal - A reactive signal source
 * @param {(value: any) => Node} condFn - Function that returns a node depending on signal value
 * @returns {ConditionalElement}
 *
 * Creates a reactive conditional renderer.
 */

/**
 * A function to add reactivity to existing DOM nodes.
 *
 * This can be used to select nodes by a CSS selector, a single Node, or a NodeList,
 * and then apply attributes or reactive behavior to them.
 *
 *  @template {keyof HTMLElementTagNameMap} T
 * @callback Query
 * @param {string|string[]|Node|NodeList} query
 *   The target for reactivity. Can be:
 *   - A CSS selector string(or an array of selectors) (e.g., `#id`, `.class`)
 *   - A single DOM Node
 *   - A NodeList of DOM nodes
 * @param {Partial<Writable<HTMLElementTagNameMap[T]>>} [attributes]
 *   Attributes or reactive bindings to apply to the selected node(s).
 * @returns {void} Nothing is returned.
 */

/**
 * @typedef {Object} ElementFactory
 * @property {FragmentFactory} fragment - Create a document fragment
 * @property {TextFactory} text - Create a text node
 * @property {ListFactory} list - Create a reactive foreach list
 * @property {CondFactory} cond - Create a conditional renderer
 * @property {Query} $ - Query existing DOM nodes and add reactivity
 *
 * @typedef {ElementFactory & {
 *   [K in keyof HTMLElementTagNameMap]:
 *     (
 *       attributes?: Partial<Writable<HTMLElementTagNameMap[K]>> & {
 *         bind?: Function;
 *         $bind?: Function;
 *       },
 *       ...children: (string|number|boolean|Node|{bind: Function;$bind?: Function})[]
 *     ) => HTMLElementTagNameMap[K]
 * }} FullElementFactory
 */

/**
 * Element factory namespace.
 * Each property is a function to create a UI element.
 * @type {FullElementFactory}
 */

const E = _init_();


export default E;
export { signal, $bind };
