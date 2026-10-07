import assert from "node:assert/strict";
import { test } from "node:test";
import {
  levantarsePrevisto,
  analizarNoche,
  calcularHistorial,
  costeDeTrasnocho,
  costeDesde,
  energiaPrevista,
  enFranjaCritica,
  clasificarFranja,
  nocheDe,
  FRANJA_CRITICA,
} from "../src/nucleo/calculos.js";
import { enEje, formatearHora, formatearDuracion, sumarDias, claveDia } from "../src/nucleo/reloj.js";
import { PLAN_POR_DEFECTO, planValido } from "../src/nucleo/modelo.js";

const flexible = planValido({ modo: "flexible", dormirObjetivo: 330, duracionObjetivo: 480 });
const anclado = planValido({ modo: "anclado", dormirObjetivo: 330, duracionObjetivo: 480, anclaDespertar: 450 });

test("el eje de la noche no se rompe al cruzar la medianoche", () => {
  assert.equal(enEje(new Date(2026, 9, 6, 18, 0)), 0);
  assert.equal(enEje(new Date(2026, 9, 6, 23, 30)), 330);
  assert.equal(enEje(new Date(2026, 9, 7, 2, 30)), 510);
  assert.equal(enEje(new Date(2026, 9, 7, 7, 30)), 810);
  assert.equal(enEje(new Date(2026, 9, 7, 12, 0)), -360);
  assert.equal(formatearHora(510), "02:30");
  assert.equal(formatearHora(1230), "14:30");
});

test("la hora de levantarse sale de la hora de acostarse", () => {
  assert.equal(levantarsePrevisto(330, flexible), 810);
  assert.equal(levantarsePrevisto(510, flexible), 990);
  assert.equal(formatearHora(levantarsePrevisto(510, flexible)), "10:30");
  // No hay tope: acostarse muy tarde produce un despertar muy tarde.
  assert.equal(formatearHora(levantarsePrevisto(840, flexible)), "16:00");
});

test("en modo anclado la hora de levantarse no se mueve", () => {
  assert.equal(levantarsePrevisto(330, anclado), 450);
  assert.equal(levantarsePrevisto(600, anclado), 450);
});

test("la franja crítica cuesta más que la misma hora tardía", () => {
  assert.ok(enFranjaCritica(FRANJA_CRITICA.desde));
  assert.ok(!enFranjaCritica(FRANJA_CRITICA.hasta));
  assert.ok(costeDesde(FRANJA_CRITICA.desde, 180) > costeDesde(flexible.dormirObjetivo, 180));
});

test("el coste del trasnocho se mide desde tu hora objetivo", () => {
  assert.equal(costeDeTrasnocho(0, flexible), 0);
  assert.equal(costeDeTrasnocho(-60, flexible), 0);
  assert.ok(costeDeTrasnocho(180, flexible) > 0);
});

test("dormir poco genera deuda y dormir de más la descuenta más rápido", () => {
  const historial = calcularHistorial(
    [
      { fecha: "2026-10-01", acostarse: 510, levantarse: 780 }, // durmió 4h30, faltan 3h30
      { fecha: "2026-10-02", acostarse: 300, levantarse: 780 }, // durmió 8h, sobran 0
      { fecha: "2026-10-03", acostarse: 300, levantarse: 810 }, // sobran 30 min
    ],
    flexible
  );
  assert.equal(historial[0].deuda, 210);
  assert.equal(historial[1].deuda, 210);
  assert.equal(historial[2].delta, -45);
  assert.equal(historial[2].deuda, 165);
});

test("el historial se ordena aunque venga desordenado", () => {
  const h = calcularHistorial(
    [
      { fecha: "2026-10-03", acostarse: 330, levantarse: 810 },
      { fecha: "2026-10-01", acostarse: 330, levantarse: 810 },
    ],
    flexible
  );
  assert.deepEqual(h.map((n) => n.fecha), ["2026-10-01", "2026-10-03"]);
});

test("una noche incompleta no altera la deuda", () => {
  const h = calcularHistorial([{ fecha: "2026-10-01", acostarse: 600, levantarse: null }], flexible);
  assert.equal(h[0].deuda, 0);
  assert.equal(h[0].completa, false);
});

test("la energía baja con el trasnocho y con la deuda", () => {
  const enHora = analizarNoche({ acostarse: 330, levantarse: 810 }, flexible);
  const tarde = analizarNoche({ acostarse: 510, levantarse: 810 }, flexible);
  assert.ok(energiaPrevista(tarde, 0) < energiaPrevista(enHora, 0));
  assert.ok(energiaPrevista(enHora, 300) < energiaPrevista(enHora, 0));
  assert.ok(energiaPrevista(tarde, 0) >= 0 && energiaPrevista(tarde, 0) <= 100);
});

test("un desfase que cruza la franja crítica se marca como tal", () => {
  const critico = analizarNoche({ acostarse: 420, levantarse: 810 }, flexible);
  assert.ok(critico.tocaFranjaCritica);
  const leve = analizarNoche({ acostarse: 345, levantarse: 810 }, flexible);
  assert.ok(!leve.tocaFranjaCritica);
});

test("las franjas se clasifican según el estado de la noche", () => {
  const analisis = analizarNoche({ acostarse: 330, levantarse: 810 }, flexible);
  const deTarde = clasificarFranja({ inicio: -360, fin: -330 }, analisis, 500);
  const durmiendo = clasificarFranja({ inicio: 400, fin: 430 }, analisis, 500);
  const futuro = clasificarFranja({ inicio: 900, fin: 930 }, analisis, 500);
  assert.equal(deTarde, "dia");
  assert.equal(durmiendo, "reposo");
  assert.equal(futuro, "futuro");
});

test("la noche de las 2am pertenece al día anterior", () => {
  assert.equal(nocheDe(new Date(2026, 9, 7, 2, 30)), "2026-10-06");
  assert.equal(nocheDe(new Date(2026, 9, 6, 23, 30)), "2026-10-06");
  assert.equal(nocheDe(new Date(2026, 9, 7, 12, 0)), "2026-10-06");
});

test("formateo de duraciones en español", () => {
  assert.equal(formatearDuracion(90), "1 h 30");
  assert.equal(formatearDuracion(45), "45 min");
  assert.equal(formatearDuracion(120), "2 h");
  assert.equal(formatearDuracion(-90), "-1 h 30");
});

test("las fechas avanzan bien", () => {
  assert.equal(sumarDias("2026-10-31", 1), "2026-11-01");
  assert.equal(sumarDias("2026-01-01", -1), "2025-12-31");
  assert.equal(claveDia(new Date(2026, 0, 5)), "2026-01-05");
});

test("el plan por defecto es coherente", () => {
  assert.equal(PLAN_POR_DEFECTO.modo, "flexible");
  assert.equal(formatearHora(PLAN_POR_DEFECTO.dormirObjetivo), "23:30");
  assert.equal(formatearHora(PLAN_POR_DEFECTO.anclaDespertar), "07:30");
});
