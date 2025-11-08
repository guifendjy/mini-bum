export default function tokenizeString(classString) {
  const merged = {};
  if (typeof classString === "string") {
    const staticClasses = classString
      .split(/\s+/) // split by any whitespace
      .filter(Boolean); // remove empty ones

    // merge into object while avoiding duplicates
    for (const cls of staticClasses) merged[cls] = true;
  }

  return merged;
}
