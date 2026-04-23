const generateReferralCode = (name = '') => {
  const prefix = name.slice(0, 3).toUpperCase() || 'JSV';
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}${suffix}`;
};

module.exports = generateReferralCode;
