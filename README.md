# La noche es un recurso

Una app web para tomar conciencia de que **cada hora que seguís despierto a la noche es una
hora que estás sacando de tu mañana**.

No es un tracker más: no cuenta horas de sueño como un trofeo. Convierte el tiempo de noche en
un recurso con cantidad fija y te muestra, en tiempo real, cuánto gastaste y a qué hora te
levantás como consecuencia.

## La idea

Tres mecánicas encadenadas:

1. **El desplazamiento visible.** Si te acostás 3 horas tarde, la línea naranja de tu hora real de
   despertar se mueve 3 horas hacia la derecha de la cian que querías. No hay que interpretar nada:
   la aritmética está a la vista.

2. **El inventario de la noche.** Tu noche tiene un presupuesto fijo (por defecto 8 horas). Cada
   minuto despierto de más lo consume. No desaparece: se gasta, y lo que queda se ve.

3. **La deuda de sueño.** La diferencia entre cada noche y tu objetivo se acumula. Dormir de más
   descuenta **1,5 veces** lo que suma estar despierto: la deuda perdona, pero no se olvida.

Además, las horas no valen lo mismo. Entre la **01:00 y las 04:00** el cuerpo está en su punto
más bajo de vigilancia: despertarse ahí saca del sueño profundo y cuesta casi el doble.

## Estructura

```
src/
  lib/
    tiempo.js           eje único de la noche: minutos contados desde las 18:00
    sueno.js            modelo: análisis por noche, coste energético, deuda, franjas
  hooks/
    useSueno.js         estado + persistencia en localStorage
  components/
    ui.jsx              piezas reutilizables (Panel, Cifra, Anillo, Boton, Deslizador)
    CintaNoche.jsx      visual principal: la noche como cinta de 30 minutos
    PanelHoy.jsx        log rápido + cuenta de esta noche
    PanelInventario.jsx presupuesto y precio de la hora
    PanelDeuda.jsx      historial de 14 días y proyección a estar en paz
    PanelAjustes.jsx    objetivos y datos
tests/
  sueno.test.mjs        24 aserciones sobre el modelo
```

Todo vive en un solo eje temporal (minutos desde las 18:00), lo que elimina de raíz los errores
de cruce de medianoche: las 02:30 son `510`, las 07:30 son `810`.

## Uso

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

Los datos se guardan solo en `localStorage` del navegador. Nada sale del dispositivo.