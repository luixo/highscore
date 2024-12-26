import { JsonValue } from '@prisma/client/runtime/library';

const getSerializer =
  (serializers: Record<string, unknown>, key: string) => (value: number) => {
    if (key in serializers && typeof serializers[key] === 'string') {
      return serializers[key].replace('%s', value.toString());
    }
    return value.toString();
  };

const getSerializers = (serializers: Record<string, unknown>) => ({
  one: getSerializer(serializers, 'one'),
  some: getSerializer(serializers, 'some'),
  many: getSerializer(serializers, 'many'),
});

export const formatScore = (score: number, formatters?: JsonValue) => {
  const serializersRaw =
    typeof formatters === 'object' && formatters && 'serializers' in formatters
      ? formatters.serializers
      : undefined;
  if (
    !serializersRaw ||
    typeof serializersRaw !== 'object' ||
    Array.isArray(serializersRaw)
  ) {
    return score.toString();
  }
  const serializers = getSerializers(serializersRaw);
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
