import { z } from "zod";

export const gameTitleSchema = z.string().min(1).max(64);

export const precisionSchema = z.number().int().min(0).max(10);

export const formattingSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("time"), precision: precisionSchema }),
  z.strictObject({
    type: z.literal("regex"),
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
export const eventAliasSchema = z
  .string()
  .min(3, { abort: true })
  .max(64, { abort: true })
  .regex(/^[a-z0-9_-]+$/, {
    message:
      "Only lowercase alphanumeric, dashes, and underscores are allowed.",
    abort: true,
  });

export const playerNameSchema = z.string().min(1).max(64);

export const moderatorKeySchema = z.string().min(2).max(64);

export const moderatorNameSchema = z.string().min(3).max(64);

export const gameUpdateObject = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("title"),
    title: gameTitleSchema,
  }),
]);

export const moderatorKeysSchema = z.preprocess(
  (input) => {
    try {
      if (typeof input !== "string") {
        return {};
      }
      return JSON.parse(input);
    } catch {
      return {};
    }
  },
  z.record(moderatorKeySchema, z.string()),
);

const gameValueKeySchema = z.string().min(2).max(20);
const gameDefaultValueSchema = z.number();

export const scoresSchema = z.object({
  values: z
    .strictObject({
      type: z.literal("number"),
      key: gameValueKeySchema,
      value: z.number(),
    })
    .array(),
});

export const scoreUpdateObject = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("playerName"),
    playerName: playerNameSchema,
  }),
  z.object({
    type: z.literal("scores"),
    scores: scoresSchema.shape.values,
  }),
]);

export const valueAggregationSchema = z.strictObject({
  type: z.literal("value"),
  key: gameValueKeySchema,
  weight: z.number().optional(),
  defaultValue: gameDefaultValueSchema,
});

const sumAggregationSchema = z.strictObject({
  type: z.literal("sum"),
  get values() {
    return allAggregationSchema.array() as unknown as z.ZodArray<
      typeof valueAggregationSchema
    >;
  },
});

const differenceAggregationSchema = z.strictObject({
  type: z.literal("difference"),
  get values() {
    return allAggregationSchema.array().length(2) as unknown as z.ZodArray<
      typeof valueAggregationSchema
    >;
  },
});

const allAggregationSchema = valueAggregationSchema
  .or(sumAggregationSchema)
  .or(differenceAggregationSchema);

const divisionAggregationSchema = z.strictObject({
  type: z.literal("division"),
  get values() {
    return allAggregationSchema.array().length(2);
  },
});

export const multiplyAggregationSchema = z.strictObject({
  type: z.literal("multiply"),
  get values() {
    return allAggregationSchema.array().length(2);
  },
});

export const aggregationSchema = z.discriminatedUnion("type", [
  valueAggregationSchema,
  sumAggregationSchema,
  differenceAggregationSchema,
  divisionAggregationSchema,
  multiplyAggregationSchema,
]);

const inputDescriptionSchema = z.string().min(1).max(30);

export const inputsSchema = z.object({
  values: z
    .strictObject({
      type: z.literal("number"),
      description: inputDescriptionSchema,
      key: gameValueKeySchema,
      defaultValue: gameDefaultValueSchema,
      hidden: z.boolean().optional(),
    })
    .array(),
});

export const sortSchema = z.strictObject({
  direction: z.literal(["asc", "desc"]),
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
