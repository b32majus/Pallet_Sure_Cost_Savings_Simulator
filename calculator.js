/* Modelo de cálculo de Pallet Sure. Sin dependencias ni conexiones de red.
   Fuentes: Excel "Calculadora Ahorro FixBox.xlsx" (23-10-2026),
   con corrección de segundos / 3600 y del payback; ampliación explícita
   de piezas/palé, retorno, pérdidas y tributación opcional. */
(function (root, create) {
  const api = create();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PalletCalculator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const required = ['pallets', 'filmKg', 'filmPrice', 'filmTime', 'hourlyCost', 'fixPrice', 'cycles', 'piecesPerPallet', 'inventory', 'fixTime'];
  const integers = new Set(['pallets', 'cycles', 'piecesPerPallet', 'inventory']);
  const positive = new Set(['pallets', 'cycles', 'piecesPerPallet', 'inventory']);
  const demo = Object.freeze({
    pallets: 500, filmKg: 0.5, filmPrice: 2.5, filmTime: 150,
    hourlyCost: 15, fixPrice: 5, cycles: 1000,
    piecesPerPallet: 1, inventory: 1, fixTime: 10,
    applyTax: true, taxRate: 0.45, nonRecycled: 100,
    returnCost: 0, lossRate: 0
  });
  function toNumber(value) {
    if (typeof value === 'string' && value.trim() === '') return NaN;
    if (value === null || value === undefined) return NaN;
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
  }
  function validate(raw, fields = required) {
    const errors = {};
    for (const name of fields) {
      const n = toNumber(raw[name]);
      if (!Number.isFinite(n)) errors[name] = 'Introduce un número válido.';
      else if (n < 0 || (positive.has(name) && n <= 0)) errors[name] = 'Introduce un valor mayor que cero.';
      else if (integers.has(name) && !Number.isInteger(n)) errors[name] = 'Introduce un número entero.';
    }
    for (const name of ['returnCost', 'lossRate']) {
      const n = toNumber(raw[name] ?? 0);
      if (!Number.isFinite(n) || n < 0 || (name === 'lossRate' && n > 100)) errors[name] = 'Comprueba este valor.';
    }
    if (raw.applyTax) {
      for (const name of ['taxRate', 'nonRecycled']) {
        const n = toNumber(raw[name]);
        if (!Number.isFinite(n) || n < 0 || (name === 'nonRecycled' && n > 100)) errors[name] = 'Comprueba este valor.';
      }
    }
    return errors;
  }
  function calculate(raw) {
    const errors = validate(raw);
    if (Object.keys(errors).length) return {ok: false, errors};
    const n = Object.fromEntries(Object.keys(demo).filter(x => x !== 'applyTax').map(k => [k, toNumber(raw[k] ?? (['returnCost', 'lossRate', 'taxRate', 'nonRecycled'].includes(k) ? demo[k] : undefined))]));
    const filmMaterial = n.pallets * n.filmKg * n.filmPrice;
    const filmLabor = n.pallets * n.filmTime / 3600 * n.hourlyCost;
    const filmTax = raw.applyTax ? n.pallets * n.filmKg * (n.nonRecycled / 100) * n.taxRate : 0;
    const filmTotal = filmMaterial + filmLabor + filmTax;
    const fixLabor = n.pallets * n.fixTime / 3600 * n.hourlyCost;
    const fixWear = n.pallets * n.piecesPerPallet * n.fixPrice / n.cycles;
    const fixReturns = n.pallets * n.returnCost;
    const fixLoss = n.pallets * n.piecesPerPallet * n.fixPrice * n.lossRate / 100;
    const fixTotal = fixLabor + fixWear + fixReturns + fixLoss;
    const savings = filmTotal - fixTotal;
    const savingsPct = filmTotal > 0 ? savings / filmTotal * 100 : null;
    const savedHours = n.pallets * (n.filmTime - n.fixTime) / 3600;
    const savedTimePct = n.filmTime > 0 ? (n.filmTime - n.fixTime) / n.filmTime * 100 : null;
    const initialInvestment = n.inventory * n.fixPrice;
    // Payback simple sobre ahorro de caja; NO descuenta el desgaste contable dos veces.
    const yearlyCashBenefit = filmTotal - (fixLabor + fixReturns + fixLoss);
    const paybackMonths = yearlyCashBenefit > 0 ? initialInvestment / yearlyCashBenefit * 12 : null;
    const feasibilityWarnings = [];
    if (n.inventory < n.piecesPerPallet) feasibilityWarnings.push('El stock inicial es inferior a las piezas necesarias para un solo palé.');
    if (n.cycles > 100) feasibilityWarnings.push('La vida útil introducida exige validar reutilizaciones reales y retorno de las piezas.');
    if (n.pallets > n.inventory / n.piecesPerPallet * n.cycles) feasibilityWarnings.push('Con el stock inicial indicado y esa vida útil, sería necesaria reposición dentro del año.');
    if (raw.applyTax) feasibilityWarnings.push('El impuesto se añade por separado: verifica que sea exigible y no esté incluido en el precio del film.');
    return {ok: true, inputs: n, applyTax: !!raw.applyTax,
      filmMaterial, filmLabor, filmTax, filmTotal, fixLabor, fixWear, fixReturns,
      fixLoss, fixTotal, savings, savingsPct, savedHours, savedTimePct,
      initialInvestment, yearlyCashBenefit, paybackMonths, feasibilityWarnings};
  }
  return {calculate, validate, required, demo};
});
