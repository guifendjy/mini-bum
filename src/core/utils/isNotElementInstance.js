import ListElement from "../listElement.js";
import ConditionalElement from "../conditionalElement.js";

/**@internal */
// @ts-ignore
export default function isNotElementInstance(element) {
  return (
    element instanceof ListElement || element instanceof ConditionalElement
  );
}
