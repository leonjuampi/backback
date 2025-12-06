# README - Conty API Backend

## Propósito y Alcance

Este documento proporciona una introducción de alto nivel al sistema `conty-api`, explicando su propósito, arquitectura central, stack tecnológico y modelo de dominio. Está destinado a orientar a nuevos desarrolladores y proporcionar contexto para comprender los subsistemas detallados documentados en páginas subsiguientes.

## Propósito del Sistema

`conty-api` es un backend de API RESTful para un sistema multi-inquilino de gestión de inventario y ventas. Proporciona a las organizaciones la capacidad de gestionar múltiples sucursales, hacer seguimiento del inventario de productos, procesar transacciones de ventas, gestionar relaciones con clientes y generar documentos comerciales como facturas y presupuestos.

El sistema aplica un aislamiento estricto de datos entre inquilinos (organizaciones) mientras permite operaciones flexibles entre sucursales dentro de cada organización. Implementa control de acceso basado en roles con tres roles jerárquicos: **Admin** (a nivel de sistema), **Owner** (a nivel de organización) y **Seller** (a nivel de sucursal).

### Capacidades Clave

- Seguimiento de inventario multi-sucursal con movimientos y transferencias de stock
- Procesamiento de ventas y presupuestos con numeración de documentos configurable
- Gestión de relaciones con clientes con listas de precios y seguimiento financiero
- Catálogo de productos con categorización jerárquica y variantes
- Gestión de usuarios con invitaciones basadas en email
- Importación/exportación masiva CSV para productos y clientes
- Flujos de trabajo de reconciliación de inventario físico

## Stack Tecnológico

El sistema está construido usando Node.js con las siguientes tecnologías centrales:

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Runtime | Node.js | Entorno de ejecución de JavaScript |
| Framework Web | Express 5.1.0 | Servidor HTTP y enrutamiento |
| Base de Datos | MySQL | Persistencia de datos relacional |
| Driver de Base de Datos | mysql2 3.15.1 | Cliente MySQL async/await con pool de conexiones |
| Autenticación | jsonwebtoken 9.0.2 | Generación y verificación de tokens JWT |
| Hashing de Contraseñas | bcrypt 6.0.0 | Almacenamiento seguro de contraseñas |
| Seguridad | helmet 8.1.0 | Headers de seguridad HTTP |
| CORS | cors 2.8.5 | Manejo de peticiones de origen cruzado |
| Logging | morgan 1.10.1 | Registro de peticiones HTTP |
| Carga de Archivos | multer 2.0.2 | Manejo de datos multipart form para importaciones CSV |
| Procesamiento CSV | csv-parser 3.2.0 | Análisis de archivos CSV por streaming |
| Email | nodemailer 7.0.9 | Entrega de email SMTP |
| Fecha/Hora | dayjs 1.11.18 | Manipulación y formateo de fechas |
| Documentación API | swagger-ui-express 5.0.1 | Documentación interactiva de API |
| Configuración | dotenv 17.2.2 | Gestión de variables de entorno |

## Inicialización de la Aplicación

El punto de entrada de la aplicación en `src/index.js` carga las variables de entorno vía `dotenv`, crea una instancia de aplicación Express, configura middleware de seguridad (helmet, CORS), configura el registro HTTP (morgan), registra las rutas de API e inicia el servidor HTTP en el puerto configurado. El pool de conexiones de base de datos se inicializa en `src/config/db.js` y se reutiliza durante todo el ciclo de vida de la aplicación.

## Descripción General de la Arquitectura

`conty-api` sigue una arquitectura en capas de tres niveles con clara separación de responsabilidades:

### Capa de Controladores
Maneja peticiones HTTP, valida entradas, invoca servicios de lógica de negocio y formatea respuestas. Los controladores nunca acceden directamente a la base de datos.

### Capa de Servicios
Contiene lógica de negocio, gestión de transacciones y validación de datos. Los servicios interactúan con la base de datos a través del pool de conexiones y pueden llamar a otros servicios.

### Capa de Acceso a Datos
Base de datos MySQL accedida a través de un pool de conexiones configurado en `src/config/db.js`. Todas las consultas de base de datos usan async/await con promesas.

## Configuración de la Base de Datos

La configuración del pool mantiene hasta 10 conexiones concurrentes, automáticamente encola peticiones cuando todas las conexiones están en uso, y proporciona ejecución de consultas asíncronas basadas en promesas. El nombre de la base de datos por defecto es `conty`.

## Modelo Multi-Inquilino

El sistema implementa multi-inquilino jerárquico usando dos mecanismos de alcance principales:

| Alcance | Campo | Propósito |
|---------|-------|-----------|
| Organización | `orgId` | Aislamiento de inquilino de nivel superior. Todos los datos están limitados por organización. |
| Sucursal | `branchId` | Aislamiento de sub-inquilino. Inventario, ventas y transacciones son específicas de sucursal. |

### Alcance de Organización
Productos, clientes, listas de precios y categorías están limitados a `orgId`. Los usuarios con rol Owner pueden acceder a todos los datos dentro de su organización pero no pueden acceder a datos de otras organizaciones.

### Alcance de Sucursal
Niveles de stock, transacciones de ventas y sesiones de inventario están limitados tanto a `orgId` como a `branchId`. Los Sellers solo pueden acceder a datos de las sucursales a las que están asignados a través de la tabla de unión `user_branches`.

### Cambio de Contexto
Los tokens JWT llevan el `branchId` activo y un array de `branchIds` accesibles. Los usuarios pueden cambiar entre sus sucursales asignadas usando el endpoint `switchContext` sin re-autenticación.

## Flujo de Peticiones

Una petición autenticada típica fluye a través de los siguientes componentes:

1. **Middleware de Seguridad**: `helmet()` añade headers de seguridad, `cors()` valida el origen
2. **Logging**: `morgan()` registra detalles de petición en consola
3. **Autenticación**: `authMiddleware` verifica el token JWT y extrae el contexto de usuario (`uid`, `roleId`, `orgId`, `branchId`)
4. **Autorización**: El controlador verifica permisos de rol y alcance
5. **Lógica de Negocio**: La capa de servicios ejecuta lógica de dominio y transacciones de base de datos
6. **Respuesta**: El controlador formatea la respuesta y retorna JSON

## Modelo de Dominio Central

El sistema gestiona las siguientes entidades de negocio principales:

### Jerarquía Organizacional
Las organizaciones poseen sucursales y usuarios. Los usuarios son asignados a sucursales específicas a través de la tabla `user_branches`.

### Catálogo de Productos
Los productos pertenecen a categorías (con subcategorías opcionales) y tienen una o más variantes (SKUs) con precios y códigos de barras distintos.

### Inventario
El stock se rastrea a nivel de sucursal-variante. Los movimientos registran ajustes, las transferencias mueven stock entre sucursales, y las sesiones de inventario reconcilian conteos físicos.

### Ventas y CRM
Los clientes pertenecen a organizaciones y pueden tener listas de precios asociadas. Las ventas y presupuestos referencian clientes y contienen líneas de ítems con variantes y cantidades.

## Configuración y Variables de Entorno

La aplicación se configura a través de variables de entorno cargadas desde un archivo `.env` al inicio:

| Variable | Propósito | Predeterminado/Ejemplo |
|----------|-----------|------------------------|
| `PORT` | Puerto del servidor HTTP | - |
| `NODE_ENV` | Modo de entorno | `development` o `production` |
| `DB_HOST` | Host del servidor MySQL | `127.0.0.1` |
| `DB_PORT` | Puerto del servidor MySQL | `3306` |
| `DB_USER` | Nombre de usuario de base de datos | - |
| `DB_PASSWORD` | Contraseña de base de datos | - |
| `DB_NAME` | Nombre de base de datos | `conty` |
| `JWT_SECRET` | Clave secreta para firma JWT | - |
| `JWT_EXPIRES_IN` | Expiración del token JWT | `1d` |
| `BCRYPT_SALT_ROUNDS` | Rondas de hashing bcrypt | `10` |
| `BACKEND_URL` | URL base de API para emails | `http://localhost:3000` |
| `SMTP_HOST` | Nombre de host del servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto del servidor SMTP | `465` |
| `SMTP_SECURE` | Usar TLS/SSL | `true` |
| `SMTP_USER` | Nombre de usuario SMTP | - |
| `SMTP_PASS` | Contraseña SMTP/contraseña de app | - |
| `EMAIL_FROM` | Dirección de email remitente | - |

El archivo `.env` en sí está excluido del control de versiones y debe ser creado manualmente durante la configuración.

## Arquitectura de Seguridad

El sistema implementa múltiples capas de seguridad:

### Seguridad de Transporte
El middleware `helmet` aplica headers de seguridad HTTP incluyendo Content Security Policy, HTTP Strict Transport Security y X-Frame-Options para prevenir ataques comunes.

### Autenticación
Las contraseñas se hashean usando `bcrypt` con 10 rondas de salt (configurable vía `BCRYPT_SALT_ROUNDS`). Los tokens JWT se firman con `JWT_SECRET` y expiran después de 1 día por defecto.

### Autorización
El `authMiddleware` extrae el contexto de usuario de los tokens JWT y lo adjunta a `req.user`. Los controladores realizan verificaciones basadas en rol (Admin/Owner/Seller) y filtrado de alcance (`orgId`/`branchId`) antes de ejecutar operaciones.

## Documentación de la API

La documentación interactiva de la API está disponible a través de Swagger UI en el endpoint `/api-docs` cuando el servidor está en ejecución. La documentación se genera usando `swagger-jsdoc` desde comentarios JSDoc en línea en archivos de rutas y se sirve mediante `swagger-ui-express`.

Para acceder a la documentación:
1. Inicie la aplicación
2. Navegue a `http://localhost:<PORT>/api-docs` en un navegador web
3. Explore endpoints disponibles, esquemas de petición/respuesta y requisitos de autenticación

## Desarrollo y Despliegue

La aplicación soporta dos modos de ejecución:

| Modo | Comando | Propósito |
|------|---------|-----------|
| Desarrollo | `npm run dev` | Ejecuta con nodemon para reinicio automático al cambiar archivos |
| Producción | `node src/index.js` | Ejecución directa de Node.js sin observación de archivos |

La variable de entorno `NODE_ENV` debe establecerse a `development` o `production` según corresponda. El modo de desarrollo habilita logging detallado y detalles de errores, mientras que el modo de producción optimiza para rendimiento y seguridad.

## Endpoints Principales

El sistema expone los siguientes grupos de endpoints:

- `/api/auth` - Autenticación y gestión de sesiones
- `/api/customers` - Gestión de clientes
- `/api/products` - Gestión de productos
- `/api/categories` - Categorías de productos
- `/api/users` - Administración de usuarios
- `/api/organizations` - Gestión de organizaciones
- `/api/branches` - Sucursales
- `/api/stock` - Control de inventario
- `/api/sales` - Ventas
- `/api/quotes` - Cotizaciones
- `/api/payment-methods` - Métodos de pago
- `/api/price-lists` - Listas de precios

## Arquitectura en Capas Detallada

### Estructura de Capas

El sistema sigue un patrón de **arquitectura en capas de cuatro niveles**:

1. **Capa de Rutas** - Define endpoints HTTP y los mapea a controladores
2. **Capa de Middleware** - Implementa autenticación, autorización y validaciones
3. **Capa de Controladores** - Orquesta el procesamiento de solicitudes
4. **Capa de Servicios** - Encapsula la lógica de acceso a datos
5. **Capa de Base de Datos** - Gestiona conexiones MySQL mediante pool

### Middleware Global

El sistema utiliza los siguientes middleware aplicados a todas las solicitudes:

- **helmet** - Establece cabeceras de seguridad HTTP
- **cors** - Habilita solicitudes de origen cruzado
- **express.json** - Parsea cuerpos de solicitud JSON
- **morgan** - Registra solicitudes HTTP en formato desarrollo

## Ejemplos de Implementación

### Gestión de Clientes

El módulo de clientes implementa operaciones CRUD completas:

- **Listar clientes** con filtros de búsqueda, lista de precios, estado, deuda y días sin compras
- **Crear/actualizar clientes** (Owner/Vendedor)
- **Eliminar clientes** mediante soft delete (Solo Owner)
- **Estado de cuenta** del cliente
- **Importación CSV** de clientes

### Listas de Precios

Sistema de gestión de múltiples listas de precios por organización:

- Soporte para lista de precios por defecto
- Validación de nombres únicos por organización
- Operaciones restringidas a rol Owner

### Métodos de Pago

Gestión flexible de medios de pago con configuración de recargos y descuentos.

Tipos soportados: CASH, DEBIT, CREDIT, TRANSFER, MIXED

Características:
- Cuotas máximas configurables
- Porcentaje de recargo/descuento
- Notas para ticket

## Reglas de Comunicación entre Capas

Cada capa solo puede depender de capas inferiores:

| Capa | Puede Importar De | NO Puede Importar De |
|------|-------------------|----------------------|
| Rutas | Middleware, Controladores | Servicios, Base de Datos |
| Middleware | Utilidades | Controladores, Servicios, BD |
| Controladores | Servicios, Utilidades | Rutas, Middleware |
| Servicios | Base de Datos, Utilidades | Rutas, Middleware, Controladores |

## Tecnologías Utilizadas

- **Node.js** con Express.js
- **MySQL** con pool de conexiones (mysql2/promise)
- **JWT** para autenticación
- **bcrypt** para hash de contraseñas
- **Swagger/OpenAPI** para documentación
- **Helmet** para seguridad HTTP
- **Morgan** para logging
- **Multer** para carga de archivos

## Notas
El sistema `conty-api` es un backend multi-inquilino completo que implementa separación estricta de datos por organización y sucursal, con un modelo de roles jerárquico (Admin/Owner/Seller) y capacidades avanzadas de gestión de inventario, ventas y CRM. <cite />

El sistema implementa soft deletes en la mayoría de entidades mediante campos `deleted_at` e `is_deleted`. <cite /> Todas las operaciones están organizadas por organización (multi-tenant) y sucursal. <cite /> La arquitectura en capas facilita el testing, mantenibilidad y reutilización de código. <cite />
