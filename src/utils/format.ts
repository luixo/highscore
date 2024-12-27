import { JsonValue } from '@prisma/client/runtime/library';

import formatDuration from 'format-duration';

type ScoreFormat = 'Time';

const formatScoreWith = (
  scoreFormat: ScoreFormat | undefined,
  score: number,
) => {
  if (scoreFormat === 'Time') {
    return formatDuration(score);
  }
  return score.toString();
};

const getSerializer =
  (
    serializers: Record<string, unknown>,
    scoreFormat: ScoreFormat | undefined,
    key: string,
  ) =>
  (value: number) => {
    if (key in serializers && typeof serializers[key] === 'string') {
      return serializers[key].replace(
        '%s',
        formatScoreWith(scoreFormat, value),
      );
    }
    return formatScoreWith(scoreFormat, value);
  };

const getSerializers = (
  serializers: Record<string, unknown>,
  scoreFormat: ScoreFormat | undefined,
) => ({
  one: getSerializer(serializers, scoreFormat, 'one'),
  some: getSerializer(serializers, scoreFormat, 'some'),
  many: getSerializer(serializers, scoreFormat, 'many'),
});

export const formatScore = (
  score: number,
  scoreFormat: ScoreFormat | undefined,
  formatters?: JsonValue,
) => {
  const serializersRaw =
    typeof formatters === 'object' && formatters && 'serializers' in formatters
      ? formatters.serializers
      : undefined;
  if (
    !serializersRaw ||
    typeof serializersRaw !== 'object' ||
    Array.isArray(serializersRaw)
  ) {
    return formatScoreWith(scoreFormat, score);
  }
  const serializers = getSerializers(serializersRaw, scoreFormat);
  if (score % 10 === 1 && score % 10 !== 11) {
    return serializers.one(score);
  } else if (
    score % 10 >= 2 &&
    score % 10 <= 4 &&
    (score % 100 < 10 || score % 100 >= 20)
  ) {
    return serializers.some(score);
  } else {
    return serializers.many(score);
  }
};

export const getInputLabel = (formatters?: JsonValue) => {
  if (!formatters || typeof formatters !== 'object') {
    return 'Очков';
  }
  if ('inputLabel' in formatters && typeof formatters.inputLabel === 'string') {
    return formatters.inputLabel;
  }
};
