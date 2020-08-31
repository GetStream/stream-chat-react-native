/* eslint-disable no-underscore-dangle */
export const convertCommandsToRealm = (commands, realm) =>
  commands.map((c) => convertCommandToRealm(c, realm));

export const convertCommandToRealm = (c, realm) => {
  const command = {
    args: c.args,
    description: c.description,
    name: c.name,
    set: c.set,
  };

  return realm.create('Command', command, true);
};
