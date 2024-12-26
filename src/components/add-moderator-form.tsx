import { FC, useCallback } from 'react';
import { Form, Button, Input } from '@nextui-org/react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { moderatorNameSchema, moderatorKeySchema } from '~/server/schemas';
import { trpc } from '~/utils/trpc';
import { toast } from 'react-hot-toast';
import { useModeratorStatus } from '~/hooks/use-moderator-status';

const formSchema = z.strictObject({
  name: moderatorNameSchema,
  key: moderatorKeySchema,
});

export const AddModeratorForm: FC = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const addModeratorMutation = trpc.moderator.add.useMutation({
    onSuccess: (result) => {
      toast.success(`Модератор "${result.name}" добавлен`);
      form.reset();
    },
  });
  const onSubmit = useCallback<SubmitHandler<z.infer<typeof formSchema>>>(
    (data) => {
      addModeratorMutation.mutate({ name: data.name, key: data.key });
    },
    [addModeratorMutation],
  );
  const moderatorStatus = useModeratorStatus();
  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
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
      <Button
        type="submit"
        color="primary"
        className="self-end"
        isDisabled={moderatorStatus !== 'Admin'}
      >
        Добавить
      </Button>
    </Form>
  );
};
