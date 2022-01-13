import { API, FileInfo } from 'jscodeshift';

module.exports = function (fileInfo: FileInfo, api: API) {
  const j = api.jscodeshift;
  const oldGenericsShortForm = ['At', 'Ch', 'Co', 'Ev', 'Me', 'Re', 'Us'];

  const out = j(fileInfo.source)
    .find(j.TSTypeParameterInstantiation, (path) => {
      return j(path).find(j.TSTypeParameterInstantiation).length === 0;
    })
    .find(j.TSTypeReference)
    .filter((path) => {
      return oldGenericsShortForm.includes(path.getValueProperty('typeName').name);
    })
    .forEach((path) => {
      const keepableTypeParameters = path.parentPath.value.filter((node: { typeName: { name: string; }; }) => {
        return !oldGenericsShortForm.includes(node.typeName.name);
      });

      const extraneousTypeParameters = [];
      for (const typeParameter of keepableTypeParameters) {
        extraneousTypeParameters.push(j.tsTypeReference(j.identifier(typeParameter.typeName.name)));
      }
      extraneousTypeParameters.push(j.tsTypeReference(j.identifier('StreamChatClient')));

      j(path.parent).replaceWith(j.tsTypeParameterInstantiation(extraneousTypeParameters));
    });

  return out.toSource();
};
