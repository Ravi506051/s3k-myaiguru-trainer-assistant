"""Local, fictional MYAIGURU case-study app. Python standard library only."""
from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DB = Path(os.environ.get("MYAIGURU_DB_PATH", str(ROOT / "myaiguru_demo.sqlite3")))


def connection():
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    return db


def initialize():
    with connection() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS batches (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, audience TEXT NOT NULL,
          learners INTEGER NOT NULL, attendance INTEGER NOT NULL,
          on_time INTEGER NOT NULL, feedback_days REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS lessons (
          id INTEGER PRIMARY KEY AUTOINCREMENT, topic TEXT NOT NULL,
          objective TEXT NOT NULL, audience TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('draft','approved')),
          created_at TEXT NOT NULL, approved_at TEXT
        );
        CREATE TABLE IF NOT EXISTS feedback (
          id INTEGER PRIMARY KEY, learner_code TEXT NOT NULL,
          assignment TEXT NOT NULL, text TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('draft','approved')),
          approved_at TEXT
        );
        CREATE TABLE IF NOT EXISTS audit (
          id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL,
          item_type TEXT NOT NULL, item_id INTEGER NOT NULL,
          occurred_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS approved_material (
          id INTEGER PRIMARY KEY AUTOINCREMENT, topic TEXT NOT NULL,
          keywords TEXT NOT NULL, answer TEXT NOT NULL, source TEXT NOT NULL
        );
        """)
        if db.execute("SELECT COUNT(*) FROM batches").fetchone()[0] == 0:
            db.executemany("INSERT INTO batches VALUES (?,?,?,?,?,?,?)", [
                ("batch-a", "Batch A", "Beginners", 30, 84, 71, 3.2),
                ("batch-b", "Batch B", "Beginners", 30, 76, 58, 4.3),
                ("batch-c", "Batch C", "Professionals", 30, 81, 66, 3.8),
                ("batch-d", "Batch D", "Professionals", 30, 71, 53, 4.7),
            ])
        if db.execute("SELECT COUNT(*) FROM feedback").fetchone()[0] == 0:
            db.execute("INSERT INTO feedback VALUES (1, ?, ?, ?, 'draft', NULL)", (
                "PM", "Explain overfitting in your own words",
                "You’ve explained the key idea clearly: the model fits training examples too closely and may struggle on new data. Your memorizing-versus-learning comparison is helpful. To make it even stronger, add one way to reduce overfitting, such as using a validation set or simplifying the model.",
            ))
        if db.execute("SELECT COUNT(*) FROM approved_material").fetchone()[0] == 0:
            db.executemany("INSERT INTO approved_material (topic,keywords,answer,source) VALUES (?,?,?,?)", [
                ("Overfitting", "overfit validation", "Overfitting happens when a model learns the training examples too closely and performs poorly on new examples. A validation set helps us compare choices during development.", "AI Foundations · Module 3"),
                ("Prompt writing", "prompt instruction", "A useful prompt includes context, task, constraints and the desired output format. Start with a clear task, then add the details needed for the audience.", "Prompting Guide · Module 2"),
                ("Data splits", "train test data", "Training data fits the model. Validation data supports model selection. A separate test set is held back for a final evaluation on unseen examples.", "AI Foundations · Module 3"),
            ])


def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        print("MYAIGURU:", format % args)

    def json_response(self, data, status=HTTPStatus.OK):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        size = int(self.headers.get("Content-Length", "0"))
        if size < 1 or size > 16_384:
            raise ValueError("Request body must be between 1 and 16384 bytes")
        result = json.loads(self.rfile.read(size))
        if not isinstance(result, dict):
            raise ValueError("Expected a JSON object")
        return result

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/state":
            with connection() as db:
                batches = [dict(row) for row in db.execute("SELECT * FROM batches ORDER BY id")]
                feedback = dict(db.execute("SELECT * FROM feedback WHERE id=1").fetchone())
                lessons = [dict(row) for row in db.execute("SELECT * FROM lessons ORDER BY id DESC LIMIT 8")]
                audit = [dict(row) for row in db.execute("SELECT * FROM audit ORDER BY id DESC LIMIT 10")]
            return self.json_response({"batches": batches, "feedback": feedback, "lessons": lessons, "audit": audit})
        if path.startswith("/api/"):
            return self.json_response({"error": "Not found"}, HTTPStatus.NOT_FOUND)
        if path not in {"/", "/index.html", "/styles.css", "/app.js", "/polish.css", "/polish.js", "/redesign.css", "/redesign.js", "/professional.css", "/backend.js", "/MYAIGURU_case_study_preview.mp4", "/MYAIGURU_case_study_Ravi_voice.mp4"}:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            data = self.read_json()
            if path == "/api/lessons":
                topic = str(data.get("topic", "")).strip()[:160]
                objective = str(data.get("objective", "")).strip()[:500]
                audience = str(data.get("audience", "")).strip()[:100]
                if not topic or not objective or not audience:
                    raise ValueError("Topic, objective and audience are required")
                with connection() as db:
                    cursor = db.execute("INSERT INTO lessons (topic,objective,audience,status,created_at) VALUES (?,?,?,'draft',?)", (topic, objective, audience, utc_now()))
                    lesson_id = cursor.lastrowid
                    db.execute("INSERT INTO audit (action,item_type,item_id,occurred_at) VALUES ('draft_created','lesson',?,?)", (lesson_id, utc_now()))
                return self.json_response({"id": lesson_id, "status": "draft"}, HTTPStatus.CREATED)
            if path.startswith("/api/lessons/") and path.endswith("/approve"):
                lesson_id = int(path.split("/")[3])
                if data.get("reviewed") is not True:
                    raise ValueError("Trainer review checklist is required")
                with connection() as db:
                    result = db.execute("UPDATE lessons SET status='approved',approved_at=? WHERE id=? AND status='draft'", (utc_now(), lesson_id))
                    if result.rowcount != 1:
                        return self.json_response({"error": "Draft not found or already approved"}, HTTPStatus.CONFLICT)
                    db.execute("INSERT INTO audit (action,item_type,item_id,occurred_at) VALUES ('approved','lesson',?,?)", (lesson_id, utc_now()))
                return self.json_response({"id": lesson_id, "status": "approved"})
            if path == "/api/feedback/1/approve":
                note = str(data.get("text", "")).strip()[:2000]
                if len(note) < 20 or data.get("reviewed") is not True:
                    raise ValueError("Trainer-reviewed feedback of at least 20 characters is required")
                with connection() as db:
                    db.execute("UPDATE feedback SET text=?,status='approved',approved_at=? WHERE id=1", (note, utc_now()))
                    db.execute("INSERT INTO audit (action,item_type,item_id,occurred_at) VALUES ('approved','feedback',1,?)", (utc_now(),))
                return self.json_response({"id": 1, "status": "approved"})
            if path == "/api/questions":
                question = str(data.get("question", "")).strip()[:300]
                if not question:
                    raise ValueError("Question is required")
                words = set(question.lower().split())
                with connection() as db:
                    materials = [dict(row) for row in db.execute("SELECT * FROM approved_material")]
                ranked = sorted(materials, key=lambda row: sum(1 for term in row["keywords"].split() if any(term in word for word in words)), reverse=True)
                if not ranked or not any(term in question.lower() for term in ranked[0]["keywords"].split()):
                    return self.json_response({"answer": "I could not find this in the approved course material. Please ask a trainer.", "source": None, "needs_review": True})
                return self.json_response({"answer": ranked[0]["answer"], "source": ranked[0]["source"], "needs_review": True})
            return self.json_response({"error": "Not found"}, HTTPStatus.NOT_FOUND)
        except (ValueError, json.JSONDecodeError) as exc:
            return self.json_response({"error": str(exc)}, HTTPStatus.BAD_REQUEST)


if __name__ == "__main__":
    initialize()
    port = int(os.environ.get("PORT", "8765"))
    host = "0.0.0.0" if "PORT" in os.environ else "127.0.0.1"
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"MYAIGURU app listening on {host}:{port}", flush=True)
    server.serve_forever()
