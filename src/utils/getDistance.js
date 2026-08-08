import edges from '../data/graph.json';

// ==== 隣接リスト作成 ====
const graph = {};
const seenEdges = new Set();
for (const e of edges) {
	const key = `${e.from}-${e.to}`;
	if (seenEdges.has(key)) continue;
	seenEdges.add(key);
	if (!graph[e.from]) graph[e.from] = [];
	graph[e.from].push({ node: e.to, cost: e.distance });
}

// ==== 優先度付きキュー（最小ヒープ） ====
class MinHeap {
	constructor() {
		this.heap = [];
	}
	push(item) {
		this.heap.push(item);
		this._bubbleUp(this.heap.length - 1);
	}
	pop() {
		if (this.heap.length === 0) return null;
		const top = this.heap[0];
		const end = this.heap.pop();
		if (this.heap.length > 0) {
			this.heap[0] = end;
			this._sinkDown(0);
		}
		return top;
	}
	_bubbleUp(idx) {
		const element = this.heap[idx];
		while (idx > 0) {
			const parentIdx = Math.floor((idx - 1) / 2);
			if (this.heap[parentIdx].priority <= element.priority) break;
			this.heap[idx] = this.heap[parentIdx];
			this.heap[parentIdx] = element;
			idx = parentIdx;
		}
	}
	_sinkDown(idx) {
		const length = this.heap.length;
		const element = this.heap[idx];
		while (true) {
			let leftIdx = 2 * idx + 1;
			let rightIdx = 2 * idx + 2;
			let swapIdx = null;

			if (leftIdx < length) {
				if (this.heap[leftIdx].priority < element.priority) swapIdx = leftIdx;
			}
			if (rightIdx < length) {
				if (
					(swapIdx === null && this.heap[rightIdx].priority < element.priority) ||
					(swapIdx !== null && this.heap[rightIdx].priority < this.heap[leftIdx].priority)
				)
					swapIdx = rightIdx;
			}
			if (swapIdx === null) break;
			this.heap[idx] = this.heap[swapIdx];
			this.heap[swapIdx] = element;
			idx = swapIdx;
		}
	}
}

function containsInOrder(parent, sub) {
	let subIndex = 0;
	for (const item of parent) {
		if (item === sub[subIndex]) {
			subIndex++;
			if (subIndex === sub.length) return true;
		}
	}
	return sub.length === 0;
}

/**
 * 2駅間の最短経路とその距離を返す
 * @param {string} start 出発駅id
 * @param {string} goal 到着駅id
 * @param {string[]} via 経由駅id
 * @returns {{distance: number, path: string[]}} 最短経路(ナンバリング配列)とその距離
 */
export function dijkstra(start, goal, via = []) {
	const distances = {};
	const previous = {};
	Object.keys(graph).forEach((node) => {
		distances[node] = Infinity;
	});
	const pq = new MinHeap();

	for (const node in graph) {
		distances[node] = Infinity;
	}
	distances[start] = 0;
	pq.push({ node: start, priority: 0 });

	let path = [];
	while (true) {
		const current = pq.pop();
		if (!current) break;

		const currentNode = current.node;
		if (currentNode === goal) {
			// 経路復元
			path = [];
			let cur = goal;
			while (cur !== undefined) {
				path.unshift(cur);
				cur = previous[cur];
			}
			if (containsInOrder(path, via)) break;
			else continue;
		}

		for (const neighbor of graph[currentNode] || []) {
			const newDist = distances[currentNode] + neighbor.cost;
			if (newDist < distances[neighbor.node]) {
				distances[neighbor.node] = newDist;
				previous[neighbor.node] = currentNode;
				pq.push({ node: neighbor.node, priority: newDist });
			}
		}
	}

	return { path, distance: distances[goal] };
}

/**
 * 2駅間の距離(営業キロ)を返す
 * @param {string} start 出発駅id
 * @param {string} goal 到着駅id
 * @param {string[]} via 経由駅id
 * @returns {number} 距離(km)
 */
export default function getDistance(start, goal, via = []) {
	const result = dijkstra(start, goal, via);
	return result.distance ?? 0;
}
