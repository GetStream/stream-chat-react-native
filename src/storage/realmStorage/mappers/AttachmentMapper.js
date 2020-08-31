export const convertAttachmentsToRealm = (attachments, realm) => {
  if (!attachments) return [];

  return attachments.map((a) => {
    const attachment = {
      actions: a.actions ? JSON.stringify(a.actions) : undefined,
      author_icon: a.author_icon,
      author_link: a.author_link,
      autor_name: a.autor_name,
      fallback: a.fallback,
      footer: a.footer,
      footer_icon: a.footer_icon,
      image_url: a.image_url,
      og_scrape_url: a.og_scrape_url,
      pretext: a.pretext,
      text: a.text,
      thumb_url: a.thumb_url,
      title: a.title,
      title_link: a.title_link,
      type: a.type,
    };

    return realm.create('Attachment', attachment);
  });
};

export const getAttachmentsFromRealmList = (aList) =>
  aList.map((al) => ({ ...al, actions: JSON.parse(al.actions) }));
