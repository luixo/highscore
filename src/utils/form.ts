import { FieldErrors } from 'react-hook-form';

export const collectErrors = (errors: FieldErrors<any>): string[] => {
  return Object.values(errors).reduce<string[]>((acc, value) => {
    if (value && 'message' in value && value.message) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return [...acc, value.message.toString()];
    }
    if (typeof value === 'object') {
      return [...acc, ...collectErrors(value as FieldErrors)];
    }
    return acc;
  }, []);
};
