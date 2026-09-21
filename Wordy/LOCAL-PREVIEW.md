# Wordy local preview

Wordy is developed from the `feature/wordy-game` branch and does not need Cloudflare, GitHub Actions, or any public deployment for review.

## Windows

Double-click:

`Wordy/preview-local.bat`

It opens:

`http://127.0.0.1:4173/Wordy/`

The preview is available only on the local computer. Closing the terminal stops it.

## Command line

With Node.js:

```bash
node Wordy/preview-local.mjs --open
```

The preview server binds only to `127.0.0.1` and sends `Cache-Control: no-store` so changes are visible after refresh.
