import { z } from "zod";

export const gameTitleSchema = z.string().min(1).max(64);

export const precisionSchema = z.number().int().min(0).max(10);

export const formattingSchema = z.discriminatedUnion("type", [
	z.strictObject({ precision: precisionSchema, type: z.literal("time") }),
	z.strictObject({
		precision: precisionSchema,
		regex: z.string(),
		type: z.literal("regex"),
	}),
]);

export const eventIdSchema = z.uuid();
export type EventId = z.infer<typeof eventIdSchema>;

export const gameIdSchema = z.uuid();
export type GameId = z.infer<typeof gameIdSchema>;

export const logoUrlSchema = z.url();

export const eventNameSchema = z.string().min(1).max(64);
export const eventAliasSchema = z
	.string()
	.min(3, { abort: true })
	.max(64, { abort: true })
	.regex(/^[a-z0-9_-]+$/u, {
		abort: true,
		message:
			"Only lowercase alphanumeric, dashes, and underscores are allowed.",
	});

export const playerNameSchema = z.string().min(1).max(64);

export const moderatorKeySchema = z.string().min(2).max(64);

export const moderatorNameSchema = z.string().min(3).max(64);

export const gameUpdateObject = z.discriminatedUnion("type", [
	z.object({
		title: gameTitleSchema,
		type: z.literal("title"),
	}),
]);

export const moderatorKeysSchema = z.preprocess(
	(input) => {
		try {
			if (typeof input !== "string") {
				return {};
			}
			return JSON.parse(input) as unknown;
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
			key: gameValueKeySchema,
			type: z.literal("number"),
			value: z.number(),
		})
		.array(),
});

export const scoreUpdateObject = z.discriminatedUnion("type", [
	z.object({
		playerName: playerNameSchema,
		type: z.literal("playerName"),
	}),
	z.object({
		scores: scoresSchema.shape.values,
		type: z.literal("scores"),
	}),
]);

export const valueAggregationSchema = z.strictObject({
	defaultValue: gameDefaultValueSchema,
	key: gameValueKeySchema,
	type: z.literal("value"),
	weight: z.number().optional(),
});

const sumAggregationSchema = z.strictObject({
	type: z.literal("sum"),
	get values() {
		// oxlint-disable-next-line no-use-before-define
		return allAggregationSchema.array() as unknown as z.ZodArray<
			typeof valueAggregationSchema
		>;
	},
});

const differenceAggregationSchema = z.strictObject({
	type: z.literal("difference"),
	get values() {
		// oxlint-disable-next-line no-use-before-define
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
			defaultValue: gameDefaultValueSchema,
			description: inputDescriptionSchema,
			hidden: z.boolean().optional(),
			key: gameValueKeySchema,
			type: z.literal("number"),
		})
		.array(),
});

export const sortSchema = z.strictObject({
	direction: z.literal(["asc", "desc"]),
});

export const addGameSchema = z.object({
	aggregation: aggregationSchema,
	eventId: eventIdSchema,
	formatting: formattingSchema,
	inputs: inputsSchema,
	logoUrl: logoUrlSchema.optional(),
	sort: sortSchema,
	title: gameTitleSchema,
});
