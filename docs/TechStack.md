AI Study Planner
Technical Stack Document
1. Overview

The AI Study Planner is a web-based application that generates personalized study schedules using artificial intelligence. The system is built using a lightweight Python backend and a simple web frontend to ensure fast development and easy deployment during the hackathon.

2. Technology Stack
Frontend

HTML5 – page structure.

Tailwind CSS – responsive and modern styling.

JavaScript – form handling and user interaction.

Reason:
Lightweight, fast to build, and suitable for a hackathon environment.

Backend

Python

Flask

Reason:
Flask is a lightweight web framework that allows rapid development and easy integration with AI services.

AI Integration

OpenAI API

Purpose:
Used to generate personalized study schedules based on user inputs such as subjects, deadlines, and available study time.

Database (MVP)

SQLite (optional)

Reason:
Built into Python, requires no setup, and is sufficient for storing basic user data during the hackathon.

3. System Architecture
Frontend (HTML + Tailwind + JS)
        ↓
Flask Backend (Python)
        ↓
OpenAI API
        ↓
Generated Study Plan

4. Deployment

Recommended platforms:

Render

Railway

Replit

PythonAnywhere

These platforms support Python apps and allow quick deployment with minimal configuration.

5. Key Advantages of This Stack

Fast development cycle.

Minimal setup and configuration.

Easy AI integration.

Suitable for rapid prototyping.