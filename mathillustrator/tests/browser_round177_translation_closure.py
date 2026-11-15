"""Round 177: all visible global UI strings, empty states, input a11y, and reversible language changes."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    try:
        for width in (1440,768,390,320):
            page=browser.new_page(viewport={'width':width,'height':850})
            errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_content(inline_html(legacy_search_expanded=False),wait_until='domcontentloaded',timeout=90000)
            for language, empty, command in [('zh','没有对象','函数表达式或构造命令'),('en','No objects','Function or construction command'),('zh','没有对象','函数表达式或构造命令'),('en','No objects','Function or construction command')]:
                page.locator('#ui-language').select_option(language)
                actual=page.locator('#objects .empty-objects').inner_text()
                # Chinese vocabulary is selected by the canonical locale dictionary.
                assert actual==('没有对象' if language=='zh' else 'No objects'),(width,language,actual)
                assert page.locator('#command').get_attribute('aria-label')==command,(width,language,page.locator('#command').get_attribute('aria-label'))
                names=page.locator('#settings-sections .section-heading .section-toggle span:not(.section-chevron)').all_text_contents()
                assert ('界面' if language=='zh' else 'Interface') in names,(width,language,names)
            if width in (1440,768):
                page.locator('#command').fill('P=(0,0)')
                page.locator('#command').press('Enter')
                page.locator('#object-search').fill('missing_object_abcdef')
                for language,expected in [('zh','没有匹配对象'),('en','No matches'),('zh','没有匹配对象')]:
                    page.locator('#ui-language').select_option(language)
                    assert page.locator('#objects .empty-objects').inner_text()==expected,(width,language,page.locator('#objects .empty-objects').inner_text())
            assert not errors,(width,errors)
            print('ROUND177_I18N_PASS',width,flush=True)
            page.close()
    finally:
        browser.close()
