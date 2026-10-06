import assert from "node:assert/strict";
import {
  analizarNoche,
  calcularHistorial,
  costeDeInversion,
  costeDesde,
  presupuestoNoche,
  AJUSTES_POR_DEFECTO,
} from "../src/lib/sueno.js";
import { formatearHora, minutosDesde18, formatearDuracion } from "../src/lib/tiempo.js";

// Eje de la noche
assert.equal(formatearHora(AJUSTES_POR_DEFECTO.dormir), "23:30");
assert.equal(formatearHora(AJUSTES_POR_DEFECTO.despertar), "07:30");
assert.equal(presupuestoNoche(), 8 * 60);
assert.equal(formatearDuracion(90), "1 h 30");

// Noche en hora
const enHora = analizarNoche({ dormir: 330, levantar: 810 });
assert.equal(enHora.desfase, 0);
assert.equal(enHora.durmido, 480);
assert.equal(enHora.despertarPrevisto, 810);

// Acostarse 3 h tarde empuja el despertar 3 h y cuesta energía
const tarde = analizarNoche({ dormir: 510, levantar: 900 });
assert.equal(tarde.desfase, 180);
assert.equal(tarde.inversion, 180);
assert.equal(tarde.despertarPrevisto, 990);
assert.equal(formatearHora(tarde.despertarPrevisto), "10:30");
assert.ok(tarde.energiaPerdida > costeDeInversion(180) * 0.5);

// El retraso en zona crítica cuesta más que el mismo retraso en hora tardía
const tardia = costeDesde(AJUSTES_POR_DEFECTO.dormir, 180);
const critica = costeDesde(420, 180);
assert.ok(critica > tardia, `critica ${critica} deberia superar tardia ${tardia}`);
assert.equal(costeDeInversion(180), tardia);

// La deuda perdona 1.5x
const historial = calcularHistorial([
  { fecha: "2026-10-01", dormir: 510, levantar: 840 }, // durmió 5h30 -> faltan 2h30
  { fecha: "2026-10-02", dormir: 300, levantar: 810 }, // durmió 8h30 -> sobran 30 min
]);
assert.equal(historial[0].deuda, 150);
assert.equal(historial[1].deuda, 105);
assert.equal(historial[1].delta, -45);

// Historial desordenado se ordena por fecha
const desordenado = calcularHistorial([
  { fecha: "2026-10-03", dormir: 330, levantar: 810 },
  { fecha: "2026-10-01", dormir: 510, levantar: 840 },
]);
assert.equal(desordenado[0].fecha, "2026-10-01");

// Noche incompleta no genera deuda
const sinTerminar = calcularHistorial([{ fecha: "2026-10-01", dormir: 510, levantar: null }]);
assert.equal(sinTerminar[0].deuda, 0);
assert.equal(sinTerminar[0].completa, false);

// Cruce de medianoche
assert.equal(minutosDesde18(new Date(2026, 9, 6, 23, 30)), 330);
assert.equal(minutosDesde18(new Date(2026, 9, 7, 2, 0)), 480);
assert.equal(minutosDesde18(new Date(2026, 9, 7, 12, 0)), -360);

console.log("OK: 24 aserciones");