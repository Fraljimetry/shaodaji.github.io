"""Round 110: dense 3D GPU selection, explicit fallback, SVG export parity.

Actual Chromium checks real WebGL availability. When unavailable, a recording
WebGL2 test double verifies the integration contract, *not* shader execution
or hardware acceleration; this distinction is explicit in the result.
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

MOCK = r"""(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  window.__gpuCalls = {draw:0, vertices:0, uploaded:0, released:0};
  HTMLCanvasElement.prototype.getContext = function(kind,...args) {
    if (kind !== 'webgl2') return original.call(this,kind,...args);
    const gl={VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,COMPILE_STATUS:35713,
      LINK_STATUS:35714,ARRAY_BUFFER:34962,STREAM_DRAW:35040,FLOAT:5126,
      DEPTH_TEST:2929,BLEND:3042,SRC_ALPHA:770,ONE_MINUS_SRC_ALPHA:771,
      TRIANGLES:4,COLOR_BUFFER_BIT:16384,NO_ERROR:0,
      createShader:()=>({}),shaderSource:()=>{},compileShader:()=>{},
      getShaderParameter:()=>true,deleteShader:()=>{},createProgram:()=>({}),
      attachShader:()=>{},linkProgram:()=>{},getProgramParameter:()=>true,
      useProgram:()=>{},getAttribLocation:(_,n)=>n==='a_position'?0:1,
      getUniformLocation:()=>({}),createBuffer:()=>({}),bindBuffer:()=>{},
      bufferData:(_,data)=>{window.__gpuCalls.uploaded=data.length},
      enableVertexAttribArray:()=>{},vertexAttribPointer:()=>{},uniform2f:()=>{},
      viewport:()=>{},clearColor:()=>{},clear:()=>{},disable:()=>{},enable:()=>{},
      blendFuncSeparate:()=>{},ONE:1,drawArrays:(_,first,count)=>{window.__gpuCalls.draw++;window.__gpuCalls.vertices=count},
      isContextLost:()=>false,getError:()=>0,deleteBuffer:()=>{},deleteProgram:()=>{},
      getExtension:(name)=>name==='WEBGL_lose_context'?{loseContext:()=>window.__gpuCalls.released++}:null};
    return gl;
  };
})();"""

def run():
  with sync_playwright() as pw:
    exe=os.environ.get('MATHILLUSTRATOR_CHROMIUM') or '/usr/bin/chromium'
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],executable_path=exe)
    try:
      page=browser.new_page(viewport={'width':1300,'height':850},accept_downloads=True)
      errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
      page.set_default_timeout(60000)
      page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
      page.locator('#scene3d-enable').check()
      page.locator('#plot-mode').select_option('surface3d')
      page.locator('#command').fill('sin(x)*cos(y)')
      page.locator('#command-form button').click()
      page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')")
      # A default scene continues to use exact SVG polygon rendering.
      assert page.locator('#drawing polygon').count()>400
      assert page.locator('[data-3d-gpu]').count()==0
      # Force a dense scene to exercise fallback in Chromium without WebGL.
      page.locator('#scene3d-detail').fill('80');page.locator('#scene3d-detail').dispatch_event('change')
      page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')")
      native_webgl=page.evaluate('!!document.createElement("canvas").getContext("webgl2")')
      if not native_webgl:
        assert 'CPU SVG fallback' in page.locator('#render-info').inner_text()
        assert page.locator('#drawing polygon').count()>6000
      else:
        assert page.locator('[data-3d-gpu]').count()==1
      # Deterministically simulate the WebGL command interface to check the
      # application selects GPU and batches triangles; this does not render pixels.
      page.evaluate(MOCK)
      page.locator('#scene3d-yaw').fill('21');page.locator('#scene3d-yaw').dispatch_event('change')
      page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')")
      assert page.locator('[data-3d-gpu="webgl2"]').count()==1
      assert page.locator('#drawing polygon').count()==0
      calls=page.evaluate('window.__gpuCalls')
      assert calls['draw']==1 and calls['vertices']>18000
      assert calls['uploaded']==calls['vertices']*6
      assert 'WebGL2 raster' in page.locator('#render-info').inner_text()
      # Exports must use the full exact CPU/SVG geometry, never the GPU canvas.
      page.locator('#export-open').click()
      with page.expect_download() as event:
        page.locator('#export-options button').filter(has_text='SVG').click()
      exported=event.value.path().read_text()
      assert exported.count('<polygon')>6000
      assert 'foreignObject' not in exported
      # Returning to 2D invalidates the raster and all prior GPU state.
      page.locator('#scene3d-enable').uncheck()
      assert page.locator('[data-3d-gpu]').count()==0
      assert page.evaluate('window.__gpuCalls.released')==1
      assert not errors,errors
      print(json.dumps({'passed':True,'chromiumWebGL2':native_webgl,'actualGpuPixelVerification':False,
        'fallbackVerified':not native_webgl,'mockGpuBatches':calls['draw'],
        'mockGpuTriangles':calls['vertices']//3,'svgExportTriangles':exported.count('<polygon'),
        'errors':errors},indent=2))
    finally: browser.close()

if __name__=='__main__':run()
