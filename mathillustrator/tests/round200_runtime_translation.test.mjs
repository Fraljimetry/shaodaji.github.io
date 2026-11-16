import test from 'node:test';
import assert from 'node:assert/strict';
import {translated, translatedGeneratedPlotName} from '../src/i18n.mjs';

test('Round 200 bilingual runtime statuses including numeric render durations',()=>{
 const examples=[
  ['Saved locally','已保存到本地'],
  ['3D rendering failed: sampling interrupted','三维渲染失败：sampling interrupted'],
  ['Same project synchronized','相同项目已同步'],
  ['Local changes pending…','本地更改待保存…'],
  ['2 3D plots · rendering…','2 个三维图形 · 正在渲染…'],
  ['2 3D plots · 6220 ms · drag preview','2 个三维图形 · 6220 毫秒 · 拖动预览'],
  ['3 3D plots · 4 ms · PLOT LIMIT: reduce detail/plots','3 个三维图形 · 4 毫秒 · 绘图限制：请降低精度或减少图形'],
  ['33 objects · 82.4 ms','33 个对象 · 82.4 毫秒'],
 ];
 for(const [en,zh] of examples){assert.equal(translated(en,'zh'),zh);assert.equal(translated(en,'en'),en);}
});
test('Round 200 generated 3D names are localized for display but custom names remain intact',()=>{
 const cases=[['implicit3d','Implicit surface 12','隐式曲面 12'],['surface3d','Surface 2','曲面 2'],['parametric3d','Parametric surface 3','参数曲面 3'],['vector3d','Vector field 4','向量场 4'],['domain3d','Domain coloring 5','定义域着色 5']];
 for(const [kind,en,zh] of cases){assert.equal(translatedGeneratedPlotName(en,kind,'zh'),zh);assert.equal(translatedGeneratedPlotName(en,kind,'en'),en);}
 for(const name of ['Implicit surface custom','Implicit surface 0','My Implicit surface 12','Surface 2'])assert.equal(translatedGeneratedPlotName(name,'implicit3d','zh'),name);
});
