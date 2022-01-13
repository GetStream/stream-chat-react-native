import { defineTest } from "jscodeshift/dist/testUtils";

defineTest(
  __dirname,
  "imports",
  null,
  "imports",
  { parser: "tsx" }
);

defineTest(
  __dirname,
  "function",
  null,
  "function",
  { parser: "tsx" }
);

defineTest(
  __dirname,
  "type-parameter-instantiation",
  null,
  "type-parameter-instantiation",
  { parser: "tsx" }
);

defineTest(
  __dirname,
  "variable-declaration",
  null,
  "variable-declaration",
  { parser: "tsx" }
);
