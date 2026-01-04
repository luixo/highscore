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
import { useTranslation } from "~/utils/i18n";
import { useTRPC } from "~/utils/trpc";

const formSchema = addGameSchema.omit({ eventId: true });
type FormType = z.infer<typeof formSchema>;

const FormatForm: React.FC<{ form: AppForm<FormType> }> = ({ form }) => {
  const { t, language } = useTranslation();
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
      <h4 className="text-xl font-semibold">
        {t("addGame.form.formatting.title")}
      </h4>
      <form.AppField name="formatting">
        {(field) => (
          <Select
            label={t("addGame.form.formatting.label")}
            placeholder={t("addGame.form.formatting.placeholder")}
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
            <SelectItem key="time">
              {t("addGame.form.formatting.options.time")}
            </SelectItem>
            <SelectItem key="regex">
              {t("addGame.form.formatting.options.special")}
            </SelectItem>
          </Select>
        )}
      </form.AppField>
      <form.AppField name="formatting">
        {(field) =>
          field.state.value.type === "regex" ? (
            <field.TextField
              isRequired
              label={t("addGame.form.regex.label")}
              placeholder={t("addGame.form.regex.placeholder")}
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
            label={t("addGame.form.precision.label")}
            placeholder={t("addGame.form.precision.placeholder")}
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
            {input.key}: {input.value.toFixed(precision)}
          </Code>
        ))}
      </div>
      <span>{t("addGame.form.resultPreview")}</span>
      <Code>
        {formatScore(score, { ...formatting, precision }, { language })}
      </Code>
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
  </ButtonGroup>
);

const InputsForm: React.FC<{ form: AppForm<FormType> }> = ({ form }) => {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <h4 className="text-xl font-semibold">
        {t("addGame.form.inputs.title")}
      </h4>
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
                        <h5>
                          {t("addGame.form.inputs.field.title", { index })}
                        </h5>
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
                            label={t(
                              "addGame.form.inputs.field.description.label",
                            )}
                            placeholder={t(
                              "addGame.form.inputs.field.description.placeholder",
                            )}
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
                            label={t("addGame.form.inputs.field.key.label")}
                            placeholder={t(
                              "addGame.form.inputs.field.key.placeholder",
                            )}
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
                            label={t("addGame.form.inputs.field.type.number")}
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
                            {t("addGame.form.inputs.field.hidden.label")}
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
};

const SortForm: React.FC<{ form: AppForm<FormType> }> = ({ form }) => {
  const { t } = useTranslation();
  return (
    <>
      <h4 className="text-xl font-semibold">
        {t("addGame.form.sorting.title")}
      </h4>
      <form.AppField name="sort.direction">
        {(field) => (
          <Select
            label={t("addGame.form.sorting.label")}
            placeholder={t("addGame.form.sorting.placeholder")}
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
            <SelectItem key="asc">
              {t("addGame.form.sorting.options.asc")}
            </SelectItem>
            <SelectItem key="desc">
              {t("addGame.form.sorting.options.desc")}
            </SelectItem>
          </Select>
        )}
      </form.AppField>
    </>
  );
};

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
  const { t } = useTranslation();
  const inputKeys = useKeys(form);
  return (
    <>
      <form.AppField name={`${path}.key` as "aggregation.key"}>
        {(field) => (
          <Select
            label={t("addGame.form.aggregation.key.label")}
            placeholder={t("addGame.form.aggregation.key.placeholder")}
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
            label={t("addGame.form.aggregation.defaultValue.label")}
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
            label={t("addGame.form.aggregation.weight.label")}
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

const AggregationElement: React.FC<{
  form: AppForm<FormType>;
  index: number;
  onSet: (value: z.infer<typeof aggregationSchema>) => void;
  onRemove?: () => void;
  value: z.infer<typeof aggregationSchema>;
  path: DeepKeysOfType<
    FormType,
    Pick<z.infer<typeof aggregationSchema>, "type">
  >;
}> = ({ form, index, onSet, onRemove, value, path }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex items-center justify-between">
        <h5 className="text-medium font-semibold">
          {t("addGame.form.inputs.field.title", { index })}
        </h5>
        <div className="flex gap-2">
          <AggregationButtonGroup form={form} onClick={onSet} color="primary" />
          <Button
            color="danger"
            isIconOnly
            size="sm"
            onPress={() => onRemove?.()}
            isDisabled={!onRemove}
          >
            <CiCircleRemove />
          </Button>
        </div>
      </div>
      <SwitchAggregationForm form={form} path={path} aggregation={value} />
    </>
  );
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
                  <AggregationElement
                    key={index}
                    form={form}
                    value={fieldValue}
                    index={index}
                    onSet={(value) => {
                      // @ts-expect-error We're simplifying schema to make ts work
                      group.setFieldValue(localPath, value);
                    }}
                    onRemove={
                      field.state.value.length === 1
                        ? undefined
                        : () => {
                            group.removeFieldValue("values", index);
                          }
                    }
                    path={localPath}
                  />
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
}> = ({ form, path }) => {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-col items-start gap-2 pl-4">
      <h4 className="text-xl font-semibold">
        {t("addGame.form.aggregation.options.sum")}
      </h4>
      <MultipleAggregationForm form={form} fields={path} path={path} />
    </div>
  );
};

const AggregationDifferenceForm: React.FC<{
  form: AppForm<FormType>;
  path: DeepKeysOfType<
    FormType,
    Pick<z.infer<typeof aggregationSchema>, "type">
  >;
}> = ({ form, path }) => {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-col items-start gap-2 pl-4">
      <h4 className="text-xl font-semibold">
        {t("addGame.form.aggregation.options.diff")}
      </h4>
      <MultipleAggregationForm form={form} fields={path} path={path} />
    </div>
  );
};

const AggregationDivisionForm: React.FC<{
  form: AppForm<FormType>;
  path: DeepKeysOfType<
    FormType,
    Pick<z.infer<typeof aggregationSchema>, "type">
  >;
}> = ({ form, path }) => {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-col items-start gap-2 pl-4">
      <h4 className="text-xl font-semibold">
        {t("addGame.form.aggregation.options.div")}
      </h4>
      <MultipleAggregationForm form={form} fields={path} path={path} />
    </div>
  );
};

const AggregationMultiplyForm: React.FC<{
  form: AppForm<FormType>;
  path: DeepKeysOfType<
    FormType,
    Pick<z.infer<typeof aggregationSchema>, "type">
  >;
}> = ({ form, path }) => {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-col items-start gap-2 pl-4">
      <h4 className="text-xl font-semibold">
        {t("addGame.form.aggregation.options.mul")}
      </h4>
      <MultipleAggregationForm form={form} fields={path} path={path} />
    </div>
  );
};

const AggregationForm: React.FC<{ form: AppForm<FormType> }> = ({ form }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex w-full justify-between">
        <h4 className="text-xl font-semibold">
          {t("addGame.form.aggregation.title")}
        </h4>
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
};

export const AddGameForm: React.FC<{ eventId: EventId }> = ({ eventId }) => {
  const trpc = useTRPC();
  const { t } = useTranslation();
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
            description: t("addGame.form.inputs.defaultDescription"),
          },
        ],
      },
      aggregation: {
        type: "value",
        key: "default",
        defaultValue: 0,
      },
    }),
    [t],
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
        title: t("common.error"),
        description: getAllErrors(formApi),
        color: "danger",
      });
    },
  });
  const addGameMutation = useMutation(
    trpc.games.add.mutationOptions({
      onSuccess: (result) => {
        addToast({
          title: t("common.success"),
          description: t("addGame.toast.description", { title: result.title }),
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
        <h3 className="text-2xl font-semibold">{t("addGame.title")}</h3>
        <form.AppField name="title">
          {(field) => (
            <field.TextField
              isRequired
              label={t("addGame.form.title.label")}
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
              label={t("addGame.form.logoUrl.label")}
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
        <form.SubmitButton>{t("addGame.form.submitButton")}</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};
