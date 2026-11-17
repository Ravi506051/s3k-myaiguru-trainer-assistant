# MYAIGURU Trainer Assistant

**Dedicated repository for S3K Case Study 01 / AI Education.**

- [Live prototype](https://myaiguru-trainer-assistant-ravi.onrender.com/)
- [Assessment PDF](S3K_Ravi_Kumar_Rao_Case_Study_01.pdf)
- [Ravi's narrated case-study video on Google Drive](https://drive.google.com/file/d/1ov5C_jgUtOg05RPnUPmDaRI1MJnN5Jvb/view) (access granted to S3K HR)

An interactive browser prototype and case-study package for **S3K Case 01: AI-Powered Learning Delivery & Trainer Assistant**.

## Run it

Run `python server.py` from this directory, then open `http://127.0.0.1:8765/` in a modern browser. Python's standard library is the only requirement. The app creates `myaiguru_demo.sqlite3` on first launch.

## Prototype walkthrough

1. **Overview:** inspect the cohort KPIs and switch between batches.
2. **Content studio:** generate a sample lesson draft, review the checklist, then approve it.
3. **Learners:** see masked check-in suggestions and draft supportive outreach.
4. **Review queue:** edit and approve rubric-based feedback.
5. **Reports:** review descriptive insights and their caveats.

The app uses fictional cohort data and masked learner examples. Its course answers are retrieved from approved sample material stored in SQLite. It does not call a generative AI model or send messages.

## Files

- `index.html`, `styles.css`, `app.js`: interactive trainer dashboard prototype.
- `polish.css`, `polish.js`: responsive visual refinements, reduced-motion-aware entrance effects, hover glow and button ripple interactions.
- `redesign.css`, `redesign.js`: earlier visual direction retained as an intermediate layer.
- `professional.css`: current restrained, professional interface.
- `backend.js`, `server.py`: API connection and local SQLite persistence.
- `assessment.md`: case-study write-up covering discovery, KPIs, workflow, UI decisions, UAT and video outline.
- `dashboard.png`: screenshot of the trainer workspace for the assessment document.

## Important demo assumptions

- Cohort and learner records are fictional; learner names are masked.
- Lesson and feedback approvals are saved in SQLite with an audit record. The sample course Q&A reads approved material from the database and abstains when no match exists. It is a retrieval demonstration, not a generative model.
- A production version would require authentication, role-based access, approved-source retrieval, audit logging, data retention and privacy review.
