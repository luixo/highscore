import { z } from 'zod';

export const gameTitleSchema = z.string().min(1).max(64);

const stringWithTemplateSchema = z
  .string()
  .min(1)
  .refine((format) => format.includes('%s'), {
    message: 'Format should include "%s"',
  });

export const formattersSchema = z.strictObject({
  serializers: z.strictObject({
    one: stringWithTemplateSchema,
    some: stringWithTemplateSchema,
    many: stringWithTemplateSchema,
  }),
  inputLabel: z.string(),
});

export const eventIdSchema = z.string().uuid();
export type EventId = z.infer<typeof eventIdSchema>;

export const gameIdSchema = z.string().uuid();
export type GameId = z.infer<typeof gameIdSchema>;

export const logoUrlSchema = z.string().url();

export const sortDirectionSchema = z.union([
  z.literal('Desc'),
  z.literal('Asc'),
]);

export const scoreFormatSchema = z.literal('Time');

export const eventNameSchema = z.string().min(1).max(64);

export const playerNameSchema = z.string().min(1).max(64);

export const scoreSchema = z.coerce.number().positive();

export const scoreCountSchema = z.coerce.number().int().positive();

export const moderatorKeySchema = z.string().min(2).max(64);

export const moderatorNameSchema = z.string().min(3).max(64);

export const gameUpdateObject = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('title'),
    title: gameTitleSchema,
  }),
]);

export const scoreUpdateObject = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('playerName'),
    playerName: playerNameSchema,
  }),
  z.object({
    type: z.literal('score'),
    score: scoreSchema,
  }),
  z.object({
    type: z.literal('scoreCount'),
    scoreCount: scoreCountSchema,
  }),
]);

export const moderatorKeys = z.preprocess((input) => {
  try {
    if (typeof input !== 'string') {
      return {};
    }
    return JSON.parse(input);
  } catch {
    return {};
  }
}, z.record(moderatorKeySchema));

export const aggregationSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('arithmetic') }),
]);

export const addGameSchema = z.object({
  eventId: eventIdSchema,
  title: gameTitleSchema,
  formatters: formattersSchema,
  logoUrl: logoUrlSchema,
  sortDirection: sortDirectionSchema,
  scoreFormat: scoreFormatSchema.optional(),
  aggregation: aggregationSchema.optional(),
});
