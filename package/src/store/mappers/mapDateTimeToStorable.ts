export const mapDateTimeToStorable = (datetime?: string) => {
  if (!datetime) return '';

  return new Date(datetime).toISOString();
};
