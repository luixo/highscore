import type { NextPageWithLayout } from '~/pages/_app';

const IndexPage: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-[clamp(1rem,10vw,2rem)] font-semibold tracking-tight sm:text-[clamp(1rem,10vw,3rem)] lg:text-5xl">
          Список игр
        </h1>
      </div>
    </div>
  );
};

export default IndexPage;
