AI Study Planner
Technical Design Document
1. System Overview

The AI Study Planner is a web-based application that generates personalized study schedules using AI.
Users input subjects, deadlines, and available time, and the system produces an optimized study plan.

The system follows a client–server architecture:

Frontend: User interface and input forms.

Backend: Logic, scheduling, and AI integration.

AI service: Generates intelligent study plans.

2. Chosen Tech Stack
Frontend

HTML5 – page structure.

Tailwind CSS – modern, responsive styling.

Vanilla JavaScript – form handling and UI interactions.

Reason for choice:

Fastest to build during a hackathon.

No heavy frameworks.

Easy to deploy.

Backend

Python

Flask

Reason for choice:

Lightweight and beginner-friendly.

Minimal setup.

Perfect for quick API creation.

Strong ecosystem for AI integration.

AI Integration

OpenAI API

Purpose:

Generate personalized study plans.

Adjust schedules based on user performance.

Reason for choice:

High-quality natural language planning.

Fast integration.

Reliable and scalable.

Database (Optional for MVP)

SQLite

Reason for choice:

Built into Python.

No setup required.

Perfect for small-scale hackathon apps.

3. System Architecture
High-Level Flow
User (Browser)
     ↓
Frontend (HTML + Tailwind + JS)
     ↓ HTTP Request
Flask Backend (Python)
     ↓
AI Logic (OpenAI API)
     ↓
Generated Study Plan
     ↓
Response to Frontend
     ↓
User Dashboard
4. Component Breakdown
4.1 Frontend Layer

Responsibilities:

Collect user inputs.

Send form data to backend.

Display generated study plan.

Key Pages:

Landing page.

Input form page.

Study plan dashboard.

4.2 Backend Layer (Flask)

Responsibilities:

Handle HTTP requests.

Process user data.

Call AI service.

Return study plans.

Main Endpoints:

Endpoint	Method	Purpose
/	GET	Load input form
/plan	POST	Generate study plan
4.3 AI Planning Module

Responsibilities:

Convert user inputs into structured prompts.

Generate optimized study schedules.

Return structured plan data.

Inputs:

Subjects.

Deadlines.

Available study time.

Confidence levels.

Outputs:

Daily study schedule.

Revision sessions.

4.4 Database Layer (Optional)

Responsibilities:

Store user plans.

Track progress.

Enable rescheduling.

Tables (basic design):

Users

id

name

email

StudyPlans

id

user_id

subject

deadline

daily_hours

5. Data Flow
Step-by-Step Flow

User enters subjects, deadlines, and study hours.

Frontend sends form data to Flask backend.

Backend processes inputs.

Backend sends prompt to OpenAI API.

AI generates a study plan.

Backend sends plan to frontend.

Frontend displays schedule on dashboard.

6. API Design (Internal)
Generate Plan

Endpoint:

POST /plan

Request:

{
  "subjects": ["Math", "Physics"],
  "daily_hours": 3,
  "deadline": "2026-03-10"
}

Response:

{
  "plan": [
    {"day": "Day 1", "task": "Math - Algebra"},
    {"day": "Day 2", "task": "Physics - Kinematics"}
  ]
}
7. Non-Functional Design Decisions
Category	Decision
Performance	Lightweight Flask server
Scalability	Modular AI integration
Security	API keys stored in environment variables
Usability	Minimal, distraction-free UI
Deployment	Single-service web app
8. Deployment Plan

Recommended Platform:

Render

Railway

Replit

PythonAnywhere

Deployment Steps:

Push code to GitHub.

Connect repo to hosting platform.

Install dependencies.

Run Flask app.

9. Future Architecture Improvements

Replace Flask with FastAPI for better performance.

Add user authentication.

Use PostgreSQL instead of SQLite.

Add background scheduling service.

Integrate calendar APIs.

10. Justification Summary
Component	Choice	Reason
Frontend	HTML + Tailwind	Fast, simple, responsive
Backend	Flask (Python)	Lightweight, AI-friendly
AI	OpenAI API	Intelligent planning
Database	SQLite	Zero-setup, built-in
Deployment	Render/Railway	Free, easy hosting