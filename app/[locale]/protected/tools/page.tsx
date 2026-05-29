"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { searchContent } from "@/lib/api/search";

type Tab = "vocab" | "grammar" | "content";

interface VocabResult {
  word: string;
  book_num: number;
  lesson_num: number;
  book_page: number;
  example_q?: string;
  example_a?: string;
}

interface ContentResult {
  id: string;
  text: string;
  block_type: string;
  book_num: number;
  lesson_num: number;
  book_page: number;
}

export default function ToolsPage() {
  const [tab, setTab] = useState<Tab>("vocab");

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-20 md:pb-6">
      <h1 className="text-2xl font-bold text-foreground mb-4">辅助工具</h1>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-border mb-6">
        {(
          [
            { key: "vocab", label: "词汇搜索" },
            { key: "grammar", label: "语法参考" },
            { key: "content", label: "教材原文" },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "vocab" && <VocabSearch />}
      {tab === "grammar" && <GrammarReference />}
      {tab === "content" && <ContentSearch />}
    </div>
  );
}

function VocabSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VocabResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function search() {
    if (!query.trim()) return;
    startTransition(async () => {
      const supabase = createClient();
      const { data: terms } = await supabase
        .from("terms")
        .select("normalized, book_num, lesson_num, book_page")
        .ilike("normalized", `%${query.trim()}%`)
        .in("term_kind", ["word", "phrase"])
        .limit(15);

      setResults(
        (terms ?? []).map((t: { normalized: string; book_num: number; lesson_num: number; book_page: number }) => ({
          word: t.normalized,
          book_num: t.book_num,
          lesson_num: t.lesson_num,
          book_page: t.book_page,
        }))
      );
      setSearched(true);
    });
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="搜索单词或中文意思..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="rounded-xl"
        />
        <Button onClick={search} disabled={isPending} className="rounded-xl shrink-0">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {searched && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          没有找到匹配词汇
        </p>
      )}

      <div className="flex flex-col gap-3">
        {results.map((r, i) => (
          <Card key={i} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-lg font-medium text-foreground">{r.word}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Book {r.book_num} · Lesson {r.lesson_num}
                  {r.book_page ? ` · 第 ${r.book_page} 页` : ""}
                </p>
              </div>
              <Button asChild size="sm" variant="ghost" className="rounded-lg shrink-0 text-primary text-xs">
                <Link href={`/protected/learn/${r.book_num}/${r.lesson_num}`}>
                  去练习
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GrammarReference() {
  const [category, setCategory] = useState("全部");
  const [notes, setNotes] = useState<{ title: string; body: string; book_num: number; lesson_num: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const cats = ["全部", "时态", "情态动词", "冠词", "介词", "疑问词", "比较级"];

  function load(cat: string) {
    setCategory(cat);
    startTransition(async () => {
      const supabase = createClient();
      let q = supabase
        .from("notes")
        .select("title, body, book_num, lesson_num")
        .order("book_num")
        .limit(50);
      if (cat !== "全部") q = q.ilike("title", `%${cat}%`);
      const { data } = await q;
      setNotes(data ?? []);
      setLoaded(true);
    });
  }

  if (!loaded) {
    return (
      <div>
        <div className="flex gap-2 flex-wrap mb-4">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => load(c)}
              className="px-3 py-1.5 rounded-full text-sm bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          点击分类查看语法参考
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => load(c)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              c === category
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {notes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          该分类暂无数据
        </p>
      )}

      <div className="flex flex-col gap-2">
        {notes.map((n, i) => (
          <button
            key={i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="text-left rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-foreground">{n.title || "语法注释"}</p>
              <span className="text-xs text-muted-foreground">
                Book {n.book_num} · L{n.lesson_num}
              </span>
            </div>
            {expanded === i && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">
                {n.body}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContentSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContentResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const typeLabel: Record<string, string> = {
    lexical_block: "词汇组",
    qa_block: "问答对",
    grammar_note: "语法注释",
  };

  function search() {
    if (!query.trim()) return;
    startTransition(async () => {
      try {
        const data = await searchContent({ query: query.trim(), limit: 10 });
        setResults(
          (data.results ?? []).map((r) => ({
            id: r.block_id,
            text: r.text,
            block_type: r.block_type,
            book_num: r.book_num,
            lesson_num: r.lesson_num,
            book_page: r.book_page,
          }))
        );
      } catch {
        setResults([]);
      }
      setSearched(true);
    });
  }

  return (
    <div>
      <Input
        placeholder="用中文或英文描述你想找的内容..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && search()}
        className="rounded-xl mb-1"
      />
      <p className="text-xs text-muted-foreground mb-3">
        例：怎么问东西在哪里 / how to ask where something is
      </p>
      <Button onClick={search} disabled={isPending} className="w-full rounded-xl mb-4">
        <Search className="w-4 h-4 mr-2" />
        {isPending ? "搜索中…" : "搜索教材原文"}
      </Button>

      {searched && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          没有找到相关内容
        </p>
      )}

      <div className="flex flex-col gap-3">
        {results.map((r, i) => (
          <Card key={i} className="rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {typeLabel[r.block_type] ?? r.block_type}
              </span>
              <span className="text-xs text-muted-foreground">
                Book {r.book_num} · L{r.lesson_num}
                {r.book_page ? ` · 第 ${r.book_page} 页` : ""}
              </span>
            </div>
            <p className="text-sm text-foreground line-clamp-3">{r.text}</p>
            <Button asChild size="sm" variant="ghost" className="mt-2 text-primary text-xs px-0">
              <Link href={`/protected/learn/${r.book_num}/${r.lesson_num}`}>
                <BookOpen className="w-3 h-3 mr-1" />
                去练习这课
              </Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
