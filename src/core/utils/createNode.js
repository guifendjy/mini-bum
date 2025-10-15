const SVG_NS = "http://www.w3.org/2000/svg";

const svgTags = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "rect",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "textPath",
  "defs",
  "symbol",
  "use",
  "clipPath",
  "mask",
  "pattern",
  "marker",
  "filter",
  "linearGradient",
  "radialGradient",
  "stop",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feFlood",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "feSpecularLighting",
  "feTile",
  "feTurbulence",
  "animate",
  "animateMotion",
  "animateTransform",
  "set",
  "desc",
  "title",
  "metadata",
  "pattern",
  "marker",
  "foreignObject",
  "view",
]);

/**
 * Create an element intelligently by tag name.
 * Automatically chooses HTML or SVG namespace.
 */
export default function createNode(tag) {
  if (svgTags.has(tag)) {
    return document.createElementNS(SVG_NS, tag);
  }
  return document.createElement(tag);
}
