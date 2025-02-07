import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Form,
  Button,
  Input,
  Select,
  SelectItem,
  Tooltip,
  Code,
  ButtonGroup,
  Divider,
  Switch,
} from '@nextui-org/react';
import type {
  FieldArrayPath,
  FieldError,
  FieldErrors,
  FieldPath,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type {
  aggregationSchema,
  EventId,
  inputsSchema,
} from '~/server/schemas';
import { addGameSchema, precisionSchema } from '~/server/schemas';
import { trpc } from '~/utils/trpc';
import { toast } from 'react-hot-toast';
import { collectErrors } from '~/utils/form';
import { DEFAULT_PRECISION, formatScore } from '~/utils/format';
import { CiCircleRemove } from 'react-icons/ci';
import { aggregateScore } from '~/utils/aggregation';

const formSchema = addGameSchema.omit({ eventId: true });
type Form = z.infer<typeof formSchema>;

const FormatForm: FC<{ form: UseFormReturn<Form> }> = ({ form }) => {
  const inputs = form.watch('inputs');
  const aggregation = form.watch('aggregation');
  const [mockValues, setMockValues] = useState<number[]>([]);
  useEffect(() => {
    setMockValues((values) =>
      inputs.map((_, index) => values[index] ?? Math.random() * 1000),
    );
  }, [inputs]);
  const mockedInputs = inputs.map((input, index) => ({
    type: input.type,
    key: input.key,
    value: (input.defaultValue || mockValues[index]) ?? 0,
  }));
  const score = aggregateScore(mockedInputs, aggregation);
  const formatting = form.watch('formatting');
  const precision = precisionSchema.safeParse(formatting.precision).success
    ? formatting.precision
    : DEFAULT_PRECISION;
  return (
    <>
      <h4 className="text-xl font-semibold">Форматирование</h4>
      <Controller
        control={form.control}
        name="formatting"
        shouldUnregister
        render={({ field }) => {
          return (
            <>
              <Select
                label="Форматирование результатов"
                placeholder="Форматирование результата"
                selectedKeys={field.value ? [field.value.type] : []}
                variant="bordered"
                onSelectionChange={(selection) => {
                  if (selection === 'all') {
                    return;
                  } else {
                    const selected = [...selection.keys()][0] as
                      | (typeof field)['value']['type']
                      | undefined;
                    if (!selected) {
                      field.onChange({
                        type: 'regex',
                        regex: '%value%',
                        precision: DEFAULT_PRECISION,
                      } satisfies Form['formatting']);
                    } else if (selected === 'time') {
                      field.onChange({
                        type: 'time',
                        precision: DEFAULT_PRECISION,
                      } satisfies Form['formatting']);
                    } else if (selected === 'regex') {
                      field.onChange({
                        type: 'regex',
                        regex: '%value%',
                        precision: DEFAULT_PRECISION,
                      } satisfies Form['formatting']);
                    }
                  }
                }}
              >
                <SelectItem key="time" value="time">
                  Как время
                </SelectItem>
                <SelectItem key="regex" value="regex">
                  Специальное форматирование
                </SelectItem>
              </Select>
            </>
          );
        }}
      />
      {formatting.type === 'regex' ? (
        <Input
          {...form.register('formatting.regex', { shouldUnregister: true })}
          isRequired
          label="Регулярное выражение форматирование"
          placeholder="%value% {ложка|ложки|ложек}"
          // @ts-expect-error discriminated union problem
          errorMessage={form.formState.errors.formatting?.regex?.message?.toString()}
          // @ts-expect-error discriminated union problem
          isInvalid={Boolean(form.formState.errors.formatting?.regex?.message)}
        />
      ) : null}
      <Input
        {...form.register('formatting.precision', { valueAsNumber: true })}
        isRequired
        label="Значимых знаков"
        placeholder="4"
        errorMessage={form.formState.errors.formatting?.precision?.message?.toString()}
        isInvalid={Boolean(
          form.formState.errors.formatting?.precision?.message,
        )}
      />
      <div className="flex flex-wrap gap-2">
        {mockedInputs.map((input) => (
          <Code key={input.key}>
            {input.key}: {input.value.toPrecision(precision)}
          </Code>
        ))}
      </div>
      <span>Результат:</span>
      <Code>{formatScore(score, { ...formatting, precision })}</Code>
    </>
  );
};

const InputButtonGroup: FC<{
  onClick: (value: z.infer<typeof inputsSchema>[number]) => void;
}> = ({ onClick }) => {
  const randomUuid =
    typeof window === 'undefined' ? 'none' : window.crypto?.randomUUID?.();
  return (
    <ButtonGroup prefix="+" size="sm">
      <Button
        color="primary"
        onPress={() =>
          onClick({
            type: 'number',
            key: randomUuid,
            description: '',
            defaultValue: 0,
          })
        }
      >
        number
      </Button>
      <Button
        color="primary"
        onPress={() =>
          onClick({
            type: 'counter',
            key: randomUuid,
            description: '',
            defaultValue: 0,
          })
        }
      >
        counter
      </Button>
    </ButtonGroup>
  );
};

const InputsForm: FC<{ form: UseFormReturn<Form> }> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'inputs',
  });
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <h4 className="text-xl font-semibold">Ввод</h4>
      {fields.map((field, index) => (
        <div key={field.id} className="flex w-full flex-col gap-2">
          <Controller
            control={form.control}
            name={`inputs.${index}`}
            key={field.id}
            render={({ field }) => (
              <>
                <div className="flex w-full items-center justify-between gap-2">
                  <h5>Поле #{index}</h5>
                  <div className="flex gap-2">
                    <InputButtonGroup
                      onClick={(value) =>
                        form.setValue(`inputs.${index}`, value)
                      }
                    />
                    <Button
                      color="danger"
                      isIconOnly
                      size="sm"
                      onPress={() => remove(index)}
                    >
                      <CiCircleRemove />
                    </Button>
                  </div>
                </div>
                <Input
                  {...form.register(`inputs.${index}.description`)}
                  isRequired
                  label="Описание поля ввода"
                  placeholder="За сколько выполнено"
                  errorMessage={form.formState.errors.inputs?.[
                    index
                  ]?.description?.message?.toString()}
                  isInvalid={Boolean(
                    form.formState.errors.inputs?.[index]?.description?.message,
                  )}
                />
                <Input
                  {...form.register(`inputs.${index}.key`)}
                  isRequired
                  label="Ключ поля ввода"
                  placeholder="default"
                  errorMessage={form.formState.errors.inputs?.[
                    index
                  ]?.key?.message?.toString()}
                  isInvalid={Boolean(
                    form.formState.errors.inputs?.[index]?.key?.message,
                  )}
                />
                <Input
                  {...form.register(`inputs.${index}.defaultValue`, {
                    valueAsNumber: true,
                  })}
                  isRequired
                  label={
                    field.value.type === 'counter'
                      ? 'Инкремент счетчика'
                      : 'Значение по умолчанию'
                  }
                  placeholder="0"
                  errorMessage={form.formState.errors.inputs?.[
                    index
                  ]?.defaultValue?.message?.toString()}
                  isInvalid={Boolean(
                    form.formState.errors.inputs?.[index]?.defaultValue
                      ?.message,
                  )}
                />
                <Controller
                  control={form.control}
                  name={`inputs.${index}.hidden`}
                  render={({ field: { value, ...field } }) => (
                    <Switch isSelected={value ?? false} {...field}>
                      Скрыто
                    </Switch>
                  )}
                />
              </>
            )}
          />
        </div>
      ))}
      <InputButtonGroup onClick={append} />
    </div>
  );
};

const SortForm: FC<{ form: UseFormReturn<Form> }> = ({ form }) => {
  return (
    <>
      <h4 className="text-xl font-semibold">Сортировка</h4>
      <Controller
        control={form.control}
        name="sort.direction"
        render={({ field }) => (
          <Select
            label="Сортировка"
            placeholder="Выбери как сортировать результаты"
            selectedKeys={[field.value]}
            variant="bordered"
            isRequired
            onSelectionChange={(selection) => {
              if (selection === 'all') {
                return;
              } else {
                const selected = [...selection.keys()][0];
                field.onChange(selected);
              }
            }}
          >
            <SelectItem key="asc" value="asc">
              Меньше лучше
            </SelectItem>
            <SelectItem key="desc" value="desc">
              Больше лучше
            </SelectItem>
          </Select>
        )}
      />
    </>
  );
};

const getPathValue = (
  input: FieldErrors<Form>,
  path: string[] = [],
): FieldError => {
  if (path.length === 0) {
    return input as FieldError;
  }
  return getPathValue(
    // @ts-expect-error this is dark magic
    input[path[0]] ?? ({} as FieldErrors<Form>),
    path.slice(1),
  );
};

const collectKeys = (
  aggregation: z.infer<typeof aggregationSchema>,
): string[] => {
  switch (aggregation.type) {
    case 'value':
      return [aggregation.key];
    case 'sum':
    case 'difference':
    case 'division':
      return aggregation.values.reduce<string[]>(
        (acc, value) => [...acc, ...collectKeys(value)],
        [],
      );
  }
};

const getKeys = (form: UseFormReturn<Form>) => {
  const allKeys = [
    ...form.watch('inputs').map((input) => input.key),
    ...collectKeys(form.watch('aggregation')),
  ];
  return [...new Set(allKeys).keys()];
};

const AggregationValueForm: FC<{
  form: UseFormReturn<Form>;
  path: FieldPath<Form>;
}> = ({ form, path }) => {
  const getErrorObject = (extraPath: string) =>
    getPathValue(form.formState.errors, [...path.split('.'), extraPath]);
  const inputKeys = getKeys(form);
  return (
    <>
      <Controller
        control={form.control}
        name={`${path}.key` as 'aggregation.key'}
        render={({ field }) => (
          <Select
            label="Ключ значения"
            placeholder="Выбери из значений"
            selectedKeys={[field.value]}
            variant="bordered"
            isRequired
            onSelectionChange={(selection) => {
              if (selection === 'all') {
                return;
              } else {
                const selected = [...selection.keys()][0];
                field.onChange(selected);
              }
            }}
          >
            {inputKeys.map((key) => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </Select>
        )}
      />
      <Input
        {...form.register(
          `${path}.defaultValue` as 'aggregation.defaultValue',
          { valueAsNumber: true },
        )}
        isRequired
        label="Значение по умолчанию"
        placeholder="0"
        errorMessage={getErrorObject('defaultValue')?.message?.toString()}
        isInvalid={Boolean(getErrorObject('defaultValue')?.message)}
      />
      <Input
        {...form.register(`${path}.weight` as 'aggregation.weight', {
          valueAsNumber: true,
        })}
        label="Вес (от 0 до 1)"
        min={0}
        max={1}
        placeholder="0.5"
        errorMessage={getErrorObject('weight')?.message?.toString()}
        isInvalid={Boolean(getErrorObject('weight')?.message)}
      />
    </>
  );
};

const AggregationButtonGroup: FC<{
  form: UseFormReturn<Form>;
  onClick: (value: z.infer<typeof aggregationSchema>) => void;
  color: 'primary' | 'secondary';
}> = ({ form, onClick, color }) => {
  const firstKey = getKeys(form)[0] ?? 'unknown';
  const defaultValue = {
    type: 'value' as const,
    key: firstKey,
    defaultValue: 0,
    weight: 1,
  };
  return (
    <ButtonGroup size="sm">
      <Button color={color} onPress={() => onClick(defaultValue)}>
        value
      </Button>
      <Button
        color={color}
        isIconOnly
        onPress={() =>
          onClick({
            type: 'sum',
            values: [defaultValue],
          })
        }
      >
        +
      </Button>
      <Button
        color={color}
        isIconOnly
        onPress={() =>
          onClick({
            type: 'difference',
            values: [defaultValue, defaultValue],
          })
        }
      >
        -
      </Button>
      <Button
        color={color}
        isIconOnly
        onPress={() =>
          onClick({
            type: 'division',
            values: [defaultValue, defaultValue],
          })
        }
      >
        /
      </Button>
    </ButtonGroup>
  );
};

const SwitchAggregationForm: FC<{
  form: UseFormReturn<Form>;
  path: FieldPath<Form>;
  aggregation: z.infer<typeof aggregationSchema>;
}> = ({ form, path, aggregation }) => {
  switch (aggregation.type) {
    case 'value':
      return <AggregationValueForm form={form} path={path} />;
    case 'sum':
      return <AggregationSumForm form={form} path={path} />;
    case 'difference':
      return <AggregationDifferenceForm form={form} path={path} />;
    case 'division':
      return <AggregationDivisionForm form={form} path={path} />;
  }
};

const MultipleAggregationForm: FC<{
  form: UseFormReturn<Form>;
  path: FieldPath<Form>;
}> = ({ form, path }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `${path}.values` as FieldArrayPath<Form>,
  });
  const value = form.watch(path) as z.infer<typeof aggregationSchema>;
  return (
    <>
      <div className="flex w-full flex-col gap-2">
        {fields.map((field, index) => {
          const localPath =
            `${path}.values.${index}` as `aggregation.values.${number}`;
          return (
            <Controller
              control={form.control}
              name={localPath}
              key={field.id}
              render={({ field }) => (
                <>
                  <div className="flex items-center justify-between">
                    <h5 className="text-medium font-semibold">Поле #{index}</h5>
                    <div className="flex gap-2">
                      <AggregationButtonGroup
                        form={form}
                        onClick={(value) => form.setValue(localPath, value)}
                        color="primary"
                      />
                      <Button
                        color="danger"
                        isIconOnly
                        size="sm"
                        onPress={() => remove(index)}
                        isDisabled={fields.length === 1}
                      >
                        <CiCircleRemove />
                      </Button>
                    </div>
                  </div>
                  <SwitchAggregationForm
                    form={form}
                    path={localPath}
                    aggregation={field.value}
                  />
                </>
              )}
            />
          );
        })}
      </div>
      {fields.length >= 2 &&
      ['difference', 'division'].includes(value.type) ? null : (
        <AggregationButtonGroup
          form={form}
          onClick={(value) => append(value)}
          color="secondary"
        />
      )}
    </>
  );
};

const AggregationSumForm: FC<{
  form: UseFormReturn<Form>;
  path: FieldPath<Form>;
}> = ({ form, path }) => {
  return (
    <div className="flex w-full flex-col items-start gap-2 pl-4">
      <h4 className="text-xl font-semibold">Сумма</h4>
      <MultipleAggregationForm form={form} path={path} />
    </div>
  );
};

const AggregationDifferenceForm: FC<{
  form: UseFormReturn<Form>;
  path: FieldPath<Form>;
}> = ({ form, path }) => {
  return (
    <div className="flex w-full flex-col items-start gap-2 pl-4">
      <h4 className="text-xl font-semibold">Разница</h4>
      <MultipleAggregationForm form={form} path={path} />
    </div>
  );
};

const AggregationDivisionForm: FC<{
  form: UseFormReturn<Form>;
  path: FieldPath<Form>;
}> = ({ form, path }) => {
  return (
    <div className="flex w-full flex-col items-start gap-2 pl-4">
      <h4 className="text-xl font-semibold">Частное</h4>
      <MultipleAggregationForm form={form} path={path} />
    </div>
  );
};

const AggregationForm: FC<{ form: UseFormReturn<Form> }> = ({ form }) => {
  return (
    <>
      <div className="flex w-full justify-between">
        <h4 className="text-xl font-semibold">Агрегация</h4>
        <AggregationButtonGroup
          form={form}
          onClick={(value) => form.setValue('aggregation', value)}
          color="primary"
        />
      </div>
      <SwitchAggregationForm
        form={form}
        path="aggregation"
        aggregation={form.watch('aggregation')}
      />
    </>
  );
};

export const AddGameForm: FC<{ eventId: EventId }> = ({ eventId }) => {
  const form = useForm<Form>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      logoUrl: undefined,
      formatting: {
        type: 'regex',
        regex: '%value%',
        precision: DEFAULT_PRECISION,
      } satisfies Form['formatting'],
      inputs: [
        {
          type: 'number',
          key: 'default',
          defaultValue: 0,
          description: 'Очки',
        },
      ] satisfies Form['inputs'],
      aggregation: {
        type: 'value',
        key: 'default',
        defaultValue: 0,
      } satisfies Form['aggregation'],
    },
  });
  console.log('watch', form.watch());
  const addGameMutation = trpc.games.add.useMutation({
    onSuccess: (result) => {
      toast.success(`Игра "${result.title}" добавлена`);
      form.reset();
    },
  });
  const onSubmit = useCallback<SubmitHandler<Form>>(
    (data) => {
      addGameMutation.mutate({ eventId: eventId, ...data });
    },
    [addGameMutation, eventId],
  );
  const onError = useCallback<SubmitErrorHandler<Form>>(
    (errors) => toast.error(collectErrors(errors).join('\n')),
    [],
  );
  return (
    <Form onSubmit={form.handleSubmit(onSubmit, onError)}>
      <h3 className="text-2xl font-semibold">Добавить игру</h3>
      <Input
        {...form.register('title')}
        isRequired
        label="Название игры"
        errorMessage={form.formState.errors.title?.message?.toString()}
        isInvalid={Boolean(form.formState.errors.title?.message)}
      />
      <Input
        {...form.register('logoUrl', {
          setValueAs: (value) => value || undefined,
        })}
        label="URL логотипа"
        errorMessage={form.formState.errors.logoUrl?.message?.toString()}
        isInvalid={Boolean(form.formState.errors.logoUrl?.message)}
      />
      <Divider className="my-2" />
      <InputsForm form={form} />
      <Divider className="my-2" />
      <AggregationForm form={form} />
      <Divider className="my-2" />
      <FormatForm form={form} />
      <Divider className="my-2" />
      <SortForm form={form} />
      <Tooltip
        isDisabled={form.formState.isValid}
        content={collectErrors(form.formState.errors)}
      >
        <div>
          <Button
            type="submit"
            color="primary"
            className="self-end"
            isDisabled={!form.formState.isValid}
          >
            Добавить
          </Button>
        </div>
      </Tooltip>
    </Form>
  );
};
