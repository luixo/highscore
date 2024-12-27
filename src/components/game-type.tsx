import { FC } from 'react';
import { Alert } from '@nextui-org/react';

type Props = {
  src: string;
  description: string;
};

export const GameType: FC<Props> = ({ src, description }) => {
  return (
    <Alert
      icon={<img src={src} height={30} width={30} />}
      description={description}
      classNames={{
        mainWrapper: 'justify-center',
      }}
    />
  );
};
