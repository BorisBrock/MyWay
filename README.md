# React + TypeScript Starter

This project is a minimal React application using Vite and TypeScript. It is configured to build a static website that can be served with a lightweight Docker container.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```
The output will be placed in the `dist` folder.

## Docker

Build and run the Docker container to serve the static site with nginx:

```bash
docker build -t react-app .
docker run -p 8080:80 react-app
```

Then open <http://localhost:8080> in your browser.
