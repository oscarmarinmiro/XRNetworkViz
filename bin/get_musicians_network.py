import pprint
import json
import requests
import time

# https://www.imdb.com/list/ls059445864/

SEEDS_FILE = "seeds.json"

FILE_OUT = "artist_network.json"

MAX_DEPTH = 3
SLEEP_INTERVAL = 2

network = {}


def insert_in_network(first, second):

    first_name = get_name_from_destination(first)
    second_name = get_name_from_destination(second)

    names = sorted([first_name, second_name])

    if names[0] not in network:
        network[names[0]] = {}

    if names[1] not in network[names[0]]:
        network[names[0]][names[1]] = 0

    network[names[0]][names[1]] += 1


def get_name_from_destination(url):
    name = url.split("http://dbpedia.org/resource/")[1].replace("_", " ")
    return name


def get_name_from_source(url):
    name = url.split("http://dbpedia.org/data/")[1].replace("_", " ")
    return name


def get_visit_from_url(url):
    name = url.split("http://dbpedia.org/resource/")[1]
    return "http://dbpedia.org/data/" + name + ".json"

# print(get_name_from_url('http://dbpedia.org/resource/Beatles_(The)'))
# print(get_visit_from_url('http://dbpedia.org/resource/Beatles_(The)'))


visited = {}

depth = 0

seeds = json.load(open("seeds.json", "rb"))

# insert seeds in to_visit

to_visit = {seed: True for seed in seeds}

# visit 'to_visit'

while depth < MAX_DEPTH:

    print("At depth: ", depth)
    print("New urls: ", len(to_visit.keys()))
    print("================================")

    new_visits = {}

    retrieved = 0

    for url in to_visit.keys():

        if url not in visited:

            print("Retrieving page number ", retrieved, ": ", url)

            r = requests.get(url)

            if r.status_code == 200:

                retrieved += 1

                try:

                    my_data = r.json()

                    print("Retrieved page: ", url)

                    source = get_name_from_source(url)

                    for primary_key, primary_value in my_data.items():

                        # print("-", primary_key)

                        # if type(primary_value) == 'dict':
                        #     print("-", primary_key, type(primary_value))
                        # print("-", primary_key, type(primary_value))
                        for secondary_key, secondary_value in primary_value.items():
                            # print("\t", secondary_key)

                            if secondary_key == "http://dbpedia.org/ontology/associatedMusicalArtist":
                                for entry in secondary_value:
                                    insert_in_network(primary_key, entry['value'])
                                    if get_visit_from_url(primary_key) not in visited:
                                        new_visits[get_visit_from_url(primary_key)] = True
                except Exception:
                    print("Casquotazo")


            else:

                print("Error retrieving page: ", url)

            json.dump({'network': network, 'visited': [key for key in visited.keys()]}, open(FILE_OUT, "w"), indent = 4)

            # mark as visited

            visited[url] = True

            # pprint.pprint(to_visit)
            # pprint.pprint(network)

            time.sleep(SLEEP_INTERVAL)

    # extract next artists

    to_visit = {seed: True for seed in new_visits.keys()}

    depth += 1