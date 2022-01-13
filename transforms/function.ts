import { API, FileInfo } from 'jscodeshift';

module.exports = function (fileInfo: FileInfo, api: API) {
  const j = api.jscodeshift;
  const oldGenerics = [
    'DefaultAttachmentType',
    'DefaultChannelType',
    'DefaultCommandType',
    'DefaultEventType',
    'DefaultMessageType',
    'DefaultReactionType',
    'DefaultUserType',
    'UnknownType',
  ];

  const newGeneric = j.tsTypeParameter(
    'StreamChatClient',
    j.tsTypeReference(j.identifier('StreamChatGenerics')),
    j.tsTypeReference(j.identifier('DefaultStreamChatGenerics')),
  );

  const out = j(fileInfo.source)
    .find(j.TSTypeParameterDeclaration)
    .find(j.TSTypeParameter, (p) => {
      if (p.default) {
        return oldGenerics.includes(p.default['typeName'].name);
      }
      return false;
    })
    .forEach((path) => {
      j(path).remove();
    })
    .at(0)
    .insertBefore(newGeneric);

  return out.toSource();
};
