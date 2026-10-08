/* Shared song data for the rebuilt ChordPeek: no chords, no synthesized
   audio — the real recording plays via an embedded YouTube player, so this
   file only needs what the room actually shows: the track's identity, a
   short factual story, and a curated mood that drives the room's lighting.
   One file, read by both lobby.html (the gallery) and room.html (the
   theater), so the two pages can never drift apart.

   Every youtubeId below was checked against YouTube's oEmbed endpoint
   before being added, confirming it's a real, embeddable, still-live
   upload of the song's actual official music video — not a lyric video,
   visualizer, or audio-only upload. Two songs from the original list
   (Phish's "Waste" and Led Zeppelin's "Stairway to Heaven") were cut
   entirely because neither one ever had an official music video made for
   it, confirmed via Wikipedia and imvdb.com.

   mood: a hand-picked { hue, name } pair (not computed from key/tempo,
   since neither exists anymore) that sets the room's accent color and
   ambient label — curated per song rather than templated, the same way a
   real editor would pick a palette for a magazine spread rather than
   running a formula. */
const SONGS = [
  {
    title: "Blurry", artist: "Puddle of Mudd", album: "Come Clean", year: 2001, genre: "Post-Grunge",
    youtubeId: "xJJsoquu70o",
    mood: { hue: 205, name: "Overcast & aching" },
    story: "Wes Scantlin wrote “Blurry” about losing contact with his infant son during a custody dispute. Fred Durst discovered the band and got them signed to Interscope; the song spent three weeks at #1 on Billboard's Mainstream Rock chart and became the defining post-grunge single of 2001.",
  },
  {
    title: "Fine Again", artist: "Seether", album: "Disclaimer II", year: 2002, genre: "Alt-Metal",
    youtubeId: "y9MVRhBfzz8",
    mood: { hue: 350, name: "Raw & searching" },
    story: "Frontman Shaun Morgan wrote “Fine Again” about pulling himself out of addiction. It became the South African band's breakthrough U.S. rock-radio hit and the song most credited with putting Seether on the map stateside.",
  },
  {
    title: "Adam's Song", artist: "blink-182", album: "Enema of the State", year: 1999, genre: "Pop Punk",
    youtubeId: "2MRdtXWcgIw",
    mood: { hue: 220, name: "Quiet & heavy" },
    story: "Mark Hoppus wrote the lyrics after reading a teenage fan's suicide note printed in a magazine, while blink-182 was on a lonely stretch of tour. It's the band's most serious song by far — a pop-punk record that opened up a real conversation about teen depression.",
  },
  {
    title: "Hemorrhage (In My Hands)", artist: "Fuel", album: "Something Like Human", year: 2000, genre: "Post-Grunge",
    youtubeId: "ZbHfgXJKn1Y",
    mood: { hue: 10, name: "Fragile & urgent" },
    story: "Written about watching someone you love fall apart and being unable to stop it, “Hemorrhage” became Fuel's biggest hit, spending nine weeks at #1 on the Mainstream Rock chart — still one of the most-played rock-radio songs of the early 2000s.",
  },
  {
    title: "If You Could Only See", artist: "Tonic", album: "Lemon Parade", year: 1996, genre: "Alt Rock",
    youtubeId: "Sfg6-4mBs6Y",
    mood: { hue: 28, name: "Golden & defiant" },
    story: "Emerson Hart wrote it about his real relationship with an older, still-married woman — the “forbidden love” in the lyrics was literal, not metaphor. It became Tonic's signature song and a radio-rock staple of the late '90s.",
  },
  {
    title: "Here Without You", artist: "3 Doors Down", album: "Away from the Sun", year: 2002, genre: "Post-Grunge",
    youtubeId: "kPBzTxZQG5Q",
    mood: { hue: 235, name: "Longing & vast" },
    story: "Brad Arnold wrote it about missing his girlfriend while 3 Doors Down was constantly on tour. It spent 30 weeks on the Billboard Hot 100 and became one of the best-selling rock singles of the decade — its official video has passed one billion YouTube views.",
  },
  {
    title: "Spin", artist: "Lifehouse", album: "Stanley Climbfall (Expanded Edition)", year: 2002, genre: "Alt Rock",
    youtubeId: "LWnIEHVoiXg",
    mood: { hue: 265, name: "Restless & searching" },
    story: "Jason Wade wrote “Spin” about the disorientation of sudden fame after Lifehouse's debut blew up — feeling like the world was moving faster than he could keep up with. It became a defining deep cut from the Stanley Climbfall era.",
  },
  {
    title: "45", artist: "Shinedown", album: "Leave a Whisper", year: 2003, genre: "Alt-Metal",
    youtubeId: "MLeIyy2ipps",
    mood: { hue: 355, name: "Tense & cornered" },
    story: "Brent Smith has said “45” uses the imagery of a loaded gun as a metaphor for being pushed to your absolute limit by a toxic relationship — not a literal account. It became Shinedown's breakout single and a mainstay of 2000s rock radio.",
  },
  {
    title: "Don't Go Away", artist: "Oasis", album: "Be Here Now", year: 1997, genre: "Britpop",
    youtubeId: "FU6yzzESX8Y",
    mood: { hue: 30, name: "Wistful & grand" },
    story: "Noel Gallagher wrote “Don't Go Away” while his father was undergoing cancer treatment. Directed by Nigel Dick and shot in London, its video — and a Japan-only single release — made it one of the most quietly personal songs Oasis ever put out.",
  },
  {
    title: "You and Me", artist: "Lifehouse", album: "Lifehouse", year: 2005, genre: "Alt Rock",
    youtubeId: "ac3HkriqdGQ",
    mood: { hue: 338, name: "Tender & sure" },
    story: "Jason Wade wrote “You and Me” as a simple, unguarded love song after years of darker material. It became Lifehouse's biggest hit — their only song to reach the U.S. Top 5 — and a wedding-playlist staple ever since.",
  },
  {
    title: "Shimmer", artist: "Fuel", album: "Sunburn", year: 1998, genre: "Post-Grunge",
    youtubeId: "rZwSqX6J5hs",
    mood: { hue: 190, name: "Hazy & uncertain" },
    story: "Carl Bell wrote “Shimmer” about feeling invisible and unworthy of love. Directed by Josh Taft, the video's past-and-present imagery mirrors the lyrics; the song became Fuel's breakout rock-radio hit off their debut album.",
  },
  {
    title: "The Diary of Jane", artist: "Breaking Benjamin", album: "Phobia", year: 2007, genre: "Alt-Metal",
    youtubeId: "QBGfONq2GMM",
    mood: { hue: 260, name: "Obsessive & dark" },
    story: "Ben Burnley wrote “The Diary of Jane” as a fictional story of obsession and loss, not a literal account. Its music video premiered on Yahoo! Music, and the song became Breaking Benjamin's highest-charting single, topping both the Mainstream Rock and Alternative charts.",
  },
  {
    title: "Bitter Sweet Symphony", artist: "The Verve", album: "Urban Hymns", year: 1997, genre: "Britpop",
    youtubeId: "1lyu1KKwC74",
    mood: { hue: 18, name: "Weary & defiant" },
    story: "Built around an orchestral sample of a Rolling Stones cover, the song triggered a lawsuit that stripped Richard Ashcroft of songwriting credit and royalties for over 20 years — reversed only in 2019 when Mick Jagger and Keith Richards signed the rights back. Walter Stern's one-take video, Ashcroft walking straight down a London pavement, became one of the most imitated shots in music video history.",
  },
  {
    title: "3 Libras", artist: "A Perfect Circle", album: "Mer de Noms", year: 2000, genre: "Alt-Metal",
    youtubeId: "u9MAg9E5K3w",
    mood: { hue: 275, name: "Unseen & aching" },
    story: "Maynard James Keenan wrote “3 Libras” about feeling unseen and misjudged within a relationship. It showcased a softer, more melodic side of Keenan than his work in Tool, and became one of A Perfect Circle's defining early singles.",
  },
  {
    title: "Bound for the Floor", artist: "Local H", album: "As Good as Dead", year: 1996, genre: "Alt Rock",
    youtubeId: "E2Oe5YKhzCE",
    mood: { hue: 95, name: "Snide & loud" },
    story: "Scott Lucas wrote this scathing kiss-off as Local H — just guitar and drums — were touring relentlessly behind As Good as Dead. Its music video, built around the band's full-band sound despite being only two members, made it an MTV staple and the duo's biggest hit.",
  },
  {
    title: "Wish You Were Here", artist: "Incubus", album: "Morning View", year: 2001, genre: "Alt Rock",
    youtubeId: "8295rOMvtQI",
    mood: { hue: 185, name: "Sun-faded & longing" },
    story: "Brandon Boyd wrote it about missing someone back home while recording at the Malibu beach house where Morning View came together. The original video, shot that August, was shelved after September 11; a re-cut version blending it with home-video-style footage premiered weeks later.",
  },
  {
    title: "Lucky Man", artist: "The Verve", album: "Urban Hymns", year: 1997, genre: "Britpop",
    youtubeId: "MH6TJU0qWoY",
    mood: { hue: 50, name: "Grateful & clear" },
    story: "Richard Ashcroft wrote “Lucky Man” after The Verve nearly broke up for good in 1995, reflecting a new sense of gratitude once the band reformed. Two different official videos were shot for it — one for the UK, one for the US.",
  },
  {
    title: "For You", artist: "Staind", album: "Break the Cycle", year: 2001, genre: "Alt-Metal",
    youtubeId: "JT8bhhDCPQc",
    mood: { hue: 255, name: "Heavy & dependent" },
    story: "Aaron Lewis wrote “For You” about the grip of addiction and codependency. Directed by Nigel Dick as Break the Cycle's fourth single, its video intercuts a teenager's family tension with the band performing in a stripped, empty room.",
  },
  {
    title: "Colors", artist: "Crossfade", album: "Crossfade", year: 2005, genre: "Alt-Metal",
    youtubeId: "PYw0mg8RPKA",
    mood: { hue: 310, name: "Vivid & restless" },
    story: "The second single from Crossfade's self-titled debut, “Colors” followed “Cold” onto rock radio and reached the Mainstream Rock top 10. It's stayed one of the album's most-streamed tracks since.",
  },
];
