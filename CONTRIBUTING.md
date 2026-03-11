# Contributing to ScamShield

We appreciate your interest in contributing to ScamShield! This document provides guidelines for contributing to the project.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### 1. Reporting Bugs

Before creating bug reports, check the issue list to avoid duplicates.

**How to submit a bug report:**

- **Use a clear, descriptive title**
- **Describe the exact steps to reproduce** the problem
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** after following the steps
- **Explain which behavior you expected** to see instead and why
- **Include screenshots or animated GIFs** if possible
- **Include your environment details** (OS, Node version, etc.)

### 2. Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

**How to submit an enhancement:**

- **Use a clear, descriptive title**
- **Provide a step-by-step description** of the enhancement
- **Provide specific examples** to demonstrate the steps
- **Describe the current behavior** and expected behavior
- **Explain why this enhancement would be useful**

### 3. Pull Requests

- Fill out the provided template completely
- Document any changes in comments
- Make sure your code follows the existing style
- Write or update tests if applicable
- End all files with a newline

## Development Setup

1. **Fork the repository**
   ```bash
   click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/scamshield.git
   cd scamshield
   ```

3. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Set up development environment**
   - Follow [SETUP.md](SETUP.md) for backend and frontend setup

5. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Test your changes thoroughly

6. **Commit your changes**
   ```bash
   git commit -m "Add feature: brief description"
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Submit for review

## Code Style Guidelines

### JavaScript/Node.js

```javascript
// Use const by default, let when necessary
const userName = 'John';
let counter = 0;

// Use arrow functions
const add = (a, b) => a + b;

// Use template literals
const message = `Hello, ${userName}!`;

// Use async/await
const fetchData = async () => {
  try {
    const response = await api.get('/endpoint');
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Use meaningful variable names
const userEmail = 'user@example.com'; // Good
const ue = 'user@example.com'; // Bad

// Add comments for complex logic
```

### React/JSX

```javascript
// Use functional components
export default function MyComponent() {
  const [state, setState] = useState(null);

  return (
    <div className="container">
      <h1>Hello</h1>
    </div>
  );
}

// Use prop destructuring
export default function Card({ title, description, onClick }) {
  return <div onClick={onClick}>{title}</div>;
}
```

### CSS/Tailwind

```css
/* Use Tailwind utility classes */
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
</div>

/* Create components for reusable styles */
.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors;
}
```

## Commit Message Guidelines

```
<type>: <subject>

<body>

<footer>
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning
- **refactor**: Code change that neither fixes nor adds feature
- **perf**: Code change that improves performance
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, etc.

### Examples
```
feat: add user authentication with JWT

fix: prevent multiple report submissions

docs: update API documentation

refactor: reorganize database service layer
```

## Testing

### Backend Tests (Not yet implemented)

```bash
cd backend
npm test
```

### Frontend Tests (Not yet implemented)

```bash
cd frontend
npm test
```

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] Backend server starts without errors
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Scam checking works
- [ ] Report submission works
- [ ] Admin functions work (if you modified them)
- [ ] No console errors in browser
- [ ] No console errors in terminal
- [ ] Real-time Socket.io events work

## Documentation

- Update [README.md](README.md) for major changes
- Update [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API changes
- Update [SETUP.md](SETUP.md) for setup process changes
- Add inline comments for complex logic
- Document any new environment variables

## Areas for Contribution

### High Priority
- [ ] Add comprehensive test suite
- [ ] Improve error handling
- [ ] Add input validation on all endpoints
- [ ] Implement rate limiting
- [ ] Add activity logging
- [ ] Create admin user management interface
- [ ] Add email notifications

### Medium Priority
- [ ] Add more scam data sources
- [ ] Improve UI/UX design
- [ ] Add dark mode support
- [ ] Add multi-language support
- [ ] Create mobile app

### Low Priority
- [ ] Add avatar upload for users
- [ ] Create scam report templates
- [ ] Add data export features
- [ ] Create API client SDKs

## Getting Help

- **Discord/Community** (if available)
- **Open an issue** with the "question" label
- **Email maintainers** (if provided)
- **Check existing issues** for similar questions

## Recognition

Contributors will be recognized in:
- [CONTRIBUTORS.md](CONTRIBUTORS.md) (coming soon)
- Project README
- Release notes

## License

By contributing, you agree that your contributions will be licensed under the same MIT license as the project.

## Questions?

Don't hesitate to ask!
- Open an issue labeled "question"
- Check existing issues and discussions
- Read the documentation

---

Thank you for contributing to ScamShield! Together, we can make the internet safer. 🛡️
