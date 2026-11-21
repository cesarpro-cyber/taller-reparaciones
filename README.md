# Taller de reparaciones

Segundo parcial de Programación Web. Aplicación para llevar el control de los equipos que se reparan en un taller.

- **Interfaz:** React + Vite (JavaScript) + React Router. Peticiones con `fetch`, sin SDK ni librerías de componentes.
- **Servidor:** PocketBase. El esquema está en `pocketbase/pb_migrations` y la lógica propia en `pocketbase/pb_hooks`.

## Requisitos

- [Node.js](https://nodejs.org) 20 o superior (incluye `npm`)
- Git
- El ejecutable de PocketBase (v0.40.6, ver paso 2). No se sube al repositorio.

## Cómo levantarlo desde cero

Se usan **dos terminales** al mismo tiempo: una para PocketBase y otra para la interfaz.

### 1. Clonar

```bash
git clone URL_DE_ESTE_REPOSITORIO
cd taller-reparaciones
```

### 2. Descargar PocketBase dentro de `pocketbase/`

**Windows (PowerShell):**

```powershell
cd pocketbase
Invoke-WebRequest -Uri "https://github.com/pocketbase/pocketbase/releases/download/v0.40.6/pocketbase_0.40.6_windows_amd64.zip" -OutFile pb.zip
Expand-Archive pb.zip -DestinationPath . -Force
Remove-Item pb.zip
```

**Mac / Linux:** cambia `darwin_arm64` por `darwin_amd64` (Mac con Intel) o `linux_amd64` (Linux).

```bash
cd pocketbase
curl -L -o pb.zip https://github.com/pocketbase/pocketbase/releases/download/v0.40.6/pocketbase_0.40.6_darwin_arm64.zip
unzip -o pb.zip && rm pb.zip
chmod +x pocketbase
```

### 3. Arrancar PocketBase (terminal 1)

Desde la carpeta `pocketbase/`:

```bash
./pocketbase serve        # en Windows: .\pocketbase.exe serve
```

Al iniciar por primera vez, PocketBase aplica solo las migraciones de `pb_migrations/`:
crea las colecciones `clientes`, `ordenes` y `eventos` **y carga los datos de prueba**.
La API queda en `http://127.0.0.1:8090`.

No hace falta entrar al panel de administración. Si quieres verlo, la consola muestra un enlace para crear el superusuario (`/_/`).

### 4. Arrancar la interfaz (terminal 2)

```bash
cd web
npm install
npm run dev
```

Abre la dirección que muestre Vite (normalmente `http://localhost:5173`).
Si PocketBase está en otra dirección, copia `web/.env.example` a `web/.env` y cambia `VITE_PB_URL`.

## Datos de prueba

2 clientes y 5 órdenes en etapas distintas, con su historial:

| Cliente | Equipo | Etapa |
| --- | --- | --- |
| Ana Martínez | Laptop Lenovo IdeaPad 3 | solicitada |
| Luis Rivera | Teléfono Samsung Galaxy A32 | en_diagnostico |
| Ana Martínez | Televisor LG 43 pulgadas | presupuestada |
| Luis Rivera | Laptop HP Pavilion 15 | en_reparacion |
| Ana Martínez | iPhone 11 | entregada |

Para volver al estado inicial: detén PocketBase, borra la carpeta `pocketbase/pb_data/` y vuelve a arrancarlo.

## Probar las garantías del servidor

Con PocketBase corriendo, en otra terminal desde la raíz del proyecto:

```bash
node pruebas/garantias.mjs
```

El script habla directamente con la API (sin la interfaz) e intenta saltar etapas, modificar el presupuesto, cancelar fuera de tiempo, borrar órdenes, y crear, editar o borrar eventos. Cada intento que debe fallar tiene que ser rechazado. También recorre el proceso completo y comprueba el historial. Crea 3 órdenes de prueba nuevas.

## Cómo está resuelto

**Esquema** (`pb_migrations/1760000000_esquema_inicial.js`): las tres colecciones con los nombres del enunciado, relaciones `ordenes.cliente → clientes` y `eventos.orden → ordenes`, y el campo de archivos `fotos` (hasta 3 imágenes).

**Reglas de acceso:** como no hay autenticación, lo que nunca debe ocurrir está en `null` (nadie, ni por la API): borrar órdenes y clientes, y crear, editar o borrar eventos. El resto está abierto y lo validan los hooks.

**Hooks** (`pb_hooks/ordenes.pb.js` y `ordenes_lib.js`):

- Al crear una orden: tiene que nacer `solicitada` y sin presupuesto.
- Al actualizar: solo se permite una transición de la tabla (y ninguna más). Las etapas finales (`rechazada`, `cancelada`, `entregada`) no cambian. Cliente, equipo, problema y fotos no se modifican. El presupuesto (`diagnostico`, `manoObra`, `piezas`) solo se escribe en `en_diagnostico → presupuestada`, validado, y después queda inmutable.
- Historial: tras guardar un cambio de etapa, el servidor crea el evento (`de`, `a`) en la misma transacción. La fecha la pone PocketBase automáticamente. Por eso `eventos` no admite creación por la API: nadie puede inventar historial.

**Interfaz:** `Layout` con `Outlet`, ruta con parámetro (`/ordenes/:id`), página para rutas inexistentes (`*`), formularios controlados, listas con `key`. `useEffect` con limpieza (`AbortController`) para cargar datos. `useRef` en el formulario de presupuesto (keys de las filas) y en el de registro (input de archivos). `useCallback` solo en `DetalleOrden`, donde `recargar` es dependencia de un efecto y se pasa como prop. El total del presupuesto se calcula (`src/util.js`) y nunca se guarda. Tras cada acción la interfaz vuelve a pedir los datos al servidor, así lo que se ve coincide con lo guardado.

## Estructura

```
pocketbase/
  pb_migrations/   esquema, reglas de acceso y datos de prueba
  pb_hooks/        validaciones e historial
web/
  src/
    pages/         Resumen, ListaOrdenes, NuevaOrden, DetalleOrden, NoEncontrada
    components/    Layout, Acciones, FormPresupuesto, Presupuesto, Historial, Progreso, EstadoBadge
    api.js         todas las peticiones con fetch
pruebas/
  garantias.mjs    prueba de las garantías contra la API
```
