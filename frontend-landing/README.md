# Synkro Landing Page

This is the landing page for Synkro, an AI-Fueled Supply Chain Optimization Platform. The landing page is built using Astro and follows the Atomic Design methodology with a neobrutalism design style.

## Features

- Responsive design
- Neobrutalism design style
- Built with Astro and TailwindCSS
- Atomic Design methodology
- Optimized for performance

## Project Structure

The project follows the Atomic Design methodology with the following structure:

```
src/
├── components/
│   ├── atoms/       # Basic building blocks (Button, Card, Container, etc.)
│   ├── molecules/   # Combinations of atoms (FeatureCard, NavLink, etc.)
│   ├── organisms/   # Sections of the page (Hero, Features, Footer, etc.)
│   └── templates/   # Page templates
├── layouts/         # Layout components
├── pages/           # Astro pages
└── styles/          # Global styles
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm (v8 or later)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open your browser and navigate to `http://localhost:4321`

## Building for Production

To build the site for production, run:

```bash
pnpm build
```

The built site will be in the `dist/` directory.

## Preview Production Build

To preview the production build, run:

```bash
pnpm preview
```

## Design System

The design system uses a neobrutalism style with the following color palette:

- Primary: #FF5252
- Secondary: #FFDE59
- Accent: #4DFFB4

## License

This project is licensed under the MIT License.

```sh
pnpm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
