# Relatório de Análise e Melhoria de Performance: Sistema Node.js (API Pokemon)

Este relatório consolida a arquitetura implementada, os resultados dos testes de carga e as intervenções de segurança necessárias para garantir a resiliência da API sob condições de alto tráfego.

## 1\. Introdução das Ferramentas da Arquitetura

O ambiente de testes foi estabelecido utilizando uma arquitetura de microserviços em contêineres, fundamental para isolamento e escalabilidade. Os projetos de base foram extraídos de repositórios públicos, conforme detalhado abaixo.

| Software | Função Principal no Projeto | Detalhe Estratégico |
| :--- | :--- | :--- |
| **Node.js API** | Serviço Alvo (Backend) | API REST responsável pela lógica de negócio e consultas ao banco de dados (`/pokemon`). **Base do Projeto:** [robsonfgomes/node-api-boilerplate](https://github.com/robsonfgomes/node-api-boilerplate) |
| **Traefik** | Reverse Proxy e Gateway | Gerencia o roteamento de tráfego, exposição de serviços e aplicação de middlewares de segurança (e.g., Rate Limiting). |
| **MySQL** | Persistência de Dados | Base de dados relacional para armazenamento dos dados da API. |
| **Locust** | Teste de Carga e Estresse | Ferramenta Python utilizada para simular milhares de usuários e medir o *throughput* (RPS) e a latência da API. **Base do Projeto de Testes:** [robsonfgomes/locust-performance-test](https://github.com/robsonfgomes/locust-performance-test) |

## 2\. Identificação de Vulnerabilidades de Performance

A análise inicial focou em identificar a capacidade máxima da infraestrutura antes que a sobrecarga causasse falha. Identificamos duas questões críticas.

### A. Vulnerabilidade de Disponibilidade (Sobrecarga)

O principal ponto de preocupação era a falta de uma camada protetora na borda da rede. Sem um limitador de taxa, um pico de tráfego não intencional ou malicioso resultaria na inundação imediata da API e do MySQL.

  * **Impacto Potencial:** Degradacão súbita do *throughput* da API, aumento drástico da latência de resposta e risco de *crash* da base de dados sob alta concorrência de conexões.

### B. Falha de Roteamento (Bug Inicial)

Durante os primeiros testes com o Locust, observamos falhas persistentes de **`404 Not Found`**. A investigação dos logs do Traefik revelou que o problema era de roteamento e não de performance da API.

  * **Causa:** O *Host Header* interno utilizado pelo Locust (`http://traefik`) não estava mapeado na regra de roteamento do Traefik. O Traefik estava descartando a requisição antes mesmo de encaminhá-la à API.

## 3\. Melhorias e Medidas de Contenção Implementadas

Duas intervenções cirúrgicas foram realizadas no arquivo `docker-compose.yml` para garantir tanto a funcionalidade quanto a resiliência.

### A. Implementação do Rate Limiting no Gateway

O middleware de Rate Limiting do Traefik foi ativado para impor um limite de tráfego sustentável, protegendo o *backend* da sobrecarga. Foi adotado o modelo **Token Bucket** para permitir uma absorção suave de picos.

  * **Taxa Sustentável (`average`):** Definida em **50 requisições por segundo (RPS)**. Esta é a taxa máxima que o Traefik garante para o serviço no longo prazo.

  * **Capacidade de Pico (`burst`):** Definida em **100 requisições**. Este valor permite que o sistema lide com picos de tráfego momentâneos (o "balde" de tolerância), prevenindo que clientes legítimos com cliques rápidos sejam bloqueados imediatamente.

### B. Correção do Host Header para Roteamento Interno

O roteador do Traefik foi reconfigurado para aceitar os dois hosts esperados: o de acesso externo (`localhost`) e o nome de serviço interno (`traefik`).

**Regra Final:** `traefik.http.routers.node-api.rule=Host(\`localhost\`) || Host(\`traefik\`)\`

## 4\. Resultados Comparativos (Cenário de Estresse)

O teste de validação foi executado com uma carga que **excedia intencionalmente** o limite de 50 RPS (500 usuários, 100 usuários/s), para observar o comportamento do Rate Limiter.

| Métrica | Antes (Sem Rate Limit) | Depois (Com Rate Limit) | Análise da Melhoria |
| :--- | :--- | :--- | :--- |
| **RPS Total** | Dispararia acima de 200 RPS. | **Estabiliza em \~50 RPS.** | O limite de segurança foi atingido e mantido. |
| **Códigos de Status** | **100% 200 OK** (Até o *crash*) ou **404** (Erro de Roteamento). | **70-80% 429** (Bloqueio) e **20-30% 200 OK** (Tráfego permitido). | **Validação de Segurança:** O tráfego excedente foi bloqueado ativamente com o código **`429 Too Many Requests`**, sem que o Node.js fosse sobrecarregado.  |
| **Latência da API (200 OK)** | Aumentaria drasticamente. | Permanece baixa e estável. | Proteção do *backend* garantida, pois o Traefik atuou como um *throttle*. |

## 5\. Procedimentos de Execução do Projeto

Para reproduzir o ambiente e validar a segurança implementada, siga as instruções:

### 5.1. Inicialização do Projeto

No diretório que contém o `docker-compose.yml` e as pastas do serviço, utilize o comando:

```
docker compose up -d --build

```

### 5.2. Acesso ao Ambiente de Testes

Abra a interface gráfica do Locust no seu navegador:

```
http://localhost:8089

```

### 5.3. Configuração do Cenário de Estresse

Na interface do Locust, configure os seguintes parâmetros para replicar o teste de sobrecarga:

| Parâmetro | Valor |
| :--- | :--- |
| **Number of users** | 500 |
| **Spawn rate** | 100 |
| **Host** | `http://traefik` |

### 5.4. Validação do Rate Limiting

Após iniciar o *swarming*, monitore a aba **"Status Codes"**. A confirmação de que a segurança está ativa é a observação de uma alta porcentagem de erros **`429`**, enquanto a taxa de **`200 OK`** se mantém próxima do limite configurado de 50 RPS.
