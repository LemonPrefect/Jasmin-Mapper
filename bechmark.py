from random import randint
from uuid import uuid4
import threading
import os
import httpx as requests


def benchmark():
    session = requests.Client(base_url=f"https://https://mapper-{os.getenv('MAPPER_PREFIX')}.{os.getenv('SUFFIX')}", verify=False)
    prefix = str(uuid4())
    response = session.post("/add", headers={
        "authorization": "123"
    }, json={
        "prefix": prefix,
        "containers": [{
            "alias": f"{prefix}-{x}", 
            "ip": f"{randint(1, 254)}.{randint(1, 254)}.{randint(1, 254)}.{randint(1, 254)}", 
            "port": randint(1, 65535)} for x in range(3)
        ]}
    )
    response = session.post("/remove", headers={
        "authorization": "123"
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
    for n in range(100):
        threads.append(MyThread(target=benchmark, args=(n,)))
    for thread in threads:
        thread.start()
    for thread in threads:
        print(thread.join())


if __name__ == '__main__':
    from timeit import timeit
    print(timeit(f, number=1))