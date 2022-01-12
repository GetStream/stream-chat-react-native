import { API, FileInfo, ImportSpecifier, Options } from "jscodeshift";

module.exports = function (fileInfo: FileInfo, api: API, options: Options) {
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
    const out = j(fileInfo.source)
        .find(j.ImportSpecifier, (node) => {
            return oldGenerics.includes(node.imported.name)
        })
        .forEach((path) => {
            j(path).remove();
        })

    out.get('specifiers')
    out.get().insertAfter(j.importSpecifier(j.identifier("StreamChatGenerics")))
    return out.toSource();

}
