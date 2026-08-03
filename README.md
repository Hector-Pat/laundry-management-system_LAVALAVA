# Lava-Lava — Laundry Management System

Sistema de gestión para lavandería con backend en Node.js/Express + MySQL y frontend en React + Vite.

## Tecnologías

**Backend**
- Node.js + Express 5
- MySQL (mysql2)
- JWT (jsonwebtoken) para autenticación
- bcrypt para hash de contraseñas
- nodemon (desarrollo)

**Frontend**
- React 19 + Vite
- React Router DOM
- Tailwind CSS
- Axios
- React Hook Form

## Estructura del proyecto

```
laundry-management-system_LAVALAVA/
├── backend/
│   ├── database/
│   │   └── schema.sql        # Script de creación de la base de datos
│   ├── src/
│   │   ├── app.js            # Configuración de Express y rutas
│   │   ├── server.js         # Punto de entrada del servidor
│   │   ├── config/db.js      # Pool de conexión a MySQL
│   │   ├── constants/        # Roles de usuario
│   │   ├── middlewares/      # Autenticación y autorización por rol
│   │   ├── modules/auth/     # Registro y login (controller/service/repository)
│   │   └── utils/            # Hash de contraseñas y JWT
│   └── .env                  # Variables de entorno (ver abajo)
└── frontend/
    └── src/
        ├── pages/             # Vistas por rol (admin, operador, recepcionista, etc.)
        ├── context/           # AuthContext (sesión en localStorage)
        ├── routes/            # Enrutado y rutas protegidas por rol
        └── services/api.js    # Cliente Axios
```

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior (incluye npm)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) 8.x (o MariaDB compatible)
- Git

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd laundry-management-system_LAVALAVA
```

### 2. Backend

```bash
cd backend
npm install
```

#### 2.1 Configurar variables de entorno

Copia el archivo de ejemplo y ajusta los valores según tu entorno:

```bash
cp .env.example .env
```

El backend usa un archivo `.env` en `backend/.env` con las siguientes variables:

| Variable         | Descripción                                   | Ejemplo                  |
|------------------|------------------------------------------------|---------------------------|
| `PORT`           | Puerto en el que corre el servidor              | `3000`                    |
| `DB_HOST`        | Host de MySQL                                   | `localhost`                |
| `DB_USER`        | Usuario de MySQL                                | `root`                      |
| `DB_PASSWORD`    | Contraseña de MySQL                             | (la de tu instalación)     |
| `DB_NAME`        | Nombre de la base de datos                      | `lavalavabd`                |
| `JWT_SECRET`     | Clave para firmar los tokens JWT                | una cadena aleatoria larga |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token                  | `2h`                        |
| `FRONTEND_URL`   | Origen permitido por CORS (URL del frontend)    | `http://localhost:5173`     |

Ejemplo de `backend/.env`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lavalavabd

JWT_SECRET=cambia_esta_clave_por_una_segura
JWT_EXPIRES_IN=2h

FRONTEND_URL=http://localhost:5173
```

> **Importante:** `JWT_SECRET` debe ser una clave única y secreta, distinta en cada entorno (desarrollo/producción), y nunca debe subirse al control de versiones.

#### 2.2 Crear y poblar la base de datos

Con el servidor de MySQL corriendo, ejecuta el script incluido en `backend/database/schema.sql`. Este script crea la base de datos, la tabla `users` y un usuario `ADMIN` inicial (el registro público del backend bloquea la creación de cuentas ADMIN, por lo que la primera debe crearse manualmente).

Desde la terminal:

```bash
mysql -u root -p < database/schema.sql
```

O bien, desde un cliente como MySQL Workbench / DBeaver, abre el archivo `backend/database/schema.sql` y ejecútalo completo.

Credenciales del usuario ADMIN inicial:

- **Email:** `admin@lavalava.com`
- **Contraseña:** `Admin123`

Cámbiala apenas puedas iniciar sesión.

#### 2.3 Levantar el servidor

```bash
npm run dev
```

El backend quedará disponible en `http://localhost:3000`. Puedes verificar que está corriendo entrando a `http://localhost:3000/api/health`.

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
```

#### 3.1 Configurar la URL de la API (opcional)

Por defecto el frontend apunta a `http://localhost:3000`. Si tu backend corre en otra URL, crea un archivo `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

#### 3.2 Levantar el frontend

```bash
npm run dev
```

Por defecto Vite expone la app en `http://localhost:5173`.

## Uso

1. Abre `http://localhost:5173` en el navegador.
2. Inicia sesión con el usuario ADMIN creado en el paso 2.2, o regístrate como cliente desde `/register`.
3. Según el rol del usuario autenticado, el sistema redirige a las vistas correspondientes (`/admin`, `/operador`, `/recepcionista`, `/dashboard`, o `/mis-pedidos` para clientes).

## Scripts disponibles

**Backend** (`backend/package.json`)

| Comando        | Descripción                                   |
|----------------|-------------------------------------------------|
| `npm run dev`  | Inicia el servidor con nodemon (auto-reload)   |
| `npm start`    | Inicia el servidor en modo produccion (sin nodemon) |
| `npm test`     | Corre la suite de tests con Jest               |
| `npm run lint` | Corre ESLint sobre el código                    |

**Frontend** (`frontend/package.json`)

| Comando          | Descripción                          |
|------------------|----------------------------------------|
| `npm run dev`     | Inicia el servidor de desarrollo Vite |
| `npm run build`   | Genera el build de producción         |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint`    | Corre ESLint sobre el código           |

## Docker

También puedes levantar todo el stack (MySQL + backend + frontend) con Docker Compose, sin instalar Node ni MySQL localmente:

```bash
docker compose up --build
```

Esto expone el frontend en `http://localhost:5173`, el backend en `http://localhost:3000`, y crea la base de datos con el esquema de `backend/database/schema.sql` la primera vez que se levanta (el volumen `mysql_data` persiste los datos entre reinicios).

Por defecto usa `DB_PASSWORD=root` y un `JWT_SECRET` de ejemplo. Para cambiarlos, crea un archivo `.env` junto a `docker-compose.yml` (Docker Compose lo lee automáticamente):

```env
DB_PASSWORD=una_clave_segura
JWT_SECRET=otra_clave_segura
```

## CI

`.github/workflows/ci.yml` corre en cada push/PR a `main`: instala dependencias, corre ESLint y los tests del backend, y ESLint + build del frontend.
