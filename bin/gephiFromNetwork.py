from networkx.readwrite import json_graph
import json
import pprint


#And finally export it to a JSON format compatible with D3
# from networkx.readwrite import json_graph
# data = json_graph.node_link_data(G)

#And then dump it in a file
# with open('graph.json', 'w') as fp:
#     json.dump(data, fp)

import networkx as nx

FILE_IN = "artist_network.json"

FILE_OUT = "d3_artist_network.json"

net_data = json.load(open(FILE_IN, "r"))

graph = nx.Graph()

for source, targets in net_data['network'].items():
    for target, weight in targets.items():
        print(source, target, weight)
        graph.add_edge(source, target, weight = weight)


nx.write_gexf(graph, "musicians.gexf")
json.dump(json_graph.node_link_data(graph), open(FILE_OUT, "w"))






