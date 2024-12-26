import { z } from 'zod';

export const gameTitleSchema = z.string().min(1).max(64);

const stringWithTemplateSchema = z
  .string()
  .min(1)
  .refine((format) => {
    if (!format.includes('%s')) {
      return 'Format should include "%s"';
    }
    return true;
  });

export const formattersSchema = z.strictObject({
  serializers: z.strictObject({
    one: stringWithTemplateSchema,
    some: stringWithTemplateSchema,
    many: stringWithTemplateSchema,
  }),
  inputLabel: z.string(),
});

export const gameIdSchema = z.string().uuid();

export const logoUrlSchema = z.string().url();

export const playerNameSchema = z.string().min(1).max(64);

export const scoreSchema = z.coerce.number().positive();

export const moderatorKeySchema = z.string().min(2).max(64);

export const moderatorNameSchema = z.string().min(3).max(64);

export const gameUpdateObject = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('title'),
    title: gameTitleSchema,
  }),
]);
