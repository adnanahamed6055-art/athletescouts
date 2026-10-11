import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Grid3x3, Trophy } from "lucide-react";
import { DEMO_CLUBS, DEMO_KIND_LABEL, DEMO_PEOPLE, DEMO_TOURNAMENTS, demoPerson, demoPostsBy, demoBio } from "@/data/demo";
import { DemoPostCard } from "@/components/app/Demo";
import { ProfileHeader } from "@/components/app/ProfileHeader";
import { VerificationPill } from "@/components/app/VerificationPill";
import { DemoTag } from "@/components/app/Demo";
import { shareLink } from "@/components/app/Social";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/people/$id")({
  loader: ({ params }) => { const p = demoPerson(params.id); if (!p) throw notFound(); return { p }; },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.p.name} — AthleteScouts` : "Profile — AthleteScouts";
    const d = loaderData ? loaderData.p.headline : "Athlete, coach and scout profiles on AthleteScouts.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }] };
  },
  notFoundComponent: () => <p className="p-10 text-center text-muted-foreground">This profile doesn't exist.</p>,
  component: PersonPage,
});

function PersonPage() {
  const { p } = Route.useLoaderData();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<"posts" | "about">("posts");
  const posts = demoPostsBy(p.id);
  const seed = [...p.id].reduce((h, c) => h + c.charCodeAt(0), 0);
  const followingCount = 80 + (seed % 300);
  const club = DEMO_CLUBS.find((c) => c.sports.includes(p.sport)) ?? DEMO_CLUBS[seed % DEMO_CLUBS.length];
  const events = DEMO_TOURNAMENTS.filter((t) => t.sport === p.sport).slice(0, 3);
  const similar = DEMO_PEOPLE.filter((x) => x.id !== p.id && x.sport === p.sport).slice(0, 6);
  const stats = p.stats ?? (p.kind === "athlete" ? [{ label: "Sessions / week", value: String(4 + (seed % 4)) }, { label: "Matches (season)", value: String(10 + (seed % 15)) }] : p.kind === "coach" ? [{ label: "Years coaching", value: String(5 + (seed % 15)) }, { label: "Players developed", value: String(40 + (seed % 120)) }] : [{ label: "Players placed", value: String(12 + (seed % 40)) }, { label: "Events / year", value: String(15 + (seed % 25)) }]);

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-6">
      <ProfileHeader
        name={p.name}
        avatarUrl={p.image}
        coverUrl={p.image}
        roleLabel={<span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold">{DEMO_KIND_LABEL[p.kind]}</span>}
        sport={p.sport}
        position={p.position}
        extraLine={p.age ? `Age ${p.age}` : null}
        bio={p.headline}
        location={p.location}
        posts={posts.length}
        followers={p.followers + Number(following)}
        following={followingCount}
        isMe={false}
        isFollowing={following}
        onFollow={() => setFollowing(!following)}
        onMessage={() => navigate({ to: "/inbox", search: { with: p.id } })}
        onShare={() => shareLink(`/people/${p.id}`, p.name)}
        badge={p.verified ? <VerificationPill label={p.verifiedSchool ? `Verified by ${p.verifiedSchool}` : "Verified coach"} /> : null}
        chips={<DemoTag />}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] gap-3">{stats.map((s) => <div key={s.label} className="min-w-0 rounded-lg border border-border bg-card p-3"><div className="break-words font-display text-2xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>)}</div>

      {p.performanceContext && <p className="text-xs text-muted-foreground">{p.performanceContext}</p>}
      <div className="flex border-t border-border">{(["posts", "about"] as const).map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={cn("-mt-px flex flex-1 items-center justify-center gap-2 border-t-2 py-3 text-xs font-bold uppercase tracking-wider", tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground")}>{t === "posts" ? <Grid3x3 className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}{t}</button>)}</div>

      {tab === "posts" ? (posts.length ? <div className="space-y-6">{posts.map((post) => <DemoPostCard key={post.id} post={post} />)}</div> : <p className="py-10 text-center text-sm text-muted-foreground">No posts yet.</p>)
        : <div className="space-y-5 text-sm">
          <section><h2 className="mb-1 text-lg font-bold">About</h2><p className="text-muted-foreground">{demoBio(p)}</p></section>

          {events.length > 0 && <section><h2 className="mb-2 text-lg font-bold">Upcoming events</h2><ul className="space-y-2">{events.map((e) => <li key={e.id} className="rounded-lg border border-border bg-card p-3"><span className="block font-semibold">{e.name}</span><span className="text-xs text-muted-foreground">{e.dates} · {e.location}</span></li>)}</ul></section>}
          {similar.length > 0 && <section><h2 className="mb-2 text-lg font-bold">Similar profiles</h2><div className="grid grid-cols-3 gap-3 sm:grid-cols-6">{similar.map((x) => <Link key={x.id} to="/people/$id" params={{ id: x.id }} className="text-center"><img src={x.image} alt="" className="mx-auto h-16 w-16 rounded-full object-cover object-top" /><span className="mt-1 block truncate text-xs font-semibold">{x.name}</span></Link>)}</div></section>}
        </div>}
    </div>
  );
}
