// KnitCult search aliases — maps user shorthand & nicknames to canonical brand/player terms.
// Keys are lower-case tokens users are likely to type. Values are additional terms to also match against.
export const SEARCH_ALIASES = {
  // Clubs
  "barca": ["barcelona"],
  "barça": ["barcelona"],
  "fcb": ["barcelona"],
  "blaugrana": ["barcelona"],
  "rmd": ["real madrid"],
  "rm": ["real madrid"],
  "real": ["real madrid"],
  "madrid": ["real madrid"],
  "los blancos": ["real madrid"],
  "man u": ["manchester united"],
  "manu": ["manchester united"],
  "mufc": ["manchester united"],
  "utd": ["manchester united"],
  "united": ["manchester united"],
  "red devils": ["manchester united"],
  "mcfc": ["manchester city"],
  "city": ["manchester city"],
  "citizens": ["manchester city"],
  "afc": ["arsenal"],
  "gunners": ["arsenal"],
  "arse": ["arsenal"],
  "invincibles": ["arsenal", "henry"],
  "lfc": ["liverpool"],
  "reds": ["liverpool"],
  "istanbul": ["liverpool", "gerrard"],
  "cfc": ["chelsea"],
  "blues": ["chelsea"],
  "thfc": ["tottenham", "spurs"],
  "spurs": ["tottenham"],
  "juve": ["juventus"],
  "bianconeri": ["juventus"],
  "milan": ["ac milan"],
  "acm": ["ac milan"],
  "rossoneri": ["ac milan"],
  "inter": ["internazionale"],
  "nerazzurri": ["inter"],
  "psg": ["paris saint germain", "paris"],
  "bayern": ["bayern munich", "fcb"],
  "die roten": ["bayern"],
  "boro": ["borussia dortmund", "dortmund"],
  "bvb": ["borussia dortmund", "dortmund"],
  "atleti": ["atletico madrid", "atletico"],
  "napoli": ["napoli"],
  "roma": ["as roma"],
  "asr": ["as roma"],
  "lazio": ["ss lazio"],
  "aja": ["ajax"],
  "psv": ["psv eindhoven"],
  "ajax": ["ajax amsterdam"],
  "celtic": ["celtic fc"],
  "rangers": ["rangers fc"],

  // Countries
  "bra": ["brazil"],
  "brasil": ["brazil"],
  "seleção": ["brazil"],
  "arg": ["argentina"],
  "albiceleste": ["argentina"],
  "ita": ["italy"],
  "azzurri": ["italy"],
  "ger": ["germany"],
  "die mannschaft": ["germany"],
  "esp": ["spain"],
  "la roja": ["spain"],
  "fra": ["france"],
  "les bleus": ["france"],
  "ned": ["netherlands", "holland"],
  "eng": ["england"],
  "three lions": ["england"],
  "por": ["portugal"],
  "seleção portuguesa": ["portugal"],
  "uru": ["uruguay"],
  "mex": ["mexico"],
  "ind": ["india"],

  // Players / legends
  "cr7": ["cristiano ronaldo", "ronaldo", "cristiano"],
  "cristiano": ["cristiano ronaldo", "cr7"],
  "ronaldo": ["cristiano ronaldo", "cr7"],
  "r7": ["ronaldo nazario", "brazilian ronaldo"],
  "l10": ["messi", "leo messi", "lionel messi"],
  "m10": ["messi", "lionel messi"],
  "leo": ["messi", "lionel messi"],
  "messi": ["lionel messi", "leo messi"],
  "pele": ["pelé", "edson"],
  "pelé": ["pele"],
  "diego": ["maradona"],
  "d10s": ["maradona", "diego"],
  "mara": ["maradona"],
  "beckham": ["david beckham"],
  "becks": ["beckham"],
  "henry": ["thierry henry", "titi"],
  "zizou": ["zidane", "zinedine"],
  "zidane": ["zinedine zidane"],
  "iniesta": ["andrés iniesta"],
  "xavi": ["xavi hernández"],
  "gerrard": ["steven gerrard"],
  "lampard": ["frank lampard"],
  "rooney": ["wayne rooney"],
  "kane": ["harry kane"],
  "haaland": ["erling haaland"],
  "mbappe": ["kylian mbappé"],
  "mbappé": ["kylian mbappé"],
  "neymar": ["neymar jr"],
  "vinicius": ["vinícius jr"],
  "van basten": ["marco van basten"],
  "gullit": ["ruud gullit"],
  "rijkaard": ["frank rijkaard"],
  "maldini": ["paolo maldini"],
  "baggio": ["roberto baggio"],
  "totti": ["francesco totti"],
  "delpiero": ["del piero", "alessandro"],

  // Trophies / events
  "treble": ["treble winner", "manchester united 1999"],
  "ucl": ["champions league"],
  "epl": ["premier league"],
  "pl": ["premier league"],
  "cl": ["champions league"],
  "wc": ["world cup"],
  "worldcup": ["world cup"],
  "euro": ["euros", "european championship"],
  "seriea": ["serie a"],
  "laliga": ["la liga"],
  "bundesliga": ["bundesliga"],
  "ligue1": ["ligue 1"],
};

// Expand a raw user query into a set of terms to match against.
export function expandQueryTerms(raw) {
  const q = (raw || "").toLowerCase().trim();
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  const terms = new Set();
  terms.add(q);
  words.forEach((w) => {
    terms.add(w);
    (SEARCH_ALIASES[w] || []).forEach((t) => terms.add(t));
  });
  // Also try full-string alias (multi-word key like "man u")
  if (SEARCH_ALIASES[q]) SEARCH_ALIASES[q].forEach((t) => terms.add(t));
  return Array.from(terms);
}

export function matchesJersey(jersey, rawQuery) {
  const terms = expandQueryTerms(rawQuery);
  if (terms.length === 0) return true;
  const haystack = [
    jersey.name,
    jersey.club,
    jersey.league,
    jersey.era,
    jersey.year,
    jersey.player,
    jersey.description,
    jersey.tags,
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();
  return terms.some((t) => haystack.includes(t));
}
