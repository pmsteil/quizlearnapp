# Frontend Chat Architecture

## Overview

The frontend chat system needs to be enhanced to support the new AI-powered chat functionality. The system will integrate with the Langchain-based backend while maintaining a clean separation of concerns.

## Current Implementation

The current chat implementation consists of:
- `ChatInterface.tsx`: A reusable component for displaying messages and handling user input
- `ChatMessage.tsx`: A component for rendering individual chat messages
- Basic REST endpoints for sending/receiving messages

## Required Changes

### 1. New Components

```typescript
frontend/
  ├── src/
  │   ├── components/
  │   │   ├── shared/
  │   │   │   ├── ChatInterface.tsx        # (existing) Base chat UI
  │   │   │   └── ChatTypingIndicator.tsx  # (new) Shows when AI is thinking
  │   │   ├── topic/
  │   │   │   ├── ChatMessage.tsx          # (existing) Message display
  │   │   │   └── AIResponseActions.tsx    # (new) Actions for AI responses
  │   │   └── lesson/
  │   │       └── LessonChatContainer.tsx  # (new) Lesson-specific chat logic
  │   ├── lib/
  │   │   ├── api/
  │   │   │   └── chat.ts                  # Enhanced API client
  │   │   └── hooks/
  │   │       └── useChat.ts               # Chat management hook
  │   └── types/
  │       └── chat.ts                      # Enhanced type definitions
```

### 2. Enhanced Message Types

```typescript
// types/chat.ts
export interface Message {
  id: string;
  type: 'user' | 'agent_lesson_goal' | 'agent_question' | 'agent_teaching';
  content: string;
  timestamp: number;
  metadata?: {
    questionNumber?: number;
    isCorrect?: boolean;
    agentId?: string;
    lessonId?: string;
  };
}
```

### 3. API Integration

The frontend needs to integrate with these new backend endpoints:
- `/api/lessons/{lesson_id}/agent-lesson-teacher`
- `/api/lessons/{lesson_id}/agent-lesson-evaluator`

### 4. State Management

Chat state will be managed using a custom hook:

```typescript
// hooks/useChat.ts
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
}

interface ChatActions {
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  retryLastMessage: () => Promise<void>;
}
```

### 5. Real-time Features

- Typing indicators when AI is processing
- Progressive message rendering for streaming responses
- Error handling with retry capabilities
- Message persistence across page reloads

## Chat Message Rendering

### ChatRenderer Class

The `ChatRenderer` class will be responsible for processing and rendering all types of chat messages. It will handle different message types, content formats, and interactive elements.

```typescript
// lib/chat/ChatRenderer.ts
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { PrismAsync as SyntaxHighlighter } from '@uiw/react-prismjs';
import type { Message, MessageType } from '../types/chat';

interface RenderOptions {
  enableMath?: boolean;
  enableSyntaxHighlighting?: boolean;
  enableInteractivity?: boolean;
}

export class ChatRenderer {
  private options: RenderOptions;
  
  constructor(options: RenderOptions = {}) {
    this.options = {
      enableMath: true,
      enableSyntaxHighlighting: true,
      enableInteractivity: true,
      ...options
    };
  }

  /**
   * Main entry point for rendering chat messages
   */
  public render(message: Message): JSX.Element {
    const contentElement = this.renderContent(message.content);
    return this.wrapWithMessageContainer(contentElement, message);
  }

  /**
   * Renders the message content based on type and format
   */
  private renderContent(content: string): JSX.Element {
    return (
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          ...(this.options.enableMath ? [remarkMath] : [])
        ]}
        rehypePlugins={[
          ...(this.options.enableMath ? [rehypeKatex] : [])
        ]}
        components={{
          code: this.renderCodeBlock.bind(this),
          table: this.renderTable.bind(this),
          img: this.renderImage.bind(this),
          a: this.renderLink.bind(this)
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  /**
   * Renders code blocks with syntax highlighting
   */
  private renderCodeBlock({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    
    // Handle special blocks
    if (match && ['question', 'explanation', 'hint', 'important', 'example', 'quiz', 'exercise', 'reference'].includes(match[1])) {
      return this.renderSpecialBlock(match[1], String(children));
    }

    // Handle regular code blocks
    if (!inline && match && this.options.enableSyntaxHighlighting) {
      return (
        <div className="code-block-wrapper">
          <div className="code-block-header">
            <span className="language-tag">{match[1]}</span>
            <button onClick={() => this.copyToClipboard(String(children))}>
              Copy
            </button>
          </div>
          <SyntaxHighlighter
            language={match[1]}
            showLineNumbers={true}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  /**
   * Renders tables with proper styling
   */
  private renderTable({ children, ...props }: any) {
    return (
      <div className="table-wrapper">
        <table className="markdown-table" {...props}>
          {children}
        </table>
      </div>
    );
  }

  /**
   * Renders images with lazy loading and error handling
   */
  private renderImage({ src, alt, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={this.handleImageError}
        {...props}
      />
    );
  }

  /**
   * Renders links with proper security attributes
   */
  private renderLink({ href, children, ...props }: any) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  /**
   * Wraps the rendered content in a message container with proper styling
   */
  private wrapWithMessageContainer(
    content: JSX.Element,
    message: Message
  ): JSX.Element {
    const isUser = message.type === 'user';
    return (
      <div
        className={`message-container ${isUser ? 'user' : 'agent'}`}
        data-message-type={message.type}
      >
        <div className="message-content">
          {this.renderMessageHeader(message)}
          {content}
          {this.renderMessageFooter(message)}
        </div>
      </div>
    );
  }

  /**
   * Renders the message header (avatar, name, timestamp)
   */
  private renderMessageHeader(message: Message): JSX.Element {
    return (
      <div className="message-header">
        {this.renderAvatar(message)}
        <span className="sender-name">
          {this.getSenderName(message)}
        </span>
        <span className="timestamp">
          {this.formatTimestamp(message.timestamp)}
        </span>
      </div>
    );
  }

  /**
   * Renders interactive elements in the message footer
   */
  private renderMessageFooter(message: Message): JSX.Element | null {
    if (!this.options.enableInteractivity) return null;

    return (
      <div className="message-footer">
        {message.type === 'agent_question' && (
          <div className="question-actions">
            {this.renderQuestionActions(message)}
          </div>
        )}
        {/* Add other message-type-specific footers here */}
      </div>
    );
  }

  /**
   * Renders special content blocks (question, explanation, etc.)
   */
  private renderSpecialBlock(type: string, content: string): JSX.Element {
    switch (type) {
      case 'quiz':
        return this.renderQuizBlock(JSON.parse(content));
      case 'exercise':
        return this.renderExerciseBlock(JSON.parse(content));
      case 'reference':
        return this.renderReferenceBlock(JSON.parse(content));
      default:
        return (
          <div className={`special-block ${type}`}>
            <div className="special-block-header">
              {this.getSpecialBlockIcon(type)}
              <span className="special-block-title">
                {this.getSpecialBlockTitle(type)}
              </span>
            </div>
            <div className="special-block-content">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        );
    }
  }

  /**
   * Renders an interactive quiz block
   */
  private renderQuizBlock(quiz: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }): JSX.Element {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    return (
      <div className="quiz-block">
        <div className="quiz-question">{quiz.question}</div>
        <div className="quiz-options">
          {quiz.options.map((option, index) => (
            <button
              key={index}
              className={`quiz-option ${
                selectedOption === index
                  ? index === quiz.correct
                    ? 'correct'
                    : 'incorrect'
                  : ''
              }`}
              onClick={() => {
                setSelectedOption(index);
                setShowExplanation(true);
              }}
              disabled={selectedOption !== null}
            >
              {option}
            </button>
          ))}
        </div>
        {showExplanation && (
          <div className="quiz-explanation">
            <div className="quiz-result">
              {selectedOption === quiz.correct ? '✅ Correct!' : '❌ Incorrect'}
            </div>
            {quiz.explanation}
          </div>
        )}
      </div>
    );
  }

  /**
   * Renders an interactive exercise block
   */
  private renderExerciseBlock(exercise: {
    task: string;
    starter_code: string;
    test_cases: Array<{ input: string; expected: string }>;
  }): JSX.Element {
    const [code, setCode] = useState(exercise.starter_code);
    const [results, setResults] = useState<Array<{ passed: boolean; output: string }>>([]);

    return (
      <div className="exercise-block">
        <div className="exercise-task">{exercise.task}</div>
        <div className="exercise-editor">
          <MonacoEditor
            value={code}
            onChange={setCode}
            language="python"
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              fontSize: 14,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
        <div className="exercise-actions">
          <button
            onClick={() => this.runExercise(code, exercise.test_cases)}
            className="run-button"
          >
            Run Tests
          </button>
        </div>
        {results.length > 0 && (
          <div className="exercise-results">
            {results.map((result, index) => (
              <div key={index} className={`test-result ${result.passed ? 'passed' : 'failed'}`}>
                <span className="test-number">Test {index + 1}:</span>
                <span className="test-status">
                  {result.passed ? '✅ Passed' : '❌ Failed'}
                </span>
                <div className="test-output">{result.output}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /**
   * Renders a reference block with link
   */
  private renderReferenceBlock(reference: {
    type: string;
    url: string;
    title: string;
    relevance: string;
  }): JSX.Element {
    return (
      <div className="reference-block">
        <div className="reference-header">
          <span className="reference-type">{reference.type}</span>
          <a
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
            className="reference-link"
          >
            {reference.title}
          </a>
        </div>
        <div className="reference-relevance">{reference.relevance}</div>
      </div>
    );
  }

  /**
   * Gets the appropriate icon for special blocks
   */
  private getSpecialBlockIcon(type: string): JSX.Element {
    const icons = {
      question: <QuestionMarkCircleIcon />,
      explanation: <BookOpenIcon />,
      hint: <LightBulbIcon />,
      important: <ExclamationCircleIcon />,
      example: <CodeIcon />
    };
    return icons[type as keyof typeof icons] || <DocumentIcon />;
  }

  /**
   * Gets the title for special blocks
   */
  private getSpecialBlockTitle(type: string): string {
    const titles = {
      question: 'Question',
      explanation: 'Explanation',
      hint: 'Hint',
      important: 'Important',
      example: 'Example'
    };
    return titles[type as keyof typeof titles] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  // Utility methods
  private copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Show copy confirmation toast
  }

  private handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    img.src = '/images/fallback-image.png';
  }

  private getSenderName(message: Message): string {
    // Logic to get sender name based on message type
    return message.type === 'user' ? 'You' : 'AI Teacher';
  }

  private formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }
}

// Usage example:
const renderer = new ChatRenderer({
  enableMath: true,
  enableSyntaxHighlighting: true,
  enableInteractivity: true
});

function ChatMessage({ message }: { message: Message }) {
  return renderer.render(message);
}
```

This `ChatRenderer` class provides:

1. **Single Responsibility**: One class to handle all message rendering
2. **Configurability**: Options to enable/disable features
3. **Extensibility**: Easy to add new message types and rendering features
4. **Consistency**: Unified styling and behavior across all messages
5. **Performance**: Optimized rendering with proper React components
6. **Security**: Built-in sanitization and security measures
7. **Accessibility**: Proper ARIA attributes and semantic HTML
8. **Interactivity**: Handles user interactions like code copying
9. **Error Handling**: Graceful fallbacks for failed images or renders

The class can be instantiated once and reused across the application, ensuring consistent rendering of all chat messages.

## Message Formatting

- Markdown support for AI responses:
  - Code blocks with syntax highlighting
  - Math equations using KaTeX or MathJax
  - Tables and lists
  - Links and references
- Rich text features:
  - Code syntax highlighting using Prism.js
  - Automatic link detection
  - Image embedding (if needed)
- Copy functionality for code blocks
- Expandable/collapsible long messages

## Recommended Libraries

### Core Markdown Processing
- **react-markdown**: Popular, well-maintained React component for rendering Markdown
  - Lightweight and extensible
  - Good TypeScript support
  - Supports GitHub Flavored Markdown
  - Customizable rendering for each element type

### Syntax Highlighting
- **Prism.js** with **@uiw/react-prismjs**:
  - Extensive language support
  - Multiple themes available
  - Line numbers and line highlighting
  - Copy button functionality built-in

### Math Equations
- **KaTeX** with **react-katex**:
  - Faster than MathJax
  - Works without JavaScript
  - Supports most LaTeX math syntax
  - Better performance for simple equations

### Additional Enhancements
- **remark-gfm**: GitHub Flavored Markdown support (tables, strikethrough, etc.)
- **remark-math**: Math equation parsing for Markdown
- **rehype-raw**: HTML parsing within Markdown
- **rehype-sanitize**: Security sanitization for HTML content

### Code Example

```typescript
// components/shared/MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { PrismAsync as SyntaxHighlighter } from '@uiw/react-prismjs';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              language={match[1]}
              showLineNumbers={true}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

This combination of libraries provides a robust solution for all our content formatting needs while maintaining good performance and extensibility.

## Implementation Plan

1. Update existing `ChatInterface.tsx` to support new message types
2. Create new components for AI-specific features
3. Implement enhanced API client with proper error handling
4. Add real-time features and typing indicators
5. Update state management to handle AI agent responses

## Security Considerations

- All API requests must include proper authentication
- Sensitive information (agent IDs, user data) must be properly handled
- Rate limiting should be implemented on the client side
- Input validation before sending messages

## Performance Optimizations

- Implement message pagination for long conversations
- Optimize re-renders using React.memo and useMemo
- Cache recent conversations in localStorage
- Implement proper error boundaries

## Testing Strategy

- Unit tests for all new components
- Integration tests for API interactions
- End-to-end tests for complete chat flows
- Performance testing for real-time features
