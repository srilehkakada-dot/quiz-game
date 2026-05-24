from flask import Flask, render_template, request, jsonify, session
import json
import os
import random

app = Flask(__name__)
app.secret_key = "quiz_secret_key_2024"

# Load questions from JSON file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE_DIR, "questions.json"), "r") as f:
    ALL_QUESTIONS = json.load(f)

TOTAL_QUESTIONS = 7
TIME_LIMITS = {"Easy": 30, "Medium": 20, "Hard": 15}

TOPICS = [
    {"id": "science",    "label": "Science",     "icon": "🔬"},
    {"id": "history",    "label": "History",     "icon": "🏛️"},
    {"id": "geography",  "label": "Geography",   "icon": "🌍"},
    {"id": "technology", "label": "Technology",  "icon": "💻"},
    {"id": "sports",     "label": "Sports",      "icon": "⚽"},
    {"id": "movies",     "label": "Movies",      "icon": "🎬"},
    {"id": "music",      "label": "Music",       "icon": "🎵"},
    {"id": "literature", "label": "Literature",  "icon": "📚"},
]


@app.route("/")
def index():
    session.clear()
    return render_template("index.html", topics=TOPICS)


@app.route("/generate", methods=["POST"])
def generate():
    """Load questions from JSON file based on topic and difficulty."""
    data = request.get_json()
    topic = data.get("topic")
    difficulty = data.get("difficulty", "Medium")

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    try:
        # Get questions for the topic and difficulty
        questions = ALL_QUESTIONS.get(topic, {}).get(difficulty, [])

        if not questions:
            return jsonify({"error": "No questions found for this topic and difficulty"}), 404

        # Shuffle questions randomly
        questions = random.sample(questions, min(TOTAL_QUESTIONS, len(questions)))

        # Store in session
        session["questions"] = questions
        session["topic"] = topic
        session["difficulty"] = difficulty
        session["score"] = 0
        session["current"] = 0
        session["history"] = []

        return jsonify({"success": True, "total": len(session["questions"])})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/question", methods=["GET"])
def get_question():
    """Return the current question (without correct answer)."""
    questions = session.get("questions", [])
    current = session.get("current", 0)

    if current >= len(questions):
        return jsonify({"done": True})

    q = questions[current]
    return jsonify({
        "index": current,
        "total": len(questions),
        "question": q["question"],
        "options": q["options"],
        "score": session.get("score", 0),
        "topic": session.get("topic"),
        "difficulty": session.get("difficulty"),
        "timeLimit": TIME_LIMITS.get(session.get("difficulty", "Medium"), 20),
    })


@app.route("/answer", methods=["POST"])
def submit_answer():
    """Validate the answer and return result."""
    data = request.get_json()
    selected = data.get("selected")  # -1 = timed out

    questions = session.get("questions", [])
    current = session.get("current", 0)

    if current >= len(questions):
        return jsonify({"error": "No active question"}), 400

    q = questions[current]
    correct_index = q["correctIndex"]
    is_correct = selected == correct_index

    if is_correct:
        session["score"] = session.get("score", 0) + 1

    history = session.get("history", [])
    history.append({
        "question": q["question"],
        "yourAnswer": q["options"][selected] if selected >= 0 else "Time's up!",
        "correctAnswer": q["options"][correct_index],
        "correct": is_correct,
    })
    session["history"] = history
    session["current"] = current + 1

    return jsonify({
        "correct": is_correct,
        "correctIndex": correct_index,
        "explanation": q["explanation"],
        "score": session.get("score", 0),
        "next": session["current"] < len(questions),
    })


@app.route("/results", methods=["GET"])
def results():
    """Return final quiz results."""
    history = session.get("history", [])
    score = session.get("score", 0)
    total = len(session.get("questions", []))

    return jsonify({
        "score": score,
        "total": total,
        "percent": round((score / total) * 100) if total else 0,
        "history": history,
        "topic": session.get("topic"),
        "difficulty": session.get("difficulty"),
    })


if __name__ == "__main__":
    print("=" * 40)
    print("  QuizMaster is running!")
    print("  Open: http://localhost:5000")
    print("=" * 40)
    app.run(debug=True, port=5000)
