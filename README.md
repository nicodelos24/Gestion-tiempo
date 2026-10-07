# La noche es un recurso

Una app web para que cada hora que seguís despierto a la noche se sienta como
**una hora que estás sacando de tu mañana**.

La idea no es contar horas de sueño: es volver visible la consecuencia. Si te
acostás tarde, la app te dice a qué hora te vas a levantar, cuánto te cuesta en
energía y cómo se acumula con las noches anteriores.

## Qué hace

### Te avisa, y se deja patear
Un aviso llega antes de tu hora de dormir (por defecto 45 minutos antes). Tiene
dos botones:

- **En 30 minutos**: pateás el aviso y te vuelve a preguntar más tarde.
- **Ya me acosté**: queda registrada tu hora y se corre el reloj de la mañana.

Si lo pateás varias veces, el aviso se vuelve insistente y cambia el tono. A la
mañana llega otro aviso preguntando **a qué hora te levantaste**, con botones de
*Ahora*, *+30 min* y *+1 h*, para cerrar el registro sin abrir la app.

### Calcula tu hora de levantarse
Es la pieza central. Hay dos formas de organizarse:

| Modo | Qué hace | Cuándo conviene |
|---|---|---|
| **Cuando me toque** | La hora de levantarse sale de la hora en que te acostaste. Si te acostás a las 00:30, te levantás 8 h después. | Fines de semana, horarios sueltos. |
| **Hora fija** | Te levantás siempre a la misma hora. Si te acostás tarde, dormís menos y eso queda anotado como deuda. | Entre semana, cuando el horario no se negocia. |

En ambos casos hay un **simulador**: movés la hora de acostarte y la app te
muestra, sin adornos, a qué hora te levantarías y cuántos puntos de energía
perderías.

### No hay tope de hora
La hora de levantarse no está limitada a las 10:00. Si te acostás a las 03:00
con 8 h de objetivo, la app te dice que te levantás a las 11:00. Y si querés
anclar la mañana, el deslizador llega hasta las 14:00.

### La franja cara
Entre la **01:00 y las 04:00** el cuerpo está en su punto más bajo de
vigilancia. Despertarse ahí te saca del sueño profundo y cuesta casi el doble
que la misma hora a las 23:30. El mismo retraso de 3 h vale una cosa u otra
según dónde caiga.

### El registro y la deuda
Cada noche se compara con tu objetivo. Lo que faltó se acumula; lo que sobró se
descuesta **1,5 veces** más rápido: la deuda perdona, pero no se olvida. El
historial muestra 14 días y proyecta en cuántas noches volvés a estar en paz.

## Estructura

```
src/
  nucleo/            lógica pura, sin React y sin navegador
    reloj.js           eje temporal: minutos contados desde las 18:00
    modelo.js          forma de los datos y valores por defecto
    calculos.js        hora de levantarse, deuda, energía, franjas
    persistencia.js    localStorage versionado
  servicios/
    alarmas.js         mecánica de recordatorios
    notificaciones.js  permiso y avisos del sistema
  hooks/
    useSueno.js        estado global y reloj vivo
    useCicloNoche.js   política: qué avisar, cuándo y qué pasa al contestar
  ui/                 primitivos (Tarjeta, Botón, Anillo, Cinta, controles)
  pantallas/          Hoy, Plan, Historial
public/
  sw.js                service worker: muestra los avisos y traduce los clics
tests/
  calculos.test.mjs    15 pruebas sobre el motor
```

La separación es deliberada: `nucleo/calculos.js` no sabe que existen
notificaciones, y `servicios/alarmas.js` no sabe quéosticé avisar. Eso permite
probar toda la lógica sin navegador.

## Decisiones técnicas

- **React 19 + Vite 8 + Tailwind 4**, sin dependencias extra. Todo lo que hace
  falta (avisos, acciones, service worker) ya existe en la plataforma.
- **Un solo eje temporal**: minutos contados desde las 18:00. Las 02:30 son
  `510` y las 07:30 son `810`, así que cruzar la medianoche no es un caso
  especial. Entre las 10:00 y las 18:00 el valor es negativo: es de día.
- **Service worker** porque los botones de una notificación sólo funcionan si la
  muestra un worker registrado. Si la app está cerrada, el clic abre la app y le
  pasa la decisión por la URL.
- **Limitación honesta**: los temporizadores viven en la pestaña. Si cerrás la
  app, los avisos pendientes te esperan al volver a abrirla. La app lo dice en
  la pantalla de Plan.

## Uso

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 15 pruebas del motor de cálculo
npm run build    # genera dist/ con rutas relativas
npm run preview
```

Los datos se guardan solo en `localStorage` del navegador. Nada sale del
dispositivo, y se pueden descargar a un JSON desde la pantalla de Plan.
