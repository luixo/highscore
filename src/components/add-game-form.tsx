import type { FC } from 'react';
import { useCallback } from 'react';
import {
  Form,
  Button,
  Input,
  Select,
  SelectItem,
  Tooltip,
} from '@nextui-org/react';
import type { SubmitErrorHandler, SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { EventId } from '~/server/schemas';
import { addGameSchema } from '~/server/schemas';
import { trpc } from '~/utils/trpc';
import { toast } from 'react-hot-toast';
import { collectErrors } from '~/utils/form';

const formSchema = addGameSchema.omit({ eventId: true });

export const AddGameForm: FC<{ eventId: EventId }> = ({ eventId }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });
  const addGameMutation = trpc.games.add.useMutation({
    onSuccess: (result) => {
      toast.success(`Игра "${result.title}" добавлена`);
      form.reset();
    },
  });
  const onSubmit = useCallback<SubmitHandler<z.infer<typeof formSchema>>>(
    (data) => {
      addGameMutation.mutate({ eventId: eventId, ...data });
    },
    [addGameMutation, eventId],
  );
  const onError = useCallback<SubmitErrorHandler<z.infer<typeof formSchema>>>(
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
        {...form.register('formatters.serializers.one')}
        isRequired
        label="Очки победы (1)"
        placeholder="%s ложка"
        errorMessage={form.formState.errors.formatters?.serializers?.one?.message?.toString()}
        isInvalid={Boolean(
          form.formState.errors.formatters?.serializers?.one?.message,
        )}
      />
      <Input
        {...form.register('formatters.serializers.some')}
        isRequired
        label="Очки победы (2-4)"
        placeholder="%s ложки"
        errorMessage={form.formState.errors.formatters?.serializers?.some?.message?.toString()}
        isInvalid={Boolean(
          form.formState.errors.formatters?.serializers?.some?.message,
        )}
      />
      <Input
        {...form.register('formatters.serializers.many')}
        isRequired
        label="Очки победы (5+)"
        placeholder="%s ложек"
        errorMessage={form.formState.errors.formatters?.serializers?.many?.message?.toString()}
        isInvalid={Boolean(
          form.formState.errors.formatters?.serializers?.many?.message,
        )}
      />
      <Input
        {...form.register('formatters.inputLabel')}
        isRequired
        label="Описание поля ввода очков"
        placeholder="За сколько выполнено"
        errorMessage={form.formState.errors.formatters?.inputLabel?.message?.toString()}
        isInvalid={Boolean(
          form.formState.errors.formatters?.inputLabel?.message,
        )}
      />
      <Input
        {...form.register('logoUrl')}
        isRequired
        label="URL логотипа (размер)"
        errorMessage={form.formState.errors.logoUrl?.message?.toString()}
        isInvalid={Boolean(form.formState.errors.logoUrl?.message)}
      />
      <Controller
        control={form.control}
        name="sortDirection"
        render={({ field }) => (
          <Select
            label="Сортировка"
            placeholder="Выбери как сортировать результаты"
            selectedKeys={[field.value]}
            variant="bordered"
            isRequired
            onSelectionChange={(selection) => {
              if (selection === 'all') {
                field.onChange('Desc');
              } else {
                const selected = [...selection.keys()][0];
                field.onChange(selected);
              }
            }}
          >
            <SelectItem key="Asc" value="Asc">
              Меньше лучше
            </SelectItem>
            <SelectItem key="Desc" value="Desc">
              Больше лучше
            </SelectItem>
          </Select>
        )}
      />
      <Controller
        control={form.control}
        name="scoreFormat"
        render={({ field }) => (
          <Select
            label="Форматирование результатов"
            placeholder="Форматирование результата"
            selectedKeys={field.value ? [field.value] : []}
            variant="bordered"
            onSelectionChange={(selection) => {
              if (selection === 'all') {
                field.onChange();
              } else {
                const selected = [...selection.keys()][0];
                field.onChange(selected);
              }
            }}
          >
            <SelectItem key="Time" value="Time">
              Как время
            </SelectItem>
          </Select>
        )}
      />
      <Controller
        control={form.control}
        name="aggregation"
        render={({ field }) => (
          <Select
            label="Агрегация результатов"
            placeholder="Агрегация результатов"
            selectedKeys={field.value ? [field.value.type] : []}
            variant="bordered"
            onSelectionChange={(selection) => {
              if (selection === 'all') {
                field.onChange();
              } else {
                const selected = [...selection.keys()][0];
                field.onChange(
                  selected === 'arithmetic'
                    ? { type: 'arithmetic' }
                    : undefined,
                );
              }
            }}
          >
            <SelectItem key="arithmetic" value="arithmetic">
              Арифметически среднее
            </SelectItem>
          </Select>
        )}
      />
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
