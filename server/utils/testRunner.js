import vm from 'vm';

/**
 * Runs user code against an array of test cases securely using Node VM
 * @param {String} code - The user's JavaScript code
 * @param {Array} testCases - Array of { input: "...", expectedOutput: "..." }
 * @returns {Array} Results for each test case
 */
export const runTestCases = (code, testCases) => {
  const results = [];

  // Extract function name using regex
  const match = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
  // Default to a generic execution approach if no explicit function is found, though this is less reliable
  const fnName = match ? match[1] : null;

  for (let tc of testCases) {
    try {
      if (!fnName) throw new Error("Could not find function name in your code.");

      // Prepare context to capture output securely
      const sandbox = {
        console: { log: () => {} },
        Math,
        JSON,
        Array,
        String,
        Number,
        Set,
        Map
      };
      vm.createContext(sandbox);

      const scriptCode = `
        ${code}
        ${fnName}(${tc.input});
      `;
      const script = new vm.Script(scriptCode);
      const output = script.runInContext(sandbox, { timeout: 1500 });
      
      const stringifiedOutput = JSON.stringify(output);
      const isPassed = stringifiedOutput === tc.expectedOutput || String(output) === tc.expectedOutput;

      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: isPassed ? tc.expectedOutput : stringifiedOutput, // Simplified for UI
        passed: isPassed
      });
    } catch (error) {
      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: error.message,
        passed: false
      });
    }
  }

  return results;
};
