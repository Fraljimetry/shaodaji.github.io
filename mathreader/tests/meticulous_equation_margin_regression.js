const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'js/00-core.js'),'utf8');
const eq=fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8');
const checks=[
  ['explicit page action',core.includes('record.equationMarginEvidence = await meticulousEquationMarginEvidence(')],
  ['reuse page canvas',core.includes('sourceDoc, pageNum, worker, imageCanvas')],
  ['margin scan crop only',eq.includes('existingCanvas: renderedCanvas')],
  ['original render is preserved',eq.includes('if (!existingCanvas) fullCanvas.width = 1')],
  ['parentheses required',eq.includes('if (candidate.bare || candidate.sequenceOnly) continue;')],
  ['side aligned',eq.includes('if (!equationCandidateAlignedToNumberingSide(record)) continue;')],
  ['persistent verified evidence',eq.includes('saved?.equationMarginEvidence || []')],
  ['no scan on reopen',eq.includes('No scan is started here or on reopen.')],
  ['screen numbering syntax',eq.includes('isPlausibleEquationTagInner(normalizedEquationLabel(evidence.label).slice(1, -1))')],
];
for(const [name,pass] of checks){if(!pass) throw Error(name)}
console.log(`OK: ${checks.length} meticulous equation margin assertions`);
