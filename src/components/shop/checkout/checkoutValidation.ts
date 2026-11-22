import { CountryInfo } from './checkoutTypes';

export const validateEmailAddress = (rawEmail: string): { valid: boolean; message?: string } => {
  const email = rawEmail.trim();
  if (!email) {
    return { valid: false, message: 'PLEASE ENTER YOUR EMAIL ADDRESS.' };
  }
  if (/\s/.test(email) || email.includes('..')) {
    return { valid: false, message: 'INVALID EMAIL FORMAT. PLEASE REMOVE SPACES OR EXTRA DOTS.' };
  }
  const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!strictEmailRegex.test(email)) {
    return { valid: false, message: 'INVALID EMAIL ADDRESS. PLEASE ENTER A VALID EMAIL (E.G. NAME@DOMAIN.COM).' };
  }
  return { valid: true };
};

export const validatePhoneByCountry = (
  rawPhone: string,
  country: CountryInfo
): { valid: boolean; normalizedDigits: string; fullPhone: string; message?: string } => {
  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return { valid: false, normalizedDigits: '', fullPhone: '', message: 'PLEASE ENTER YOUR PHONE NUMBER.' };
  }

  const bnToEnDigits = trimmed.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  const digitsOnly = bnToEnDigits.replace(/\D/g, '');

  const codeDigits = country.code.replace(/\D/g, '');
  let subscriberDigits = digitsOnly;
  if (subscriberDigits.startsWith(codeDigits) && subscriberDigits.length > country.maxDigits) {
    subscriberDigits = subscriberDigits.slice(codeDigits.length);
  }

  if (subscriberDigits.startsWith('0')) {
    subscriberDigits = subscriberDigits.slice(1);
  }

  if (country.bdMobileCheck) {
    if (!/^1[3-9]\d{8}$/.test(subscriberDigits)) {
      return {
        valid: false,
        normalizedDigits: subscriberDigits,
        fullPhone: `${country.code}${subscriberDigits}`,
        message: `INVALID BANGLADESH MOBILE NUMBER FOR ${country.code}. ENTER A VALID 11-DIGIT NUMBER.`
      };
    }
  } else {
    if (subscriberDigits.length < country.minDigits || subscriberDigits.length > country.maxDigits) {
      const expectedText =
        country.minDigits === country.maxDigits
          ? `${country.minDigits} DIGITS`
          : `${country.minDigits} TO ${country.maxDigits} DIGITS`;
      return {
        valid: false,
        normalizedDigits: subscriberDigits,
        fullPhone: `${country.code}${subscriberDigits}`,
        message: `INVALID PHONE NUMBER FOR ${country.name.toUpperCase()} (${country.code}). EXPECTED ${expectedText}.`
      };
    }
  }

  return {
    valid: true,
    normalizedDigits: subscriberDigits,
    fullPhone: `${country.code}${subscriberDigits}`
  };
};
