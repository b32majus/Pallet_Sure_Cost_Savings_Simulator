const test = require('node:test');
const assert = require('node:assert/strict');
const {calculate,validate,demo} = require('../calculator.js');
const approx = (actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} vs ${expected}`);

test('reproduces source figures after correcting the seconds-to-hours error',()=>{
  const r=calculate(demo);
  assert.equal(r.ok,true);
  approx(r.filmMaterial,625);approx(r.filmTax,112.5);
  approx(r.filmLabor,312.5); // Excel incorrectly gave 18,750
  approx(r.filmTotal,1050); // Excel incorrectly gave 19,487.5
  approx(r.fixLabor,125/6); // Excel incorrectly gave 1,250
  approx(r.fixWear,2.5);approx(r.fixTotal,70/3);
  approx(r.savings,3080/3); // Excel incorrectly gave 18,235
  assert.ok(r.paybackMonths>0); // Excel returned 0 due to B29 blank
});

test('tax is excluded by default to avoid double counting',()=>{
  const r=calculate({...demo,applyTax:false});
  approx(r.filmTax,0);
  approx(r.filmTotal,937.5);
  approx(r.savings,937.5-(125/6+2.5));
});

test('no-payback and negative-savings scenario',()=>{
  const r=calculate({...demo,applyTax:false,filmKg:0,filmTime:0,fixTime:90,fixPrice:100,returnCost:3});
  assert.ok(r.savings<0);
  assert.equal(r.paybackMonths,null);
  assert.ok(r.savedHours<0);
});

test('cost of a reusable part scales with pieces used per pallet',()=>{
  const a=calculate({...demo,piecesPerPallet:1});
  const b=calculate({...demo,piecesPerPallet:3,inventory:3});
  approx(b.fixWear,3*a.fixWear);
  approx(b.initialInvestment,3*a.initialInvestment);
});

test('validates required numeric quantities and advanced limits',()=>{
  assert.ok(validate({...demo,pallets:0}).pallets);
  assert.ok(validate({...demo,cycles:1.5}).cycles);
  assert.ok(validate({...demo,lossRate:150}).lossRate);
  assert.ok(validate({...demo,applyTax:true,nonRecycled:110}).nonRecycled);
  assert.ok(validate({...demo,filmTime:''}).filmTime);
  assert.deepEqual(validate(demo),{});
});

test('returns finite values for zero consumption and zero prices',()=>{
  const r=calculate({...demo,applyTax:false,filmKg:0,filmPrice:0,filmTime:0,hourlyCost:0,fixPrice:0,fixTime:0});
  assert.ok(r.ok);assert.equal(r.savings,0);
  assert.equal(r.savingsPct,null);
  assert.equal(r.paybackMonths,null);
});
