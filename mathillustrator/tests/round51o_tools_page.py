"""Round 51O: bilingual website-root capabilities card and obsolete-claim regression."""
from pathlib import Path
from html.parser import HTMLParser
class Cards(HTMLParser):
    def __init__(self): super().__init__(); self.cards=[]
    def handle_starttag(self, tag, attrs):
        if tag == "p":
            a=dict(attrs)
            if "Advanced 3D" in a.get("data-en", "") or "Create editable mathematical figures" in a.get("data-en", ""):
                self.cards.append(a)
def test():
    root=Path(__file__).resolve().parents[2]
    page=(root / "tools.html").read_text(encoding="utf-8")
    parsed=Cards();parsed.feed(page)
    assert len(parsed.cards)==1, parsed.cards
    card=parsed.cards[0]
    for keyword in ("2D geometry", "3D surfaces", "implicit", "transformations", "JSON", "limitations"):
        assert keyword in card["data-en"], keyword
    for keyword in ("二维几何", "三维曲面", "隐式", "变换", "JSON", "局限"):
        assert keyword in card["data-zh"], keyword
    assert "not yet available" not in page
    assert page.count('href="mathillustrator/"')==1
    assert page.count('href="mathillustrator/tutorial.html"')==1
    print("ROUND51O_TOOLS_PAGE_PASS")
if __name__=="__main__": test()

def browser_test():
    from playwright.sync_api import sync_playwright
    root=Path(__file__).resolve().parents[2]
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        try:
            for width in (700, 1450):
                page=browser.new_page(viewport={'width':width,'height':900})
                page.set_content((root/'tools.html').read_text(encoding='utf8'),wait_until='domcontentloaded')
                assert page.locator('#mathillustrator p[data-en]').count()==1
                item=page.locator('#mathillustrator p[data-en]')
                assert '3D surfaces' in item.inner_text()
                assert '三维曲面' in item.get_attribute('data-zh')
                assert page.locator('a[href="mathillustrator/"]').count()==1
                assert page.locator('a[href="mathillustrator/tutorial.html"]').count()==1
                assert page.locator('#mathreader').count()==1
                page.close()
            print('ROUND51O_CHROMIUM_TOOLS_PAGE_PASS: bilingual content, navigation at 700/1450')
        finally: browser.close()

if __name__=='__main__': browser_test()
