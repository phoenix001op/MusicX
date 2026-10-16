# MusicX

A simple dark music web app in the spirit of YouTube Music. Search or browse Bollywood, Hollywood, Punjabi, old Hindi, rock and more, play songs in the browser, like them and save them into your own playlists. No sign up: you continue as a guest and everything is stored on your device.

Plain HTML, CSS and JavaScript. No build step, no npm, no framework.

## Features

- Home page with genre chips (Bollywood, Hollywood, Punjabi, Romantic, Party, Workout, Chill, Old Hindi) and scrollable shelves
- Search for any song, artist or album
- Player bar: play/pause, next/previous, seek, volume, shuffle, repeat, like, add to playlist
- Guest account (optional name), no password needed
- Create, rename and delete playlists, remove songs from them
- Liked songs
- Keyboard: `Space` play/pause, `Shift + Right` next, `Shift + Left` previous
- Works on phone screens too (bottom navigation)

## Music data

Songs come from the free [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/index.html), which is listed in the Music section of [public-apis](https://github.com/public-apis/public-apis#music). It needs no API key.

Important limit: the API only provides **30 second previews**, not full songs. That is how the API works, not a bug in the app. If you want full-length playback later, the API source in `js/app.js` (`fetchTracks`) can be swapped for a service that allows it, for example Jamendo (free, independent music) or by integrating a licensed streaming SDK.

## Run it locally

Just open `index.html` in a browser. If your browser blocks anything when opening from a file, start a tiny local server instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Put it on GitHub and host it free

```bash
git init
git add .
git commit -m "MusicX first version"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/musicx.git
git push -u origin main
```

Then on GitHub: **Settings > Pages > Build and deployment > Deploy from a branch > main / (root)**. After a minute your site is live at `https://YOUR-USERNAME.github.io/musicx/`.

## Files

```
musicx/
  index.html      page structure
  css/style.css   dark theme and layout
  js/app.js       player, search, playlists, routing
  README.md
```

## Notes

- Playlists and likes are saved in your browser's `localStorage`. Clearing site data or using another browser/device starts fresh.
- Album art and audio belong to their owners and are streamed directly from Apple's servers.

## License

MIT. Do what you like with the code.
