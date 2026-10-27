import copy
import tempfile
import unittest
from pathlib import Path
import benchmark

class BenchmarkTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.directory = Path(self.temp.name)
        benchmark.prepare(self.directory)
        self.run = benchmark.read(self.directory / 'run.json')
    def tearDown(self):
        self.temp.cleanup()
    def save(self):
        benchmark.write(self.directory / 'run.json', self.run)
    def completed(self):
        row = self.run['rows'][0]
        (self.directory / 'raw/answer.txt').write_text('A genuine captured response used only as a test fixture.')
        row.update(status='completed', completedAt='2026-10-27T12:00:00+00:00', model='Fixture', mode='Search enabled', freshSession=True, searchUsed=None, searchEvidence='Requested; no visible evidence of search use', answerFile='raw/answer.txt', annotations=dict(mentioned=False,recommendedRank=None,facts=[],retiredPropertyError=False,guardrailAppropriate=None))
        return row
    def test_missing_is_not_zero_and_prepare_does_not_overwrite(self):
        result = benchmark.score(self.directory)
        self.assertEqual(result['allAvailable']['scored'], 0)
        self.assertIsNone(result['platforms']['muse']['mentionRatePct'])
        with self.assertRaises(ValueError): benchmark.prepare(self.directory)
    def test_real_absence_is_zero_without_scoring_inaccessible_providers(self):
        self.completed(); self.save()
        result = benchmark.score(self.directory)
        self.assertEqual(result['platforms']['chatgpt']['mentionRatePct'], 0)
        self.assertEqual(result['platforms']['chatgpt']['ownedSiteCitationRatePct'], 0)
        self.assertIsNone(result['platforms']['chatgpt']['verifiedFactAccuracyPct'])
        self.assertIsNone(result['platforms']['claude']['mentionRatePct'])
    def test_facts_and_qualifications_are_separate_from_visibility(self):
        row=self.completed()
        row.update(citations=['https://www.enchantedhavens.com/havens/blue-haven'])
        row['annotations'].update(mentioned=True,recommendedRank=1,guardrailAppropriate=True,facts=[dict(claim='A',verdict='correct',source='Owner confirmation'),dict(claim='B',verdict='unverified',source='No evidence')])
        self.save(); result=benchmark.score(self.directory)['platforms']['chatgpt']
        self.assertEqual(result['topThreeRatePct'],100)
        self.assertEqual(result['supportedFactRatePct'],50)
        self.assertEqual(result['unverifiedFacts'],1)
        self.assertEqual(result['appropriateGuardrailRatePct'],100)
    def test_rejects_duplicate_prompt_drift_and_missing_evidence(self):
        original=copy.deepcopy(self.run)
        self.run['rows'].append(self.run['rows'][0]); self.save()
        with self.assertRaises(ValueError): benchmark.score(self.directory)
        self.run=copy.deepcopy(original); self.run['rows'][0]['prompt']='Changed'; self.save()
        with self.assertRaises(ValueError): benchmark.score(self.directory)
        self.run=copy.deepcopy(original); self.completed()['answerFile']='../outside.txt'; self.save()
        with self.assertRaises(ValueError): benchmark.score(self.directory)
    def test_stale_or_search_disabled_sessions_are_excluded(self):
        self.completed()['freshSession']=False; self.save()
        self.assertEqual(benchmark.score(self.directory)['allAvailable']['scored'],0)
    def test_owned_citations_reject_lookalikes(self):
        self.assertFalse(benchmark.owned('https://enchantedhavens.com.evil.example'))
        self.assertTrue(benchmark.owned('https://www.enchantedhavens.com/agents'))

if __name__=='__main__': unittest.main()
