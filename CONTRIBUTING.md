# Contributing to Montenegro Car Cost Calculator

Thank you for your interest in contributing to the Montenegro Car Cost Calculator! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. **Fork the repository** - Click the fork button in the top right corner
2. **Clone your fork** - `git clone https://github.com/your-username/montenegro-car-cost-calc.git`
3. **Create a new branch** - `git checkout -b feature/your-feature-name`
4. **Install dependencies** - `npm install`
5. **Start development server** - `npm run dev`

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow the existing code style and conventions
- Run `npm run lint` before committing
- Ensure all tests pass with `npm run test`

### Commit Messages
- Use clear, descriptive commit messages
- Start with a verb: "Add", "Fix", "Update", "Refactor", etc.
- Example: `Fix: correct VAT calculation for edge cases`

### Pull Requests
1. **Update your fork** - Ensure your branch is up to date with main
2. **Test thoroughly** - Run all tests and manual testing
3. **Write a clear PR description** - Explain what changes you made and why
4. **Link issues** - If fixing an issue, link it in the PR description
5. **Keep PRs focused** - One feature or fix per PR when possible

## Areas for Contribution

### Bug Fixes
- Report bugs in the Issues section
- Create a PR with a fix and clear description
- Include before/after test cases

### Features
- Discuss major features in Issues first
- Keep features aligned with the calculator's scope
- Update documentation as needed

### Documentation
- Improve README.md
- Add inline code comments for complex logic
- Update CHANGELOG when making changes

### Tests
- Write tests for new features
- Improve test coverage for existing code
- Add edge case tests

## Testing

Run the test suite:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Building

Build the project for production:
```bash
npm run build
```

## Code Review Process

1. **Automated checks** - CI/CD tests must pass
2. **Code review** - Maintainers will review your PR
3. **Feedback** - Address any feedback or suggestions
4. **Merge** - Once approved, your PR will be merged

## Project Structure

```
montenegrgo-car-cost-calc/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── lib/             # Utilities and helpers
│   ├── types/           # TypeScript types
│   └── App.tsx          # Main application
├── public/              # Static assets
├── tests/               # Test files
└── package.json         # Dependencies
```

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest
- **Deployment**: Netlify

## Questions?

- Open an Issue for questions or discussions
- Check existing Issues and PRs before creating new ones
- Be respectful and constructive in all interactions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

Thank you for contributing!
