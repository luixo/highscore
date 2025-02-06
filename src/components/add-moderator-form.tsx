import type { FC } from 'react';
import { useCallback } from 'react';
import { Form, Button, Input, Tooltip } from '@nextui-org/react';
import type { SubmitErrorHandler, SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { EventId } from '~/server/schemas';
import { moderatorNameSchema, moderatorKeySchema } from '~/server/schemas';
import { trpc } from '~/utils/trpc';
import { toast } from 'react-hot-toast';
import { collectErrors } from '~/utils/form';

const formSchema = z.strictObject({
  name: moderatorNameSchema,
  key: moderatorKeySchema,
});

export const AddModeratorForm: FC<{ eventId: EventId }> = ({ eventId }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),

    mode: 'onChange',
  });
  const addModeratorMutation = trpc.moderator.add.useMutation({
    onSuccess: (result) => {
      toast.success(`Модератор "${result.name}" добавлен`);
      form.reset();
    },
  });
  const onSubmit = useCallback<SubmitHandler<z.infer<typeof formSchema>>>(
    (data) =>
      addModeratorMutation.mutate({ eventId, name: data.name, key: data.key }),
    [addModeratorMutation, eventId],
  );
  const onError = useCallback<SubmitErrorHandler<z.infer<typeof formSchema>>>(
    (errors) => toast.error(collectErrors(errors).join('\n')),
    [],
  );
  return (
    <Form onSubmit={form.handleSubmit(onSubmit, onError)}>
      <h3 className="text-2xl font-semibold">Добавить модератора</h3>
      <Input
        {...form.register('name')}
        label="Имя"
        errorMessage={form.formState.errors.name?.message?.toString()}
        isInvalid={Boolean(form.formState.errors.name?.message)}
      />
      <Input
        {...form.register('key')}
        label="Ключ модератора"
        errorMessage={form.formState.errors.name?.message?.toString()}
        isInvalid={Boolean(form.formState.errors.name?.message)}
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
