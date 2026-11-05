(function () {
  'use strict';
  const api = window.PalletCalculator;
  const i18n = window.PalletI18n;
  const tr = value => i18n.translate(value);
  const msg = (key, values) => i18n.phrase(key, values);
  const form = document.getElementById('calcForm');
  const banner = document.getElementById('demoBanner');
  const inputs = Array.from(form.querySelectorAll('input'));
  const steps = Array.from(document.querySelectorAll('.form-step'));
  const progress = Array.from(document.querySelectorAll('[data-progress]'));
  const money = new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
  const decimal = new Intl.NumberFormat('es-ES',{maximumFractionDigits:1});
  const byId = id => document.getElementById(id);
  let demoMode = false;
  let lastResult = null;
  let step = 1;
  function getRaw() {
    const raw = {};
    inputs.forEach(i => {raw[i.name] = i.type === 'checkbox' ? i.checked : i.value;});
    return raw;
  }
  function setStep(newStep) {
    step = newStep;
    steps.forEach(el => {el.hidden = Number(el.dataset.step) !== newStep;});
    progress.forEach(el => {
      const pos = Number(el.dataset.progress);
      el.classList.toggle('current',pos === newStep);
      el.classList.toggle('done',pos < newStep);
      el.setAttribute('aria-current',pos === newStep ? 'step' : 'false');
    });
    document.getElementById('calculadora').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function clearErrors() {
    form.querySelectorAll('[data-error]').forEach(n=>{n.textContent='';});
    inputs.forEach(i => i.removeAttribute('aria-invalid'));
  }
  function validateStep(which) {
    clearErrors();
    const fields = which === 1 ? ['pallets','filmKg','filmPrice','filmTime','hourlyCost'] : ['fixPrice','cycles','piecesPerPallet','inventory','fixTime'];
    const all = api.validate(getRaw(), fields);
    const errors = which === 1 ? Object.fromEntries(Object.entries(all).filter(([k])=>fields.includes(k))) : all;
    for(const [name,message] of Object.entries(errors)) {
      const input = form.elements.namedItem(name);
      if (input && input instanceof HTMLElement) input.setAttribute('aria-invalid','true');
      const err = form.querySelector(`[data-error="${name}"]`);
      if (err) err.textContent = tr(message);
    }
    if (Object.keys(errors).length) {
      const firstName = Object.keys(errors)[0];
      const first = form.elements.namedItem(firstName);
      if (first && first.closest('details')) first.closest('details').open = true;
      if (first && typeof first.focus === 'function') first.focus();
      return false;
    }
    return true;
  }
  function revealTax() {byId('taxInputs').hidden = !byId('applyTax').checked;}
  function put(id,text){byId(id).textContent=text;}
  function render(result){
    lastResult = result;
    put('annualSavings',money.format(result.savings));
    const isLoss = result.savings < 0;
    byId('mainResult').classList.toggle('negative',isLoss);
    put('resultSummary', isLoss ? msg('loss') : result.savings === 0 ? msg('equal') : msg('savings',{percent:decimal.format(result.savingsPct ?? 0)}));
    put('filmAnnual',money.format(result.filmTotal));
    put('fixAnnual',money.format(result.fixTotal));
    put('timeSaved',decimal.format(Math.abs(result.savedHours))+' h');
    put('timePct', result.savedHours < 0 ? msg('addedHours') : msg('savedTime',{percent:decimal.format(result.savedTimePct ?? 0)}));
    put('barFilmNum',money.format(result.filmTotal));
    put('barFixNum',money.format(result.fixTotal));
    const scale = Math.max(1,result.filmTotal,result.fixTotal);
    byId('barFilm').style.width = `${result.filmTotal / scale * 100}%`;
    byId('barFix').style.width = `${result.fixTotal / scale * 100}%`;
    ['filmMaterial','filmLabor','filmTax','fixLabor','fixWear','fixReturns','fixLoss'].forEach(name => {
      const target = {filmMaterial:'costFilmMaterial',filmLabor:'costFilmLabor',filmTax:'costFilmTax',fixLabor:'costFixLabor',fixWear:'costFixWear',fixReturns:'costFixReturns',fixLoss:'costFixLoss'}[name];
      put(target,money.format(result[name]));
    });
    put('initialInvestment',money.format(result.initialInvestment));
    let p = msg('noPayback');
    if(result.paybackMonths !== null){
      p = result.paybackMonths < 1 ? msg('days',{number:decimal.format(result.paybackMonths * 365 / 12)}) : msg('months',{number:decimal.format(result.paybackMonths)});
    }
    put('payback',p);
    const cautions = [
      tr('No se incluyen gastos de implantación, mantenimiento, mermas o compatibilidad de carga que no se hayan introducido.'),
      ...result.feasibilityWarnings.map(tr)
    ];
    put('advisory', '');
    const advisory = byId('advisory');
    const strong = document.createElement('strong');strong.textContent=tr('Antes de decidir');
    const para = document.createElement('p');para.textContent=cautions.join(' ');
    advisory.append(strong,para);
  }
  byId('toStep2').addEventListener('click',()=>{if(validateStep(1)) setStep(2);});
  byId('backStep1').addEventListener('click',()=>setStep(1));
  byId('toResults').addEventListener('click',()=>{
    if(!validateStep(2))return;
    const result = api.calculate(getRaw());
    if(!result.ok){validateStep(2);return;}
    render(result);setStep(3);
  });
  byId('backStep2').addEventListener('click',()=>setStep(2));
  byId('editResults').addEventListener('click',()=>setStep(1));
  byId('demoButton').addEventListener('click',()=>{
    for(const [name,value] of Object.entries(api.demo)){
      const input = form.elements.namedItem(name);
      if(input){if(input.type === 'checkbox')input.checked=value;else input.value=String(value);}
    }
    clearErrors();demoMode=true;banner.hidden=false;revealTax();setStep(1);
  });
  inputs.forEach(input=>input.addEventListener('input',()=>{
    if(demoMode){demoMode=false;banner.hidden=true;}
    input.removeAttribute('aria-invalid');
    const error=form.querySelector(`[data-error="${input.name}"]`);
    if(error)error.textContent='';
  }));
  byId('applyTax').addEventListener('change',revealTax);
  byId('resetCalc').addEventListener('click',()=>{
    form.reset();clearErrors();revealTax();demoMode=false;banner.hidden=true;lastResult=null;
    setStep(1);
  });
  byId('printResults').addEventListener('click',()=>window.print());
  byId('shareResults').addEventListener('click',async()=>{
    if(!lastResult)return;
    const r=lastResult;
    const message = msg('shareBody', {pallets:decimal.format(r.inputs.pallets),film:money.format(r.filmTotal),fix:money.format(r.fixTotal),savings:money.format(r.savings),investment:money.format(r.initialInvestment),url:location.protocol.startsWith('http')?location.href:''});
    try{
      if(navigator.share){await navigator.share({title:msg('shareTitle'),text:message});put('shareMessage','');}
      else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(message);put('shareMessage',tr('Resumen copiado al portapapeles.'));}
      else{window.prompt(tr('Copia este resumen:'),message);}
    }catch(e){if(e.name!=='AbortError')put('shareMessage',tr('No se ha podido compartir. Puedes guardarlo como PDF.'));}
  });
  i18n.onChange(() => {
    if (lastResult) render(lastResult);  // Rebuild every result and PDF section in the chosen language.
    const fields = step === 1 ? ['pallets','filmKg','filmPrice','filmTime','hourlyCost'] : ['fixPrice','cycles','piecesPerPallet','inventory','fixTime'];
    const errors = api.validate(getRaw(),fields);
    form.querySelectorAll('[data-error]').forEach(element => {
      if (element.textContent.trim()) element.textContent = errors[element.dataset.error] ? tr(errors[element.dataset.error]) : '';
    });
    const notice = byId('shareMessage');
    if (notice.textContent.trim()) {
      notice.textContent = i18n.language === 'en' ? 'Summary is available in the selected language. Share again to copy it.' : 'El resumen está disponible en el idioma seleccionado. Compártelo de nuevo para copiarlo.';
    }
  });
  form.addEventListener('submit',e=>e.preventDefault());
  byId('currentYear').textContent = new Date().getFullYear();
  revealTax();
})();