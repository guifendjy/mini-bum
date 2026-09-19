import Element from "./element.js";
import ListElement from "./listElement.js";
import ConditionalElement from "./conditionalElement.js";
import { $signal, $computed } from "../signal/signal.js";

// 🍬 MINI BUM LIBRARY - CREATE DOM ELEMENTS OR ADD REACTIVITY TO EXISTING ELEMENTS🍬
/**
 * Core DOM and reactivity helpers for Mini Bum.
 *
 * @module core
 */
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
 * Exports the core DOM element helpers.
 *
 * @type {Object}
 * @property {typeof Element} Element Creates and manages a reactive DOM element.
 * @property {typeof ListElement} ListElement Renders and updates a list of items.
 * @property {typeof ConditionalElement} ConditionalElement Renders content based on a condition.
 */
export { Element, ListElement, ConditionalElement };

/**
 * Exports the reactivity helpers.
 *
 * @type {Object}
 * @property {typeof $signal} $signal Creates reactive state.
 * @property {typeof $computed} $computed Creates a value derived from reactive state.
 */
export { $signal, $computed };
