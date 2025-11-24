import time
from locust import HttpUser, task, between

class QuickstartUser(HttpUser):
    # O TEMPO DE ESPERA ENTRE AS REQUISIÇÕES ESTÁ AQUI (em segundos)
    # Se estes valores forem muito baixos (ex: 0.001), o RPS será altíssimo.
    wait_time = between(1, 2) # Espera entre 1 e 2 segundos entre as tasks

    @task
    def load_pokemon(self):
        # O host é definido via interface Locust (http://traefik)
        self.client.get("/pokemon")