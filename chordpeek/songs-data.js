/* Shared song data for the rebuilt ChordPeek: no chords, no synthesized
   audio — the real recording plays via an embedded YouTube player, so this
   file only needs what the room actually shows: the track's identity, a
   long-form story, a curated mood that drives the room's lighting, and a
   tempo that drives the room's beat-synced lighting pulse. One file, read
   by both lobby.html (the gallery) and room.html (the theater), so the
   two pages can never drift apart.

   Every youtubeId below was checked against YouTube's oEmbed endpoint
   before being added, confirming it's a real, embeddable, still-live
   upload of the song's actual official music video — not a lyric video,
   visualizer, or audio-only upload. Two songs from the original list
   (Phish's "Waste" and Led Zeppelin's "Stairway to Heaven") were cut
   entirely because neither one ever had an official music video made for
   it, confirmed via Wikipedia and imvdb.com.

   mood: a hand-picked { hue, name } pair (not computed from key/tempo)
   that sets the room's accent color and ambient label — curated per song
   rather than templated, the same way a real editor would pick a palette
   for a magazine spread rather than running a formula.

   bpm: the track's tempo, used to drive the room's lighting — the house
   lights (cove, aisle, and seat-strip LEDs) duck gently on every beat,
   with a bigger blackout-into-flash "drop" a few times across the song.
   Since YouTube's embed strips out its own audio from anything a page can
   actually analyze (no waveform access across origins), there's no way to
   detect the real beat from the video itself — the pulse is reconstructed
   from each song's known tempo instead, locked to the video's real
   playback clock via the YouTube IFrame API so it stays in sync through
   pausing, seeking, and buffering. The three "drop" moments are placed at
   fixed, typical verse/chorus/bridge fractions of the track's real
   duration rather than hand-timed to an actual chorus hit — a deliberate,
   honest approximation, not a claim of true audio analysis. */
const SONGS = [
  {
    title: "Blurry", artist: "Puddle of Mudd", album: "Come Clean", year: 2001, genre: "Post-Grunge",
    youtubeId: "xJJsoquu70o",
    mood: { hue: 205, name: "Overcast & aching" },
    bpm: 86,
    story: "Wes Scantlin wrote “Blurry” about losing contact with his infant son during a custody dispute, pouring the haze of that fight into a chorus built to carry an arena. Fred Durst heard a demo tape, pushed to get the Kansas City band signed to his own imprint on Interscope, and personally helped produce Come Clean. The gamble paid off fast: “Blurry” spent three weeks at #1 on Billboard's Mainstream Rock chart and crossed over to the Hot 100, becoming the defining post-grunge single of 2001 and the song that put Puddle of Mudd on modern-rock radio for the rest of the decade. Its simple, unpolished video — just the band playing in grainy, high-contrast black and white — matched the row-house rawness of the lyric and helped the song become inescapable on both rock radio and early-2000s MTV.",
  },
  {
    title: "Fine Again", artist: "Seether", album: "Disclaimer II", year: 2002, genre: "Alt-Metal",
    youtubeId: "y9MVRhBfzz8",
    mood: { hue: 350, name: "Raw & searching" },
    bpm: 150,
    story: "Frontman Shaun Morgan wrote “Fine Again” about pulling himself out of addiction, a subject he'd return to again and again across Seether's catalog as the band's songs grew more openly autobiographical. Formed in Pretoria, South Africa, Seether had already built a following at home, but “Fine Again” was the song that crossed the Atlantic — it became the breakthrough U.S. rock-radio hit that introduced the band to American audiences and is still the song most credited with putting Seether on the map stateside. The track's quiet-verse, massive-chorus structure became something of a Seether signature, repeated across later hits, and “Fine Again” remains a staple of the band's live sets more than two decades on.",
  },
  {
    title: "Adam's Song", artist: "blink-182", album: "Enema of the State", year: 1999, genre: "Pop Punk",
    youtubeId: "2MRdtXWcgIw",
    mood: { hue: 220, name: "Quiet & heavy" },
    bpm: 136,
    story: "Mark Hoppus wrote the lyrics after reading a teenage fan's suicide note printed in a magazine, during a long, isolating stretch of tour that left him questioning what the band was even doing out there. It's the most serious song blink-182 ever released — a pop-punk record that opened up a real, unguarded conversation about teen depression at a moment when the genre rarely went anywhere near that subject. The music video, built around slow-motion, black-and-white footage of the band performing and walking through an empty high school, was deliberately stripped of the trio's usual comic relief. “Adam's Song” became one of Enema of the State's biggest singles and, over time, grew into one of the most frequently cited songs in conversations about music and mental health, with Hoppus speaking openly in later interviews about the letters fans have sent him over the years.",
  },
  {
    title: "Hemorrhage (In My Hands)", artist: "Fuel", album: "Something Like Human", year: 2000, genre: "Post-Grunge",
    youtubeId: "ZbHfgXJKn1Y",
    mood: { hue: 10, name: "Fragile & urgent" },
    bpm: 75,
    story: "Written about watching someone you love fall apart and being powerless to stop it, “Hemorrhage (In My Hands)” paired that helplessness with one of the biggest choruses of the era. The song became Fuel's signature hit, spending nine weeks at #1 on Billboard's Mainstream Rock chart — a run that made it one of the most-played rock-radio songs of the early 2000s and, for many listeners, the song that defines the band's entire catalog. Its music video leaned into surreal, water-logged imagery — rooms filling with liquid, a world coming undone around the band — a literal staging of the title that became one of the most recognizable rock videos on MTV2 in 2000 and 2001.",
  },
  {
    title: "If You Could Only See", artist: "Tonic", album: "Lemon Parade", year: 1996, genre: "Alt Rock",
    youtubeId: "Sfg6-4mBs6Y",
    mood: { hue: 28, name: "Golden & defiant" },
    bpm: 142,
    story: "Emerson Hart wrote it about his real relationship with an older, still-married woman — the “forbidden love” described in the lyrics wasn't a metaphor, it was literal, and Hart has said the song came together almost exactly as it was lived. It became Tonic's breakout single and the song most responsible for Lemon Parade going platinum, turning the Texas-formed band into a radio-rock fixture of the late '90s. “If You Could Only See” has had an unusually long afterlife for a mid-'90s alt-rock single — it's remained a staple at weddings (both played earnestly and used ironically, given its subject matter) and is still one of the most-licensed rock songs of its era for film and TV.",
  },
  {
    title: "Here Without You", artist: "3 Doors Down", album: "Away from the Sun", year: 2002, genre: "Post-Grunge",
    youtubeId: "kPBzTxZQG5Q",
    mood: { hue: 235, name: "Longing & vast" },
    bpm: 138,
    story: "Brad Arnold wrote it about missing his girlfriend while 3 Doors Down was constantly on tour behind their breakout debut, turning the grind of a band's early touring years into one of the most universally relatable songs of the decade. It spent 30 weeks on the Billboard Hot 100 and became one of the best-selling rock singles of the 2000s, crossing over hard enough to get regular airplay on pop and adult-contemporary stations that otherwise never touched post-grunge. Its official video — the band performing in a stark white room intercut with a couple separated by distance — has since passed one billion YouTube views, making it one of the most-watched rock videos of the platform's first two decades.",
  },
  {
    title: "Spin", artist: "Lifehouse", album: "Stanley Climbfall (Expanded Edition)", year: 2002, genre: "Alt Rock",
    youtubeId: "LWnIEHVoiXg",
    mood: { hue: 265, name: "Restless & searching" },
    bpm: 97,
    story: "Jason Wade wrote “Spin” about the disorientation of sudden fame after Lifehouse's debut single “Hanging by a Moment” turned the band into a radio phenomenon almost overnight — the lyric is less a love song than a document of feeling like the world was moving faster than he could keep up with. It became a defining deep cut from the Stanley Climbfall era, a record widely seen as Lifehouse's more guitar-driven, less polished follow-up to their blockbuster debut. Never pushed as hard to radio as the band's biggest singles, “Spin” has nonetheless become a favorite among longtime Lifehouse fans precisely because it captures the band mid-reckoning with its own success rather than riding it.",
  },
  {
    title: "45", artist: "Shinedown", album: "Leave a Whisper", year: 2003, genre: "Alt-Metal",
    youtubeId: "MLeIyy2ipps",
    mood: { hue: 355, name: "Tense & cornered" },
    bpm: 152,
    story: "Brent Smith has said “45” uses the imagery of a loaded gun as a metaphor for being pushed to your absolute limit by a toxic relationship, not a literal account of a specific event — a clarification he's offered repeatedly since the song still gets mistaken for something more literal. It became Shinedown's breakout single, the song that took the Jacksonville band from a regional act to a mainstay of 2000s rock radio, and it remains one of the most-requested songs at Shinedown's live shows two decades later. The track's slow-building verse-into-explosion structure — a near-whisper opening that detonates into one of the heaviest choruses of the Leave a Whisper album — became a template Shinedown would return to across their career.",
  },
  {
    title: "Don't Go Away", artist: "Oasis", album: "Be Here Now", year: 1997, genre: "Britpop",
    youtubeId: "FU6yzzESX8Y",
    mood: { hue: 30, name: "Wistful & grand" },
    bpm: 108,
    story: "Noel Gallagher wrote “Don't Go Away” while his father was undergoing cancer treatment, a rare moment of direct, unguarded vulnerability on an album otherwise known for its sprawling, maximalist excess. Directed by Nigel Dick and shot in London, its video — along with a Japan-only single release — made it one of the more quietly personal songs Oasis ever put out, overshadowed in the band's catalog by the bigger, brasher singles from Be Here Now but held in high regard by longtime fans for exactly that restraint. It's since become one of the Oasis deep cuts most frequently cited by the band's own members as a personal favorite, standing apart from the Britpop bombast that defined the era around it.",
  },
  {
    title: "You and Me", artist: "Lifehouse", album: "Lifehouse", year: 2005, genre: "Alt Rock",
    youtubeId: "ac3HkriqdGQ",
    mood: { hue: 338, name: "Tender & sure" },
    bpm: 76,
    story: "Jason Wade wrote “You and Me” as a simple, unguarded love song after years of darker, more conflicted material on Lifehouse's earlier records — a deliberate turn toward directness that paid off. It became the band's biggest hit, their only song to reach the U.S. Top 5, and has stayed a wedding-playlist staple ever since, to the point that it's arguably better known today for its use at weddings than for its chart run. An acoustic version released as a bonus track became nearly as popular as the album cut, and the song's steady, unhurried tempo has made it one of the most frequently covered Lifehouse songs by other artists.",
  },
  {
    title: "Shimmer", artist: "Fuel", album: "Sunburn", year: 1998, genre: "Post-Grunge",
    youtubeId: "rZwSqX6J5hs",
    mood: { hue: 190, name: "Hazy & uncertain" },
    bpm: 93,
    story: "Carl Bell wrote “Shimmer” about feeling invisible and unworthy of love, a theme he'd revisit in sharper focus two years later on “Hemorrhage.” Directed by Josh Taft, the video's intercut past-and-present imagery — a younger self glimpsed against the present-day band — mirrors the lyric's sense of looking back at who you used to be, and the song became Fuel's breakout rock-radio hit off their debut album Sunburn. “Shimmer” also found an unusual second life in film: its inclusion on the soundtrack to The Faculty introduced the song to an audience well outside Fuel's usual rock-radio base and helped the single cross over to modern-rock stations nationwide.",
  },
  {
    title: "The Diary of Jane", artist: "Breaking Benjamin", album: "Phobia", year: 2007, genre: "Alt-Metal",
    youtubeId: "QBGfONq2GMM",
    mood: { hue: 260, name: "Obsessive & dark" },
    bpm: 137,
    story: "Ben Burnley wrote “The Diary of Jane” as a fictional story of obsession and loss rather than a literal account, building the track around one of the most immediately recognizable riffs of late-2000s rock radio. Its music video premiered on Yahoo! Music and leaned into the song's stalker-thriller narrative with a stylized, cinematic treatment that stood out from the era's usual performance-video format. The song became Breaking Benjamin's highest-charting single, topping both the Mainstream Rock and Alternative charts simultaneously, and an acoustic version released on the same album's deluxe edition became almost as well known as the original, showing off a softer side of a band mostly known for its heaviness.",
  },
  {
    title: "Bitter Sweet Symphony", artist: "The Verve", album: "Urban Hymns", year: 1997, genre: "Britpop",
    youtubeId: "1lyu1KKwC74",
    mood: { hue: 18, name: "Weary & defiant" },
    bpm: 85,
    story: "Built around an orchestral sample from an orchestral cover of a Rolling Stones song, the track triggered a lawsuit that stripped Richard Ashcroft of songwriting credit and royalties for over two decades — a dispute only reversed in 2019, when Mick Jagger and Keith Richards voluntarily signed the publishing rights back to Ashcroft. Walter Stern's one-take video — Ashcroft walking straight down a London pavement, shouldering past everyone in his path without breaking stride — became one of the most imitated shots in music video history, referenced and parodied for years afterward. Despite the legal mess around its credit, “Bitter Sweet Symphony” is now widely regarded as one of the defining British singles of the 1990s and remains The Verve's best-known song by a wide margin.",
  },
  {
    title: "3 Libras", artist: "A Perfect Circle", album: "Mer de Noms", year: 2000, genre: "Alt-Metal",
    youtubeId: "u9MAg9E5K3w",
    mood: { hue: 275, name: "Unseen & aching" },
    bpm: 100,
    story: "Maynard James Keenan wrote “3 Libras” about feeling unseen and misjudged within a relationship, channeling a vulnerability he rarely showed in his work fronting Tool. The song showcased a softer, more melodic, almost dream-pop side of Keenan's songwriting, built around Billy Howerdel's atmospheric guitar work rather than Tool's signature heaviness, and became one of A Perfect Circle's defining early singles off their debut album Mer de Noms. For many listeners, “3 Libras” served as an introduction to A Perfect Circle as a genuinely distinct project rather than simply “Maynard's side band,” and it remains one of the clearest showcases of the collaboration between Keenan and Howerdel that defined the group's sound.",
  },
  {
    title: "Bound for the Floor", artist: "Local H", album: "As Good as Dead", year: 1996, genre: "Alt Rock",
    youtubeId: "E2Oe5YKhzCE",
    mood: { hue: 95, name: "Snide & loud" },
    bpm: 160,
    story: "Scott Lucas wrote this scathing kiss-off as Local H — just guitar and drums, with Lucas running his guitar through a bass rig to fake the low end of a full band — were touring relentlessly behind As Good as Dead. The music video leaned into that two-piece setup rather than hiding it, built around the band's full, deceptively huge sound despite being only two members on stage, and it made “Bound for the Floor” an MTV staple through 1996 and 1997. It remains the Chicago duo's biggest hit and the song most responsible for keeping the two-piece rock-band format commercially viable years before the format exploded again in the 2000s.",
  },
  {
    title: "Wish You Were Here", artist: "Incubus", album: "Morning View", year: 2001, genre: "Alt Rock",
    youtubeId: "8295rOMvtQI",
    mood: { hue: 185, name: "Sun-faded & longing" },
    bpm: 96,
    story: "Brandon Boyd wrote it about missing someone back home while the band recorded at the Malibu beach house where the entire Morning View album came together — a literal account of a specific summer rather than a general sentiment. The original video, shot that August on the beach near the recording house, was shelved after the September 11 attacks out of sensitivity to its imagery; a re-cut version blending the original footage with home-video-style clips of the band premiered several weeks later instead. “Wish You Were Here” became one of Incubus's most enduring singles, a mellower counterpoint to the band's heavier material that helped broaden their audience well beyond nu-metal radio.",
  },
  {
    title: "Lucky Man", artist: "The Verve", album: "Urban Hymns", year: 1997, genre: "Britpop",
    youtubeId: "MH6TJU0qWoY",
    mood: { hue: 50, name: "Grateful & clear" },
    bpm: 90,
    story: "Richard Ashcroft wrote “Lucky Man” after The Verve nearly broke up for good in 1995, and the song reflects a genuinely new sense of gratitude once the band reformed to make Urban Hymns — a deliberate counterweight, in both tone and lyric, to the bitterness running through “Bitter Sweet Symphony” on the same record. Two different official videos were shot for it, one released in the UK and a separate one for the US market, an unusual choice that underlined how much weight the label was putting behind the single on both sides of the Atlantic. “Lucky Man” has endured as one of Urban Hymns' most quietly beloved tracks, often cited by fans as their favorite on the album even though it never matched “Bitter Sweet Symphony” commercially.",
  },
  {
    title: "For You", artist: "Staind", album: "Break the Cycle", year: 2001, genre: "Alt-Metal",
    youtubeId: "JT8bhhDCPQc",
    mood: { hue: 255, name: "Heavy & dependent" },
    bpm: 138,
    story: "Aaron Lewis wrote “For You” about the grip of addiction and codependency, continuing the unflinchingly confessional songwriting that had already made Staind one of the more emotionally direct bands on rock radio. Directed by Nigel Dick as Break the Cycle's fourth single, its video intercuts a teenager's strained family life with footage of the band performing in a stripped-down, empty room, deliberately avoiding any glamor in favor of something closer to a documentary tone. Break the Cycle went on to become one of the best-selling rock albums of 2001, and “For You” helped extend the record's radio run well into the following year, long after its blockbuster lead single had already peaked.",
  },
  {
    title: "Colors", artist: "Crossfade", album: "Crossfade", year: 2005, genre: "Alt-Metal",
    youtubeId: "PYw0mg8RPKA",
    mood: { hue: 310, name: "Vivid & restless" },
    bpm: 92,
    story: "The second single from Crossfade's self-titled debut, “Colors” followed the massive success of lead single “Cold” onto rock radio and reached the Mainstream Rock top 10 in its own right, proving the Columbia, South Carolina band wasn't a one-hit act. Where “Cold” leaned into a moody, almost electronic-tinged verse, “Colors” pushed harder toward a straightforward rock chorus, broadening the range the band could show off across a single album cycle. It's stayed one of Crossfade's most-streamed tracks since, a consistent presence on 2000s-rock nostalgia playlists even as the band's output slowed in the years that followed.",
  },
];
