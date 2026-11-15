"""Round 67: temporary snap focus and restoration in actual Chromium."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1440,'height':900})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
  page.wait_for_timeout(150)
  snap=page.locator('#snap')
  assert not snap.is_checked() and not snap.is_disabled()
  page.locator('[data-tool-choice="node"]').click()
  assert snap.is_checked() and snap.is_disabled()
  assert 'temporarily enabled' in page.locator('#toast').inner_text()
  page.locator('[data-tool-choice="morphism"]').click()
  assert snap.is_checked() and snap.is_disabled()
  page.locator('[data-tool-choice="pan"]').click()
  assert not snap.is_checked() and not snap.is_disabled()
  assert 'restored' in page.locator('#toast').inner_text()
  # Select an existing node in Move: grid snapping activates for its edit context.
  page.locator('#command').fill('A=(0,0)')
  page.locator('#command-form button').click()
  page.wait_for_timeout(80)
  # Use interactive node creation with browser dialog.
  page.locator('[data-tool-choice="node"]').click()
  page.once('dialog',lambda d:d.accept('X'))
  page.locator('#drawing').click(position={'x':700,'y':460})
  page.wait_for_timeout(100)
  nodes=[o for o in json.loads(page.evaluate('window.__round36Snapshot()'))['objects'] if o['type']=='node']
  assert nodes
  page.locator('[data-tool-choice="select"]').click()
  page.locator(f'#drawing [data-id="{nodes[0]["id"]}"]').first.click(force=True)
  assert snap.is_checked() and snap.is_disabled(), 'selected node should enable temporary snap'
  page.locator('#drawing').click(position={'x':30,'y':30},force=True)
  assert not snap.is_checked() and not snap.is_disabled(), 'deselection restores saved snap'
  # Nothing temporary must leak into persisted document settings.
  assert json.loads(page.evaluate('window.__round36Snapshot()'))['settings']['snap'] is False
  assert not errors,errors
  print('ROUND67_CHROMIUM_PASS: tools, notice, selection focus, deselection, persistence, no page errors')
 finally:browser.close()
