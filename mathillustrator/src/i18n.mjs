/** Scoped editor UI translation, never modifies mathematical object text or exported project data. */
const zh={
 'Undo':'撤销','Redo':'重做','New':'新建','Open':'打开','Save':'保存','Import TeX':'导入 TeX','Export ▾':'导出 ▾','Export':'导出','Objects':'对象','Tools':'工具','Properties':'属性','Recently Deleted':'最近删除','Delete selected':'删除选中','Restore':'恢复','Hidden':'隐藏对象','Construction input':'构造输入','Syntax':'语法','Geometry':'几何','Illustration':'绘图','Diagrams':'交换图','Basic':'基本','Plotting':'绘图','Point':'点','Move':'移动','Pan':'平移','Segment':'线段','Arrow':'箭头','Vector':'向量','Infinite line':'直线','Circle':'圆','Ellipse':'椭圆','Rectangle':'矩形','Polygon':'多边形','Polyline':'折线','Bézier':'贝塞尔','Angle':'角','Regular polygon':'正多边形','Free curve':'自由曲线','Text':'文字','Diagram node':'图节点','Morphism':'态射','Toolkits':'工具组','Fit':'适应','Setting':'设置','Settings / 设置':'设置','Font':'字体','Return to Move after placing a point':'放置点后返回移动工具',
 'Page & appearance':'画布与外观','New object style':'新对象样式','Geometry options':'几何选项','Plot detail':'绘图精度','Fast · responsive':'快速','Balanced · default':'均衡','Detailed · more sampling':'精细','Free curves':'自由曲线','Open':'打开','Close when ends are near':'端点接近时闭合','Always close':'始终闭合','Curve smoothing':'曲线平滑','Off · exact pointer':'关闭','Gentle · smooth':'轻度','Medium · smooth + simplify':'中度','Strong':'强','Ultra-smooth':'超平滑','Regular polygon sides':'正多边形边数','Snap interval':'吸附间隔','Snap to grid':'吸附网格','Snap to existing points':'吸附已有点','Show grid':'显示网格','Show axes':'显示坐标轴','Show point labels':'显示点标签','Point label placement':'点标签布局','Standard · exact legacy position':'标准','Avoid nearby overlaps':'尽量避让重叠','Stroke':'线条颜色','Fill':'填充颜色','Line width':'线宽','Point size':'点大小','Opacity':'不透明度','Canvas':'画布','Infinite':'无限画布','A4 landscape frame':'A4 横向','Letter landscape frame':'Letter 横向','Export area':'导出范围','Current viewport':'当前视图','Page frame only':'仅页面边框','Include grid and axes in image exports':'导出网格与坐标轴','Transparent background':'透明背景','Raster resolution':'位图分辨率','Background':'背景','Theme':'主题','Light':'浅色','Dark':'深色','1×':'1 倍','2× · default':'2 倍','3×':'3 倍','4×':'4 倍',
 'Name':'名称','x':'x','y':'y','Text / label':'文字／标签','Arrow label':'箭头标签','Font size':'字号','Label format':'标签格式','Plain text':'普通文本','LaTeX math':'LaTeX 数学公式','Serif':'衬线字体','Sans-serif':'无衬线字体','Monospace':'等宽字体','Node border':'节点边框','Arrow style':'箭头样式','→ Solid':'实线箭头','Dashed':'虚线','Dotted':'点线','Hooked':'钩形箭头','Hooked dashed':'虚线钩形','Two heads':'双箭头','Tail bar':'尾部竖线','Curve / bend':'弯曲程度','Auto route':'自动路径','Label position on arrow (0.05–0.95)':'标签位置','Label distance (px)':'标签距离 (px)','Label shift X (px)':'标签水平偏移 (px)','Label shift Y (px)':'标签竖直偏移 (px)','Swap label side':'切换标签侧','Avoid collisions':'避让标签','Number of sides':'边数','Point radius':'点半径','Bring forward':'上移一层','Send backward':'下移一层','Center view':'居中查看','Delete + dependents':'删除及依赖对象',
 'Export illustration':'导出图形','SVG':'SVG','PNG':'PNG','JPEG':'JPEG','WebP':'WebP','TikZ / PGF':'TikZ / PGF','tikz-cd (semantic)':'tikz-cd（语义）','JSON project':'JSON 项目','PDF':'PDF','Asymptote':'Asymptote','GIF / video':'GIF／视频','Import diagram':'导入交换图','Import semantic tikz-cd':'导入 tikz-cd','Recently Deleted':'最近删除','Select an object to edit its style, labels, coordinates or dependencies.':'选择对象后编辑属性。','Find objects…':'搜索对象…','Drag tool sections by their headings to rearrange.':'拖动工具组标题可调整顺序。','Local backup ready':'本地备份已就绪','Ready':'就绪','Retry local save':'重试本地保存',
 'General':'全部','Construction':'几何','Function plotting':'函数绘图',
 'Undo (Ctrl+Z)':'撤销 (Ctrl+Z)','Redo (Ctrl+Y)':'重做 (Ctrl+Y)','New project':'新建项目','Open a JSON project':'打开 JSON 项目','Save editable project':'保存可编辑项目','Import semantic tikz-cd diagram':'导入 tikz-cd 交换图',
};
const originalText=new WeakMap(),originalAttrs=new WeakMap();
const skip='script,style,svg,.objects,#toast,#render-info,#coords,#autosave-info,#object-count,#trash-count,#mode-label,#command,#drawing';
function translateTextNode(node,language){
 if(!originalText.has(node))originalText.set(node,node.nodeValue);
 const original=originalText.get(node),trim=original.trim();
 if(!trim||!Object.hasOwn(zh,trim))return;
 node.nodeValue=language==='zh'?original.replace(trim,zh[trim]):original;
}
export function localizeUI(root,language='en'){
 if(!root||!['en','zh'].includes(language))return;
 const doc=root.ownerDocument||root;
 const walker=doc.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const n of nodes){if(n.parentElement?.closest(skip))continue;translateTextNode(n,language);}
 const candidates=root.querySelectorAll?.('[title],[aria-label],[placeholder]')||[];
 for(const el of candidates){if(el.closest(skip))continue;let base=originalAttrs.get(el);
  if(!base){base={};for(const name of ['title','aria-label','placeholder'])if(el.hasAttribute(name))base[name]=el.getAttribute(name);originalAttrs.set(el,base);}
  for(const [name,value] of Object.entries(base))if(Object.hasOwn(zh,value))el.setAttribute(name,language==='zh'?zh[value]:value);
 }
}
export function translated(s,language='en'){return language==='zh'?(zh[s]||s):s;}
export const supportedLanguages=['en','zh'];
