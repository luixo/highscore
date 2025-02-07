import { z } from 'zod';

export const gameTitleSchema = z.string().min(1).max(64);

export const precisionSchema = z.number().int().min(1).max(10);

export const formattingSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('time'), precision: precisionSchema }),
  z.strictObject({
    type: z.literal('regex'),
    precision: precisionSchema,
    regex: z.string(),
  }),
]);

export const eventIdSchema = z.string().uuid();
export type EventId = z.infer<typeof eventIdSchema>;

export const gameIdSchema = z.string().uuid();
export type GameId = z.infer<typeof gameIdSchema>;

export const logoUrlSchema = z.string().url();

export const eventNameSchema = z.string().min(1).max(64);

export const playerNameSchema = z.string().min(1).max(64);

export const moderatorKeySchema = z.string().min(2).max(64);

export const moderatorNameSchema = z.string().min(3).max(64);

export const gameUpdateObject = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('title'),
    title: gameTitleSchema,
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

const gameValueKeySchema = z.string().min(2).max(20);
const gameDefaultValueSchema = z.number();

export const scoresSchema = z
  .discriminatedUnion('type', [
    z.strictObject({
      type: z.literal('number'),
      key: gameValueKeySchema,
      value: z.number(),
    }),
    z.strictObject({
      type: z.literal('counter'),
      key: gameValueKeySchema,
      value: z.number(),
    }),
  ])
  .array();

export const scoreUpdateObject = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('playerName'),
    playerName: playerNameSchema,
  }),
  z.object({
    type: z.literal('scores'),
    scores: scoresSchema,
  }),
]);

export const valueAggregationSchema = z.strictObject({
  type: z.literal('value'),
  key: gameValueKeySchema,
  weight: z.number().min(0).max(1).optional(),
  defaultValue: gameDefaultValueSchema,
});

type AllAggregation =
  | z.infer<typeof valueAggregationSchema>
  | SumAggregation
  | DifferenceAggregation
  | DivisionAggregation;

const allAggregationSchema = z.lazy(() =>
  valueAggregationSchema
    .or(sumAggregationSchema)
    .or(differenceAggregationSchema),
);

type SumAggregation = {
  type: 'sum';
  values: AllAggregation[];
};

const sumAggregationSchema: z.ZodType<SumAggregation> = z.strictObject({
  type: z.literal('sum'),
  values: allAggregationSchema.array(),
});

type DifferenceAggregation = {
  type: 'difference';
  values: AllAggregation[];
};

const differenceAggregationSchema: z.ZodType<DifferenceAggregation> =
  z.strictObject({
    type: z.literal('difference'),
    values: allAggregationSchema.array().length(2),
  });

type DivisionAggregation = {
  type: 'division';
  values: AllAggregation[];
};

const divisionAggregationSchema: z.ZodType<DivisionAggregation> =
  z.strictObject({
    type: z.literal('division'),
    values: allAggregationSchema.array().length(2),
  });

// @ts-expect-error dark magic of discriminatedUnion & lazy types
export const aggregationSchema = z.discriminatedUnion('type', [
  valueAggregationSchema,
  sumAggregationSchema,
  differenceAggregationSchema,
  divisionAggregationSchema,
]) as unknown as z.ZodType<
  | z.infer<typeof sumAggregationSchema>
  | z.infer<typeof differenceAggregationSchema>
  | z.infer<typeof divisionAggregationSchema>
  | z.infer<typeof valueAggregationSchema>
>;

const inputDescriptionSchema = z.string().min(1).max(30);

export const inputsSchema = z
  .discriminatedUnion('type', [
    z.strictObject({
      type: z.literal('number'),
      description: inputDescriptionSchema,
      key: gameValueKeySchema,
      defaultValue: gameDefaultValueSchema,
    }),
    z.strictObject({
      type: z.literal('counter'),
      description: inputDescriptionSchema,
      key: gameValueKeySchema,
      defaultValue: gameDefaultValueSchema,
    }),
  ])
  .array();

export const sortSchema = z.strictObject({
  direction: z.union([z.literal('asc'), z.literal('desc')]),
});

export const addGameSchema = z.object({
  eventId: eventIdSchema,
  title: gameTitleSchema,
  logoUrl: logoUrlSchema.optional(),
  sort: sortSchema,

  formatting: formattingSchema,
  aggregation: aggregationSchema,
  inputs: inputsSchema,
});
