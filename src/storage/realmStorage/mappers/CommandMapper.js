/* eslint-disable no-underscore-dangle */
export const convertCommandsToRealm = (commands, realm) =>
  commands.map((c) => convertCommandToRealm(c, realm));

export const convertCommandToRealm = (c, realm) => {
  const command = {
    name: c.name,
    description: c.description,
    args: c.args,
    set: c.set,
  };

  return realm.create('Command', command, true);
};
