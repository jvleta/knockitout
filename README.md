# knockitout

![Deploy to Firebase Hosting on merge](https://github.com/jvleta/knockitout/actions/workflows/firebase-hosting-merge.yml/badge.svg)
![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen)

Because the world needed one more to-do list app.

## Development

```bash
npm install
npm run dev
```

## Testing

Run the Jest test suite (required by CI/CD):

```bash
npm test
```

Generate a coverage report:

```bash
npm test -- --coverage
```

Coverage reports are written to the `coverage/` directory (ignored by Git).
