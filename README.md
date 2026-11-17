# Durga Saptashati flipbook

The live book is https://hrishim.github.io/durga_saptashati_pwa/book/ . The root URL also opens the book.

The reader contains the original app's 13 chapters and 700 Gita Press-numbered entries. Sanskrit, translations, word meanings and source metadata are retained in `book/book-data.js`; the UI renders those fields without rewriting the text. This release changes presentation, not the source text or the extent of its prior proofreading.

## iPhone and iPad

Open the book in Safari, choose Share > Add to Home Screen, leave **Open as Web App** enabled, then open the new Home Screen icon. Standalone launch omits Safari's address and button bars, including its Reader control. A regular Safari tab keeps browser chrome under Safari's control. There is no supported website setting that forces Reader off in every ordinary Safari tab.

The reader uses safe-area spacing for the notch/Home indicator, facing pages on larger screens, and one page at a time on iPhone. A mobile page turn alternates the Sanskrit/translation page and word meanings for that verse. The complete offline shell is about 2.3 MB. Open once online and allow it to cache before relying on offline use.

## Mac

From the committed `native` folder, run `bash build_app.sh`. The existing book is bundled from `../book`, and compilation occurs on the Samsung T7 (UUID checked by the build script). No source resources are downloaded by the build. The output is `native/Durga Saptashati.app`; copy it to `~/Applications` to install.

The Mac app uses WKWebView and native Core Animation turns of immutable page snapshots, so text is not re-laid out during the page rotation. The narrow-window layout uses a whole-page turn. Reduced-motion settings use immediate navigation. View > Enter Full Screen or the book's full-screen control toggles the Mac window.

Reading position, font size and bookmarks are local to each device. Bookmarks can be opened from Contents. The native updater accepts only newer `durga-flipbook-` releases, validates flat file names, and leaves the bundled reader available offline.

## Editing and publishing

`book/index.html`, `flipbook.css` and `flipbook.js` are the buildless web sources. `book-data.js` is the source-preserving data artifact; all cover images, icons and WOFF2 fonts are local. No package installation is required. `native/main.swift`, `PageTurn.swift`, `Info.plist`, `icon1024.png` and `build_app.sh` are the complete Mac sources.

When changing book resources, bump the offline cache version in `book/service-worker.js` and the matching release in `book/manifest.txt`. List every native/offline resource in the manifest. Commit sources to `main`, then mirror the tested `book/` and root web files to `gh-pages`, the configured GitHub Pages source branch. The original assets and standard chapter pages are retained in the repository.

## Release verification

- All 700 serialized entries compared exactly with the original app's canonical chapter modules.
- Signed Mac bundle verified and tested loading its own bundled resources through `file:` in WebKit.
- 22 native checks: forward/backward and rapid turns, four representative Sanskrit/translation/word-meaning renderings, final verse boundary, zoom, bookmark retrieval, resize cancellation and unique DOM IDs.
- Responsive browser layouts inspected at Mac, iPad and iPhone sizes. Physical iPhone/iPad Home Screen launch still requires device verification.
