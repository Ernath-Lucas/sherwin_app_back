# Sherwin-Williams Backend API

API REST pour l'application Sherwin-Williams - Node.js + Express + MongoDB

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Modifier .env avec vos paramètres (MongoDB URI, JWT secret, etc.)

# Lancer le serveur en développement
npm run dev

# Ou en production
npm start
```

## 📦 Seeding (données de test)

```bash
npm run seed
```

Cela créera :
- 1 admin : `admin@sherwin.com` / `admin123`
- 3 utilisateurs test
- 9 produits
- 2 commandes exemple
- 1 demande de réinitialisation de mot de passe

## 🔗 Endpoints API

### Authentication (`/api/auth`)
| Méthode | Route | Description | Accès |
|---------|-------|-------------|-------|
| POST | `/register` | Inscription | Public |
| POST | `/login` | Connexion | Public |
| GET | `/me` | Profil utilisateur | Privé |
| POST | `/forgot-password` | Demande reset password | Public |
| PUT | `/update-password` | Modifier mot de passe | Privé |

### Products (`/api/products`)
| Méthode | Route | Description | Accès |
|---------|-------|-------------|-------|
| GET | `/` | Liste des produits | Privé |
| GET | `/search?q=xxx` | Recherche | Privé |
| GET | `/reference/:ref` | Par référence | Privé |
| GET | `/:id` | Par ID | Privé |
| GET | `/:id/related` | Produits associés | Privé |

### Orders (`/api/orders`)
| Méthode | Route | Description | Accès |
|---------|-------|-------------|-------|
| GET | `/` | Mes commandes | Privé |
| POST | `/` | Créer commande | Privé |
| GET | `/:id` | Détail commande | Privé |
| PUT | `/:id/items/:index` | Retirer un article | Privé |
| DELETE | `/:id` | Annuler commande | Privé |

### Admin (`/api/admin`)

#### Users
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/users` | Liste utilisateurs |
| GET | `/users/:id` | Détail utilisateur |
| DELETE | `/users/:id` | Supprimer utilisateur |
| DELETE | `/users/by-email` | Supprimer par email |
| GET | `/users/password-requests` | Demandes de reset |
| PUT | `/users/password-requests/:id` | Traiter demande |
| DELETE | `/users/password-requests/:id` | Rejeter demande |

#### Products
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/products` | Liste produits |
| POST | `/products` | Créer produit |
| PUT | `/products/:id` | Modifier produit |
| PUT | `/products/reference/:ref` | Modifier par référence |
| DELETE | `/products/:id` | Supprimer produit |

#### Orders
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/orders` | Toutes les commandes |
| PUT | `/orders/:id/status` | Changer statut |
| PUT | `/orders/:id/items/:index` | Retirer article |
| DELETE | `/orders/:id` | Supprimer commande |

## 📁 Structure

```
src/
├── config/
│   └── database.js       # Configuration MongoDB
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── orderController.js
│   └── userController.js
├── middleware/
│   ├── auth.js           # JWT & autorisation
│   ├── errorHandler.js
│   └── validation.js
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   └── PasswordResetRequest.js
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   └── adminRoutes.js
├── utils/
│   ├── jwt.js
│   └── apiResponse.js
├── seed.js               # Script de seeding
└── server.js             # Point d'entrée
```

## 🔐 Variables d'environnement

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sherwin-williams
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@sherwin.com
ADMIN_PASSWORD=admin123
```

## 📝 Exemple de requêtes

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sherwin.com", "password": "admin123"}'
```

### Recherche produits
```bash
curl http://localhost:5000/api/products/search?q=alabaster \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Créer commande
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {"productId": "PRODUCT_ID", "quantity": 10}
    ]
  }'
```
