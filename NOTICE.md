# Third-party notices

## dsh-whale-musume

- Author: Sutera-Diffusus
- Source: https://github.com/Sutera-Diffusus/dsh-whale-musume
- Version: 2.1.0
- Commit: 41a21d289af2bc268cbc83ebc50ba10158007026
- License: MIT; original text in vendor/dsh-whale-musume/LICENSE.

The original assets, presenter, state machine and settings are included in vendor/.
Desktop-specific transformations are explicit in build.cjs: adjustable size, menu positioning, disabled host activity signals, and a click event emitted after drag suppression.
The tray PNG is a format conversion of the upstream idle image.

Desktop adaptation copyright (c) 2026 BRUENCE-TOWM.
Character artwork belongs to its respective creators. No official DeepSeek affiliation is implied.

## Runtime and libraries

Electron / Chromium license notices are retained in the portable runtime directory.
React and esbuild are MIT licensed; Playwright is Apache-2.0 licensed. Exact versions are pinned in package-lock.json.
No personal music, API keys, user records or account credentials are distributed.
