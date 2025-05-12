# Neo4j Centrality Algorithms

Centrality algorithms are used to determine the importance of distinct nodes in a network. The Neo4j Graph Data Science library includes the following centrality algorithms:

## Production-quality Algorithms

- **Article Rank**: A variant of PageRank that takes link direction into account
- **Articulation Points**: Identifies nodes that, if removed, would increase the number of connected components in the graph
- **Betweenness Centrality**: Measures the extent to which a node lies on paths between other nodes
- **Bridges**: Identifies relationships that, if removed, would increase the number of connected components in the graph
- **CELF**: Cost-Effective Lazy Forward selection for influence maximization
- **Closeness Centrality**: Measures how close a node is to all other nodes in the graph
- **Degree Centrality**: Measures the number of relationships a node has
- **Eigenvector Centrality**: Measures the influence of a node based on the influence of its neighbors
- **Page Rank**: Measures the importance of a node based on the importance of its neighbors

## Alpha Algorithms

- **Harmonic Centrality**: A variant of closeness centrality that works well with disconnected graphs
- **HITS**: Hyperlink-Induced Topic Search, which assigns hub and authority scores to nodes

These algorithms help identify the most influential or important nodes in a network, which can be useful for various applications such as:

- Finding key influencers in social networks
- Identifying critical infrastructure in transportation networks
- Discovering bottlenecks in communication networks
- Prioritizing resources in resource allocation problems
- Identifying potential points of failure in network structures