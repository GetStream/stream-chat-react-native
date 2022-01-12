import { defineTest } from "jscodeshift/dist/testUtils";

defineTest(
  __dirname,
  "imports",
  null,
    // {test name}.(input|output).ts
  "imports",
  // Jscodeshift options.
  { parser: "ts" }
);
