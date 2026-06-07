/**
 * lib/templates.ts
 * Thư viện code templates cho Competitive Programming.
 */

export interface Template {
  id:          string;
  label:       string;
  category:    string;
  lang:        'cpp' | 'python' | 'c';
  description: string;
  code:        string;
}

export const TEMPLATE_CATEGORIES = [
  'Cơ bản', 'Tìm kiếm', 'Đồ thị', 'Cấu trúc dữ liệu', 'Số học', 'Python',
] as const;

export const TEMPLATES: Template[] = [
  // ─── Cơ bản ─────────────────────────────────────────────────────────────
  {
    id: 'fast-io',
    label: 'Fast I/O (multi-test)',
    category: 'Cơ bản',
    lang: 'cpp',
    description: 'Template chuẩn CP với fast I/O và vòng lặp T test cases',
    code: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
typedef pair<int,int> pii;
#define all(x) (x).begin(), (x).end()
#define pb push_back

void solve() {
    // TODO
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t;
    cin >> t;
    while (t--) solve();
    return 0;
}`,
  },
  {
    id: 'basic-single',
    label: 'Single test case',
    category: 'Cơ bản',
    lang: 'cpp',
    description: 'Template đơn giản không có multi-test',
    code: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin >> n;

    return 0;
}`,
  },

  // ─── Tìm kiếm ────────────────────────────────────────────────────────────
  {
    id: 'binary-search',
    label: 'Binary Search',
    category: 'Tìm kiếm',
    lang: 'cpp',
    description: 'Binary search trên mảng đã sort, tìm lower_bound',
    code: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

// Tìm x nhỏ nhất thỏa f(x) = true (hàm monotone)
bool check(ll x) {
    // TODO: trả về true nếu x thỏa điều kiện
    return false;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    ll lo = 0, hi = 1e18, ans = -1;
    while (lo <= hi) {
        ll mid = lo + (hi - lo) / 2;
        if (check(mid)) {
            ans = mid;
            hi = mid - 1;  // tìm min → thu nhỏ về trái
        } else {
            lo = mid + 1;
        }
    }
    cout << ans << "\\n";
    return 0;
}`,
  },
  {
    id: 'ternary-search',
    label: 'Ternary Search',
    category: 'Tìm kiếm',
    lang: 'cpp',
    description: 'Tìm cực trị của hàm unimodal trên đoạn thực',
    code: `#include <bits/stdc++.h>
using namespace std;

double f(double x) {
    // TODO: hàm unimodal (có đúng 1 cực tiểu/cực đại)
    return -(x - 3) * (x - 3) + 5;
}

int main() {
    double lo = -100, hi = 100;
    // 200 lần lặp đủ chính xác ~1e-60
    for (int iter = 0; iter < 200; iter++) {
        double m1 = lo + (hi - lo) / 3;
        double m2 = hi - (hi - lo) / 3;
        if (f(m1) < f(m2)) lo = m1;  // tìm max
        else               hi = m2;
    }
    printf("%.9f\\n", (lo + hi) / 2);
    return 0;
}`,
  },

  // ─── Đồ thị ──────────────────────────────────────────────────────────────
  {
    id: 'bfs',
    label: 'BFS (đồ thị)',
    category: 'Đồ thị',
    lang: 'cpp',
    description: 'Duyệt theo chiều rộng, tính khoảng cách ngắn nhất (unweighted)',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v; cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    int src = 1;
    vector<int> dist(n + 1, -1);
    queue<int> q;
    dist[src] = 0;
    q.push(src);

    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }

    for (int i = 1; i <= n; i++)
        cout << "dist[" << i << "] = " << dist[i] << "\\n";
    return 0;
}`,
  },
  {
    id: 'dfs',
    label: 'DFS (đồ thị)',
    category: 'Đồ thị',
    lang: 'cpp',
    description: 'Duyệt theo chiều sâu, đếm số thành phần liên thông',
    code: `#include <bits/stdc++.h>
using namespace std;

vector<int> adj[100005];
bool visited[100005];

void dfs(int u) {
    visited[u] = true;
    for (int v : adj[u]) {
        if (!visited[v]) dfs(v);
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    cin >> n >> m;
    for (int i = 0; i < m; i++) {
        int u, v; cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    int components = 0;
    for (int i = 1; i <= n; i++) {
        if (!visited[i]) {
            dfs(i);
            components++;
        }
    }
    cout << components << "\\n";
    return 0;
}`,
  },
  {
    id: 'dijkstra',
    label: 'Dijkstra',
    category: 'Đồ thị',
    lang: 'cpp',
    description: 'Đường đi ngắn nhất từ nguồn, đồ thị có trọng số dương',
    code: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
typedef pair<ll,int> pli;
const ll INF = 1e18;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    cin >> n >> m;
    vector<vector<pair<int,ll>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v; ll w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
        adj[v].push_back({u, w}); // bỏ nếu có hướng
    }

    int src = 1;
    vector<ll> dist(n + 1, INF);
    priority_queue<pli, vector<pli>, greater<pli>> pq;
    dist[src] = 0;
    pq.push({0, src});

    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }

    for (int i = 1; i <= n; i++)
        cout << (dist[i] == INF ? -1 : dist[i]) << " \\n"[i == n];
    return 0;
}`,
  },

  // ─── Cấu trúc dữ liệu ────────────────────────────────────────────────────
  {
    id: 'dsu',
    label: 'DSU / Union-Find',
    category: 'Cấu trúc dữ liệu',
    lang: 'cpp',
    description: 'Disjoint Set Union với path compression và union by rank',
    code: `#include <bits/stdc++.h>
using namespace std;

struct DSU {
    vector<int> parent, rank_;
    int components;

    DSU(int n) : parent(n+1), rank_(n+1, 0), components(n) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);
        return parent[x];
    }

    bool unite(int x, int y) {
        x = find(x); y = find(y);
        if (x == y) return false;
        if (rank_[x] < rank_[y]) swap(x, y);
        parent[y] = x;
        if (rank_[x] == rank_[y]) rank_[x]++;
        components--;
        return true;
    }

    bool same(int x, int y) { return find(x) == find(y); }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    cin >> n >> m;
    DSU dsu(n);
    for (int i = 0; i < m; i++) {
        int u, v; cin >> u >> v;
        dsu.unite(u, v);
    }
    cout << dsu.components << "\\n";
    return 0;
}`,
  },
  {
    id: 'fenwick',
    label: 'Fenwick Tree (BIT)',
    category: 'Cấu trúc dữ liệu',
    lang: 'cpp',
    description: 'Binary Indexed Tree — update O(log n), prefix sum O(log n)',
    code: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

struct BIT {
    int n;
    vector<ll> tree;
    BIT(int n) : n(n), tree(n + 1, 0) {}

    void update(int i, ll delta) {
        for (; i <= n; i += i & -i)
            tree[i] += delta;
    }

    ll query(int i) {
        ll s = 0;
        for (; i > 0; i -= i & -i)
            s += tree[i];
        return s;
    }

    // Tổng đoạn [l, r]
    ll query(int l, int r) { return query(r) - query(l - 1); }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, q;
    cin >> n >> q;
    BIT bit(n);

    vector<ll> a(n + 1);
    for (int i = 1; i <= n; i++) {
        cin >> a[i];
        bit.update(i, a[i]);
    }

    while (q--) {
        int type; cin >> type;
        if (type == 1) {
            int i; ll x; cin >> i >> x;
            bit.update(i, x - a[i]);
            a[i] = x;
        } else {
            int l, r; cin >> l >> r;
            cout << bit.query(l, r) << "\\n";
        }
    }
    return 0;
}`,
  },
  {
    id: 'segtree',
    label: 'Segment Tree',
    category: 'Cấu trúc dữ liệu',
    lang: 'cpp',
    description: 'Segment tree điểm update, range query (sum)',
    code: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

struct SegTree {
    int n;
    vector<ll> tree;
    SegTree(int n) : n(n), tree(4 * n, 0) {}

    void build(vector<ll>& a, int node, int l, int r) {
        if (l == r) { tree[node] = a[l]; return; }
        int mid = (l + r) / 2;
        build(a, 2*node, l, mid);
        build(a, 2*node+1, mid+1, r);
        tree[node] = tree[2*node] + tree[2*node+1];
    }

    void update(int node, int l, int r, int pos, ll val) {
        if (l == r) { tree[node] = val; return; }
        int mid = (l + r) / 2;
        if (pos <= mid) update(2*node, l, mid, pos, val);
        else            update(2*node+1, mid+1, r, pos, val);
        tree[node] = tree[2*node] + tree[2*node+1];
    }

    ll query(int node, int l, int r, int ql, int qr) {
        if (ql > r || qr < l) return 0;
        if (ql <= l && r <= qr) return tree[node];
        int mid = (l + r) / 2;
        return query(2*node, l, mid, ql, qr)
             + query(2*node+1, mid+1, r, ql, qr);
    }

    void update(int pos, ll val) { update(1, 1, n, pos, val); }
    ll query(int l, int r)       { return query(1, 1, n, l, r); }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n; cin >> n;
    vector<ll> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];

    SegTree seg(n);
    seg.build(a, 1, 1, n);

    int q; cin >> q;
    while (q--) {
        int t; cin >> t;
        if (t == 1) {
            int pos; ll val; cin >> pos >> val;
            seg.update(pos, val);
        } else {
            int l, r; cin >> l >> r;
            cout << seg.query(l, r) << "\\n";
        }
    }
    return 0;
}`,
  },

  // ─── Số học ──────────────────────────────────────────────────────────────
  {
    id: 'sieve',
    label: 'Sieve of Eratosthenes',
    category: 'Số học',
    lang: 'cpp',
    description: 'Sàng số nguyên tố, factorize O(n log log n)',
    code: `#include <bits/stdc++.h>
using namespace std;

const int MAXN = 1e7 + 5;
vector<int> primes;
bool is_composite[MAXN];

void sieve(int n) {
    for (int i = 2; i <= n; i++) {
        if (!is_composite[i]) {
            primes.push_back(i);
            for (long long j = (long long)i*i; j <= n; j += i)
                is_composite[j] = true;
        }
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    sieve(1e6);
    cout << "Số lượng số nguyên tố <= 1e6: " << primes.size() << "\\n";
    return 0;
}`,
  },
  {
    id: 'modular',
    label: 'Modular Arithmetic',
    category: 'Số học',
    lang: 'cpp',
    description: 'Lũy thừa nhanh, nghịch đảo modular, tổ hợp',
    code: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll MOD = 1e9 + 7;

ll power(ll base, ll exp, ll mod = MOD) {
    ll result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}

ll inv(ll x, ll mod = MOD) { return power(x, mod - 2, mod); }

const int MAXN = 1e6 + 5;
ll fact[MAXN], inv_fact[MAXN];

void precompute() {
    fact[0] = 1;
    for (int i = 1; i < MAXN; i++)
        fact[i] = fact[i-1] * i % MOD;
    inv_fact[MAXN-1] = inv(fact[MAXN-1]);
    for (int i = MAXN-2; i >= 0; i--)
        inv_fact[i] = inv_fact[i+1] * (i+1) % MOD;
}

// C(n, k) = n! / (k! * (n-k)!)
ll C(int n, int k) {
    if (k < 0 || k > n) return 0;
    return fact[n] % MOD * inv_fact[k] % MOD * inv_fact[n-k] % MOD;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    precompute();

    cout << C(10, 3) << "\\n"; // = 120
    cout << power(2, 10) << "\\n"; // = 1024
    return 0;
}`,
  },

  // ─── Python ──────────────────────────────────────────────────────────────
  {
    id: 'py-fast-io',
    label: 'Python Fast I/O',
    category: 'Python',
    lang: 'python',
    description: 'Template Python với fast I/O dùng sys.stdin',
    code: `import sys
input = sys.stdin.readline

def solve():
    n = int(input())
    a = list(map(int, input().split()))
    # TODO
    print(sum(a))

def main():
    t = int(input())
    for _ in range(t):
        solve()

if __name__ == "__main__":
    main()`,
  },
  {
    id: 'py-bfs',
    label: 'Python BFS',
    category: 'Python',
    lang: 'python',
    description: 'BFS trong Python với deque',
    code: `from collections import deque
import sys
input = sys.stdin.readline

def bfs(graph, src, n):
    dist = [-1] * (n + 1)
    dist[src] = 0
    q = deque([src])
    while q:
        u = q.popleft()
        for v in graph[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist

def main():
    n, m = map(int, input().split())
    graph = [[] for _ in range(n + 1)]
    for _ in range(m):
        u, v = map(int, input().split())
        graph[u].append(v)
        graph[v].append(u)

    dist = bfs(graph, 1, n)
    for i in range(1, n + 1):
        print(f"dist[{i}] = {dist[i]}")

main()`,
  },
  {
    id: 'py-dsu',
    label: 'Python DSU',
    category: 'Python',
    lang: 'python',
    description: 'Disjoint Set Union trong Python',
    code: `import sys
input = sys.stdin.readline
sys.setrecursionlimit(300000)

class DSU:
    def __init__(self, n):
        self.parent = list(range(n + 1))
        self.rank = [0] * (n + 1)
        self.components = n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def unite(self, x, y):
        x, y = self.find(x), self.find(y)
        if x == y:
            return False
        if self.rank[x] < self.rank[y]:
            x, y = y, x
        self.parent[y] = x
        if self.rank[x] == self.rank[y]:
            self.rank[x] += 1
        self.components -= 1
        return True

def main():
    n, m = map(int, input().split())
    dsu = DSU(n)
    for _ in range(m):
        u, v = map(int, input().split())
        dsu.unite(u, v)
    print(dsu.components)

main()`,
  },
];

export function getTemplatesByLang(langId: string): Template[] {
  const isC    = langId === 'c11';
  const isPy   = langId === 'python3';
  const isCpp  = langId.startsWith('cpp');
  return TEMPLATES.filter(t =>
    (isPy  && t.lang === 'python') ||
    (isC   && (t.lang === 'c' || t.lang === 'cpp')) ||
    (isCpp && (t.lang === 'cpp'))
  );
}
