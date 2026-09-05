export type TimeControl = "standard" | "rapid" | "blitz";

export type RegisterList = "classical" | "rapid" | "blitz" | "women" | "online";

export type FidePlayer = {
  id: number;
  name: string;
  federation: string;
  year: number | null;
  title: string | null;
  standard: number | null;
  rapid: number | null;
  blitz: number | null;
  gender: "M" | "F" | "O" | null;
  inactive?: boolean;
  photo?: { small?: string; medium?: string; credit?: string } | null;
};

export type RegisterRow = FidePlayer & {
  age: number | null;
  club: boolean;
};

export type LiveRegister = {
  source: "live" | "seed" | "mixed";
  fetchedAt: string;
  players: RegisterRow[];
  clubCount: number;
  numberOne: RegisterRow | null;
};

export type RatingPoint = {
  period: string;
  year: number;
  month: number;
  rating: number;
};

export type PlayerDossier = {
  player: RegisterRow;
  history: {
    standard: RatingPoint[];
    rapid: RatingPoint[];
    blitz: RatingPoint[];
  };
  peak: { standard: number | null; rapid: number | null; blitz: number | null };
  delta12m: { standard: number | null; rapid: number | null; blitz: number | null };
  lastChange: { standard: number | null; rapid: number | null; blitz: number | null };
};

export type BroadcastCard = {
  id: string;
  name: string;
  url: string;
  location: string | null;
  format: string | null;
  timeControl: string | null;
  image: string | null;
  dates: number[] | null;
  roundName: string | null;
  roundUrl: string | null;
};

export type OnlineBoard = {
  rank: number;
  username: string;
  title: string | null;
  rating: number;
  country: string | null;
};

export type OnlineRegister = {
  fetchedAt: string;
  blitz: OnlineBoard[];
  rapid: OnlineBoard[];
  bullet: OnlineBoard[];
};
