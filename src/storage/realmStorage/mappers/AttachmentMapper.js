export const convertAttachmentsToRealm = (attachments, realm) => {
  if (!attachments) return [];

  return attachments.map((a) => {
    const attachment = {
      type: a.type,
      fallback: a.fallback,
      pretext: a.pretext,
      autor_name: a.autor_name,
      author_link: a.author_link,
      author_icon: a.author_icon,
      title: a.title,
      title_link: a.title_link,
      text: a.text,
      image_url: a.image_url,
      thumb_url: a.thumb_url,
      footer: a.footer,
      footer_icon: a.footer_icon,
      actions: a.actions ? JSON.stringify(a.actions) : undefined,
      og_scrape_url: a.og_scrape_url,
    };

    return realm.create('Attachment', attachment);
  });
};

export const getAttachmentsFromRealmList = (aList) =>
  aList.map((al) => ({ ...al, actions: JSON.parse(al.actions) }));
