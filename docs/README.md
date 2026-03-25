# CometChat UIKit Angular Documentation

This is the documentation site for CometChat UIKit Angular, built with [Mintlify](https://mintlify.com).

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

This will start the documentation server at `http://localhost:3000`.

### Build

```bash
npm run build
```

## Structure

```
docs/
├── mint.json              # Mintlify configuration
├── introduction.mdx       # Home page
├── quickstart.mdx         # Getting started guide
├── installation.mdx       # Installation instructions
├── components/            # Component documentation
│   ├── overview.mdx
│   ├── conversations.mdx
│   ├── messages.mdx
│   ├── users.mdx
│   └── groups.mdx
├── customization/         # Customization guides
│   ├── theming.mdx
│   └── localization.mdx
├── api-reference/         # API documentation
│   └── introduction.mdx
└── logo/                  # Logo assets
    ├── light.svg
    └── dark.svg
```

## Adding New Pages

1. Create a new `.mdx` file in the appropriate directory
2. Add the page to the `navigation` array in `mint.json`
3. Run `npm run dev` to preview changes
