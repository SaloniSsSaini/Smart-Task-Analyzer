from django.test import TestCase
from .scoring import compute_scores

class ScoringTests(TestCase):
    def test_overdue_boost(self):
        tasks = [{ 'id':'t1','title':'Old','due_date':'2020-01-01T00:00:00Z','estimated_hours':2,'importance':5 }]
        res = compute_scores(tasks)
        self.assertTrue(res['tasks'][0]['score'] > 50)

    def test_fastest_strategy(self):
        tasks = [
            { 'id':'t1','title':'Big','estimated_hours':8,'importance':5 },
            { 'id':'t2','title':'Quick','estimated_hours':0.5,'importance':5 }
        ]
        res = compute_scores(tasks, strategy='fastest')
        self.assertEqual(res['tasks'][0]['id'], 't2')

    def test_cycles_detected(self):
        tasks = [ { 'id':'a','title':'A','dependencies':['b'] }, { 'id':'b','title':'B','dependencies':['a'] } ]
        res = compute_scores(tasks)
        self.assertTrue(len(res['cycles']) >= 1)
