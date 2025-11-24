# AurelAI - AI-Powered Code Review Assistant

AurelAI is a standalone web application that provides intelligent, contextual code review feedback. It allows users to select specific blocks of code and receive AI-generated suggestions and improvements in an inline conversation thread.

## Features

- **Code Editor**: Full-featured code editor powered by Monaco Editor (VS Code's editor).
- **Contextual AI**: Select any code block to ask AI for feedback. The AI understands the surrounding context.
- **Inline Threads**: Conversations happen right next to the code, visually tied to the selected block.
- **Multiple Threads**: Support for multiple independent discussions on the same file.
- **Mock & Real AI**: Comes with a mock AI service for demonstration, but includes an OpenAI implementation that can be enabled.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository (if applicable) or navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open your browser to `http://localhost:5173`.

## Architecture

- **Frontend**: React + Vite + TypeScript
- **Editor**: `@monaco-editor/react`
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Icons**: Lucide React

### Key Decisions

- **Monaco Editor**: Chosen for its robust API regarding "View Zones" and "Content Widgets", which are essential for rendering inline React components (threads) that push code down.
- **Portals**: We use `ReactDOM.createPortal` to render React components into the DOM nodes created by Monaco's View Zones.
- **Zustand**: Used for global state management (threads, selection) to avoid prop drilling and complex context providers.

## AI Integration

The project uses a `MockAIService` by default to demonstrate functionality without needing an API key. To use real OpenAI:

1. Open `src/services/ai.ts`.
2. Instantiate `OpenAIService` with your API key instead of `MockAIService`.

```typescript
export const aiService = new OpenAIService('your-api-key');
```

## Future Improvements

- **Persisted State**: Save threads to local storage or a backend.
- **Diff View**: Allow AI to propose changes and show a diff.
- **Language Detection**: Automatically detect language based on file extension or content.
