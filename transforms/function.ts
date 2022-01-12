import { API, ASTPath, Collection, FileInfo, Identifier, Options, TSQualifiedName, TSType, TSTypeParameter, TSTypeReference } from "jscodeshift";

module.exports = function (fileInfo: FileInfo, api: API) {
    const j = api.jscodeshift;
        const oldGenerics = [
                "DefaultAttachmentType",
                "DefaultChannelType",
                "DefaultCommandType",
                "DefaultEventType",
                "DefaultMessageType",
                "DefaultReactionType",
                "DefaultUserType",
                "UnknownType",
            ]

    const typeParameterNames = [];


    const out = j(fileInfo.source)
        .find(j.TSTypeParameterDeclaration)
        .find(j.TSTypeParameter)
        .filter((path) =>  oldGenerics.includes(path.getValueProperty('constraint').typeName?.name)
               || oldGenerics.includes(path.getValueProperty('default').typeName?.name))
        .forEach(node => {
            typeParameterNames.push(node.getValueProperty('name'))
            j(node).remove()
        })
        .at(0)
        .insertBefore(j.tsTypeParameter("StreamChatApplication", j.tsExpressionWithTypeArguments(j.identifier("StreamChatGenerics"))))
        .closest(j.VariableDeclaration)
        .find(j.TSTypeReference, (node) => typeParameterNames.includes(node.typeName["name"]))
        .forEach(node => {
            j(node).remove()
        })
        .at(0)
        .insertBefore(j.tsTypeParameter("StreamChatApplication"))
    return out.toSource();

}
