# 🚀 ViralBot — Automatisation de Contenu Vidéo Viral

<div align="center">

![ViralBot](https://img.shields.io/badge/ViralBot-1.3.0-ff0050?style=for-the-badge&logo=tiktok)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Docker](https://img.shields.io/badge/Docker-Powered-2496ED?style=for-the-badge&logo=docker)

**Pipeline complet d'automatisation vidéo virale : YouTube → IA → TikTok**

</div>

---

## 🎯 Fonctionnalités

| Module | Description |
|--------|-------------|
| 🔍 **Recherche YouTube** | Détection automatique de vidéos virales avec score de viralité |
| 🧠 **Analyse IA** | Transcription Whisper + génération de contenu TikTok via GPT-4 |
| 🎬 **Montage Automatique** | Conversion 9:16, sous-titres dynamiques, barre de progression |
| 📱 **Publication TikTok** | API TikTok officielle, planification, multi-comptes |
| 📊 **Dashboard Admin** | Interface web complète avec statistiques en temps réel |
| 🔄 **n8n Automation** | Workflow complet de bout en bout sans intervention manuelle |

---

## 🏗️ Architecture

```
viralbot/
├── backend/          # FastAPI + Celery
│   ├── app/
│   │   ├── api/v1/   # REST API endpoints
│   │   ├── services/ # YouTube, AI, Video, TikTok
│   │   ├── models/   # SQLAlchemy models
│   │   └── tasks/    # Celery async tasks
│   └── requirements.txt
├── frontend/         # Next.js 14
│   └── src/app/
│       ├── dashboard/
│       │   ├── search/    # YouTube search
│       │   ├── videos/    # Video management
│       │   ├── tiktok/    # Account management
│       │   └── settings/  # Configuration
│       └── login/
├── docker/           # Docker configs
│   ├── nginx/
│   └── postgres/
├── workflows/        # n8n workflows
└── docker-compose.yml
```

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- Docker & Docker Compose
- Clé API YouTube Data v3
- Clé API OpenAI
- Clés API TikTok Developer

### 2. Configuration
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer avec vos clés API
nano .env
```

### 3. Lancer l'application
```bash
# Démarrer tous les services
docker compose up -d

# Voir les logs
docker compose logs -f backend

# Arrêter
docker compose down
```

### 4. Accès
| Service | URL |
|---------|-----|
| Dashboard Frontend | http://localhost:3000 |
| API Backend | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/api/docs |
| MinIO Storage | http://localhost:9001 |
| Flower (Celery) | http://localhost:5555 |

---

## 🔑 Variables d'Environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `YOUTUBE_API_KEY` | Clé API YouTube Data v3 | ✅ |
| `OPENAI_API_KEY` | Clé API OpenAI (GPT-4 + Whisper) | ✅ |
| `TIKTOK_CLIENT_KEY` | Client Key TikTok Developer | ✅ |
| `TIKTOK_CLIENT_SECRET` | Client Secret TikTok | ✅ |
| `SECRET_KEY` | Clé secrète JWT (min 32 chars) | ✅ |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | ✅ |

---

## 🔄 Workflow Automatique (n8n)

Importez le fichier `workflows/viralbot_pipeline.json` dans votre instance n8n.

**Pipeline:**
```
Toutes les 6h
    ↓
Fetch Trending YouTube (FR)
    ↓
Filter Top 5 Viral (score ≥ 50)
    ↓
Import dans ViralBot
    ↓  (Pipeline IA: download → transcription → content gen → video processing)
Auto-Approve + Publish TikTok
    ↓
Notification Telegram
```

---

## 🎬 Pipeline Vidéo

1. **Téléchargement** — yt-dlp télécharge la vidéo en haute qualité
2. **Transcription** — OpenAI Whisper génère le texte avec timestamps
3. **Analyse IA** — GPT-4 génère : titre viral, hook, description, hashtags, analyse émotionnelle
4. **Montage** — FFmpeg :
   - Conversion 9:16 (1080x1920)
   - Re-cadrage intelligent centré
   - Sous-titres dynamiques animés
   - Barre de progression
   - Optimisation TikTok-ready
5. **Validation** — Review manuelle ou automatique
6. **Publication** — API TikTok officielle

---

## 🔐 Sécurité

- Authentification JWT avec refresh tokens
- Rate limiting par endpoint
- Variables d'environnement pour secrets
- Anti-duplicate check
- Privacy level configurable (test en privé)

---

## 📦 Déploiement Production (Dokploy)

```bash
# API Dokploy
curl -X POST https://your-dokploy-host/api/application \
  -H "Authorization: Bearer $DOKPLOY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "viralbot",
    "repository": "your-github-repo",
    "branch": "main"
  }'
```

Le fichier `docker-compose.yml` est compatible Dokploy pour un déploiement en un clic.

---

## 📊 Stack Technique

**Backend:** Python 3.11 · FastAPI · Celery · PostgreSQL · Redis · FFmpeg · OpenAI API · yt-dlp

**Frontend:** Next.js 14 · React 18 · TypeScript · Recharts

**Infrastructure:** Docker · Nginx · MinIO (S3) · n8n · Dokploy

---

## 🤝 Contribution

1. Fork le repo
2. Créer une branche : `git checkout -b feature/amazing-feature`
3. Commit : `git commit -m 'feat: add amazing feature'`
4. Push : `git push origin feature/amazing-feature`
5. Ouvrir une Pull Request

---

<div align="center">
Made with ❤️ by ViralBot Team
</div>

