#!/usr/bin/env python3
"""Prepare and score evidence-backed consumer-app runs; audit public crawlability.
No model/API calls, account setup, signups, bookings, or production mutations.
"""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError, URLError
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[2]
PROTOCOL = ROOT / 'docs/ticket-840-workstreams-7-8/benchmark-protocol.json'
NOW = lambda: dt.datetime.now(dt.timezone.utc).isoformat()

def read(path):
    return json.loads(Path(path).read_text())

def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')

def prepare(directory):
    directory = Path(directory)
    path = directory / 'run.json'
    if path.exists():
        raise ValueError(f'{path} already exists; resume it without overwriting evidence')
    protocol = read(PROTOCOL)
    rows = []
    for platform in protocol['platforms']:
        for prompt in protocol['prompts']:
            for sample in range(1, protocol['samplesPerPrompt'] + 1):
                rows.append(dict(platform=platform, promptId=prompt['id'], sample=sample,
                    prompt=protocol['prefix'] + prompt['text'], status='pending', reason=None,
                    completedAt=None, model=None, mode=None, freshSession=None,
                    searchEnabled=True, searchUsed=None, searchEvidence=None, answerFile=None,
                    citations=[], annotations=None))
    write(path, dict(protocol=protocol, createdAt=NOW(), rows=rows))
    (directory / 'raw').mkdir(exist_ok=True)
    return {'run': str(path), 'plannedResponses': len(rows)}

def ratio(a, b):
    return round(100 * a / b, 2) if b else None

def owned(url):
    return urlparse(url).hostname in ('enchantedhavens.com', 'www.enchantedhavens.com')

def summarize(rows, planned):
    facts = [f for r in rows for f in r['annotations']['facts']]
    correct = sum(f['verdict'] == 'correct' for f in facts)
    incorrect = sum(f['verdict'] == 'incorrect' for f in facts)
    guardrails = [r['annotations']['guardrailAppropriate'] for r in rows if r['annotations'].get('guardrailAppropriate') is not None]
    rankable = [r for r in rows if r['rankable']]
    return dict(planned=planned, scored=len(rows), coveragePct=ratio(len(rows), planned),
        searchVerifiedResponses=sum(r.get('searchUsed') is True for r in rows),
        mentionRatePct=ratio(sum(r['annotations']['mentioned'] for r in rows), len(rows)),
        topThreeRatePct=ratio(sum(r['annotations']['recommendedRank'] is not None and r['annotations']['recommendedRank'] <= 3 for r in rankable), len(rankable)),
        ownedSiteCitationRatePct=ratio(sum(any(owned(u) for u in r['citations']) for r in rows), len(rows)),
        checkedFacts=len(facts), supportedFactRatePct=ratio(correct, len(facts)),
        verifiedFactAccuracyPct=ratio(correct, correct + incorrect),
        incorrectFacts=incorrect, unverifiedFacts=sum(f['verdict'] == 'unverified' for f in facts),
        retiredPropertyErrorRatePct=ratio(sum(r['annotations']['retiredPropertyError'] for r in rows), len(rows)),
        appropriateGuardrailRatePct=ratio(sum(guardrails), len(guardrails)),
        citationUrls=sorted(set(u for r in rows for u in r['citations'])))

def score(directory):
    directory = Path(directory)
    run = read(directory / 'run.json')
    protocol = run['protocol']
    prompt_map = {p['id']: p for p in protocol['prompts']}
    expected = {(p, q, s) for p in protocol['platforms'] for q in prompt_map for s in range(1, protocol['samplesPerPrompt'] + 1)}
    seen = set()
    accepted, excluded = [], []
    for row in run['rows']:
        key = (row['platform'], row['promptId'], row['sample'])
        if key not in expected or key in seen:
            raise ValueError(f'Unexpected or duplicate response: {key}')
        seen.add(key)
        if row['prompt'] != protocol['prefix'] + prompt_map[row['promptId']]['text']:
            raise ValueError(f'Prompt drift: {key}; create a new protocol version')
        if row['status'] not in ('pending', 'completed', 'blocked', 'error'):
            raise ValueError(f'Invalid status: {key}')
        if row['status'] != 'completed':
            excluded.append({'key': key, 'reason': row.get('reason') or row['status']})
            continue
        for field in ('completedAt', 'model', 'mode', 'searchEvidence', 'answerFile'):
            if not row.get(field):
                raise ValueError(f'Missing {field}: {key}')
        dt.datetime.fromisoformat(row['completedAt'].replace('Z', '+00:00'))
        answer = (directory / row['answerFile']).resolve()
        if not answer.is_relative_to(directory.resolve()) or not answer.is_file() or not answer.read_text().strip():
            raise ValueError(f'Missing or unsafe raw answer path: {key}')
        if answer.suffix == '.json':
            raw = read(answer)
            if not isinstance(raw, dict) or not isinstance(raw.get('answer'), str) or not raw['answer'].strip():
                raise ValueError(f'JSON evidence has no answer text: {key}')
        if row.get('searchEnabled') is not True or row.get('freshSession') is not True:
            excluded.append({'key': key, 'reason': 'Search-enabled mode or fresh session not verified; kept outside comparable scores'})
            continue
        annotation = row.get('annotations')
        if not isinstance(annotation, dict):
            raise ValueError(f'Human/agent evidence review required: {key}')
        for field in ('mentioned', 'retiredPropertyError'):
            if type(annotation.get(field)) is not bool:
                raise ValueError(f'{field} must be an explicit boolean: {key}')
        rank = annotation.get('recommendedRank')
        if rank is not None and (type(rank) is not int or rank < 1 or not annotation['mentioned']):
            raise ValueError(f'Invalid recommendation rank: {key}')
        if annotation.get('guardrailAppropriate') is not None and type(annotation['guardrailAppropriate']) is not bool:
            raise ValueError(f'Invalid guardrail annotation: {key}')
        if not isinstance(annotation.get('facts'), list):
            raise ValueError(f'Explicit fact review required: {key}')
        for fact in annotation['facts']:
            if fact.get('verdict') not in ('correct', 'incorrect', 'unverified') or not fact.get('claim') or not fact.get('source'):
                raise ValueError(f'Claim, verdict and evidence source required: {key}')
        if not isinstance(row['citations'], list) or any(urlparse(u).scheme not in ('http', 'https') or not urlparse(u).hostname for u in row['citations']):
            raise ValueError(f'Invalid citations: {key}')
        accepted.append({**row, 'rankable': prompt_map[row['promptId']]['rankedRecommendations']})
    if seen != expected:
        raise ValueError('Missing planned rows; mark blocked/pending rather than deleting them')
    report = dict(generatedAt=NOW(), protocolVersion=protocol['version'],
        protocolSha256=hashlib.sha256(json.dumps(protocol, sort_keys=True).encode()).hexdigest(),
        scope=protocol['scope'], traveler=protocol['traveler'], executionLocation=protocol['executionLocation'],
        allAvailable=summarize(accepted, len(expected)),
        platforms={p: summarize([r for r in accepted if r['platform'] == p], len(prompt_map) * protocol['samplesPerPrompt']) for p in protocol['platforms']},
        excluded=excluded, outcomeMetrics={'status': 'not_collected', 'referralSessions': None, 'quotes': None, 'inquiries': None, 'reservations': None, 'revenueUSD': None},
        caution='Partial coverage is not a four-platform score. Two trials are descriptive, not stable ranking evidence. Compare matched protocol/model/mode cohorts and four-week trends; changes cannot establish causation.')
    write(directory / 'scorecard.json', report)
    return report

class MetaParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.canonical = []; self.robots = []; self.title = ''; self.in_title = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonical.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name', '').lower() == 'robots': self.robots.append(attrs.get('content'))
        if tag == 'title': self.in_title = True
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
    def handle_data(self, value):
        if self.in_title: self.title += value

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def fetch(url):
    request = Request(url, headers={'User-Agent': 'EnchantedHavensQA/1.0 (ticket-840; technical audit, not a search crawler)'})
    try:
        with build_opener(NoRedirect).open(request, timeout=30) as r:
            return r.status, r.url, {k.lower(): v for k, v in r.headers.items()}, r.read().decode('utf-8')
    except HTTPError as e:
        return e.code, e.url, {k.lower(): v for k, v in e.headers.items()}, e.read().decode('utf-8', errors='replace')

def audit(directory, origin):
    if urlparse(origin).scheme not in ('http', 'https'):
        raise ValueError('Use an HTTP(S) origin')
    paths = ['/robots.txt', '/sitemap.xml', '/all-listings?guests=6&utm_source=internal&utm_medium=qa', '/privacy', '/terms', '/owner-policy', '/havens/blue-haven?guests=6&utm_source=internal&utm_medium=qa', '/havens/reflection-haven', '/havens/reflection-point', '/booking/blue-haven', '/confirmation/00000000-0000-0000-0000-000000000000']
    # Expand the public sitemap, bounded to this site's own origin. Never follow
    # an unexpected sitemap host into private/admin or third-party URLs.
    try:
        code, _, _, sitemap_body = fetch(urljoin(origin, '/sitemap.xml'))
        if code == 200:
            for node in ET.fromstring(sitemap_body).iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
                parsed = urlparse(node.text or '')
                if parsed.hostname in ('enchantedhavens.com', 'www.enchantedhavens.com', urlparse(origin).hostname) and not parsed.path.startswith(('/api/', '/admin/', '/booking/', '/confirmation/')):
                    if parsed.path not in paths: paths.append(parsed.path)
    except (URLError, TimeoutError, ValueError, ET.ParseError):
        pass  # The explicit sitemap check below preserves the failure evidence.
    results = []
    for path in paths[:150]:
        try:
            status, final, headers, body = fetch(urljoin(origin, path))
            row = dict(path=path, status=status, finalUrl=final, location=headers.get('location'), xRobotsTag=headers.get('x-robots-tag'))
            if path == '/sitemap.xml' and status == 200:
                tree = ET.fromstring(body)
                ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
                row['sitemap'] = [{'url': item.findtext('s:loc', namespaces=ns), 'lastModified': item.findtext('s:lastmod', namespaces=ns)} for item in tree.findall('s:url', ns)]
            elif path == '/robots.txt': row['robotsTxt'] = body
            else:
                parser = MetaParser(); parser.feed(body)
                row.update(title=parser.title, canonical=parser.canonical, robots=parser.robots)
            results.append(row)
        except (URLError, TimeoutError, ValueError, ET.ParseError) as error:
            results.append(dict(path=path, error=str(error)))
    report = dict(capturedAt=NOW(), origin=origin, results=results,
        limitations='Synthetic HTTP audit only. Not genuine provider-crawler verification, Search Console indexing evidence, field Core Web Vitals, or an AI recommendation score.')
    write(Path(directory) / 'technical-audit.json', report)
    return report

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['prepare', 'score', 'audit'])
    parser.add_argument('directory', help='Run directory, normally output/ai-visibility/YYYY-MM-DD')
    parser.add_argument('--origin', default='https://www.enchantedhavens.com')
    args = parser.parse_args()
    result = audit(args.directory, args.origin) if args.command == 'audit' else (prepare if args.command == 'prepare' else score)(args.directory)
    print(json.dumps(result if args.command == 'prepare' else {'saved': args.command, 'directory': args.directory}, indent=2))

if __name__ == '__main__':
    main()
