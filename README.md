# 🎤 SMVIT DebSoc  
### Debating Society of Sir M. Visvesvaraya Institute of Technology

Welcome to **SMVIT DebSoc**, the official debating society of SMVIT.  
We are a community of thinkers, speakers, and leaders who believe in the power of dialogue, critical reasoning, and impactful communication.

---

## 🚀 About Us

SMVIT DebSoc is dedicated to:

- 🧠 Promoting critical thinking and analytical skills  
- 🗣️ Enhancing public speaking and communication  
- ⚖️ Encouraging healthy debates and discussions  
- 🌍 Building awareness on social, political, and global issues  

We provide a platform for students to express ideas, challenge perspectives, and grow into confident speakers.

---

## 🎯 What We Do

- 🏛️ **Parliamentary Debates** (BP, Asian formats, etc.)
- 🎙️ **Open Mic & Speaking Sessions**
- 📚 **Workshops & Training Sessions**
- 🏆 **Intra & Inter-college Competitions**
- 🤝 **Collaborations with other clubs & institutions**

---

## 🌟 Why Join DebSoc?

- Improve **public speaking & confidence**
- Learn **structured argumentation**
- Develop **leadership & teamwork skills**
- Participate in **competitive debating**
- Be part of a **vibrant intellectual community**

---

## 🧩 Debate Formats We Explore

- British Parliamentary (BP)
- Asian Parliamentary
- Turncoat Debates
- Extempore Speaking
- Group Discussions

---

## 🛠️ Tech & Media Presence

We actively engage with our audience through:

- 🌐 Website: https://www.smvitdebsoc.com  
- 📸 Instagram: https://www.instagram.com/smvit_debsoc/  

---

## 📅 Events & Activities

We regularly organize:

- Weekly debate sessions  
- Beginner-friendly training programs  
- Flagship competitions  
- Guest lectures & speaker sessions  

Stay tuned for updates!

---

## 🤝 How to Join

Interested in becoming a part of DebSoc?

1. Follow us on Instagram  
2. Attend our open sessions  
3. Register during recruitment drives  

---

## 💡 Motto

> *"Speak. Think. Influence."*

---

## 📬 Contact Us

For collaborations, queries, or participation:

- 🌐 Website: https://www.smvitdebsoc.com  
- 📸 Instagram: https://www.instagram.com/smvit_debsoc/  

---

## 🏁 Contribution

We welcome ideas, collaborations, and enthusiastic members who want to make a difference through dialogue and debate.

## Local development and verification

Use Node.js **24.x** for development and CI. Copy `.env.example` to `.env.local`, provide a local PostgreSQL `DATABASE_URL`, and set a local-only `NEXTAUTH_SECRET` before starting the app. Google OAuth must be configured with the local callback URL; no development authentication bypass is part of the supported setup.

After PostgreSQL is available, apply the existing Prisma migrations with `npx prisma migrate deploy` (or use the repository’s normal development migration workflow), then run:

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test
npm run build
npm audit --omit=dev
npm audit
```

Authenticated browser verification requires the same local database and OAuth credentials. The test suite run by `npm test` is the repository’s existing 23-test Node test suite; browser checks that require real accounts or PostgreSQL should be performed against the documented local setup.

---

## ⭐ Acknowledgements

Special thanks to all members, alumni, and organizers who have contributed to building SMVIT DebSoc into a thriving community.

---
