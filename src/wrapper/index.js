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
 * @interface E
 * @method tag
 * Creates a DOM element of the specified tag(eg: E.div(...), E.span(...)) type. Accepts:
 * - A single value (string, number, Node, array, or reactive signal) as the element's content.
 * - An object with `children` and/or attributes to define the element's properties.
 * - No arguments, creating an empty element.
 *
 * @method fragment
 * Creates a document fragment containing the provided children. Handles arrays, Nodes, reactive signals,
 * or other valid child types, skipping invalid ones.
 *
 * @method text
 * Creates a reactive text node. Automatically detects if the provided text is a signal or a static value.
 *
 * @method list
 * Creates a reactive list of elements based on a signal and a mapping function. Automatically updates
 * when the signal changes.
 *
 * @method cond
 * Creates a reactive conditional element that updates based on a signal and a condition function.
 */
const E = _init_();

export default E;
export { signal, $bind };
