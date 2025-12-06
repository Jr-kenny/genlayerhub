# GenLayer Hub

**A portal for learning about and contributing to the GenLayer protocol.**

This repository hosts a static site that introduces GenLayer  an "intelligent" blockchain protocol  and provides resources for learners and contributors. 



## Quick project overview

* **Purpose:** Educate visitors about GenLayer, showcase protocol concepts, provide articles, and offer an interactive quiz and community section to onboard contributors.

* **Stack:** Plain HTML/CSS/JavaScript (no framework). Uses a small local data store (`data/*.json`) and a simple JSONBin client in `js/api.js` for optional remote features.

** `https://genlayerhub.vercel.app`


## Features

* Static, fast, and privacy-friendly site built with vanilla web technologies.
* Quiz system that reads `data/quiz.json` and runs client-side.
* Articles page that reads `data/articles.json` to render posts.
* Small JSONBin integration (in `js/api.js`) for optional remote storage of community posts or user responses. **Note:** Sensitive keys should not be committed to the repo.
* Responsive UI with `css/responsive.css`.

---

## Installation 

1. Clone the repository:

```bash
git clone https://github.com/Jr-kenny/genlayerhub.git
cd genlayerhub
```

2. Serve the files locally. 

* Python 3 HTTP server :

```bash
# In the repo root
python3 -m http.server 3000
# Open http://localhost:3000
```

* Node (http-server):

```bash
npm install -g http-server
http-server -p 3000
# Open http://localhost:3000
```

3. Edit files and refresh the browser. No build step required.

---

## Configuration

* The `data/` folder contains site data (articles, quiz questions). Edit those JSON files to add or update content.
* `js/api.js` contains a small JSONBin client (or similar). **Do not** commit secrets into the repo. Instead, use environment variables or a server-side proxy when necessary.

---

## Deploy

This project is compatible with any static host.

* Vercel: `vercel` or connect the GitHub repository.
* GitHub Pages: Push to a branch and enable Pages in repository settings.
* Netlify: Connect the repository and set the publish directory to the repo root.

---

## Security & Privacy notes

* The repo currently contains a `js/api.js` that expects remote keys for JSONBin-style functionality. If you plan to enable remote storage for community posts, move any secret API keys to a server-side endpoint or environment variables. Never embed production API keys in client-side code. 

(didn't bother cause it is for fun)

---

## Contribution guidelines

If you want to contribute:

1. Fork the repository.
2. Create a descriptive feature branch.
3. Open a Pull Request with a clear description of changes.

Suggested contributions:

* Improve accessibility, semantic HTML, and ARIA labels.
* Add E2E tests or simple unit tests using a minimal toolchain.
* Convert to a small static site generator if you need templating (Eleventy, Hugo, etc.).
* Replace client-side secret handling with a serverless function or proxy.
* Add more quiz questions, article content, or improve UX.

---

## Notes for maintainers

* Check `yarn.lock` and package usage before adding heavy dependencies — the site is intentionally dependency-light.
* If JSONBin is used in production, implement server-side token handling and rate-limiting.

---

## License
This project is licensed under the MIT License – see the [LICENSE](https://github.com/Jr-kenny/genlayerhub/blob/main/LICENSE) file.
---

## Acknowledgements

Built by Jr-kenny. Inspired by the GenLayer concept and the need for approachable protocol documentation and onboarding.

---

## Contact

If you'd like help improving this README or refactoring the site for a modern static site workflow, tell me what you want changed and I will produce the next revision.


## tree structure/

```
├── index.html          # Home page
├── protocol.html      # Protocol page
├── articles.html      # Articles page
├── quiz.html         # Quiz page
├── community.html    # Community page
├── css/
│   ├── style.css     # Main styles
│   └── responsive.css # Responsive styles
├── js/
│   ├── main.js       # Common functionality
│   ├── articles.js   # Articles functionality
│   ├── quiz.js       # Quiz system
│   ├── community.js  # Community posts
│   └── api.js        # JSONBin API client
├── images/
│   └── logo.png      # logo
└── data/
    ├── quiz.json     # Quiz questions
    └── articles.json # Articles data
```
