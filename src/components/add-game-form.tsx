import { FC, useCallback } from 'react';
import { Form, Button, Input } from '@nextui-org/react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  gameTitleSchema,
  logoUrlSchema,
  formattersSchema,
} from '~/server/schemas';
import { trpc } from '~/utils/trpc';
import { toast } from 'react-hot-toast';
import { useModeratorStatus } from '~/hooks/use-moderator-status';

export const AddGameForm: FC = () => {
  const moderatorStatus = useModeratorStatus();
  if (!moderatorStatus) {
    return null;
  }
  return <AddGameFormInner />;
};

const formSchema = z.strictObject({
  title: gameTitleSchema,
  formatters: formattersSchema,
  logoUrl: logoUrlSchema,
});

const AddGameFormInner: FC = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const addGameMutation = trpc.games.add.useMutation({
    onSuccess: (result) => {
      toast.success(`Игра "${result.title}" добавлена`);
      form.reset();
    },
  });
  const onSubmit = useCallback<SubmitHandler<z.infer<typeof formSchema>>>(
    (data) => {
      addGameMutation.mutate({
        title: data.title,
        formatters: data.formatters,
        logoUrl: data.logoUrl,
      });
    },
    [addGameMutation],
  );
  const moderatorStatus = useModeratorStatus();
  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <h3 className="text-2xl font-semibold">Добавить игру</h3>
      <Input
        {...form.register('title')}
        label="Название игры"
        errorMessage={form.formState.errors.title?.message?.toString()}
        isInvalid={Boolean(form.formState.errors.title?.message)}
      />
      <Input
        {...form.register('formatters.serializers.one')}
        label="Очки победы (1)"
        placeholder="%s ложка"
        errorMessage={form.formState.errors.formatters?.serializers?.one?.message?.toString()}
        isInvalid={Boolean(
          form.formState.errors.formatters?.serializers?.one?.message,
        )}
      />
      <Input
        {...form.register('formatters.serializers.some')}
        label="Очки победы (2-4)"
        placeholder="%s ложки"
        errorMessage={form.formState.errors.formatters?.serializers?.some?.message?.toString()}
        isInvalid={Boolean(
          form.formState.errors.formatters?.serializers?.some?.message,
        )}
      />
      <Input
        {...form.register('formatters.serializers.many')}
        label="Очки победы (5+)"
        placeholder="%s ложек"
        errorMessage={form.formState.errors.formatters?.serializers?.many?.message?.toString()}
        isInvalid={Boolean(
          form.formState.errors.formatters?.serializers?.many?.message,
        )}
      />
      <Input
        {...form.register('formatters.inputLabel')}
        label="Описание поля ввода очков"
        placeholder="За сколько выполнено"
        errorMessage={form.formState.errors.formatters?.inputLabel?.message?.toString()}
        isInvalid={Boolean(
          form.formState.errors.formatters?.inputLabel?.message,
        )}
      />
      <Input
        {...form.register('logoUrl')}
        label="URL логотипа (размер)"
        errorMessage={form.formState.errors.logoUrl?.message?.toString()}
        isInvalid={Boolean(form.formState.errors.logoUrl?.message)}
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
