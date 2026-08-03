export const formatPhoneForDisplay = (phone: string) => {
  const match = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!match) return phone;
  const [, areaCode, prefix, line] = match;
  return `+1 (${areaCode}) ${prefix}-${line}`;
};
