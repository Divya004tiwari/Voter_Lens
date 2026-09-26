# VoterLens 🗳️

VoterLens is a full-stack political accountability and civic engagement platform that enables citizens to discuss governance, report civic issues, participate in polls, and explore political leaders and civic concerns across India's administrative hierarchy.

## ✨ Features

* 🔐 **User Authentication** — Firebase Authentication
* 👤 **User Profiles** — Public and anonymous participation modes
* 📰 **Political Discussion Feed** — Create and engage with civic and political discussions
* 🏛️ **Civic Issue Reporting** — Report and track local civic issues
* 👥 **Political Leader Profiles** — Explore leader-related discussions and performance information
* 🏳️ **Political Party Pages** — Party-related information and discussions
* 📊 **Polling System** — Create and participate in opinion polls
* ⭐ **Reputation System** — User reputation and engagement tracking
* 🛡️ **Role-Based Moderation** — Moderator and administrator controls
* 📍 **Location-Based Discussions** — Organize civic discussions by locality
* 📈 **Analytics Dashboard** — Visualize platform and civic engagement data
* 🤖 **AI-Assisted Analysis** — Gemini-powered sentiment analysis, moderation assistance, misinformation warnings, summaries, and issue clustering

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Tailwind CSS
* Recharts
* Motion
* Lucide React

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* Firebase Cloud Firestore

### Authentication & Security

* Firebase Authentication
* Firestore Security Rules
* Role-Based Access Control

### Generative AI

* Google Gemini API
* `@google/genai`
* Prompt Engineering
* Structured JSON Responses

### Build & Deployment

* Vite
* esbuild
* Vercel
* Firebase

## 🤖 AI Integration

VoterLens integrates Google's Gemini API through a Node.js and Express.js backend.

The Gemini API is used to provide AI-assisted analysis of civic and political content.

### AI Capabilities

#### 1. Sentiment Analysis

Political and civic discussions can be analyzed and categorized as:

* Positive
* Negative
* Neutral

The model also returns a confidence value and a short rationale.

#### 2. Content Moderation Assistance

The application can analyze posts and comments for potential:

* Hate speech
* Abusive language
* Harassment
* Threats
* Potential misinformation

The result is returned as structured JSON that can be used by the platform's moderation workflow.

#### 3. Misinformation Warnings

VoterLens can analyze political posts, news-style content, and civic complaints for potentially misleading or unverified claims and generate a warning message and explanation.

This is an **AI-assisted warning system, not a definitive fact-checking system**.

#### 4. Civic Summaries

Gemini can generate summaries for:

* Geographic areas
* Political leaders

The generated response includes overall sentiment, major issue categories, development highlights, a civic evaluation score, and community advice.

#### 5. Civic Issue Clustering

Similar civic complaints can be grouped together based on their titles, descriptions, categories, and locality.

For example, multiple reports about the same water-supply problem can be grouped into a common issue cluster.

### AI Request Flow

```text
React Frontend
      │
      │ AI request
      ▼
Node.js + Express
      │
      │ Prompt + user content
      ▼
Google Gemini API
      │
      │ Structured JSON response
      ▼
Node.js + Express
      │
      ▼
React Frontend
```

The Gemini client is initialized on the server using the `GEMINI_API_KEY` environment variable, keeping the credential out of frontend code.

## 🔐 Security

VoterLens uses Firebase Authentication and Firestore Security Rules to control access to application data.

The Firestore rules include:

* Authentication checks
* User ownership validation
* Role-based permissions
* Moderator/Administrator authorization
* Document ID validation
* Field-level update restrictions
* Author ownership checks
* Content length restrictions

For example, users can modify their own posts while moderator/administrator users have additional moderation permissions.

The repository also documents security scenarios such as identity spoofing, role escalation, comment spoofing, vote hijacking, and unauthorized modification of moderation fields.

## 📁 Project Structure

```text
Voter_Lens/
│
├── src/
│   └── Frontend React + TypeScript application
│
├── server.ts
│   └── Express server
│   └── Gemini API integration
│   └── AI endpoints
│
├── firestore.rules
│   └── Firestore security rules
│
├── firebase-applet-config.json
│   └── Firebase configuration
│
├── .env.example
│   └── Environment variable template
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Divya004tiwari/Voter_Lens.git
cd Voter_Lens
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file and configure the required environment variables.

```env
GEMINI_API_KEY=your_gemini_api_key
```

Do not commit real API keys or other sensitive credentials to GitHub.

The repository includes an `.env.example` file containing the Gemini API key configuration.

### 4. Run the development server

```bash
npm run dev
```

The project starts the Vite/Express development server on:

```text
http://localhost:3000
```

### 5. Build for production

```bash
npm run build
```

### 6. Start the production build

```bash
npm start
```

The project uses Vite for the frontend build and esbuild to bundle the Express server.

## 🚀 Future Enhancements

* Government Response Portal
* Issue Escalation Workflow
* Image Evidence Upload
* Source-grounded fact verification
* Advanced moderation workflows
* Mobile Application
* Improved scalability for high-volume AI requests

## ⚠️ AI Limitations

AI-generated results are probabilistic and should not automatically be treated as verified facts.

In particular, the misinformation feature provides **warnings based on model analysis** rather than independently proving that a claim is false.

For a production system, the AI layer could be extended with:

* Retrieval from authoritative sources
* Human moderation
* Rate limiting
* Input validation
* Asynchronous AI processing
* Better output validation
* Monitoring and evaluation of AI responses

## 📄 License

This project was developed for educational and portfolio purposes.
