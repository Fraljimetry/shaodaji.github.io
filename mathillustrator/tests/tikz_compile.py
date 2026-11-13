"""Actual LaTeX compilation for a supported TikZ scene and a semantic tikz-cd sample.
Needs installed pdflatex and TikZ packages. Missing binaries are explicitly UNVERIFIED,
not counted PASS. Browser source is isolated inline Chromium, not deployed-site smoke.
"""
from browser_smoke import inline_html, cmd, download
from playwright.sync_api import sync_playwright
from pathlib import Path
import os,shutil,subprocess,tempfile


def compile_tex(fragment, packages):
 with tempfile.TemporaryDirectory() as directory:
  root=Path(directory)
  text='\\documentclass{article}\n'+''.join('\\usepackage{'+name+'}\n' for name in packages)+'\\pagestyle{empty}\n\\begin{document}\n'+fragment+'\n\\end{document}\n'
  (root/'test.tex').write_text(text)
  out=subprocess.run(['pdflatex','-halt-on-error','-interaction=nonstopmode','test.tex'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=35)
  assert out.returncode==0,out.stdout[-2200:]
  assert (root/'test.pdf').is_file() and (root/'test.pdf').stat().st_size>1000
  return (root/'test.pdf').stat().st_size


def run():
 if not shutil.which('pdflatex'):
  print('LATEX_UNVERIFIED: pdflatex absent, compilation not executed')
  return
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1400,'height':920},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(),wait_until='load')
  page.wait_for_timeout(100)
  for source in ['A=(0,0)','B=(3,1)','C=(2,3)','Segment(A,B)','Rectangle(A,B)','Circle(A,C)','Ellipse(A,B)','Bezier(A,B,C,B)','Angle(A,B,C)','RegularPolygon(A,C,6)','X=Node(-3,-3,"X")','Y=Node(0,-3,"Y")','Morphism(X,Y,"f")']:
   cmd(page,source)
  page.locator('#objects .object').first.click()
  page.locator('#properties textarea').first.fill('^~ #% &')
  page.locator('#properties textarea').first.press('Tab')
  page.locator('#export-open').click()
  tikz=download(page,'TikZ / PGF').read_text()
  assert r'\textasciicircum{}' in tikz and r'\textasciitilde{}' in tikz
  assert ' rectangle ' in tikz, 'Live two-point rectangle missing from compiled TikZ'
  sample1=compile_tex(tikz,['tikz'])
  assert not errors,errors
  browser.close()
 from subprocess import run as call
 source=Path(__file__).resolve().parents[1]
 js="import {importTikzCd,exportTikzCd} from './src/diagram.mjs';const x=String.raw`\\begin{tikzcd} A \\arrow[r, \"f\"] & B \\\\ C \\arrow[u, \"g\"'] & D \\end{tikzcd}`;process.stdout.write(exportTikzCd(importTikzCd(x)));"
 output=call(['node','--input-type=module','-e',js],cwd=source,capture_output=True,text=True,timeout=12)
 assert output.returncode==0,output.stderr
 sample2=compile_tex(output.stdout,['tikz-cd'])
 print(f'LATEX_COMPILE_PASS: actual pdflatex compiled browser-exported TikZ ({sample1} bytes) and semantic tikz-cd ({sample2} bytes)')

if __name__=='__main__':run()
