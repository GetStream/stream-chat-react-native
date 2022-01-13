import { API, FileInfo } from 'jscodeshift';

module.exports = function (fileInfo: FileInfo, api: API) {
  const j = api.jscodeshift;
  const oldGenericsShortForm = ['At', 'Ch', 'Co', 'Ev', 'Me', 'Re', 'Us'];

  const out = j(fileInfo.source)
    .find(j.CallExpression)
    .forEach((path) => {
      const keepableTypeParameters =
        (path.node['typeParameters'] &&
          path.node['typeParameters'].params.filter((p: { typeName: { name: string } }) => {
            return !oldGenericsShortForm.includes(p.typeName.name);
          })) ??
        [];

      const currentIdentifier = path.parent.value.id['name'];

      const newDeclaration = j.variableDeclaration('const', [
        j.variableDeclarator(j.identifier(currentIdentifier), {
          callee: j.identifier(path.node.callee['name']),
          type: 'CallExpression',
          arguments: [],
          typeArguments: {
            type: 'TypeParameterInstantiation',
            params: [...keepableTypeParameters, j.typeParameter('StreamChatClient')],
          },
        }),
      ]);

      /**
       * │──────────VariableDeclaration──────────│ .parent
       * │kind│
       *      │────────VariableDeclarator────────│ .parent
       *      │            │───CallExpression────│ path
       * const something = whatever(takeSomething)
       * */
      path.parent.parent.replace(newDeclaration);
    });

  return out.toSource();
};
