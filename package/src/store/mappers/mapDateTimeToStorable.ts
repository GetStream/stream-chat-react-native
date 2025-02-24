export const mapDateTimeToStorable = (datetime?: string | Date | null) => {
  if (!datetime) {
    return '';
  }

  return new Date(datetime).toISOString();
};
