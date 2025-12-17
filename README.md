# AurelAI - AI-Powered Code Review Assistant

AurelAI is a standalone web application that provides intelligent, contextual code review feedback. It allows users to select specific blocks of code and receive AI-generated suggestions and improvements in an inline conversation thread.

## Features

- **Code Editor**: Full-featured code editor powered by Monaco Editor (VS Code's editor).
- **Contextual AI**: Select any code block to ask AI for feedback. The AI understands the surrounding context.
- **Inline Threads**: Conversations happen right next to the code, visually tied to the selected block.
- **Multiple Threads**: Support for multiple independent discussions on the same file.
- **Resizable Chat Panel**: Drag the divider between the editor and chat panel to customize the layout.
- **Specific Feedback**: AI provides actionable, code-specific suggestions rather than generic advice.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm
- OpenAI API key (required for AI functionality)

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

### Running Tests

```bash
npm run test        # Watch mode
npm run test:run    # Single run
```

## Architecture

- **Frontend**: React 19 + Vite + TypeScript
- **Editor**: `@monaco-editor/react`
- **Styling**: TailwindCSS 4
- **State Management**: Zustand with localStorage persistence
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

### Key Decisions

- **Monaco Editor**: Chosen for its robust API regarding "View Zones" and "Content Widgets", which are essential for rendering inline React components (threads) that push code down.
- **Portals**: We use `ReactDOM.createPortal` to render React components into the DOM nodes created by Monaco's View Zones.
- **Zustand**: Used for global state management (threads, selection) to avoid prop drilling and complex context providers.

## AI Integration

AurelAI requires an OpenAI API key to function. To configure:

1. Click the Settings icon in the header
2. Enter your OpenAI API key (starts with `sk-`)
3. Save settings

The AI service uses GPT-4o with enhanced prompts that:
- Reference specific function names, variables, and line numbers
- Provide actionable suggestions rather than generic advice
- Focus on bugs, security, performance, and code quality

## Resizable Chat Panel

The chat panel can be resized by dragging the horizontal divider between the code editor and chat area:
- Minimum height: 15% of viewport
- Maximum height: 80% of viewport
- Default: 40% of viewport

## Future Improvements

- **Persisted Panel Size**: Save panel height preference to localStorage.
- **Horizontal Layout**: Option for side-by-side editor/chat layout.
