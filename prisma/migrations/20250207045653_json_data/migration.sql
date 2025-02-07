-- AlterTable
ALTER TABLE "Game" 
ADD COLUMN "formatting" JSONB,
ADD COLUMN "inputs" JSONB,
ADD COLUMN "sort" JSONB;

UPDATE "Game"
SET "sort" = jsonb_build_object(
  'direction',
  CASE
    WHEN "sortDirection" = 'Desc' THEN 'desc'
    WHEN "sortDirection" = 'Asc' THEN 'asc'
  END::text
);

UPDATE "Game"
SET "inputs" = jsonb_build_array(
  jsonb_build_object(
    'type',
    'number',
    'key',
    'default',
    'description',
    'Score',
    'defaultValue',
    0
  )
);

UPDATE "Game"
SET "formatting" = jsonb_build_object(
  'type',
  'regex',
  'precision',
  4,
  'regex',
  replace('%value% {' || (
    SELECT string_agg(value, '|')
    FROM jsonb_each_text(formatters->'serializers')
  ) || '}', '%s ', '')
);

-- AlterTable
ALTER TABLE "Game"
DROP COLUMN "formatScore",
DROP COLUMN "formatters",
DROP COLUMN "sortDirection";

-- AlterTable
ALTER TABLE "Score"
ADD COLUMN "values" JSONB;

UPDATE "Score"
SET "values" = jsonb_build_object(
  'type',
  'number',
  'key',
  'default',
  'value',
  "score"
);

-- AlterTable
ALTER TABLE "Score"
DROP COLUMN "score",
DROP COLUMN "scoreCount";

ALTER TABLE "Score"
ALTER COLUMN "values" SET NOT NULL;

-- DropEnum
DROP TYPE "Direction";

-- DropEnum
DROP TYPE "ScoreFormat";
