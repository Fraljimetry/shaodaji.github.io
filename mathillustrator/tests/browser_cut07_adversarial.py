"""Cut07 red/green browser cases: semantic rectangle, fidelity, overlays, stale import.
Isolated Chromium with source inlined, not a published-site test.
"""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download
import os,json,re

PASS=[]
def project(p):return json.loads(download(p,'Save').read_text())

def page_new(browser,prompt=None):
 p=browser.new_page(viewport={'width':1440,'height':880},accept_downloads=True)
 p.on('dialog',lambda d: d.accept(prompt if d.type=='prompt' else None))
 errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.set_content(inline_html(),wait_until='load');p.wait_for_timeout(80)
 return p,errors

def clickmode(p,t):p.locator(f'[data-tool-choice="{t}"]').click()
def canvasclick(p,dx,dy):
 rect=p.locator('#drawing').bounding_box();p.mouse.click(rect['x']+rect['width']/2+dx,rect['y']+rect['height']/2+dy)

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  p,errors=page_new(browser)
  cmd(p,'A=(0,0)');cmd(p,'B=(3,2)');cmd(p,'Rectangle(A,B)')
  rect=project(p)['objects'][-1]
  assert rect['type']=='rectangle' and len(rect['refs'])==2,rect
  assert p.locator('#drawing rect[data-id="'+rect['id']+'"]').count()==1
  # Move live anchor in properties, rectangle should change dimensions without losing its constraint.
  p.locator('#object-search').fill('B');p.locator('#objects .object').filter(has=p.locator('.object-label strong',has_text=re.compile('^B$'))).click()
  inputs=p.locator('#properties .twocol input');inputs.first.fill('5');inputs.first.dispatch_event('change')
  updated=project(p);assert updated['objects'][-1]['type']=='rectangle'
  assert abs(float(p.locator('#drawing rect[data-id="'+rect['id']+'"]').get_attribute('width'))-240)<1
  p.locator('#export-open').click();assert p.get_by_role('button',name='TikZ / PGF').is_enabled()
  tex=download(p,'TikZ / PGF').read_text();assert 'rectangle (5.00000,2.00000)' in tex,tex
  assert not errors,errors;PASS.append('rectangle semantic drag/property/TeX')
  p.close()

  longtext='t'*1200
  p,errors=page_new(browser,prompt=longtext)
  clickmode(p,'text');canvasclick(p,-40,30)
  doc=project(p);assert doc['objects'][-1]['type']=='text' and doc['objects'][-1]['text']==longtext
  assert not errors,errors;PASS.append('text prompt 1200 characters exact')
  p.close()

  p,errors=page_new(browser,prompt='t'*2001)
  clickmode(p,'text');canvasclick(p,0,0)
  assert project(p)['objects']==[]
  assert 'exceeds 2000' in p.locator('#toast').inner_text()
  assert not errors;PASS.append('text prompt >2000 rejects without truncated object')
  p.close()

  p,errors=page_new(browser,prompt='α')
  clickmode(p,'text');canvasclick(p,0,0)
  p.locator('#export-open').click()
  assert p.get_by_role('button',name='TikZ / PGF').is_disabled(), 'raw Unicode cannot compile reliably under pdflatex'
  assert p.get_by_role('button',name='SVG').is_enabled()
  assert p.get_by_role('button',name='JSON project').is_enabled()
  assert not errors;PASS.append('non-ascii TikZ disabled with SVG/JSON available')
  p.close()

  p,errors=page_new(browser)
  cmd(p,'A=(0,0)');cmd(p,'B=(2,0)');cmd(p,'Segment(A,B)');n=len(project(p)['objects'])
  p.locator('#export-open').click()
  assert p.locator('#export-menu').is_visible()
  p.keyboard.press('Delete');assert int(p.locator('#object-count').inner_text())==n,'export dialog must isolate global delete shortcut'
  p.keyboard.press('Escape');assert p.locator('#export-menu').is_hidden()
  assert p.locator('#export-open').evaluate('(el)=>document.activeElement===el')
  p.locator('#tikzcd-open').click();assert p.locator('#tikzcd-dialog').is_visible()
  p.keyboard.press('Escape');assert p.locator('#tikzcd-dialog').is_hidden()
  assert p.locator('#tikzcd-open').evaluate('(el)=>document.activeElement===el')
  assert not errors;PASS.append('Escape/focus/global shortcuts in two dialogs')
  p.close()

  p,errors=page_new(browser)
  # The deliberately delayed File.text simulates a large import while the user
  # edits the current project. A stale read must never overwrite newer work.
  old=json.dumps({'format':'mathillustrator-project','version':1,'meta':{'title':'old file'},'settings':project(p)['settings'],'objects':[],'nextId':1})
  p.evaluate("""(payload)=>{
      const input=document.querySelector('#open-file');
      const f=new File([payload],'stale.json',{type:'application/json'});
      Object.defineProperty(f,'text',{value:()=>new Promise(resolve=>setTimeout(()=>resolve(payload),250))});
      const dt=new DataTransfer();dt.items.add(f);input.files=dt.files;
      input.dispatchEvent(new Event('change',{bubbles:true}));
      const field=document.querySelector('#command');field.value='A=(4,5)';
      document.querySelector('#command-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  }""",old)
  p.wait_for_timeout(360)
  names=[o['name'] for o in project(p)['objects']];assert 'A' in names,names
  assert not errors;PASS.append('stale async JSON import rejected')
  p.close();browser.close()
 print('CHROMIUM_CUT07_ADVERSARIAL_PASS',len(PASS),'cases:',', '.join(PASS))

if __name__=='__main__':run()
