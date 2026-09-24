# Wordy local preview

Wordy is developed from the `feature/wordy-game` branch and does not need Cloudflare, GitHub Actions, or any public deployment for review.

## Windows

Double-click:

`Wordy/preview-local.bat`

It opens:

`http://127.0.0.1:4173/Wordy/`

The preview is available only on the local computer. Closing the terminal stops it.

## Jump directly to a validation level

Use the `level` query parameter:

- `http://127.0.0.1:4173/Wordy/?level=A`
- `http://127.0.0.1:4173/Wordy/?level=F`
- `http://127.0.0.1:4173/Wordy/?level=G`

When Wordy is opened through `localhost` or `127.0.0.1`, a compact **DEV** bar appears above the game. It lets you switch between levels A–G and restart the current level.

The DEV controls are not mounted on non-local hosts.

## Command line

With Node.js:

```bash
node Wordy/preview-local.mjs --open
```

The preview server binds only to `127.0.0.1` and sends `Cache-Control: no-store` so changes are visible after refresh.

## Branch-only safety

While Wordy is under development:

- the COG landing page does not link to Wordy;
- the Cloudflare production build does not copy the Wordy folder;
- working on `feature/wordy-game` does not require GitHub Actions or Cloudflare.
