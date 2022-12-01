export const mapDateTimeToStorable = (datetime?: string | Date) => {
  if (!datetime) return '';

  return new Date(datetime).toISOString();
};
