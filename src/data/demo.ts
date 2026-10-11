import yousefBjj from "@/assets/yousef-bjj.jpg";
import yaraBasketball from "@/assets/yara-basketball.jpg";
import devMehtaPhoto from "@/assets/portrait-dev-mehta.jpg";
import arjunNairPhoto from "@/assets/portrait-arjun-nair.jpg";
import isaOmarPhoto from "@/assets/portrait-isa-omar.jpg";
import adisStriker from "@/assets/adis-striker.jpg";
import adisBowler from "@/assets/adis-bowler.jpg";
import adisPointGuard from "@/assets/adis-point-guard.jpg";
import studentSprinter from "@/assets/student-sprinter.jpg";
import studentSwimmer from "@/assets/student-swimmer.jpg";
import studentBadminton from "@/assets/student-badminton.jpg";
import swimClubPhoto from "@/assets/aquatic.jpg";
import padelClubPhoto from "@/assets/venue-padel.jpg";
import trackClubPhoto from "@/assets/demo-track.jpg";
import coach1 from "@/assets/coach-1.jpg";
import coach2 from "@/assets/coach-2.jpg";
import coach3 from "@/assets/coach-3.jpg";
import coach4 from "@/assets/coach-4.jpg";
import coach5 from "@/assets/coach-5.jpg";
import coach6 from "@/assets/coach-6.jpg";
import coach7 from "@/assets/coach-7.jpg";
import coach8 from "@/assets/coach-8.jpg";
import coach9 from "@/assets/coach-9.jpg";
import coach10 from "@/assets/coach-10.jpg";
import coach11 from "@/assets/coach-11.jpg";
import coach12 from "@/assets/coach-12.jpg";
import coach13 from "@/assets/coach-13.jpg";
import coach14 from "@/assets/coach-14.jpg";
import coach15 from "@/assets/coach-15.jpg";
import coach16 from "@/assets/coach-16.jpg";
import coach17 from "@/assets/coach-17.jpg";
import coach18 from "@/assets/coach-18.jpg";
import coach19 from "@/assets/coach-19.jpg";
import coach20 from "@/assets/coach-20.jpg";
import coach21 from "@/assets/coach-21.jpg";
import coach22 from "@/assets/coach-22.jpg";
import coach23 from "@/assets/coach-23.jpg";
import coach24 from "@/assets/coach-24.jpg";
import coach25 from "@/assets/coach-25.jpg";
import scout1 from "@/assets/scout-1.jpg";
import scout2 from "@/assets/scout-2.jpg";
import scout3 from "@/assets/scout-3.jpg";
import scout4 from "@/assets/scout-4.jpg";
import scout5 from "@/assets/scout-5.jpg";
import scout6 from "@/assets/scout-6.jpg";
import scout7 from "@/assets/scout-7.jpg";
import scout8 from "@/assets/scout-8.jpg";
import scout9 from "@/assets/scout-9.jpg";
import scout10 from "@/assets/scout-10.jpg";
import scout11 from "@/assets/scout-11.jpg";
import scout12 from "@/assets/scout-12.jpg";
import scout13 from "@/assets/scout-13.jpg";
import scout14 from "@/assets/scout-14.jpg";
import scout15 from "@/assets/scout-15.jpg";
import scout16 from "@/assets/scout-16.jpg";
import scout17 from "@/assets/scout-17.jpg";
import scout18 from "@/assets/scout-18.jpg";
import scout19 from "@/assets/scout-19.jpg";
import scout20 from "@/assets/scout-20.jpg";
import scout21 from "@/assets/scout-21.jpg";
import scout22 from "@/assets/scout-22.jpg";
import scout23 from "@/assets/scout-23.jpg";
import scout24 from "@/assets/scout-24.jpg";
import scout25 from "@/assets/scout-25.jpg";
import footballPhoto from "@/assets/demo-football.jpg";
import trackPhoto from "@/assets/demo-track.jpg";
import basketballPhoto from "@/assets/demo-basketball.jpg";
import bjjPhoto from "@/assets/demo-bjj.jpg";
import cricketPhoto from "@/assets/demo-cricket.jpg";
import stadiumPhoto from "@/assets/discover-stadium.jpg";
import trackReel from "@/assets/demo-track-reel.webm.asset.json";
/**
 * Sample content shown so the app feels active before real members join.
 * Showcase content so the app feels active before real members join.
 */

export type DemoKind = "athlete" | "coach" | "club" | "scout";

export interface DemoPerson {
  id: string;
  kind: DemoKind;
  name: string;
  sport: string;
  headline: string;
  location: string;
  followers: number;
  image?: string;
  age?: number;
  position?: string;
  stats?: { label: string; value: string }[];
  verified?: boolean;
  verifiedSchool?: string;
  performanceContext?: string;
}

export interface DemoClub {
  id: string;
  name: string;
  sports: string[];
  location: string;
  level: string;
  blurb: string;
  members: number;
  openTrials: number;
  image?: string;
  unofficial?: boolean;
}

export interface DemoTournament {
  id: string;
  name: string;
  sport: string;
  location: string;
  dates: string;
  ageGroup: string;
  format: string;
  teams: number;
  fee: string;
  deadline: string;
  image?: string;
}

export interface DemoPost {
  id: string;
  authorId: string;
  body: string;
  ago: string;
  likes: number;
  highlight?: boolean;
  image?: string;
  video?: string;
  alt?: string;
}

export const DEMO_PEOPLE: DemoPerson[] = [
  { id: "d-ath-1", kind: "athlete", name: "Omar Al Hammadi", sport: "Football", position: "Winger", age: 16, location: "Abu Dhabi", followers: 412, headline: "Left-footed winger, Abu Dhabi school football pathway", stats: [{ label: "40m sprint", value: "5.1s" }, { label: "Goals (season)", value: "14" }] },
  { id: "d-ath-2", kind: "athlete", name: "Aisha Rahman", sport: "Athletics", position: "400m", age: 17, location: "Dubai", followers: 288, headline: "400m runner chasing a GCC Youth medal", stats: [{ label: "400m PB", value: "56.8s" }, { label: "Beep test", value: "L12" }] },
  { id: "d-ath-3", kind: "athlete", name: "Rohan Menon", sport: "Cricket", position: "All-rounder", age: 15, location: "Sharjah", followers: 351, headline: "Right-arm medium pace, top-order bat", stats: [{ label: "Avg (bat)", value: "41.2" }, { label: "Wickets", value: "22" }] },
  { id: "d-ath-4", kind: "athlete", name: "Layla Haddad", sport: "Basketball", position: "Point guard", age: 18, location: "Dubai", followers: 197, headline: "Floor general, 7.1 assists per game", stats: [{ label: "Assists/g", value: "7.1" }, { label: "Vertical", value: "52cm" }] },
  { id: "d-ath-5", kind: "athlete", name: "Yousef Karim", sport: "Martial Arts", position: "BJJ -66kg", age: 19, location: "Al Ain", followers: 523, headline: "UAE Jiu-Jitsu national youth champion", stats: [{ label: "Record", value: "18–3" }, { label: "Belt", value: "Purple" }] },
  { id: "d-ath-6", kind: "athlete", name: "Mariam Saeed", sport: "Swimming", position: "200m Free", age: 14, location: "Abu Dhabi", followers: 164, headline: "Junior freestyle swimmer, early starter", stats: [{ label: "200m free", value: "2:14" }, { label: "Sessions/wk", value: "9" }] },
  { id: "d-coa-1", kind: "coach", name: "Coach Daniel Reyes", sport: "Football", location: "Abu Dhabi", followers: 640, verified: true, headline: "UEFA B licence · ADIS academy lead" },
  { id: "d-coa-2", kind: "coach", name: "Coach Fatima Noor", sport: "Athletics", location: "Dubai", followers: 302, verified: true, headline: "Sprint & hurdles coach, school PE head" },
  { id: "d-coa-3", kind: "coach", name: "Coach Imran Sheikh", sport: "Cricket", location: "Sharjah", followers: 455, headline: "Level 2 ECB coach, youth pathway" },
  { id: "d-sco-1", kind: "scout", name: "Khalid Mansour", sport: "Football", location: "GCC-wide", followers: 980, headline: "Youth recruitment, Pro League academy" },
  { id: "d-sco-2", kind: "scout", name: "Sara Lindqvist", sport: "Athletics", location: "UAE — Dubai", followers: 410, headline: "University scholarship recruiter (US/UK)" },
  { id: "d-sco-3", kind: "scout", name: "Vikram Joshi", sport: "Cricket", location: "UAE — Sharjah", followers: 377, headline: "Franchise talent ID, U-19 focus" },
];

export const DEMO_CLUBS: DemoClub[] = [
  { id: "d-club-1", name: "Capital Falcons Academy", sports: ["Football"], location: "Abu Dhabi — Khalifa City", level: "U-10 to U-18", blurb: "Elite youth football pathway with weekly match play.", members: 240, openTrials: 2 },
  { id: "d-club-2", name: "Desert Hawks Cricket Club", sports: ["Cricket"], location: "Sharjah — Al Qasimia", level: "U-13 to Senior", blurb: "Turf nets, bowling machines and league squads.", members: 180, openTrials: 1 },
  { id: "d-club-3", name: "Marina Track Collective", sports: ["Athletics"], location: "Dubai — Marina", level: "All levels", blurb: "Sprint, jumps and endurance groups on a 400m track.", members: 120, openTrials: 1 },
  { id: "d-club-4", name: "Oasis Grappling Lab", sports: ["Martial Arts", "BJJ"], location: "Al Ain — Al Jimi", level: "Kids to Adults", blurb: "Competition BJJ team with national-level coaching.", members: 95, openTrials: 0 },
  { id: "d-club-5", name: "Gulf Hoops Basketball", sports: ["Basketball"], location: "Dubai — Al Quoz", level: "U-12 to U-20", blurb: "FIBA hardwood courts, girls & boys programmes.", members: 150, openTrials: 1 },
];

export const DEMO_TOURNAMENTS: DemoTournament[] = [
  { id: "d-tour-1", name: "Abu Dhabi Youth Football Cup", sport: "Football", location: "Zayed Sports City, Abu Dhabi", dates: "14–16 Nov 2026", ageGroup: "U-14 / U-16", format: "Group stage + knockout", teams: 24, fee: "AED 1,200 / team", deadline: "31 Oct 2026" },
  { id: "d-tour-2", name: "Emirates Schools Cricket T20", sport: "Cricket", location: "Sharjah Cricket Stadium", dates: "5–8 Dec 2026", ageGroup: "U-17", format: "T20 round robin", teams: 12, fee: "AED 900 / team", deadline: "15 Nov 2026" },
  { id: "d-tour-3", name: "Dubai Junior Athletics Open", sport: "Athletics", location: "Dubai Police Stadium", dates: "21 Nov 2026", ageGroup: "U-15 / U-18", format: "Track & field events", teams: 0, fee: "AED 75 / athlete", deadline: "10 Nov 2026" },
  { id: "d-tour-4", name: "GCC Youth Jiu-Jitsu Series", sport: "Martial Arts", location: "Mubadala Arena, Abu Dhabi", dates: "12 Dec 2026", ageGroup: "U-18", format: "Weight-class brackets", teams: 0, fee: "AED 150 / athlete", deadline: "30 Nov 2026" },
  { id: "d-tour-5", name: "3x3 Hoops Winter League", sport: "Basketball", location: "Kite Beach, Dubai", dates: "Jan–Feb 2027 (Fridays)", ageGroup: "U-18 / U-21", format: "3x3 league", teams: 16, fee: "AED 400 / team", deadline: "20 Dec 2026" },
  { id: "d-tour-6", name: "Al Ain Padel Juniors", sport: "Padel", location: "Hili Padel Club, Al Ain", dates: "28–29 Nov 2026", ageGroup: "U-16", format: "Doubles knockout", teams: 32, fee: "AED 200 / pair", deadline: "18 Nov 2026" },
];

export const DEMO_POSTS: DemoPost[] = [
  { id: "d-post-1", image: footballPhoto, alt: "Football training on a UAE pitch", authorId: "d-ath-1", body: "Brace in the ADIS derby today ⚽⚽ Big thanks to the coaches for the extra finishing sessions. #ADIS #U16", ago: "2h", likes: 86, highlight: true },
  { id: "d-post-2", authorId: "d-coa-1", body: "Open trial for U-14 and U-16 goalkeepers next Saturday at Khalifa City. Bring boots and gloves, we'll handle the rest. #trials", ago: "4h", likes: 41 },
  { id: "d-post-3", image: trackPhoto, video: trackReel.url, alt: "Sprint training on the track", authorId: "d-ath-2", body: "New 400m PB — 56.8s! Two-tenths away from the GCC Youth standard 🏃‍♀️ #athletics", ago: "6h", likes: 112, highlight: true },
  { id: "d-post-4", authorId: "d-sco-1", body: "Looking at wide players born 2009–2010 in Abu Dhabi and Al Ain. Keep your Passport stats verified — that's what I filter by first.", ago: "9h", likes: 67 },
  { id: "d-post-5", image: bjjPhoto, alt: "Jiu-jitsu training at an academy", authorId: "d-ath-5", body: "Gold at the national youth championship 🥇 Three submissions, one decision. On to the GCC Series in December. #BJJ", ago: "1d", likes: 154, highlight: true },
  { id: "d-post-6", image: cricketPhoto, alt: "Cricket batting practice", authorId: "d-ath-3", body: "4-for-18 and a quick 36 in the league final. Team won by 22 runs 🏏 #cricket", ago: "1d", likes: 73 },
  { id: "d-post-7", authorId: "d-coa-2", body: "Reminder for my sprint group: block starts and 3×60m flying tomorrow 6am. Hydrate tonight!", ago: "2d", likes: 29 },
  { id: "d-post-8", image: basketballPhoto, alt: "Basketball shooting practice", authorId: "d-ath-4", body: "Summer camp done — 12 days, 2 sessions a day. Handle and shooting feel completely different. #basketball", ago: "3d", likes: 58 },
];

export const DEMO_KIND_LABEL: Record<DemoKind, string> = { athlete: "Athlete", coach: "Coach", club: "Club", scout: "Scout" };

export const demoPerson = (id: string) => DEMO_PEOPLE.find((p) => p.id === id);

export const initials = (name: string) =>
  name.replace(/^Coach\s+/, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const photos = [footballPhoto, trackPhoto, cricketPhoto, basketballPhoto, bjjPhoto];
const sports = ["Football", "Athletics", "Cricket", "Basketball", "Martial Arts"];
const cities = ["Abu Dhabi", "Dubai", "Sharjah", "Al Ain", "Ras Al Khaimah"];
const athleteNames = ["Zain Abdullah", "Noura Khalil", "Arjun Nair", "Sofia Malik", "Adam Hassan", "Hana Saleh", "Kabir Patel", "Leila Faris", "Isa Omar", "Maya Thomas", "Tariq Rashid", "Rania Ali", "Dev Mehta", "Amira Zayed", "Samir Adel", "Noor Hamdan", "Ibrahim Aziz", "Lina Saad", "Yara Salem"];
const coachNames = ["Ahmed Nasser", "Elena Costa", "Raj Kapoor", "Marcus Cole", "Luca Romano", "Grace Okafor", "Yassin Farouk", "Sophie Martin", "Adil Khan", "Kenji Mori", "Oliver Grant", "Samuel Diallo", "Huda Mansoor", "Diego Silva", "Joseph Mensah", "Priya Sharma", "Thomas Weber", "Kwame Asante", "Isabel Ruiz", "Faisal Hamid", "James Evans", "Zara Williams"];
const scoutNames = ["Omar Nasser", "Anika Rao", "Michael Reed", "David Okoye", "Salma Khalid", "Julian Costa", "Nia Mensah", "Hassan Idris", "Emma Laurent", "Rehan Malik", "Daniel Brooks", "Ana Pereira", "Peter Shaw", "Ravi Desai", "Jade Thompson", "Fahad Ali", "Ben Turner", "Mona Karim", "Eric Grant", "Alice Moreau", "Sanjay Shah", "Robert Hayes"];
const coachPhotos = [coach1,coach2,coach3,coach4,coach5,coach6,coach7,coach8,coach9,coach10,coach11,coach12,coach13,coach14,coach15,coach16,coach17,coach18,coach19,coach20,coach21,coach22,coach23,coach24,coach25];
const scoutPhotos = [scout1,scout2,scout3,scout4,scout5,scout6,scout7,scout8,scout9,scout10,scout11,scout12,scout13,scout14,scout15,scout16,scout17,scout18,scout19,scout20,scout21,scout22,scout23,scout24,scout25];

athleteNames.forEach((name,i) => DEMO_PEOPLE.push({id:`d-ath-${i+7}`,name,kind:"athlete",sport:sports[i%5] ?? "Football",location:cities[i%5] ?? "Dubai",followers:140+i*31,age:16+i%5,headline:"Youth pathway · Building the next chapter",image:photos[i%5] ?? footballPhoto}));
coachNames.forEach((name,i) => DEMO_PEOPLE.push({id:`d-coa-${i+4}`,name:`Coach ${name}`,kind:"coach",sport:sports[i%5] ?? "Football",location:cities[i%5] ?? "Dubai",followers:240+i*43,headline:"Player development · Academy coaching",image:coachPhotos[i+3] ?? coach1}));
scoutNames.forEach((name,i) => DEMO_PEOPLE.push({id:`d-sco-${i+4}`,name,kind:"scout",sport:sports[i%5] ?? "Football",location:cities[i%5] ?? "Dubai",followers:320+i*53,headline:"Youth talent identification · GCC pathways",image:scoutPhotos[i+3] ?? scout1}));
// Explicit portrait assignments keep names and roles stable when entries are added.
const COACH_PORTRAITS = [21, 13, 3, 1, 2, 7, 4, 5, 6, 9, 8, 20, 10, 11, 12, 15, 14, 18, 16, 17, 23, 19, 24, 22, 25];
const coaches = DEMO_PEOPLE.filter((p) => p.kind === "coach");
coaches.forEach((p, i) => { 
  const photoNum = COACH_PORTRAITS[i] ?? 1;
  const image = coachPhotos[photoNum - 1];
  if (image) p.image = image;
  const sportIdx = (photoNum - 1) % 5;
  p.sport = sports[sportIdx] ?? "Football";
  p.headline = `${p.sport} coach · Youth player development`;
});
DEMO_PEOPLE.filter((p) => p.kind === "scout").forEach((p, i) => { 
  const image = scoutPhotos[i % scoutPhotos.length];
  if (image) p.image = image;
  const sportIdx = i % 5;
  p.sport = sports[sportIdx] ?? "Football";
  p.headline = `${p.sport} Scout · Talent identification & recruitment`;
});

const SPECIAL_SPORT: Record<string, string> = { "Gulf Swim Academy": "Swimming", "Emirates Padel Collective": "Padel", "Capital Athletics Club": "Athletics" };
const SPECIAL_IMG: Record<string, string> = { "Gulf Swim Academy": swimClubPhoto, "Emirates Padel Collective": padelClubPhoto, "Capital Athletics Club": trackClubPhoto };
const clubNames = ["FC Barcelona", "Real Madrid CF", "Manchester City", "Liverpool FC", "Arsenal FC", "Paris Saint-Germain", "Bayern Munich", "AC Milan", "Inter Milan", "Juventus", "Borussia Dortmund", "Ajax", "Benfica", "Sporting CP", "Atlético Madrid", "Al Ain FC", "Baniyas Club", "Gulf Swim Academy", "Emirates Padel Collective", "Capital Athletics Club"];
clubNames.forEach((name,i) => DEMO_CLUBS.push({id:`d-club-${i+6}`,name,sports:i<17?["Football"]:[SPECIAL_SPORT[name] ?? "Football"],location:i<15?"International":cities[i%5] ?? "Dubai",level:"Youth & academy",blurb:i<17?"An unofficial showcase of youth development and club pathways. Not an affiliated club account.":"Training, competition and a community built around sport.",members:380+i*83,openTrials:0,image:i<17?stadiumPhoto:(SPECIAL_IMG[name] ?? footballPhoto),unofficial:i<17}));
DEMO_CLUBS.forEach((c) => {if(!c.image) c.image=c.sports.includes("Football") ? footballPhoto : c.sports.includes("Cricket") ? cricketPhoto : c.sports.includes("Athletics") ? trackPhoto : c.sports.includes("Basketball") ? basketballPhoto : bjjPhoto;});
const eventNames=["Capital Youth Invitational", "Emirates Academy Cup", "Marina Sprint Classic", "Desert Cricket Challenge", "Gulf Hoops Invitational", "Oasis Grappling Open", "Khalifa Youth Games", "Dubai Schools Championship", "Sharjah Rising Stars Cup", "Al Ain Track Meet", "GCC Academy Showcase", "Coastal Basketball Classic", "National Junior Challenge", "Palm Padel Invitational", "Capital Cricket Trophy", "Emirates Winter Games", "Falcon Football Festival", "UAE Youth Sports Cup", "Gulf Future Champions"];
eventNames.forEach((name,i) => DEMO_TOURNAMENTS.push({id:`d-tour-${i+7}`,name,sport:sports[(i+3)%5] ?? "Football",location:cities[i%5] ?? "Dubai",dates:`${12+i%15} Dec 2026`,ageGroup:i%2?"U-18":"U-16",format:i%2?"Knockout":"Round robin",teams:16,fee:"Invitation",deadline:"1 Dec 2026",image:photos[i%5] ?? footballPhoto}));
DEMO_TOURNAMENTS.forEach((t) => {if(!t.image)t.image=t.sport === "Football" ? footballPhoto : t.sport === "Cricket" ? cricketPhoto : t.sport === "Athletics" ? trackPhoto : t.sport === "Basketball" ? basketballPhoto : bjjPhoto;});

// Unique photography per profile: one image each for athletes, clubs and tournaments (no repeats).
const pick = (glob: Record<string, { default: string }>, prefix: string) =>
  Object.entries(glob).map(([k, m]) => [Number(k.match(new RegExp(`${prefix}-(\\d+)\\.jpg$`))?.[1] ?? 0), m.default] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
const ATHLETE_PHOTOS = pick(import.meta.glob<{ default: string }>("@/assets/athlete-*.jpg", { eager: true }), "athlete");
const CLUB_PHOTOS = pick(import.meta.glob<{ default: string }>("@/assets/club-*.jpg", { eager: true }), "club");
const TOUR_PHOTOS = pick(import.meta.glob<{ default: string }>("@/assets/tour-*.jpg", { eager: true }), "tour");
const ATHLETE_ASSIGNMENTS: { photo: number; sport: string; position: string }[] = [
  { photo: 1, sport: "Football", position: "Winger" }, { photo: 2, sport: "Athletics", position: "400m" },
  { photo: 3, sport: "Cricket", position: "All-rounder" }, { photo: 15, sport: "Basketball", position: "Point guard" },
  { photo: 11, sport: "Football", position: "Striker" }, { photo: 5, sport: "Swimming", position: "200m freestyle" },
  { photo: 7, sport: "Tennis", position: "Singles" }, { photo: 8, sport: "Athletics", position: "100m" },
  { photo: 0, sport: "Cricket", position: "Fast bowler" }, { photo: 10, sport: "Tennis", position: "Singles" },
  { photo: 14, sport: "Football", position: "Defender" }, { photo: 6, sport: "Martial Arts", position: "Judo" },
  { photo: 16, sport: "Cricket", position: "Batter" }, { photo: 21, sport: "Athletics", position: "400m" },
  { photo: 0, sport: "Swimming", position: "100m freestyle" }, { photo: 17, sport: "Tennis", position: "Singles" },
  { photo: 18, sport: "Athletics", position: "100m" }, { photo: 19, sport: "Martial Arts", position: "Taekwondo" },
  { photo: 0, sport: "Cricket", position: "Batter" }, { photo: 13, sport: "Athletics", position: "800m" },
  { photo: 20, sport: "Football", position: "Striker" }, { photo: 25, sport: "Swimming", position: "100m backstroke" },
  { photo: 24, sport: "Basketball", position: "Shooting guard" }, { photo: 23, sport: "Tennis", position: "Singles" },
  { photo: 4, sport: "Basketball", position: "Small forward" },
];
DEMO_PEOPLE.filter((p) => p.kind === "athlete").forEach((p, i) => {
  const assignment = ATHLETE_ASSIGNMENTS[i];
  if (!assignment) return;
  const img = ATHLETE_PHOTOS[assignment.photo - 1];
  if (img) p.image = img;
  const changedSport = p.sport !== assignment.sport;
  p.sport = assignment.sport; p.position = assignment.position;
  if (changedSport) delete p.stats;
  if (i >= 6 || changedSport) p.headline = `${p.position} · ${p.location} youth development pathway`;
});
const yousef = DEMO_PEOPLE.find((p) => p.id === "d-ath-5");
if (yousef) { yousef.image = yousefBjj; yousef.sport = "Martial Arts"; yousef.position = "BJJ -66kg"; yousef.headline = "Abu Dhabi youth BJJ competitor · Purple belt"; yousef.stats = [{ label: "Competition record", value: "18–3" }, { label: "Belt", value: "Purple" }]; }
const yara = DEMO_PEOPLE.find((p) => p.id === "d-ath-25");
if (yara) yara.image = yaraBasketball;
// Dedicated portraits (photo: 0 above) where no shared portrait matched the athlete's identity.
const DEDICATED_PORTRAITS: Record<string, string> = { "d-ath-9": arjunNairPhoto, "d-ath-15": isaOmarPhoto, "d-ath-19": devMehtaPhoto };
DEMO_PEOPLE.forEach((p) => { const img = DEDICATED_PORTRAITS[p.id]; if (img) p.image = img; });
// Every athlete gets sport-appropriate, illustrative metrics so profiles never render empty.
const SPORT_METRICS: Record<string, (n: number) => { label: string; value: string }[]> = {
  Football: (n) => [{ label: "Season goals", value: String(4 + (n % 9)) }, { label: "30m sprint", value: `${(4.3 + (n % 5) / 10).toFixed(2)} s` }],
  Athletics: (n) => [{ label: "Personal best", value: `${(12.6 + (n % 7) / 10).toFixed(2)} s (100m)` }, { label: "School meets", value: String(3 + (n % 5)) }],
  Cricket: (n) => [{ label: "Season runs", value: String(180 + (n % 7) * 24) }, { label: "Wickets", value: String(6 + (n % 9)) }],
  Basketball: (n) => [{ label: "Points / game", value: (8 + (n % 9) * 0.7).toFixed(1) }, { label: "Assists / game", value: (2 + (n % 5) * 0.6).toFixed(1) }],
  Swimming: (n) => [{ label: "100m freestyle", value: `1:0${2 + (n % 7)}.${10 + (n * 7) % 80}` }, { label: "Sessions / week", value: String(6 + (n % 4)) }],
  Tennis: (n) => [{ label: "Match record", value: `${9 + (n % 6)}–${2 + (n % 4)}` }, { label: "First-serve %", value: `${58 + (n % 12)}%` }],
  "Martial Arts": (n) => [{ label: "Competition record", value: `${8 + (n % 7)}–${1 + (n % 3)}` }, { label: "Medals (season)", value: String(2 + (n % 4)) }],
};
DEMO_PEOPLE.forEach((p, n) => { if (p.kind === "athlete" && !p.stats?.length) { const m = SPORT_METRICS[p.sport]?.(n); if (m) p.stats = m; } });
// Fictional student showcases, not real school endorsements or member records.
DEMO_PEOPLE.push(
  { id: "d-adis-striker", kind: "athlete", name: "Aarav Krishnan", sport: "Football", position: "Striker", age: 15, location: "Abu Dhabi", followers: 368, image: adisStriker, verified: true, verifiedSchool: "Abu Dhabi Indian School", headline: "ADIS U16 striker · Quick movement and composed finishing", performanceContext: "Illustrative 2025–26 Abu Dhabi inter-school season · 16 matches", stats: [{ label: "Season goals", value: "18" }, { label: "Season assists", value: "6" }, { label: "30m sprint", value: "4.35 s" }, { label: "Shot accuracy", value: "62%" }] },
  { id: "d-adis-bowler", kind: "athlete", name: "Rishabh Pillai", sport: "Cricket", position: "Fast bowler", age: 17, location: "Abu Dhabi", followers: 342, image: adisBowler, verified: true, verifiedSchool: "Abu Dhabi Indian School", headline: "ADIS U19 right-arm fast bowler · New-ball swing and yorkers", performanceContext: "Illustrative 2025–26 Abu Dhabi school T20 season · 12 matches", stats: [{ label: "Season wickets", value: "24" }, { label: "Top bowling speed", value: "118 km/h" }, { label: "Economy rate", value: "5.8 runs/ov" }, { label: "Best figures", value: "4/18" }] },
  { id: "d-adis-point-guard", kind: "athlete", name: "Diya Nair", sport: "Basketball", position: "Point guard", age: 13, location: "Abu Dhabi", followers: 276, image: adisPointGuard, verified: true, verifiedSchool: "Abu Dhabi Indian School", headline: "ADIS U14 point guard · Court vision and confident ball handling", performanceContext: "Illustrative 2025–26 Abu Dhabi inter-school season · 14 games", stats: [{ label: "Points / game", value: "12.4" }, { label: "Assists / game", value: "5.6" }, { label: "Steals / game", value: "2.3" }, { label: "Free throws", value: "74%" }] },
);
DEMO_PEOPLE.push(
  { id: "d-adis-sprinter", kind: "athlete", name: "Mariam Al Mansoori", sport: "Athletics", position: "100m / 200m sprinter", age: 16, location: "Abu Dhabi", followers: 284, image: studentSprinter, verified: true, verifiedSchool: "Abu Dhabi Indian School", headline: "ADIS U19 sprinter · Sprint mechanics and relay teamwork", performanceContext: "Illustrative 2025–26 Abu Dhabi inter-school track season · Electronic timing", stats: [{ label: "100m personal best", value: "13.24 s" }, { label: "200m personal best", value: "27.18 s" }, { label: "4 × 100m team best", value: "54.60 s" }, { label: "School meets", value: "6" }] },
  { id: "d-adis-swimmer", kind: "athlete", name: "Ishaan Menon", sport: "Swimming", position: "50m / 100m freestyle", age: 15, location: "Abu Dhabi", followers: 231, image: studentSwimmer, verified: true, verifiedSchool: "Abu Dhabi Indian School", headline: "ADIS U16 freestyle swimmer · Starts, turns and sprint endurance", performanceContext: "Illustrative 2025–26 Abu Dhabi school swim season · 25m short-course pool", stats: [{ label: "50m freestyle best", value: "28.42 s" }, { label: "100m freestyle best", value: "1:03.85" }, { label: "100m backstroke best", value: "1:12.40" }, { label: "School meets", value: "5" }] },
  { id: "d-adis-badminton", kind: "athlete", name: "Ananya Suresh", sport: "Badminton", position: "Singles / doubles", age: 13, location: "Abu Dhabi", followers: 208, image: studentBadminton, verified: true, verifiedSchool: "Abu Dhabi Indian School", headline: "ADIS U14 badminton player · Footwork and controlled net play", performanceContext: "Illustrative 2025–26 Abu Dhabi inter-school badminton season · 16 singles matches", stats: [{ label: "Singles wins", value: "11 / 16" }, { label: "Singles win rate", value: "68.8%" }, { label: "Doubles wins", value: "7 / 10" }, { label: "School tournaments", value: "4" }] },
);
const FB_PHOTOS = pick(import.meta.glob<{ default: string }>("@/assets/fbvenue-*.jpg", { eager: true }), "fbvenue");
// Sport-matched venue photo per club: football clubs each get their own football venue; others use their sport's venue.
const SPORT_VENUE: Record<string, number> = { Cricket: 8, Athletics: 7, "Martial Arts": 10, BJJ: 10, Basketball: 9, Swimming: 4, Padel: 5, Tennis: 6 };
const FB_ORDER = [1, 2, 4, 7, 11, 12, 3, 8, 14, 15, 16, 18, 19, 9, 6, 10, 13, 20, 21, 22, 23, 24, 25, 5, 17];
let fb = 0;
DEMO_CLUBS.forEach((c) => {
  if (SPECIAL_IMG[c.name]) return;
  const sp = c.sports[0] ?? "Football";
  const img = sp === "Football" ? FB_PHOTOS[(FB_ORDER[fb++ % FB_ORDER.length] ?? 1) - 1] : CLUB_PHOTOS[(SPORT_VENUE[sp] ?? 18) - 1];
  if (img) c.image = img;
});
DEMO_TOURNAMENTS.forEach((t, i) => { const img = TOUR_PHOTOS[i % TOUR_PHOTOS.length]; if (img) t.image = img; });

// Extra community posts so profiles, feed and reels have more varied media.
const EXTRA_CAPTIONS = ["Match day ready 🔥", "Final whistle — proud of this squad 🏆", "Morning session done before sunrise ☀️", "New PB unlocked 💪", "Tournament weekend recap 🎥", "Grateful for this team ❤️", "Hard work in the heat pays off", "Back on the podium 🥇", "Scouting trip highlights 👀", "Academy open day — great turnout!", "Recovery day: mobility + ice bath 🧊", "One more week until trials ⏳"];
TOUR_PHOTOS.slice(0, 12).forEach((img, i) => {
  // Credit each photo to an athlete whose sport matches the tournament it was made for.
  const sport = DEMO_TOURNAMENTS[i]?.sport;
  const pool = DEMO_PEOPLE.filter((p) => p.kind === "athlete" && p.sport === sport);
  const author = pool.length ? pool[i % pool.length] : DEMO_PEOPLE[(i * 5 + 3) % DEMO_PEOPLE.length];
  if (!author) return;
  DEMO_POSTS.push({ id: `d-post-x${i}`, image: img, alt: `${author.sport} action`, authorId: author.id, body: `${EXTRA_CAPTIONS[i]} #${author.sport.replace(/\s/g, "")}`, ago: `${i + 2}d`, likes: 40 + ((i * 37) % 180), highlight: i % 4 === 0 });
});

export const demoClub = (id: string) => DEMO_CLUBS.find((c) => c.id === id);
export const demoPostsBy = (id: string) => DEMO_POSTS.filter((p) => p.authorId === id);

/** Seeded conversations between the signed-in member ("me") and showcase profiles. */
export type DemoChatLine = { from: "me" | "them"; text: string; at: string };
export const DEMO_CHATS: Record<string, DemoChatLine[]> = {
  "d-coa-1": [
    { from: "them", text: "Hi! Saw your highlight reel — your first touch under pressure is really good.", at: "Mon 18:02" },
    { from: "me", text: "Thank you coach! I've been working on it every session.", at: "Mon 18:10" },
    { from: "them", text: "We're running U-16 trials at Khalifa City this Saturday, 4pm. Want me to put your name down?", at: "Mon 18:12" },
    { from: "me", text: "Yes please! Should I bring anything?", at: "Mon 18:15" },
    { from: "them", text: "Boots, shin pads and water. Arrive 20 minutes early for the warm-up 👍", at: "Mon 18:16" },
  ],
  "d-coa-2": [
    { from: "them", text: "Great 60m splits in your last upload. What's your current 100m time?", at: "Tue 07:40" },
    { from: "me", text: "12.1 hand-timed, hoping to get under 12 this season.", at: "Tue 08:05" },
    { from: "them", text: "Very doable. Join my block-start group Thursday 6am at Dubai Police Stadium.", at: "Tue 08:07" },
  ],
  "d-coa-3": [
    { from: "me", text: "Hi coach, are there still spots in the U-17 nets programme?", at: "Wed 16:20" },
    { from: "them", text: "Two spots left. Sessions are Sun/Tue/Thu evenings in Sharjah.", at: "Wed 16:31" },
    { from: "them", text: "Send me a clip of your bowling action and I'll take a look.", at: "Wed 16:32" },
  ],
  "d-ath-1": [
    { from: "them", text: "Bro are you going to the Abu Dhabi Youth Cup?", at: "Yesterday" },
    { from: "me", text: "Yeah our academy entered! You?", at: "Yesterday" },
    { from: "them", text: "Same 🔥 see you there. Let's train together this week?", at: "Yesterday" },
  ],
  "d-ath-2": [
    { from: "me", text: "Congrats on the 400m PB!! 56.8 is crazy", at: "Today 09:12" },
    { from: "them", text: "Thank you 😭 coach Fatima's sessions are paying off. You should join!", at: "Today 09:20" },
  ],
  "d-ath-5": [
    { from: "them", text: "Thanks for the follow! Do you train BJJ too?", at: "Sat" },
    { from: "me", text: "Just started — white belt, 3 months in 😅", at: "Sat" },
    { from: "them", text: "Best time to start. Open mat at Oasis Grappling Lab on Fridays, come through.", at: "Sat" },
  ],
  "d-sco-1": [
    { from: "them", text: "Hello, I'm scouting wide players born 2009–2010. Is your Passport up to date?", at: "Thu 12:00" },
    { from: "me", text: "Yes, I added my sprint and match stats last week.", at: "Thu 12:30" },
    { from: "them", text: "Perfect. I'll be at your next league game — good luck!", at: "Thu 12:34" },
  ],
};

export function demoBio(p: DemoPerson) {
  if (p.kind === "athlete") return `${p.name} is a ${p.position?.toLowerCase() ?? "student-athlete"} focused on ${p.sport.toLowerCase()} in ${p.location}.${p.verifiedSchool ? ` School: ${p.verifiedSchool}.` : ""} Open to youth development and academy trials.`;
  if (p.kind === "coach") return `${p.name} focuses on ${p.sport.toLowerCase()} player development in ${p.location}. ${p.headline}.`;
  if (p.kind === "scout") return `${p.name} scouts ${p.sport.toLowerCase()} talent in ${p.location}. ${p.headline}.`;
  return p.headline;
}

/** Problems that make a showcase athlete incoherent (missing photo, sport, metrics, or a post credited to a missing profile). */
export function demoIdentityIssues(): string[] {
  const issues: string[] = [];
  DEMO_PEOPLE.filter((p) => p.kind === "athlete").forEach((p) => {
    if (!p.image) issues.push(`${p.id}: missing photo`);
    if (!p.sport || !p.position) issues.push(`${p.id}: missing sport or position`);
    if (p.age == null || !p.location) issues.push(`${p.id}: missing age or city`);
    if (!p.headline || !p.stats?.length) issues.push(`${p.id}: missing bio or metrics`);
  });
  DEMO_POSTS.forEach((post) => { if (!demoPerson(post.authorId)) issues.push(`${post.id}: author ${post.authorId} not found`); });
  return issues;
}
if (import.meta.env.DEV) demoIdentityIssues().forEach((m) => console.warn(`[showcase data] ${m}`));
