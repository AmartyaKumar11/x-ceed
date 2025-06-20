# X-Ceed Video AI Assistant - Tech Stack

> **Last Updated:** June 20, 2025  
> **Project Version:** 0.1.0  
> **Status:** Active Development

## 🚀 Project Overview

X-Ceed is an AI-powered video learning assistant that helps users analyze YouTube videos, create notes, manage projects, and maintain conversation history with cloud persistence.

---

## 🎯 Frontend Technologies

### Core Framework
- **Next.js 15** - React framework with App Router architecture
- **React 18** - Modern UI library with hooks and server components
- **JavaScript ES6+** - Modern JavaScript with async/await, modules, destructuring

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **PostCSS** - CSS processing and transformation
- **Lucide React** - Beautiful, customizable SVG icon library
- **Responsive Design** - Mobile-first approach with breakpoint utilities

### State Management
- **React Hooks** - useState, useEffect, useCallback, useRef for state management
- **Context API** - For global state sharing across components
- **localStorage** - Browser storage for offline fallback

---

## ⚡ Backend & Server Technologies

### Server Framework
- **Next.js API Routes** - Server-side API endpoints with file-based routing
- **Node.js** - JavaScript runtime environment
- **FastAPI** - High-performance Python web framework for AI services
- **Python 3.12** - Backend language for AI and data processing

### API Architecture
- **RESTful APIs** - Standard HTTP methods for CRUD operations
- **Microservices** - Separated Python AI services for scalability
- **Service-to-Service Communication** - HTTP-based inter-service communication

---

## 🗄️ Database & Storage Solutions

### Primary Database
- **Firebase Firestore** - NoSQL cloud database for real-time chat history
  - Collections: `chatSessions`, `chatMessages`
  - Real-time synchronization
  - Offline support with local caching

### Secondary Storage
- **MongoDB** - Document database for application data
  - URI: `mongodb://localhost:27017/x-ceed-db`
  - Used for user profiles and job-related data

### Client Storage
- **localStorage** - Browser storage as Firestore fallback
- **sessionStorage** - Temporary data during user sessions

---

## 🤖 AI & Machine Learning Stack

### AI Service Providers
- **Groq AI** - Ultra-fast AI inference engine for chat responses
  - Model: High-speed language model processing
  - Use case: Real-time conversation generation

- **Google Gemini API** - Advanced AI for job description parsing
  - Multimodal AI capabilities
  - Natural language understanding

### AI Architecture
- **RAG (Retrieval Augmented Generation)** - Context-aware AI responses
- **LangChain Community** - Framework for complex AI workflows
- **Vector Embeddings** - For semantic search and content matching
- **Python AI Services** - Dedicated microservices for AI processing
  - Port 8000: RAG Service
  - Port 8005: Video AI Service

---

## ☁️ Cloud Services & APIs

### Google Cloud Platform
- **Google Drive API** - File storage and document management
- **Google Docs API** - Programmatic document creation and editing
- **Google Service Account** - Server-to-server authentication
- **YouTube Data API v3** - Video metadata, suggestions, and analytics

### Firebase Services
- **Firebase Authentication** - (Planned) User authentication system
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase Storage** - File storage for screenshots and media
- **Firebase Hosting** - Static asset hosting capabilities

---

## 🔌 External API Integrations

### News & Content
- **NewsAPI** - Real-time technology news integration
  - Live feed updates
  - Content filtering and categorization

### Video Processing
- **YouTube API** - Video analysis and metadata extraction
- **Custom Video Analysis** - Python-based video content processing

---

## 🛠️ Development Tools & Configuration

### Code Quality
- **ESLint** - JavaScript/TypeScript linting with custom configs
- **Prettier** - Code formatting and style consistency
- **JSConfig** - JavaScript project configuration

### Build Tools
- **Next.js Build System** - Optimized production builds
- **Webpack** - Module bundling (via Next.js)
- **Babel** - JavaScript transpilation (via Next.js)

### Package Management
- **npm** - Node package manager
- **package.json** - Dependency management and scripts

---

## 🔒 Security & Authentication

### Authentication Methods
- **JWT (JSON Web Tokens)** - Stateless authentication tokens
- **Google Service Account** - Secure server-side API access
- **API Key Management** - Environment-based credential storage

### Security Practices
- **Environment Variables** - Secure credential management
- **.gitignore Protection** - Prevents credential exposure
- **HTTPS Enforcement** - Secure data transmission
- **CORS Configuration** - Cross-origin request security

---

## 📦 Key Dependencies

### Production Dependencies
```json
{
  "next": "^15.0.0",
  "react": "^18.0.0",
  "firebase": "^11.9.1",
  "googleapis": "^150.0.1",
  "@langchain/community": "^0.3.46",
  "lucide-react": "latest",
  "tailwindcss": "latest"
}
```

### Development Dependencies
```json
{
  "eslint": "latest",
  "postcss": "latest",
  "typescript": "latest"
}
```

---

## 🏗️ Architecture Patterns

### Design Patterns
- **Component-Based Architecture** - Modular, reusable React components
- **API-First Design** - Backend services exposed via REST APIs
- **Separation of Concerns** - Clear boundaries between UI, business logic, and data
- **Microservices Architecture** - Independent, scalable service components

### Data Flow
```
User Interface (React) 
    ↓
Next.js API Routes 
    ↓
External APIs / Databases
    ↓
AI Processing Services (Python)
    ↓
Response & Storage
```

---



## 📊 Monitoring & Analytics

### Performance Monitoring
- **Next.js Analytics** - Built-in performance metrics
- **Firebase Analytics** - User behavior tracking (when enabled)
- **Console Logging** - Development debugging and error tracking

---

## 🔄 Recent Updates

### June 20, 2025
- ✅ **Firebase Firestore Integration** - Added cloud-based chat history persistence
- ✅ **Chat Session Management** - Per-video chat isolation with real-time sync
- ✅ **Service Account Setup** - Configured Google Drive integration
- ✅ **API Route Enhancement** - Added GET/POST/DELETE endpoints for chat sessions
- ✅ **Security Configuration** - Protected environment variables and credentials

---

## 🎯 Upcoming Technologies (Planned)

### Short Term
- [ ] **User Authentication** - Firebase Auth integration
- [ ] **Real-time Chat** - WebSocket implementation
- [ ] **File Upload System** - Direct media handling
- [ ] **Caching Layer** - Redis for improved performance

### Long Term  
- [ ] **Mobile App** - React Native implementation
- [ ] **AI Model Training** - Custom model fine-tuning
- [ ] **Analytics Dashboard** - Usage metrics and insights
- [ ] **Multi-language Support** - Internationalization

---

## 📚 Documentation Standards

This tech stack document follows these principles:
- **Version Control** - Track all technology additions/removals
- **Detailed Descriptions** - Explain the purpose of each technology
- **Regular Updates** - Maintain accuracy with project evolution
- **Future Planning** - Include roadmap and planned technologies

---

**Maintainer:** X-Ceed Development Team  
**Repository:** Private Development  
**License:** Proprietary
