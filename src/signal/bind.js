/** * $bind
 * Parameters:
 * 1. signals: a signal or an array of signals to bind to
 * 2. callback: a function that gets passed the signal value as an argument.
 * 3. evalAsExpression: (default to true) a boolean that determines whether the callback should be evaluated as an expression to an attribute or not.
 * Returns:
 * un unbind function if set to false else an object with a evaluate method that can be used to evaluate the callback and apply the value to the element attribute.
 * the evaluate method then returns an unbind function that can be used to unbind the signals.(could be used if you want to initialize the binding and evaluate later on).
 */

export default function $bind(signals, callback, evalAsExpression = true) {
  const signalArray = signals && !Array.isArray(signals) ? [signals] : signals;

  if (!signalArray || !signalArray.length) {
    console.error(
      "Error: expected a signal or an array of signals but got nothing"
    );
    return;
  }
  if (typeof callback !== "function") {
    console.error("Error: expected a function as callback but got:", callback);
    return;
  }

  // if is used outside of an element attribute context
  if (evalAsExpression == false) {
    let unbunds = [];

    signalArray.forEach((s) => {
      if (!s || typeof s !== "object") {
        return console.warn("Invalid signal passed to $bind:", s);
      }

      const unbund = s.bind((value) => {
        if (value === undefined || value === null) {
          console.warn("Signal value is undefined or null, skipping callback.");
          return;
        }
        const values = signalArray.map((s) => {
          return s.value; // get the value of the signal
        });
        callback(values.length === 1 ? values[0] : values);
      }, false);

      unbunds.push(unbund);
    });

    return () =>
      unbunds.forEach((unbund) => {
        if (unbund && typeof unbund === "function") {
          unbund(); // call the unbind function to remove the subscription
        }
      }); // return a function that unbinds all the signals
  }

  const evaluate = (applyValue) => {
    const evalUnbunds = [];

    const runCallback = () => {
      const values = signalArray.map((s) => {
        return s.value; // get the value of the signal
      });
      const result = callback(values.length === 1 ? values[0] : values);
      if (applyValue) {
        applyValue(result);
      } // apply the result to the element attribute if provided
    };

    // Subscribe to each signal
    signalArray.forEach((s) => {
      if (!s || typeof s !== "object" || !s.bind) {
        console.warn("Invalid signal passed to $bind:", s);
        return;
      }
      let unbund = s.bind(runCallback, false); // it's false here because we don't want to evaluate the callback as an expression
      evalUnbunds.push(unbund);
    });

    return () =>
      evalUnbunds.forEach((unbund) => {
        if (unbund && typeof unbund === "function") {
          unbund(); // call the unbind function to remove the subscription
        }
      }); // return the single unbind if only one signal is passed else return all the bindings
  };

  return {
    _signal_: true,
    evaluate,
  };
}
