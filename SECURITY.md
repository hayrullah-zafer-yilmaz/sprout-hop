# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.7.x   | Yes       |
| < 0.7   | No        |

## Reporting a vulnerability

Please do not open a public issue for a security problem. Report it privately instead:

https://github.com/hayrullah-zafer-yilmaz/sprout-hop/security/advisories/new

Please include:

- what the problem is and where it is (file, line or URL)
- the steps to reproduce it
- what an attacker could do with it

You will get a first reply within 7 days.

## Scope

Sprout Hop is a browser game with no server and no accounts. It keeps only the best score, the language and the sound setting in `localStorage`.

In scope:

- the code in this repository
- the site published from it to GitHub Pages

Out of scope:

- problems in dependencies (Vue, TresJS, Three.js, Vite) that are already reported to those projects
- issues that need an already compromised browser or device
