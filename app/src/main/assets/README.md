# StudyQuest

A fantasy-RPG-styled, mobile-first learning app. Pure HTML/CSS/JS — no build step, no backend.

## Run it
Open `index.html` directly in a browser.

## Structure
```
StudyQuest/
├── index.html
├── css/style.css
├── js/app.js
├── assets/images/
│   ├── backgrounds/   dungeon-main.png        (full-screen dungeon background)
│   ├── characters/    warrior/mage/archer/wizard (.png) + matching *_card.png (battle select)
│   ├── enemies/       goblin.png
│   ├── avatars/       avatar-default.png
│   ├── banners/       warrior/mage/archer/wizard _banner.png (used as deck accents)
│   ├── panels/        parchment.png, hud_frame.png
│   └── icons/         nav icons, back/settings/search/upload, coin/gem/star/heart/crown, door, chest
└── README.md
```

All art here comes from your uploaded `icoagrods_pixel_sprites` set (background, character
cards, nav/UI icons, banners, parchment panel). Nothing is a generic placeholder anymore.

## Where each asset is used
- **Background:** `backgrounds/dungeon-main.png` — full-bleed behind the app on all screen sizes.
- **Nav bar:** `icons/nav-home.png`, `nav-flashcards.png`, `nav-battle.png`, `nav-rooms.png`, `nav-profile.png`.
- **Topbar buttons:** `icons/back.png`, `settings.png`, `search.png`, `upload.png`.
- **Currency/stats:** `icons/coin.png`, `gem.png`, `star.png`, `heart.png`, `crown.png` (logo mark).
- **Battle:** `characters/{warrior,mage,archer,wizard}_card.png` for hero select, the plain
  `characters/*.png` sprite for the in-combat portrait, `enemies/goblin.png` for the enemy.
- **Flashcard decks:** each deck gets one of the four colored banners for a quick visual identity.
- **Quiz / flashcard review question panel:** `panels/parchment.png` as the background texture.
- **Rooms:** `icons/door.png` per room row; `icons/chest.png` is included and free to use for a
  reward/treasure moment if you add one.
- `panels/hud_frame.png` is included but not wired in yet — a ready-made dark frame if you want to
  reskin a HUD panel later.

Font Awesome is still used for a handful of generic/interchangeable icons (help "?", check, trophy,
sword on buttons) where no matching sprite was in the set — everything else now uses your sprites.

## Swapping/adding art later
Replace any file in `assets/images/...` keeping the same filename and nothing else needs to change.
Want different sprites per item? Update the one path reference in `index.html` or `js/app.js`
(`CHARACTERS`/`DECKS` arrays).

## Notes
- Progress (XP, level, coins, gems, stats, achievements, selected character) is saved to
  `localStorage` — fully offline, no backend required.
- Rooms/multiplayer is a local demo only (no real networking).
