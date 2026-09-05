import type { FidePlayer } from "./types";

/** Last-known snapshot so the register still paints if Lichess is slow. */
export const SEED_PLAYERS: FidePlayer[] = [
  { id: 1503014, name: "Carlsen, Magnus", federation: "NOR", year: 1990, title: "GM", standard: 2823, rapid: 2803, blitz: 2860, gender: "M" },
  { id: 2016192, name: "Nakamura, Hikaru", federation: "USA", year: 1987, title: "GM", standard: 2792, rapid: 2740, blitz: 2850, gender: "M" },
  { id: 2020009, name: "Caruana, Fabiano", federation: "USA", year: 1992, title: "GM", standard: 2789, rapid: 2760, blitz: 2800, gender: "M" },
  { id: 14205483, name: "Sindarov, Javokhir", federation: "UZB", year: 2005, title: "GM", standard: 2778, rapid: 2700, blitz: 2680, gender: "M" },
  { id: 5202213, name: "So, Wesley", federation: "USA", year: 1993, title: "GM", standard: 2774, rapid: 2740, blitz: 2760, gender: "M" },
  { id: 12940690, name: "Keymer, Vincent", federation: "GER", year: 2004, title: "GM", standard: 2764, rapid: 2720, blitz: 2700, gender: "M" },
  { id: 14204118, name: "Abdusattorov, Nodirbek", federation: "UZB", year: 2004, title: "GM", standard: 2762, rapid: 2740, blitz: 2730, gender: "M" },
  { id: 25059530, name: "Praggnanandhaa R", federation: "IND", year: 2005, title: "GM", standard: 2761, rapid: 2710, blitz: 2700, gender: "M" },
  { id: 35009192, name: "Erigaisi Arjun", federation: "IND", year: 2003, title: "GM", standard: 2759, rapid: 2700, blitz: 2720, gender: "M" },
  { id: 12573981, name: "Firouzja, Alireza", federation: "FRA", year: 2003, title: "GM", standard: 2757, rapid: 2740, blitz: 2810, gender: "M" },
  { id: 24116068, name: "Giri, Anish", federation: "NED", year: 1994, title: "GM", standard: 2757, rapid: 2700, blitz: 2730, gender: "M" },
  { id: 8603405, name: "Wei, Yi", federation: "CHN", year: 1999, title: "GM", standard: 2752, rapid: 2700, blitz: 2680, gender: "M" },
  { id: 1170546, name: "Duda, Jan-Krzysztof", federation: "POL", year: 1998, title: "GM", standard: 2743, rapid: 2730, blitz: 2760, gender: "M" },
  { id: 5000017, name: "Anand, Viswanathan", federation: "IND", year: 1969, title: "GM", standard: 2739, rapid: 2720, blitz: 2730, gender: "M" },
  { id: 8603677, name: "Ding, Liren", federation: "CHN", year: 1992, title: "GM", standard: 2733, rapid: 2730, blitz: 2760, gender: "M" },
  { id: 46616543, name: "Gukesh D", federation: "IND", year: 2006, title: "GM", standard: 2703, rapid: 2650, blitz: 2650, gender: "M" },
  { id: 8602980, name: "Hou, Yifan", federation: "CHN", year: 1994, title: "GM", standard: 2596, rapid: 2580, blitz: 2560, gender: "F" },
  { id: 8603006, name: "Ju, Wenjun", federation: "CHN", year: 1991, title: "GM", standard: 2553, rapid: 2540, blitz: 2500, gender: "F" },
  { id: 8605114, name: "Lei, Tingjie", federation: "CHN", year: 1997, title: "GM", standard: 2552, rapid: 2500, blitz: 2480, gender: "F" },
  { id: 700070, name: "Polgar, Judit", federation: "HUN", year: 1976, title: "GM", standard: 2675, rapid: 2646, blitz: 2680, gender: "F" },
];
