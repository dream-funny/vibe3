'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ExternalLink, MapPin, Sparkles } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

type Item = {
  id: string;
  title: string;
  region: string | null;
  cover_image_url: string | null;
  summary: string | null;
  tags: string[] | string | null;
  project_url: string | null;
  created_at: string;
};

function safeHttpUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function LoadingCards() {
  return (
    <div aria-label="작품을 불러오는 중" aria-live="polite" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <Card key={item} className="min-h-48 border border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="gap-3">
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-2/5" />
          </CardHeader>
          <CardContent className="mt-auto">
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    async function loadItems() {
      if (!supabaseUrl || !supabaseKey) {
        setError('목록 연결 설정이 필요해요.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/items?select=id,title,region,cover_image_url,summary,tags,project_url,created_at&order=created_at.desc`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) throw new Error('Supabase request failed');
        setItems((await response.json()) as Item[]);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError('작품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      } finally {
        setIsLoading(false);
      }
    }

    loadItems();
    return () => controller.abort();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden="true" className="warm-orb warm-orb-one" />
      <div aria-hidden="true" className="warm-orb warm-orb-two" />

      <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8 sm:py-8">
        <a href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span>바이브코딩 공부</span>
        </a>
        <a href="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft className="size-4" aria-hidden="true" />
          처음으로
        </a>
      </nav>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-14">
        <header className="mb-8 sm:mb-10">
          <p className="mb-3 text-sm font-semibold text-primary">함께 만든 결과물</p>
          <h1 className="text-4xl font-black tracking-[-0.045em] sm:text-5xl">완성 작품</h1>
        </header>

        {isLoading ? (
          <LoadingCards />
        ) : error ? (
          <Empty className="min-h-72 border border-border bg-card/75 shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Sparkles aria-hidden="true" /></EmptyMedia>
              <EmptyTitle>목록을 불러오지 못했어요</EmptyTitle>
              <EmptyDescription>{error}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : items.length === 0 ? (
          <Empty className="min-h-72 border border-border bg-card/75 shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Sparkles aria-hidden="true" /></EmptyMedia>
              <EmptyTitle>아직 등록된 글이 없어요</EmptyTitle>
              <EmptyDescription>첫 번째 바이브코딩 작품을 기다리고 있어요.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const imageUrl = safeHttpUrl(item.cover_image_url);
              const projectUrl = safeHttpUrl(item.project_url);
              const tags = Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',').filter(Boolean);
              return (
                <Card key={item.id} className="group min-w-0 overflow-hidden border border-border/70 bg-card/85 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
                  {imageUrl ? (
                    <a href={projectUrl || undefined} target={projectUrl ? '_blank' : undefined} rel={projectUrl ? 'noopener noreferrer' : undefined} className="block aspect-[16/10] overflow-hidden bg-secondary" aria-label={projectUrl ? `${item.title} 작품 열기` : undefined}>
                      <img src={imageUrl} alt={`${item.title} 대표 이미지`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]" />
                    </a>
                  ) : (
                    <div className="grid aspect-[16/10] place-items-center bg-secondary px-5 text-center text-sm text-muted-foreground">등록된 대표 이미지가 없어요</div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl font-bold tracking-tight">
                      {projectUrl ? <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.title}</a> : item.title}
                    </CardTitle>
                    {item.summary && <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>}
                    {tags.length > 0 && <div className="flex flex-wrap gap-1.5">{tags.slice(0, 5).map((tag) => <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">#{tag.trim()}</span>)}</div>}
                  </CardHeader>
                  <CardContent className="mt-auto space-y-4 text-sm text-muted-foreground">
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      <span className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" aria-hidden="true" />{item.region || '지역 미정'}</span>
                      <time className="flex items-center gap-1.5" dateTime={item.created_at}><CalendarDays className="size-4 text-primary" aria-hidden="true" />{dateFormatter.format(new Date(item.created_at))}</time>
                    </div>
                    {projectUrl ? <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90">작품 보기 <ExternalLink className="size-4" aria-hidden="true" /></a> : <span className="block rounded-xl bg-secondary px-4 py-3 text-center">등록된 작품 링크가 없어요</span>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
