/**
 * Per-test coverage for the e2e impact analysis (`e2e/README.md`), at file level: which source files
 * ran any of their functions while a test ran. Enabled with `E2E_COVERAGE=1` at bundle time.
 *
 * Not istanbul: its counters are module-scoped functions, and react-native-worklets captures them
 * into every worklet's closure, which then throws on the UI runtime. These markers only touch
 * `globalThis`, which worklets treat as a global, so a worklet runs them harmlessly on its own
 * runtime (its hits are not counted; the JS-thread code around it is).
 *
 * Every instrumented module registers itself in `globalThis.__e2eCoverage` (0) when it loads, and
 * every function body marks it (1). Metro loads nearly the whole SDK at startup, so the module body
 * says nothing about a test; only function calls do. A module without functions, or with top-level
 * statements that do something (calls, conditionals; not property assignments), counts as run once
 * it loads.
 */
const { sourceId } = require('./sources');

module.exports = ({ types: t }) => {
  // (globalThis.__e2eCoverage || (globalThis.__e2eCoverage = {}))
  const coverage = () => {
    const member = () => t.memberExpression(t.identifier('globalThis'), t.identifier('__e2eCoverage'));
    return t.logicalExpression(
      '||',
      member(),
      t.assignmentExpression('=', member(), t.objectExpression([])),
    );
  };
  const entry = (id) => t.memberExpression(coverage(), t.stringLiteral(id), true);
  // (...)['<id>'] = 1;
  const mark = (id) =>
    t.expressionStatement(t.assignmentExpression('=', entry(id), t.numericLiteral(1)));
  // '<id>' in (...) || ((...)['<id>'] = 0);  Keeps a mark set before the module body ran (a cycle).
  const register = (id) =>
    t.expressionStatement(
      t.logicalExpression(
        '||',
        t.binaryExpression('in', t.stringLiteral(id), coverage()),
        t.assignmentExpression('=', entry(id), t.numericLiteral(0)),
      ),
    );

  return {
    name: 'e2e-coverage',
    visitor: {
      Program: {
        // On enter, before other plugins (worklets, TypeScript, module transforms) change the file.
        enter(programPath, state) {
          const id = sourceId(state.filename || state.file.opts.filename);
          if (!id) {
            return;
          }
          let functions = 0;
          programPath.traverse({
            Function(fnPath) {
              if (!fnPath.node.body) {
                return;
              }
              functions += 1;
              fnPath.ensureBlock();
              fnPath.get('body').unshiftContainer('body', mark(id));
            },
          });
          // Top-level side effects (`registerNativeHandlers(...)`, `if (...) ...`) run in every test
          // that loads the module, so changing them matters to those tests too. `X.displayName = ...`
          // doesn't count.
          const sideEffects = programPath
            .get('body')
            .some(
              (statement) =>
                statement.isIfStatement() ||
                (statement.isExpressionStatement() &&
                  !(
                    statement.get('expression').isAssignmentExpression() &&
                    statement.get('expression.left').isMemberExpression()
                  )),
            );
          programPath.unshiftContainer(
            'body',
            functions > 0 && !sideEffects ? register(id) : mark(id),
          );
        },
      },
    },
  };
};
