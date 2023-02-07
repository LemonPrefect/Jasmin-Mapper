from random import randint
from uuid import uuid4
import threading
import os
import httpx as requests


MAPPER_PREFIX = os.getenv('MAPPER_PREFIX')
DOMAIN_SUFFIX = os.getenv('DOMAIN_SUFFIX')
AUTHORIZATION = os.getenv('AUTHORIZATION')

def benchmark():
    session = requests.Client(base_url=f"https://mapper-{MAPPER_PREFIX}.{DOMAIN_SUFFIX}:1443", verify=False, timeout=2)
    prefix = str(uuid4())
    response = session.post("/add", headers={
        "authorization": AUTHORIZATION
    }, json={
        "prefix": prefix,
        "containers": [{
            "alias": f"{prefix}-{x}", 
            "ip": f"{randint(1, 254)}.{randint(1, 254)}.{randint(1, 254)}.{randint(1, 254)}", 
            "port": randint(1, 65535)} for x in range(3)
        ]}
    )
    print(response.text)
    response = session.post("/remove", headers={
        "authorization": AUTHORIZATION
    }, json={
        "prefix": prefix,
        "containers": []}
    )
    return response.text

class MyThread(threading.Thread):
    def run(self):
        self._return = ""
        if self._target is not None:
            self._return = self._target()

    def join(self):
        super().join()
        return self._return


def f():
    threads = []
    for n in range(1):
        threads.append(MyThread(target=benchmark, args=(n,)))
    for thread in threads:
        thread.start()
    for thread in threads:
        print(thread.join())


if __name__ == '__main__':
    from timeit import timeit
    print(timeit(f, number=1))