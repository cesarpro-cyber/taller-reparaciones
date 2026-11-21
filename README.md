# Taller de reparaciones

Segundo parcial de Programación Web. Aplicación web para gestionar las órdenes de reparación de un taller de equipos electrónicos: registro del equipo, diagnóstico, presupuesto, decisión del cliente, reparación y entrega, con historial de cada cambio de etapa.

Autor: cesarpro-cyber

- **Interfaz:** React + Vite (JavaScript) + React Router. Peticiones con `fetch`, sin SDK de PocketBase ni librerías de componentes o de estado.
- **Servidor:** PocketBase. El esquema está en `pocketbase/pb_migrations` y la lógica propia en `pocketbase/pb_hooks`.

## Requisitos

- [Node.js](https://nodejs.org) 20 o superior (incluye `npm`)
- Git
- Ejecutable de PocketBase v0.40.6 (se descarga en el paso 2; no se incluye en el repositorio)

## Puesta en marcha desde cero

Se necesitan dos terminales abiertas a la vez: una para PocketBase y otra para la interfaz.

### 1. Clonar el repositorio

```bash
git clone https://github.com/cesarpro-cyber/taller-reparaciones.git
cd taller-reparaciones
```

### 2. Descargar PocketBase dentro de `pocketbase/`

Windows (PowerShell):

```powershell
cd pocketbase
Invoke-WebRequest -Uri "https://github.com/pocketbase/pocketbase/releases/download/v0.40.6/pocketbase_0.40.6_windows_amd64.zip" -OutFile pb.zip
Expand-Archive pb.zip -DestinationPath . -Force
Remove-Item pb.zip
```

Mac o Linux (usar `darwin_arm64`, `darwin_amd64` o `linux_amd64` según el equipo):

```bash
cd pocketbase
curl -L -o pb.zip https://github.com/pocketbase/pocketbase/releases/download/v0.40.6/pocketbase_0.40.6_darwin_arm64.zip
unzip -o pb.zip && rm pb.zip
chmod +x pocketbase
```

### 3. Iniciar PocketBase (terminal 1)

Desde la carpeta `pocketbase/`:

```bash
./pocketbase serve        # en Windows: .\pocketbase.exe serve
```

En el primer arranque, PocketBase aplica automáticamente las migraciones de `pb_migrations/`: crea las colecciones `clientes`, `ordenes` y `eventos` y carga los datos de prueba. La API queda disponible en `http://127.0.0.1:8090`. No se requiere crear un superusuario para usar la aplicación.

### 4. Iniciar la interfaz (terminal 2)

Desde la raíz del proyecto:

```bash
cd web
npm install
npm run dev
```

La aplicación se abre en la dirección que indique Vite (normalmente `http://localhost:5173`). Si PocketBase corre en otra dirección, copiar `web/.env.example` a `web/.env` y ajustar `VITE_PB_URL`.

## Datos de prueba

Se cargan 2 clientes y 5 órdenes en etapas distintas, con su historial de eventos:

| Cliente | Equipo | Etapa |
| --- | --- | --- |
| Ana Martínez | Laptop Lenovo IdeaPad 3 | solicitada |
| Luis Rivera | Teléfono Samsung Galaxy A32 | en_diagnostico |
| Ana Martínez | Televisor LG 43 pulgadas | presupuestada |
| Luis Rivera | Laptop HP Pavilion 15 | en_reparacion |
| Ana Martínez | iPhone 11 | entregada |

Para volver al estado inicial: detener PocketBase, borrar la carpeta `pocketbase/pb_data/` y volver a iniciarlo.

## Verificación de las garantías del servidor

Con PocketBase en ejecución, desde la raíz del proyecto:

```bash
node pruebas/garantias.mjs
```

El script usa la API directamente, sin pasar por la interfaz. Intenta saltar etapas, cancelar fuera de la etapa permitida, modificar el presupuesto, editar órdenes cerradas, borrar órdenes y clientes, y crear, editar o borrar eventos; todos esos intentos deben ser rechazados. También recorre el proceso completo y comprueba que el historial queda registrado en orden y con fecha. Cada comprobación imprime `OK` o `FALLA`. El script crea 3 órdenes de prueba nuevas.

## Decisiones de diseño

**Reglas de acceso.** Al no haber autenticación, las reglas no distinguen quién llama. Lo que nunca debe ocurrir queda en `null`, es decir, bloqueado para toda petición a la API: borrar órdenes y clientes, y crear, editar o borrar eventos. El resto está abierto y lo validan los hooks.

**Hooks** (`pb_hooks/ordenes.pb.js`, con lo compartido en `ordenes_lib.js`):

- Al crear una orden: debe nacer en `solicitada` y sin presupuesto.
- Al actualizar: solo se admite una transición de la tabla del enunciado. Las etapas finales (`rechazada`, `cancelada`, `entregada`) no cambian. Cliente, equipo, problema y fotos no se modifican tras el registro. El presupuesto (`diagnostico`, `manoObra`, `piezas`) solo se escribe en la transición `en_diagnostico → presupuestada`, validado, y después es inmutable.
- Historial: tras guardar un cambio de etapa, el servidor crea el evento (`de`, `a`) dentro de la misma transacción, de modo que orden y evento se guardan juntos o no se guarda ninguno. La fecha la asigna PocketBase (`autodate`). Por eso la creación de eventos está cerrada a la API: nadie puede fabricar historial.

**Total del presupuesto.** Se calcula (mano de obra más cantidad por precio de cada pieza) en `web/src/util.js` y nunca se guarda.

**Coherencia.** Tras cada acción, la interfaz vuelve a pedir los datos al servidor, de modo que lo mostrado coincide con lo guardado al recargar o abrir otro navegador.

## Cumplimiento de los requisitos técnicos

| Requisito | Dónde se cumple |
| --- | --- |
| Proyecto Vite, JavaScript, React Router | `web/package.json`, `web/src/main.jsx` |
| Parámetro de ruta | `ordenes/:id` en `web/src/App.jsx`, leído con `useParams` en `DetalleOrden.jsx` |
| Diseño anidado con `Outlet` | `web/src/components/Layout.jsx` |
| Página para rutas inexistentes | ruta `*`, `web/src/pages/NoEncontrada.jsx` |
| Formularios controlados | `NuevaOrden.jsx`, `FormPresupuesto.jsx` |
| Listas con `key` | listas de órdenes, piezas, fotos, eventos y etapas |
| `useEffect` con dependencias y limpieza | `Resumen.jsx`, `ListaOrdenes.jsx`, `NuevaOrden.jsx`, `DetalleOrden.jsx` (`AbortController`) |
| `useRef` | `FormPresupuesto.jsx` (contador para las keys de las filas), `NuevaOrden.jsx` (input de archivos) |
| `useCallback` | `DetalleOrden.jsx`: `recargar` es dependencia de un efecto y se pasa como prop |
| Peticiones con `fetch`, sin SDK | `web/src/api.js` |
| Esquema en `pb_migrations` | `pocketbase/pb_migrations/1760000000_esquema_inicial.js` |
| Lógica en `pb_hooks` | `pocketbase/pb_hooks/` |
| 3 colecciones relacionadas y campo de archivos | `clientes`, `ordenes`, `eventos`; `ordenes.fotos` (hasta 3 imágenes) |
| Reglas de acceso que bloquean lo que nunca debe ocurrir | `deleteRule: null` en las tres colecciones; `createRule`, `updateRule` y `deleteRule: null` en `eventos` |
| Hook de validación de cambios de etapa | `pocketbase/pb_hooks/ordenes.pb.js` |
| 2 clientes y al menos 3 órdenes en etapas distintas | `pocketbase/pb_migrations/1760000001_datos_de_prueba.js` |

## Estructura del proyecto

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
  garantias.mjs    comprobación de las garantías contra la API
```
