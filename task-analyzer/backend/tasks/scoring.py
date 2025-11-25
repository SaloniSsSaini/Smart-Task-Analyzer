from datetime import datetime, timezone
from dateutil import parser


STRATEGIES = {
'smart': {'w_u':0.35,'w_i':0.30,'w_e':0.20,'w_d':0.15},
'fastest': {'w_u':0.15,'w_i':0.20,'w_e':0.60,'w_d':0.05},
'high_impact': {'w_u':0.15,'w_i':0.60,'w_e':0.10,'w_d':0.05},
'deadline': {'w_u':0.70,'w_i':0.15,'w_e':0.10,'w_d':0.05}
}


DEFAULT_IMPORTANCE = 5




def parse_date(d):
if not d:
return None
try:
return parser.isoparse(d).astimezone(timezone.utc)
except Exception:
return None




def detect_cycles(tasks):
graph = {}
ids = []
for t in tasks:
tid = t.get('id') or t.get('title')
ids.append(tid)
graph[tid] = t.get('dependencies') or []
visited = {}
stack = set()
cycles = []


def dfs(node, path):
if node in stack:
start = path.index(node)
cycles.append(path[start:])
return
if node in visited:
return
visited[node] = True
stack.add(node)
for neigh in graph.get(node, []):
if neigh in graph:
dfs(neigh, path + [neigh])
stack.remove(node)


for n in ids:
if n not in visited:
dfs(n, [n])
return cycles




def compute_scores(tasks, strategy='smart', custom_weights=None):
ws = STRATEGIES.get(strategy, STRATEGIES['smart']).copy()
if custom_weights:
# merge custom weights (expected keys: w_u,w_i,w_e,w_d) and normalize
for k in ['w_u','w_i','w_e','w_d']:
if k in custom_weights:
ws[k] = float(custom_weights[k])
# normalize to sum 1
s = sum(ws.values())
if s > 0:
return {'tasks':results,'errors':errors,'cycles':cycles}