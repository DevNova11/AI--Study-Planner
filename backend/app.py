from datetime import date, datetime, timedelta
from pathlib import Path
import json
import os
import sqlite3
from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
DB_PATH = BASE_DIR / "data" / "app.db"

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret")
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
CORS(app)


def _get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = _get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    conn.commit()
    conn.close()


def _current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    conn = _get_db()
    user = conn.execute(
        "SELECT id, name, email FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    conn.close()
    return user


def _parse_date(value: str, default: date) -> date:
    if not value:
        return default
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return default


def _normalize_subjects(raw_subjects):
    subjects = []
    for item in raw_subjects or []:
        name = str(item.get("name", "")).strip()
        hours = float(item.get("hours", 0) or 0)
        if name and hours > 0:
            subjects.append({"name": name, "hours": hours})
    return subjects


def _generate_plan(subjects, start_date: date, end_date: date, hours_per_day: float):
    if not subjects:
        return []

    total_days = max((end_date - start_date).days + 1, 1)
    hours_per_day = max(hours_per_day, 0.5)

    # Calculate total hours needed
    total_hours = sum(item["hours"] for item in subjects)
    if total_hours == 0:
        return []

    # Distribute flexibly across days
    ideal_hours_per_day = total_hours / total_days
    
    # If we have surplus days, add strategic break days in the middle
    break_days_count = 0
    insert_break_at = total_days // 2
    
    if total_days > 5 and ideal_hours_per_day < hours_per_day * 0.6:
        break_days_count = max(1, total_days // 7)
    
    # Create a working copy of subjects with rounded hours
    remaining = [{"name": item["name"], "hours": round(float(item["hours"]), 2), "order": i} 
                 for i, item in enumerate(subjects)]
    schedule = []
    current_date = start_date
    study_day_index = 0  # Track which study day we're on (excluding breaks)

    for day_num in range(total_days):
        # Decide if this should be a break day
        is_break_day = (
            break_days_count > 0 
            and day_num >= insert_break_at 
            and day_num < insert_break_at + break_days_count
        )
        
        if is_break_day:
            schedule.append({
                "date": current_date.isoformat(),
                "sessions": [{"subject": "Break", "hours": 0}],
                "hoursPlanned": 0,
                "type": "break"
            })
        else:
            # Calculate adaptive hours for this study day
            remaining_study_days = sum(1 for d in range(day_num, total_days) 
                                       if not (break_days_count > 0 and 
                                              d >= insert_break_at and 
                                              d < insert_break_at + break_days_count))
            remaining_hours = sum(item["hours"] for item in remaining if item["hours"] > 0.01)
            
            if remaining_hours > 0.01 and remaining_study_days > 0:
                day_hours_target = min(hours_per_day, remaining_hours / remaining_study_days * 1.15)
            else:
                day_hours_target = 0
            
            sessions = []
            day_hours_used = 0
            
            # Sort by remaining hours (descending) to tackle harder subjects first
            sorted_remaining = sorted([s for s in remaining if s["hours"] > 0.01], 
                                    key=lambda x: x["hours"], reverse=True)
            
            # Assign subjects to this day with meaningful focus blocks
            for subject in sorted_remaining:
                if day_hours_used >= day_hours_target - 0.01:
                    break
                
                # Calculate meaningful block size (try for 1.5-2 hours for deep work, but adapt)
                ideal_block = min(2.0, subject["hours"], day_hours_target - day_hours_used)
                
                # Round to nearest 0.5 hour for cleaner display
                block = round(ideal_block * 2) / 2
                block = min(block, subject["hours"], day_hours_target - day_hours_used)
                
                if block > 0.01:
                    subject["hours"] = round(subject["hours"] - block, 2)
                    day_hours_used = round(day_hours_used + block, 2)
                    sessions.append({"subject": subject["name"], "hours": block})
            
            schedule.append({
                "date": current_date.isoformat(),
                "sessions": sessions,
                "hoursPlanned": round(day_hours_used, 2),
            })
            study_day_index += 1
        
        current_date += timedelta(days=1)

    return schedule


@app.route("/", methods=["GET"])
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/login", methods=["GET"])
def serve_login():
    return send_from_directory(FRONTEND_DIR, "login.html")


@app.route("/<path:filename>", methods=["GET"])
def serve_static(filename):
    file_path = FRONTEND_DIR / filename
    if file_path.exists():
        return send_from_directory(FRONTEND_DIR, filename)
    return jsonify({"error": "Not found"}), 404


@app.route("/api/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required."}), 400

    conn = _get_db()
    existing = conn.execute(
        "SELECT id FROM users WHERE email = ?",
        (email,),
    ).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "Email already registered."}), 409

    password_hash = generate_password_hash(password)
    cursor = conn.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        (name, email, password_hash),
    )
    conn.commit()
    conn.close()

    session["user_id"] = cursor.lastrowid
    return jsonify({"id": cursor.lastrowid, "name": name, "email": email})


@app.route("/api/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    conn = _get_db()
    user = conn.execute(
        "SELECT id, name, email, password_hash FROM users WHERE email = ?",
        (email,),
    ).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials."}), 401

    session["user_id"] = user["id"]
    return jsonify({"id": user["id"], "name": user["name"], "email": user["email"]})


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/me", methods=["GET"])
def me():
    user = _current_user()
    if not user:
        return jsonify({"error": "Not signed in."}), 401
    return jsonify({"id": user["id"], "name": user["name"], "email": user["email"]})


@app.route("/api/plan", methods=["POST"])
def build_plan():
    payload = request.get_json(silent=True) or {}
    subjects = _normalize_subjects(payload.get("subjects"))

    today = date.today()
    start_date = _parse_date(payload.get("startDate"), today)
    end_date = _parse_date(payload.get("endDate"), today + timedelta(days=6))
    if end_date < start_date:
        start_date, end_date = end_date, start_date

    hours_per_day = float(payload.get("hoursPerDay", 2) or 2)

    schedule = _generate_plan(subjects, start_date, end_date, hours_per_day)
    response = {
        "plan": schedule,
        "meta": {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "hoursPerDay": hours_per_day,
        },
    }

    user = _current_user()
    if user:
        conn = _get_db()
        conn.execute(
            "INSERT INTO plans (user_id, payload) VALUES (?, ?)",
            (user["id"], json.dumps(response)),
        )
        conn.commit()
        conn.close()

    return jsonify(response)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    _init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
