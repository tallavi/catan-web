# Catan Web App

A web-based implementation of the Catan board game, built with React, TypeScript, and Vite.

## 🚀 Quick Start

### Prerequisites
- Node.js 24 LTS (installed via nvm)
- VS Code with React Development profile

### Installation & Development

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd catan-web
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser

3. **Build for production:**
   ```bash
   npm run build
   ```

## 🎯 Current Status

Currently contains a **hello world React app** for experimentation and testing the development setup. This allows you to:

- ✅ Test React + TypeScript development
- ✅ Experiment with components and state
- ✅ Verify ESLint and Prettier setup
- ✅ Test Hot Module Replacement (HMR)
- ✅ Practice with modern React hooks

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite
- **Linting:** ESLint
- **Formatting:** Prettier
- **Development:** Hot Module Replacement

## 📁 Project Structure

```
catan-web/
├── src/
│   ├── core/          # Game logic (future)
│   ├── components/    # React components (future)
│   ├── hooks/         # Custom React hooks (future)
│   ├── states/        # Game state management (future)
│   ├── App.tsx        # Main app component
│   ├── App.css        # App styles
│   └── main.tsx       # React entry point
├── public/            # Static assets
├── .vscode/           # VS Code configuration
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite configuration
└── eslint.config.js   # ESLint configuration
```

## 🎮 Next Steps

When ready to implement the Catan game:

1. Review the implementation plan in `TODO.md`
2. Port Python game logic to TypeScript
3. Build React components for the game UI
4. Implement state management and game flow

## 📝 Development Notes

- Uses VS Code "React Development" profile for optimal experience
- Auto-formatting on save with Prettier
- ESLint for code quality
- Hot reload for instant feedback

## 🤝 Contributing

1. Use the "React Development" VS Code profile
2. Follow the existing code style (Prettier handles formatting)
3. Run `npm run dev` for development
4. Test in multiple browsers

## 📄 License

MIT License - see LICENSE file for details
