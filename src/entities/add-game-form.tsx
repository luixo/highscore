import React from "react";

import type { Form as FormType } from "@heroui/react";
import {
  Button,
  ButtonGroup,
  Code,
  Divider,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import { type DeepKeysOfType, useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { CiCircleRemove } from "react-icons/ci";
import type { z } from "zod";

import { type AppForm, useAppForm, withFieldGroup } from "~/hooks/use-app-form";
import type {
  EventId,
  aggregationSchema,
  inputsSchema,
} from "~/server/schemas";
import { addGameSchema, precisionSchema } from "~/server/schemas";
import { aggregateScore } from "~/utils/aggregation";
import { getUuid } from "~/utils/crypto";
import { getAllErrors } from "~/utils/form";
import { DEFAULT_PRECISION, formatScore } from "~/utils/format";
import { useTRPC } from "~/utils/trpc";

const formSchema = addGameSchema.omit({ eventId: true });
type FormType = z.infer<typeof formSchema>;

const FormatForm: React.FC<{ form: AppForm<FormType> }> = ({ form }) => {
  const inputs = useStore(form.store, (state) => state.values.inputs.values);
  const aggregation = useStore(form.store, (state) => state.values.aggregation);
  const [mockValues, setMockValues] = React.useState<number[]>([]);
  React.useEffect(() => {
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
  const formatting = useStore(form.store, (state) => state.values.formatting);
  const precision = precisionSchema.safeParse(formatting.precision).success
    ? formatting.precision
    : DEFAULT_PRECISION;
  return (
    <>
      <h4 className="text-xl font-semibold">Форматирование</h4>
      <form.AppField name="formatting">
        {(field) => (
          <Select
            label="Форматирование результатов"
            placeholder="Форматирование результата"
            selectedKeys={field.state.value ? [field.state.value.type] : []}
            variant="bordered"
            onSelectionChange={(selection) => {
              if (selection === "all") {
                return;
              } else {
                const selected = [...selection.keys()][0] as
                  | (typeof field)["state"]["value"]["type"]
                  | undefined;
                if (!selected) {
                  field.setValue({
                    type: "regex",
                    regex: "%value%",
                    precision: DEFAULT_PRECISION,
                  } satisfies FormType["formatting"]);
                } else if (selected === "time") {
                  field.setValue({
                    type: "time",
                    precision: DEFAULT_PRECISION,
                  } satisfies FormType["formatting"]);
                } else if (selected === "regex") {
                  field.setValue({
                    type: "regex",
                    regex: "%value%",
                    precision: DEFAULT_PRECISION,
                  } satisfies FormType["formatting"]);
                }
              }
            }}
          >
            <SelectItem key="time">Как время</SelectItem>
            <SelectItem key="regex">Специальное форматирование</SelectItem>
          </Select>
        )}
      </form.AppField>
      <form.AppField name="formatting">
        {(field) =>
          field.state.value.type === "regex" ? (
            <field.TextField
              isRequired
              label="Регулярное выражение форматирование"
              placeholder="%value% {ложка|ложки|ложек}"
              value={field.state.value.regex}
              onValueChange={(value) =>
                field.setValue((prevValue) => ({
                  type: "regex",
                  precision: prevValue.precision,
                  regex: value,
                }))
              }
              name={field.name}
              onBlur={field.handleBlur}
              fieldError={
                field.state.meta.isDirty ? field.state.meta.errors : undefined
              }
            />
          ) : null
        }
      </form.AppField>
      <form.AppField name="formatting.precision">
        {(field) => (
          <field.NumberField
            isRequired
            label="Значимых знаков"
            placeholder="4"
            value={field.state.value}
            onValueChange={field.setValue}
            name={field.name}
            onBlur={field.handleBlur}
            fieldError={
              field.state.meta.isDirty ? field.state.meta.errors : undefined
            }
          />
        )}
      </form.AppField>
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

const InputButtonGroup: React.FC<{
  onClick: (value: z.infer<typeof inputsSchema>["values"][number]) => void;
}> = ({ onClick }) => (
  <ButtonGroup prefix="+" size="sm">
    <Button
      color="primary"
      onPress={() =>
        onClick({
          type: "number",
          key: getUuid(),
          description: "",
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
          type: "counter",
          key: getUuid(),
          description: "",
          defaultValue: 0,
        })
      }
    >
      counter
    </Button>
  </ButtonGroup>
);

const InputsForm: React.FC<{ form: AppForm<FormType> }> = ({ form }) => (
  <div className="flex w-full flex-col items-start gap-4">
    <h4 className="text-xl font-semibold">Ввод</h4>
    <form.AppField name="inputs.values" mode="array">
      {(field) => (
        <>
          {field.state.value.map((fieldValue, index) => (
            <form.Field key={fieldValue.key} name={`inputs.values[${index}]`}>
              {(subField) => (
                <div
                  key={fieldValue.key}
                  className="flex w-full flex-col gap-2"
                >
                  <>
                    <div className="flex w-full items-center justify-between gap-2">
                      <h5>Поле #{index}</h5>
                      <div className="flex gap-2">
                        <InputButtonGroup onClick={subField.setValue} />
                        <Button
                          color="danger"
                          isIconOnly
                          size="sm"
                          onPress={() => field.removeValue(index)}
                        >
                          <CiCircleRemove />
                        </Button>
                      </div>
                    </div>
                    <form.Field name={`inputs.values[${index}].description`}>
                      {(localField) => (
                        <field.TextField
                          isRequired
                          label="Описание поля ввода"
                          placeholder="За сколько выполнено"
                          value={localField.state.value}
                          onValueChange={localField.setValue}
                          name={field.name}
                          onBlur={field.handleBlur}
                          fieldError={
                            field.state.meta.isDirty
                              ? field.state.meta.errors
                              : undefined
                          }
                        />
                      )}
                    </form.Field>
                    <form.Field name={`inputs.values[${index}].key`}>
                      {(localField) => (
                        <field.TextField
                          isRequired
                          label="Ключ поля ввода"
                          placeholder="default"
                          value={localField.state.value}
                          onValueChange={localField.setValue}
                          name={field.name}
                          onBlur={field.handleBlur}
                          fieldError={
                            field.state.meta.isDirty
                              ? field.state.meta.errors
                              : undefined
                          }
                        />
                      )}
                    </form.Field>
                    <form.Field name={`inputs.values[${index}].defaultValue`}>
                      {(localField) => (
                        <field.NumberField
                          isRequired
                          label={
                            subField.state.value.type === "counter"
                              ? "Инкремент счетчика"
                              : "Значение по умолчанию"
                          }
                          placeholder="0"
                          value={localField.state.value}
                          onValueChange={localField.setValue}
                          name={field.name}
                          onBlur={field.handleBlur}
                          fieldError={
                            field.state.meta.isDirty
                              ? field.state.meta.errors
                              : undefined
                          }
                        />
                      )}
                    </form.Field>
                    <form.Field name={`inputs.values[${index}].hidden`}>
                      {(localField) => (
                        <field.SwitchField
                          isSelected={localField.state.value ?? false}
                          onValueChange={localField.setValue}
                          name={field.name}
                          onBlur={field.handleBlur}
                          fieldError={
                            field.state.meta.isDirty
                              ? field.state.meta.errors
                              : undefined
                          }
                        >
                          Скрыто
                        </field.SwitchField>
                      )}
                    </form.Field>
                  </>
                </div>
              )}
            </form.Field>
          ))}
          <InputButtonGroup
            onClick={() =>
              field.pushValue({
                type: "number",
                description: "",
                key: getUuid(),
                defaultValue: 0,
              })
            }
          />
        </>
      )}
    </form.AppField>
  </div>
);

const SortForm: React.FC<{ form: AppForm<FormType> }> = ({ form }) => (
  <>
    <h4 className="text-xl font-semibold">Сортировка</h4>
    <form.AppField name="sort.direction">
      {(field) => (
        <Select
          label="Сортировка"
          placeholder="Выбери как сортировать результаты"
          selectedKeys={[field.state.value]}
          variant="bordered"
          isRequired
          onSelectionChange={(selection) => {
            if (selection === "all") {
              return;
            } else {
              const selected = [...selection.keys()][0] as "asc" | "desc";
              field.setValue(selected);
            }
          }}
        >
          <SelectItem key="asc">Меньше лучше</SelectItem>
          <SelectItem key="desc">Больше лучше</SelectItem>
        </Select>
      )}
    </form.AppField>
  </>
);

const collectKeys = (
  aggregation: z.infer<typeof aggregationSchema>,
): string[] => {
  switch (aggregation.type) {
    case "value":
      return [aggregation.key];
    case "sum":
    case "difference":
    case "division":
    case "multiply":
      return aggregation.values.reduce<string[]>(
        (acc, value) => [...acc, ...collectKeys(value)],
        [],
      );
  }
};

const useKeys = (form: AppForm<FormType>) =>
  useStore(form.store, (state) => {
    const allKeys = [
      ...state.values.inputs.values.map((input) => input.key),
      ...collectKeys(state.values.aggregation),
    ];
    return [...new Set(allKeys).keys()];
  });

const AggregationValueForm: React.FC<{
  form: AppForm<FormType>;
  path: DeepKeysOfType<
    FormType,
    Pick<z.infer<typeof aggregationSchema>, "type">
  >;
}> = ({ form, path }) => {
  const inputKeys = useKeys(form);
  return (
    <>
      <form.AppField name={`${path}.key` as "aggregation.key"}>
        {(field) => (
          <Select
            label="Ключ значения"
            placeholder="Выбери из значений"
            selectedKeys={[field.state.value]}
            variant="bordered"
            isRequired
            onSelectionChange={(selection) => {
              if (selection === "all") {
                return;
              } else {
                const selected = [...selection.keys()][0] as string;
                field.setValue(selected);
              }
            }}
          >
            {inputKeys.map((key) => (
              <SelectItem key={key}>{key}</SelectItem>
            ))}
          </Select>
        )}
      </form.AppField>
      <form.AppField
        name={`${path}.defaultValue` as "aggregation.defaultValue"}
      >
        {(field) => (
          <field.NumberField
            isRequired
            label="Значение по умолчанию"
            placeholder="0"
            value={field.state.value}
            onValueChange={field.setValue}
            name={field.name}
            onBlur={field.handleBlur}
            fieldError={
              field.state.meta.isDirty ? field.state.meta.errors : undefined
            }
          />
        )}
      </form.AppField>
      <form.AppField name={`${path}.weight` as "aggregation.weight"}>
        {(field) => (
          <field.NumberField
            label="Вес (от 0 до 1)"
            min={0}
            max={1}
            placeholder="0.5"
            value={field.state.value}
            onValueChange={field.setValue}
            name={field.name}
            onBlur={field.handleBlur}
            fieldError={
              field.state.meta.isDirty ? field.state.meta.errors : undefined
            }
          />
        )}
      </form.AppField>
    </>
  );
};

const AggregationButtonGroup: React.FC<{
  form: AppForm<FormType>;
  onClick: (value: z.infer<typeof aggregationSchema>) => void;
  color: "primary" | "secondary";
}> = ({ form, onClick, color }) => {
  const firstKey = useKeys(form)[0] ?? "unknown";
  const defaultValue = {
    type: "value" as const,
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
            type: "sum",
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
            type: "difference",
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
            type: "multiply",
            values: [defaultValue],
          })
        }
      >
        *
      </Button>
      <Button
        color={color}
        isIconOnly
        onPress={() =>
          onClick({
            type: "division",
            values: [defaultValue, defaultValue],
          })
        }
      >
        /
      </Button>
    </ButtonGroup>
  );
};

const SwitchAggregationForm: React.FC<{
  form: AppForm<FormType>;
  path: DeepKeysOfType<
    FormType,
    Pick<z.infer<typeof aggregationSchema>, "type">
  >;
  aggregation: z.infer<typeof aggregationSchema>;
}> = ({ form, path, aggregation }) => {
  switch (aggregation.type) {
    case "value":
      return <AggregationValueForm form={form} path={path} />;
    case "sum":
      return <AggregationSumForm form={form} path={path} />;
    case "difference":
      return <AggregationDifferenceForm form={form} path={path} />;
    case "division":
      return <AggregationDivisionForm form={form} path={path} />;
    case "multiply":
      return <AggregationMultiplyForm form={form} path={path} />;
  }
};

const MultipleAggregationForm = withFieldGroup({
  defaultValues: {
    type: "multiply",
    values: [],
  } as z.infer<typeof aggregationSchema>,
  props: {
    path: "" as DeepKeysOfType<
      FormType,
      Pick<z.infer<typeof aggregationSchema>, "type">
    >,
  },
  render: ({ group, path }) => {
    const form = group.form as unknown as AppForm<FormType>;
    return (
      <group.AppField name="values" mode="array">
        {(field) => (
          <>
            <div className="flex w-full flex-col gap-2">
              {field.state.value.map((fieldValue, index) => {
                const localPath =
                  `${path}.values[${index}]` as `aggregation.values[${number}]`;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <h5 className="text-medium font-semibold">
                        Поле #{index}
                      </h5>
                      <div className="flex gap-2">
                        <AggregationButtonGroup
                          form={form}
                          onClick={(value) =>
                            // @ts-expect-error We're simplifying schema to make ts work
                            group.setFieldValue(localPath, value)
                          }
                          color="primary"
                        />
                        <Button
                          color="danger"
                          isIconOnly
                          size="sm"
                          onPress={() =>
                            group.removeFieldValue("values", index)
                          }
                          isDisabled={field.state.value.length === 1}
                        >
                          <CiCircleRemove />
                        </Button>
                      </div>
                    </div>
                    <SwitchAggregationForm
                      form={form}
                      path={localPath}
                      aggregation={fieldValue}
                    />
                  </>
                );
              })}
            </div>
            {field.state.value.length >= 2 &&
            ["difference", "division"].includes(
              group.getFieldValue("type"),
            ) ? null : (
              <AggregationButtonGroup
                form={form}
                // @ts-expect-error We're simplifying schema to make ts work
                onClick={(value) => group.pushFieldValue("values", value)}
                color="secondary"
              />
            )}
          </>
        )}
      </group.AppField>
    );
  },
});

const AggregationSumForm: React.FC<{
  form: AppForm<FormType>;
  path: DeepKeysOfType<
    FormType,
    Pick<z.infer<typeof aggregationSchema>, "type">
  >;
}> = ({ form, path }) => (
  <div className="flex w-full flex-col items-start gap-2 pl-4">
    <h4 className="text-xl font-semibold">Сумма</h4>
    <MultipleAggregationForm form={form} fields={path} path={path} />
  </div>
);

const AggregationDifferenceForm: React.FC<{
  form: AppForm<FormType>;
  path: DeepKeysOfType<
    FormType,
    Pick<z.infer<typeof aggregationSchema>, "type">
  >;
}> = ({ form, path }) => (
  <div className="flex w-full flex-col items-start gap-2 pl-4">
    <h4 className="text-xl font-semibold">Разница</h4>
    <MultipleAggregationForm form={form} fields={path} path={path} />
  </div>
);

const AggregationDivisionForm: React.FC<{
  form: AppForm<FormType>;
  path: DeepKeysOfType<
    FormType,
    Pick<z.infer<typeof aggregationSchema>, "type">
  >;
}> = ({ form, path }) => (
  <div className="flex w-full flex-col items-start gap-2 pl-4">
    <h4 className="text-xl font-semibold">Частное</h4>
    <MultipleAggregationForm form={form} fields={path} path={path} />
  </div>
);

const AggregationMultiplyForm: React.FC<{
  form: AppForm<FormType>;
  path: DeepKeysOfType<
    FormType,
    Pick<z.infer<typeof aggregationSchema>, "type">
  >;
}> = ({ form, path }) => (
  <div className="flex w-full flex-col items-start gap-2 pl-4">
    <h4 className="text-xl font-semibold">Произведение</h4>
    <MultipleAggregationForm form={form} fields={path} path={path} />
  </div>
);

const AggregationForm: React.FC<{ form: AppForm<FormType> }> = ({ form }) => (
  <>
    <div className="flex w-full justify-between">
      <h4 className="text-xl font-semibold">Агрегация</h4>
      <AggregationButtonGroup
        form={form}
        onClick={(value) => form.setFieldValue("aggregation", value)}
        color="primary"
      />
    </div>
    <form.Subscribe selector={(state) => state.values.aggregation}>
      {(value) => (
        <SwitchAggregationForm
          form={form}
          path="aggregation"
          aggregation={value}
        />
      )}
    </form.Subscribe>
  </>
);

export const AddGameForm: React.FC<{ eventId: EventId }> = ({ eventId }) => {
  const trpc = useTRPC();
  const getDefaultValues = React.useCallback(
    (): z.infer<typeof formSchema> => ({
      title: "",
      sort: { direction: "asc" },
      logoUrl: undefined,
      formatting: {
        type: "regex",
        regex: "%value%",
        precision: DEFAULT_PRECISION,
      },
      inputs: {
        values: [
          {
            type: "number",
            key: "default",
            defaultValue: 0,
            description: "Очки",
          },
        ],
      },
      aggregation: {
        type: "value",
        key: "default",
        defaultValue: 0,
      },
    }),
    [],
  );
  const form = useAppForm({
    defaultValues: getDefaultValues(),
    validators: {
      onChange: formSchema,
    },
    onSubmit: ({ value }) => {
      addGameMutation.mutate({ eventId: eventId, ...value });
    },
    onSubmitInvalid: ({ formApi }) => {
      addToast({
        title: "Ошибка",
        description: getAllErrors(formApi),
        color: "danger",
      });
    },
  });
  const addGameMutation = useMutation(
    trpc.games.add.mutationOptions({
      onSuccess: (result) => {
        addToast({
          title: "Успех",
          description: `Игра "${result.title}" добавлена`,
          color: "success",
        });
        form.reset(getDefaultValues());
      },
    }),
  );
  return (
    <form.AppForm>
      <form.Form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <h3 className="text-2xl font-semibold">Добавить игру</h3>
        <form.AppField name="title">
          {(field) => (
            <field.TextField
              isRequired
              label="Название игры"
              value={field.state.value}
              onValueChange={field.setValue}
              name={field.name}
              onBlur={field.handleBlur}
              fieldError={
                field.state.meta.isDirty ? field.state.meta.errors : undefined
              }
            />
          )}
        </form.AppField>
        <form.AppField name="logoUrl">
          {(field) => (
            <field.TextField
              label="URL логотипа"
              value={field.state.value}
              onValueChange={field.setValue}
              name={field.name}
              onBlur={field.handleBlur}
              fieldError={
                field.state.meta.isDirty ? field.state.meta.errors : undefined
              }
            />
          )}
        </form.AppField>
        <Divider className="my-2" />
        <InputsForm form={form} />
        <Divider className="my-2" />
        <AggregationForm form={form} />
        <Divider className="my-2" />
        <FormatForm form={form} />
        <Divider className="my-2" />
        <SortForm form={form} />
        <form.SubmitButton>Добавить</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};
