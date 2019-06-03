/* eslint-env node */
const { createMacro } = require('babel-plugin-macros');
// const printAST = require('ast-pretty-print');
const generate = require('@babel/generator').default;
const parse = require('@babel/parser').parse;
const prettier = require('prettier');
const process = require('process');
module.exports = createMacro(registerCSS);

function toCode(ast) {
  return prettier.format(generate(ast).code, {
    parser: 'babel',
  });
}

function registerCSS({ references }) {
  references.default.forEach((reference) => {
    const [themePathArg, arg] = reference.parentPath.get('arguments');
    if (arg == null) {
      throw Error('registerCSS requires two arguments');
    }
    arg.parentPath.replaceWith(arg.node);
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const code = toCode(arg.node);

    const importStament = parse(
      `import { setOriginalCSS } from "../styles/theme";`,
      {
        sourceType: 'module',
      },
    );
    const newCode = `setOriginalCSS(${JSON.stringify(
      themePathArg.node.value,
    )}, ${JSON.stringify(code)});;`;

    arg.hub.file.path.node.body.push(importStament.program.body[0]);
    arg.hub.file.path.node.body.push(parse(newCode));
  });
}
