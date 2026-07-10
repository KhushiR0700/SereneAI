# SereneAI

> **Memory-Based AI Interview Coach for students and fresh graduates.**

SereneAI is an AI-powered interview preparation platform that helps users improve through adaptive mock interviews, personalized feedback, pronunciation coaching, and memory-based learning. Instead of assigning generic scores, it identifies improvement areas, remembers previous performance, and guides users through continuous interview practice.

---

# Overview

Traditional interview preparation platforms evaluate a session in isolation.

SereneAI approaches interview preparation differently by treating every session as part of a continuous learning journey. Previous interviews influence future practice, allowing users to improve consistently rather than repeatedly starting from scratch.

The platform combines AI-generated interview questions, detailed feedback, pronunciation analysis, growth analytics, and session memory into a single interview preparation experience.

---

# Core Features

## AI Mock Interviews

Practice interviews across technical and professional domains with AI-generated questions.

Supported interview types include:

* Technical Interviews
* HR Interviews
* Behavioral Interviews
* Mixed Interviews

Difficulty Levels:

* Easy
* Medium
* Hard

Question Types:

* Basic
* Conceptual
* Situational
* Advanced

Each interview includes dynamic follow-up questions generated from previous responses, creating a more realistic interview experience.

---

## Memory-Based Learning

SereneAI remembers previous interview sessions and adapts future practice accordingly.

The platform tracks:

* Previous interview history
* Weak concepts
* Communication improvement
* Technical progress
* Confidence development
* Pronunciation improvement

Future interviews become progressively more personalized based on past performance.

---

## AI Feedback Engine

Every response is evaluated using Google Gemini AI.

Evaluation includes:

* Communication
* Technical Accuracy
* Confidence
* Clarity
* Problem Solving
* Pronunciation

Each evaluation includes an explanation so users understand why they received a particular score instead of only seeing numerical results.

---

## Next 3 Fixes

Instead of overwhelming users with multiple recommendations, SereneAI prioritizes exactly three improvement areas ranked by impact.

This allows users to focus on meaningful progress after every interview.

---

## Voice Interview Mode

Practice interviews using voice interaction.

Workflow:

Record → Transcribe → Analyze → Evaluate

Voice evaluation includes:

* Speaking confidence
* Pronunciation
* Clarity
* Fluency
* Speaking pace
* Hesitation patterns
* Filler words

---

## Pronunciation Lab

Improve speaking clarity and pronunciation through AI-powered evaluation.

Features include:

* AI pronunciation feedback
* IPA phonetic notation
* Syllable breakdown
* Pronunciation history
* Progress tracking across sessions

---

## Growth Analytics

Track improvement across multiple interview sessions.

Analytics include:

* Communication Growth
* Technical Growth
* Confidence Trends
* Pronunciation Progress
* Domain Performance
* Practice Consistency
* Peer-Relative Analytics

---

## Interview Reports

Every completed interview generates a structured report including:

* Executive Summary
* Communication Analysis
* Technical Analysis
* Confidence Analysis
* Pronunciation Analysis
* Strengths
* Weaknesses
* Missing Concepts
* Hiring Readiness
* Action Plan
* Model Answer
* Recruiter-Oriented Feedback
* Next 3 Fixes

Reports can also be exported for future reference.

---

## Interview Replay

Review completed interview sessions using timestamp-based commentary.

Replay highlights communication gaps, hesitation points, weak explanations, and technical mistakes to make future practice more effective.

---

# Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

## Backend

* Python
* FastAPI

## Database

* Supabase (PostgreSQL)

## Authentication

* Supabase Auth

## Artificial Intelligence

* Google Gemini API

## Voice Processing

* Web Speech API

## Version Control

* Git
* GitHub

---

# Architecture

```text
React + Vite Frontend
          │
          ▼
Supabase Authentication
          │
          ▼
FastAPI Backend
          │
 ┌──────────────────────┐
 │ Question Service
 │ Feedback Service
 │ Memory Service
 │ Pronunciation Engine
 └──────────────────────┘
          │
          ▼
Google Gemini API
          │
          ▼
Supabase Database
```

---

# Project Structure

```text
SereneAI
│
├── backend/
│   ├── app/
│   ├── api/
│   ├── services/
│   ├── data/
│   └── requirements.txt
│
├── src/
├── supabase/
├── package.json
├── vite.config.ts
└── README.md
```

---

# Getting Started

## Clone the Repository

```bash
git clone https://github.com/KhushiR0700/SereneAI.git
```

## Frontend

```bash
npm install

npm run dev
```

## Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

# Environment Variables

Frontend

```env
VITE_SUPABASE_URL=

VITE_SUPABASE_ANON_KEY=
```

Backend

```env
GEMINI_API_KEY=

SUPABASE_URL=

SUPABASE_SERVICE_KEY=
```

---

# Supported Domains

SereneAI supports interview preparation across more than thirty technical and professional domains, including:

* Python
* Java
* JavaScript
* React
* Node.js
* Express
* MERN Stack
* C++
* SQL
* DBMS
* Operating Systems
* Computer Networks
* Artificial Intelligence
* Machine Learning
* Docker
* Cloud Computing
* DevOps
* HR Interviews
and many more.. 


---

# Roadmap

* Resume-aware interview generation
* Company-specific interview preparation
* Group Discussion Simulator
* Mobile Application
* Multi-language Support
* AI Study Roadmaps

---

# Developer

**Khushi Raut**

Computer Science Engineering Student

Built using React, FastAPI, Supabase, and Google Gemini AI.

---

*"Confidence is built through consistent practice, not memorization."*
