# 🛡️ End-to-End Insurance Management Platform

A powerful, AI-driven full-stack web application that transforms the way users interact with insurance. It provides a **centralized platform** to **explore, compare, manage, and purchase insurance policies**, while empowering insurers to list and manage their offerings. Powered by **Gemini AI**, **Firebase**, and a robust **Next.js + Node.js** stack, this project is designed for scalability, personalization, and trust.

---

## 🚀 Features

### 👥 For Users
- ✅ **Unified Policy Dashboard**  
  View and manage all your active and past insurance policies in one place.

- 🧠 **AI-Powered Recommendations (Gemini API)**  
  Get intelligent, personalized insurance suggestions based on your profile, goals, and past coverage.

- 📊 **Side-by-Side Policy Comparisons**  
  Compare multiple insurance policies based on premium, coverage, tenure, and more.

- 🛒 **Direct Policy Purchase**  
  Purchase insurance instantly from listed insurers within the platform.

- 🔁 **Renewal & Claim Tracking**  
  Track your claim status and get smart reminders for policy renewals.

---

### 🏢 For Insurers
- 📝 **Multi-Policy Management**  
  Add, edit, or delete multiple insurance policies with complete details.

- 📂 **Document Upload & Management**  
  Upload brochures, T&Cs, and other documents securely (stored on Firebase Storage).

- 📈 **Engagement Insights** *(upcoming)*  
  Analytics to understand which policies are being searched, viewed, or purchased.

---

## 🧠 AI Recommendations (Gemini API)

Gemini provides tailored suggestions based on:
- Age, income, goals, dependents
- Risk appetite and policy history

### 🔁 Workflow:
1. User completes a financial profile
2. App sends structured prompt to Gemini
3. Gemini returns top 3 policy suggestions + explanations
4. Frontend renders these recommendations with "Why This Fits You"

> _"For a 32-year-old with ₹9L income and a goal of child education, we recommend a Term Life + Child ULIP combo policy for long-term benefit."_  

### ✅ Benefits of Using Gemini:
- Natural language reasoning
- Simple explanation of complex insurance terms
- Human-like, context-aware suggestions

---

## 🏗️ Tech Stack

| Layer           | Technology                            |
|------------------|----------------------------------------|
| 🌐 Frontend      | Next.js, Tailwind CSS, React Context   |
| 🔐 Authentication| Firebase Authentication                |
| 🔥 Database      | Firebase Firestore                     |
| ☁️ Storage       | Firebase Storage                       |
| 🧠 AI/ML          | Google Gemini API                      |
| ⚙️ Backend       | Node.js with Express (API layer)       |
| 📄 OCR/NLP (optional)| Python (Tesseract, spaCy)          |

---

## 📱 Application Workflow

```plaintext
[User Registration/Login via Firebase]
        ↓
[Complete Profile & Set Goals]
        ↓
[Explore & Filter Insurance Policies]
        ↓
[Get AI Recommendations (Gemini API)]
        ↓
[Compare Policies Side-by-Side]
        ↓
[Purchase & View in Dashboard]
        ↓
[Renewal Alerts & Claim Status Tracking]
