"""Verification of the verification runner's fail-closed invariants."""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('mathillustrator_release_gate', HERE / 'release_gate.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class GateContractTests(unittest.TestCase):
    def fake_completed(self, stdout='', returncode=0, stderr=''):
        return mock.Mock(stdout=stdout, stderr=stderr, returncode=returncode)

    def run_fake(self, name, output, returncode=0, kind='node', env=None, stderr=''):
        with mock.patch.object(gate, 'check_prerequisites', return_value=None), mock.patch.object(
                gate.subprocess, 'run', return_value=self.fake_completed(output, returncode, stderr)):
            return gate.run_check(name, ['node'], 2, kind, {} if env is None else env)

    def test_inline_browser_graph_preserves_module_identity_and_content(self):
        import base64
        fixture_spec = importlib.util.spec_from_file_location('browser_fixture', gate.ROOT / 'tests/browser_smoke.py')
        fixture = importlib.util.module_from_spec(fixture_spec)
        fixture_spec.loader.exec_module(fixture)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'src').mkdir()
            entry = root / 'src/app.mjs'
            entry.write_text("import {a} from './a.mjs?cut=new';\nimport {b} from './a.mjs?cut=old';\nimport {a as c} from './a.mjs?cut=new';\n", encoding='utf8')
            (root / 'src/a.mjs').write_text("export {x} from './leaf.mjs?cut=next';\nexport const a='cut=round28', b=2;\n", encoding='utf8')
            (root / 'src/leaf.mjs').write_text('export const x=1;', encoding='utf8')
            app, imports = fixture.inline_module_graph(root)
            self.assertEqual(set(imports), {'mi/a.mjs?cut=new', 'mi/a.mjs?cut=old', 'mi/leaf.mjs?cut=next'})
            self.assertEqual(app.count("'mi/a.mjs?cut=new'"), 2)
            self.assertNotEqual(imports['mi/a.mjs?cut=new'], imports['mi/a.mjs?cut=old'])
            decoded = base64.b64decode(imports['mi/a.mjs?cut=new'].split(',', 1)[1]).decode()
            self.assertIn("from 'mi/leaf.mjs?cut=next'", decoded)
            self.assertIn("a='cut=round28'", decoded)
            (root / 'src/leaf.mjs').unlink()
            with self.assertRaises(FileNotFoundError):
                fixture.inline_module_graph(root)

    def test_self_tests_are_required_in_each_profile(self):
        for profile in ('quick', 'local', 'release'):
            specs = gate.command_specs(profile, 10000)
            tests = [argv for name, argv, *_ in specs if name == 'verification-self-tests']
            self.assertEqual(len(tests), 1)
            self.assertIn('tests/verification/test_release_gate.py', tests[0])

    def test_recent_bug_browser_workflows_are_selected_by_profile(self):
        expected_common = {
            'browser-recent-input-assist': 'tests/browser_round246_input_assist.py',
        }
        expected_full = {
            'browser-recent-freehand': 'tests/browser_round146_freehand_shapes.py',
            'browser-recent-panel-resize': 'tests/browser_panel_resize_current.py',
        }
        for profile in ('quick', 'local', 'release'):
            specs = gate.command_specs(profile, 10000)
            selected = {name: (argv, timeout, kind) for name, argv, timeout, kind in specs}
            for name, path in expected_common.items():
                self.assertIn(name, selected, profile)
                argv, timeout, kind = selected[name]
                self.assertEqual(argv[-1], path)
                self.assertEqual(kind, 'browser')
                self.assertGreaterEqual(timeout, 90)
                self.assertTrue((gate.ROOT / path).is_file(), path)
            for name, path in expected_full.items():
                if profile == 'quick':
                    self.assertNotIn(name, selected)
                    continue
                self.assertIn(name, selected, profile)
                argv, timeout, kind = selected[name]
                self.assertEqual(argv[-1], path)
                self.assertEqual(kind, 'browser')
                self.assertGreaterEqual(timeout, 90)
                self.assertTrue((gate.ROOT / path).is_file(), path)
            self.assertEqual(len(selected), len(specs), 'Duplicate verification check name')

    def test_recent_bug_browser_workflows_fail_closed_without_execution(self):
        for name in ('browser-recent-input-assist', 'browser-recent-freehand', 'browser-recent-panel-resize'):
            self.assertEqual(self.run_fake(name, '', kind='browser')['status'], 'INCOMPLETE')
            self.assertEqual(self.run_fake(name, 'PASS', returncode=1, kind='browser')['status'], 'FAIL')

    def test_self_tests_cannot_pass_with_empty_discovery(self):
        result = self.run_fake('verification-self-tests', '', kind='python')
        self.assertEqual(result['status'], 'INCOMPLETE')
        result = self.run_fake('verification-self-tests', '', kind='python', stderr='Ran 0 tests in 0.001s\n\nOK\n')
        self.assertEqual(result['status'], 'INCOMPLETE')

    def test_self_tests_require_real_success_summary(self):
        result = self.run_fake('verification-self-tests', '', kind='python', stderr='Ran 24 tests in 0.3s\n\nOK\n')
        self.assertEqual(result['status'], 'PASS')
        result = self.run_fake('verification-self-tests', '', kind='python', stderr='Ran 24 tests in 0.3s\n\nFAILED (failures=1)\n')
        self.assertEqual(result['status'], 'INCOMPLETE')

    def test_empty_node_suite_cannot_pass(self):
        output = '# tests 0\n# pass 0\n# fail 0\n# skipped 0\n# todo 0\n'
        self.assertEqual(self.run_fake('node-regressions', output)['status'], 'INCOMPLETE')

    def test_missing_node_summary_cannot_pass(self):
        self.assertEqual(self.run_fake('node-regressions', 'success')['status'], 'INCOMPLETE')

    def test_skipped_node_tests_cannot_pass(self):
        output = '# tests 4\n# pass 3\n# fail 0\n# skipped 1\n# todo 0\n'
        self.assertEqual(self.run_fake('node-regressions', output)['status'], 'INCOMPLETE')

    def test_valid_node_summary_passes(self):
        output = '# tests 4\n# pass 4\n# fail 0\n# skipped 0\n# todo 0\n'
        self.assertEqual(self.run_fake('node-regressions', output)['status'], 'PASS')

    def test_missing_code_module_is_a_failure_not_missing_tooling(self):
        result = self.run_fake('node-regressions', '', 1, stderr="Error: Cannot find module './broken.mjs'")
        self.assertEqual(result['status'], 'FAIL')

    def test_optimized_python_cannot_pass_browser_checks(self):
        result = self.run_fake('browser-startup', '', kind='browser', env={'PYTHONOPTIMIZE': '1'})
        self.assertEqual(result['status'], 'INCOMPLETE')

    def test_browser_empty_output_cannot_pass(self):
        self.assertEqual(self.run_fake('browser-startup', '', kind='browser')['status'], 'INCOMPLETE')

    def test_browser_unrelated_output_cannot_pass(self):
        self.assertEqual(self.run_fake('browser-startup', 'hello', kind='browser')['status'], 'INCOMPLETE')

    def test_browser_positive_marker_passes(self):
        self.assertEqual(self.run_fake('browser-startup', 'CHROMIUM_ISOLATED_SMOKE_PASS', kind='browser')['status'], 'PASS')

    def test_browser_false_json_does_not_pass(self):
        self.assertEqual(self.run_fake('browser-scene-lifecycle', '{"passed": false}', kind='browser')['status'], 'INCOMPLETE')

    def test_release_without_hosted_url_is_incomplete(self):
        self.assertEqual(gate.hosted_check(None)['status'], 'INCOMPLETE')
        self.assertEqual(gate.hosted_check('http://example.invalid')['status'], 'FAIL')

    def test_real_timeout_is_failure(self):
        import subprocess
        with mock.patch.object(gate, 'check_prerequisites', return_value=None), mock.patch.object(
                gate.subprocess, 'run', side_effect=subprocess.TimeoutExpired(['node'], 2)):
            result = gate.run_check('node-regressions', ['node'], 2, 'node', {})
        self.assertEqual(result['status'], 'FAIL')

    def test_missing_required_runtime_is_incomplete(self):
        with mock.patch.object(gate, 'check_prerequisites', return_value='Node.js not available'):
            result = gate.run_check('node-regressions', ['node'], 2, 'node', {})
        self.assertEqual(result['status'], 'INCOMPLETE')

    def test_inventory_requires_every_original_module(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'src').mkdir()
            (root / 'tests' / 'verification').mkdir(parents=True)
            (root / 'src' / 'app.mjs').write_text('export {};')
            (root / 'tests' / 'legacy.test.mjs').write_text('')
            (root / 'tests' / 'browser_example.py').write_text('assert True')
            manifest = {'schemaVersion': 1, 'sourceModules': ['src/app.mjs'],
                        'nodeTestModules': ['tests/legacy.test.mjs'], 'pythonTestModules': ['tests/browser_example.py']}
            (root / 'tests' / 'verification' / 'baseline_inventory.json').write_text(json.dumps(manifest))
            self.assertEqual(gate.validate_baseline_inventory(root)['status'], 'PASS')
            (root / 'tests' / 'legacy.test.mjs').unlink()
            result = gate.validate_baseline_inventory(root)
            self.assertEqual(result['status'], 'FAIL')
            self.assertIn('legacy.test.mjs', result['reason'])

    def test_deleted_browser_script_fails_inventory(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'src').mkdir()
            (root / 'tests' / 'verification').mkdir(parents=True)
            (root / 'src' / 'app.mjs').write_text('export {};')
            (root / 'tests' / 'base.test.mjs').write_text('')
            browser = root / 'tests' / 'browser_example.py'
            browser.write_text('assert True')
            inventory = {'schemaVersion': 1, 'sourceModules': ['src/app.mjs'],
                         'nodeTestModules': ['tests/base.test.mjs'],
                         'pythonTestModules': ['tests/browser_example.py']}
            (root / 'tests' / 'verification' / 'baseline_inventory.json').write_text(json.dumps(inventory))
            self.assertEqual(gate.validate_baseline_inventory(root)['status'], 'PASS')
            browser.unlink()
            result = gate.validate_baseline_inventory(root)
            self.assertEqual(result['status'], 'FAIL')
            self.assertIn('browser_example.py', result['reason'])

    def test_all_python_tests_are_parsed_by_checker(self):
        import subprocess
        result = subprocess.run([sys.executable, 'tests/verification/check_python_syntax.py'],
                                cwd=gate.ROOT, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        self.assertIn('PYTHON_SOURCE_SYNTAX_PASS', result.stdout)

    def test_syntax_checker_rejects_broken_python(self):
        import subprocess
        source = (HERE / 'check_python_syntax.py').read_text()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'tests' / 'verification').mkdir(parents=True)
            (root / 'tests' / 'verification' / 'check_python_syntax.py').write_text(source)
            (root / 'tests' / 'browser_broken.py').write_text('def incomplete(:\n')
            result = subprocess.run([sys.executable, str(root / 'tests' / 'verification' / 'check_python_syntax.py')],
                                    capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('browser_broken.py', result.stderr + result.stdout)

    def test_current_inventory_is_complete(self):
        result = gate.validate_baseline_inventory()
        self.assertEqual(result['status'], 'PASS', result)
        self.assertGreaterEqual(result['sourceModules'], 37)
        self.assertGreaterEqual(result['nodeTestModules'], 187)
        self.assertGreaterEqual(result['pythonTestModules'], 318)

    def test_local_selection_includes_recent_regressions(self):
        specs = gate.command_specs('local', 10000)
        names = {name for name, *_ in specs}
        for name in ('browser-unnamed-algebra', 'browser-transform-objects',
                     'browser-shortcuts', 'browser-paste', 'browser-editing-history',
                     'browser-atlas', 'browser-atlas-fidelity', 'browser-implicit-topology',
                     'browser-legacy-2d-sweep', 'browser-inversion-glyph',
                     'browser-derived-geometry', 'browser-tikzcd-export'):
            self.assertIn(name, names)
        node = next(argv for name, argv, *_ in specs if name == 'node-regressions')
        self.assertIn('--test-concurrency=2', node)

    def test_coverage_reporter_requires_zero_exit_evidence(self):
        import subprocess
        if not gate.shutil.which('node'):
            self.skipTest('Node.js unavailable')
        root = HERE.parents[1]
        catalog = json.loads((HERE / 'coverage_catalog.json').read_text())
        needed = {'tests/verification/run_kernel_properties.mjs'}
        for op in catalog['operations']:
            needed.update(op.get('browserTests') or [])
            needed.update(op.get('benchmarkTests') or [])
        entries = [{'name': 'math-properties' if p.endswith('run_kernel_properties.mjs') else p,
                    'command': ['node', p], 'status': 'PASS', 'returnCode': 0}
                   for p in sorted(needed)]
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'evidence.json'
            def report():
                return subprocess.run(['node', 'tests/verification/report_coverage.mjs',
                                       '--evidence-file=' + str(path)], cwd=root,
                                      capture_output=True, text=True)
            path.write_text(json.dumps({'schemaVersion': 1, 'checks': entries}))
            good = report()
            self.assertEqual(good.returncode, 0, good.stderr + good.stdout[-500:])
            self.assertIn('"executedVerified": 28', good.stdout)
            entries[0]['returnCode'] = 1
            path.write_text(json.dumps({'schemaVersion': 1, 'checks': entries}))
            bad = report()
            self.assertEqual(bad.returncode, 2, bad.stderr + bad.stdout[-500:])
            self.assertNotIn('"executedVerified": 28', bad.stdout)
            # A forged suffix path must not certify the declared script.
            entries[0]['returnCode'] = 0
            entries[0]['command'] = ['node', 'unrelated/' + entries[0]['command'][1]]
            path.write_text(json.dumps({'schemaVersion': 1, 'checks': entries}))
            suffix_spoof = report()
            self.assertEqual(suffix_spoof.returncode, 2, suffix_spoof.stderr)


    def test_browser_gate_scripts_have_assertions_and_entrypoints(self):
        import ast
        for name, argv, _, kind in gate.command_specs('local', 10000):
            if kind != 'browser':
                continue
            path = gate.ROOT / argv[1]
            with self.subTest(script=path.name):
                self.assertTrue(path.is_file())
                source = path.read_text(encoding='utf8')
                tree = ast.parse(source)
                self.assertTrue(any(isinstance(node, ast.Assert) for node in ast.walk(tree)),
                                f'{path.name} has no active assertion')
                self.assertTrue('__main__' in source or any(
                    isinstance(node, ast.With) and any(
                        isinstance(item.context_expr, ast.Call) and
                        isinstance(item.context_expr.func, ast.Name) and
                        item.context_expr.func.id == 'sync_playwright'
                        for item in node.items) for node in tree.body),
                    f'{path.name} has no direct execution entrypoint')

    def test_quick_catalog_check_does_not_claim_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / 'result.json'
            completed = lambda name, *args, **kw: {
                'name': name, 'status': 'PASS', 'returnCode': 0, 'elapsedSeconds': 0,
            }
            with mock.patch.object(gate, 'command_specs', return_value=[]), \
                 mock.patch.object(gate, 'run_check', side_effect=completed), \
                 mock.patch.object(sys, 'argv', ['gate', '--profile', 'quick', '--output', str(output)]):
                self.assertEqual(gate.main(), 0)
            data = json.loads(output.read_text())
            self.assertFalse(data['coverageEvidenceExecuted'])
            self.assertEqual(data['checks'][-1]['name'], 'coverage-catalog')
            self.assertGreaterEqual(data['testInventory']['browserScripts'], 1)


if __name__ == '__main__':
    unittest.main()
