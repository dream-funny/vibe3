import { ArrowDown, Coffee, HeartHandshake, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

const introductions = [
  {
    icon: HeartHandshake,
    title: '혼자가 아니라 함께,',
    description: '막히는 순간도 질문하고 나누며 같이 답을 찾아가요.',
  },
  {
    icon: Sparkles,
    title: '아이디어를 바로 만들어보고,',
    description: '어렵게만 느껴졌던 코딩을 작은 결과물로 완성해봐요.',
  },
  {
    icon: Coffee,
    title: '부담 없이 꾸준하게,',
    description: '각자의 속도를 존중하며 편안하게 배우고 성장해요.',
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden="true" className="warm-orb warm-orb-one" />
      <div aria-hidden="true" className="warm-orb warm-orb-two" />

      <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-5 py-6 sm:px-8 sm:py-8">
        <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span>바이브코딩 공부</span>
        </a>
      </nav>

      <section id="top" className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-5 pb-20 pt-14 text-center sm:px-8 sm:pb-28 sm:pt-20 lg:pt-24">
        <p className="mb-6 rounded-full border border-primary/15 bg-card/80 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur">
          코딩이 궁금한 우리들의 따뜻한 공부방
        </p>
        <h1 className="max-w-4xl text-balance text-[clamp(3.4rem,11vw,7.8rem)] font-black leading-[0.92] tracking-[-0.075em]">
          바이브코딩
          <span className="mt-1 block text-primary sm:mt-3">공부</span>
        </h1>
        <p className="mt-8 max-w-xl text-balance text-lg leading-8 text-muted-foreground sm:mt-10 sm:text-xl">
          함께 바이브코딩 공부하는 방
        </p>

        <Button className="mt-9 h-13 rounded-full px-7 text-base shadow-[0_12px_28px_rgb(180_78_45/22%)] sm:mt-11" size="lg" nativeButton={false} render={<a href="#about" />}>
          둘러보기
          <ArrowDown className="ml-1 size-4" aria-hidden="true" />
        </Button>
      </section>

      <section id="about" className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-12 sm:px-8 sm:pb-20">
        <div className="grid gap-3 rounded-[2rem] border border-border/80 bg-card/75 p-3 shadow-[0_24px_80px_rgb(116_65_42/10%)] backdrop-blur-md sm:grid-cols-3 sm:gap-4 sm:p-4">
          {introductions.map(({ icon: Icon, title, description }, index) => (
            <article key={title} className="group rounded-[1.45rem] border border-transparent bg-background/75 p-6 text-left transition-transform duration-300 hover:-translate-y-1 hover:border-primary/10 sm:min-h-56 sm:p-7">
              <div className="mb-8 flex items-center justify-between sm:mb-10">
                <span className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-muted-foreground/60">0{index + 1}</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-sm leading-6 text-muted-foreground">
          바이브 코딩에 관심이 있다면, 경험이나 실력에 관계없이 누구나 환영해요.
        </p>
      </section>
    </main>
  );
}
